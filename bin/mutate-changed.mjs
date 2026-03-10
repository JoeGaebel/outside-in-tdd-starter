#!/usr/bin/env node

/**
 * Run mutation testing and enforce per-file thresholds.
 *
 * Modes:
 *   Full codebase:    node bin/mutate-changed.mjs
 *   Specific files:   node bin/mutate-changed.mjs src/lib/date-utils.ts src/pages/daily-audit.tsx
 *   Uncommitted files: node bin/mutate-changed.mjs --uncommitted
 *
 * In full codebase mode, runs Stryker with the config's mutate patterns (which
 * include exclusions) and checks every non-excluded file in the report.
 *
 * In specific files mode, runs Stryker with --mutate for just those files and
 * only checks those files against the threshold.
 *
 * In uncommitted mode, uses git to detect changed source files (staged, unstaged,
 * and untracked) under src/ with .ts/.tsx extensions, then runs in specific files mode.
 *
 * The threshold is read from stryker.config.mjs (thresholds.break or thresholds.low).
 *
 * Exit codes:
 *   0 - All files meet the threshold
 *   1 - One or more files below threshold
 */

import {execSync} from 'child_process';
import {readFileSync, writeFileSync, mkdirSync} from 'fs';
import {resolve} from 'path';
import {pathToFileURL} from 'url';

const args = process.argv.slice(2);
const uncommittedMode = args.includes('--uncommitted');
let files = args.filter(a => !a.startsWith('--'));

if (uncommittedMode) {
    // Get modified/added tracked files (staged + unstaged vs HEAD)
    const diffFiles = execSync('git diff --name-only --diff-filter=ACMR HEAD 2>/dev/null || true', {encoding: 'utf-8'})
        .split('\n')
        .filter(f => f.trim());

    // Get untracked files (new files not yet added to git)
    const untrackedFiles = execSync('git ls-files --others --exclude-standard', {encoding: 'utf-8'})
        .split('\n')
        .filter(f => f.trim());

    // Deduplicate and filter to TypeScript source files under src/
    files = [...new Set([...diffFiles, ...untrackedFiles])]
        .filter(f => /^src\/.*\.tsx?$/.test(f));

    if (files.length === 0) {
        console.log('\nNo uncommitted TypeScript source files found under src/.\n');
        process.exit(0);
    }

    console.log(`\nDetected ${files.length} uncommitted source file(s):`);
    for (const f of files) {
        console.log(`  ${f}`);
    }
}

const fullCodebase = files.length === 0;

// Read threshold from stryker config
const configPath = pathToFileURL(resolve('stryker.config.mjs')).href;
const config = (await import(configPath)).default;
const threshold = config.thresholds?.break ?? config.thresholds?.low ?? 60;
const thresholdHigh = config.thresholds?.high ?? 80;
const thresholdLow = config.thresholds?.low ?? 60;

// ANSI color codes
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

function scoreColor(score) {
    if (score >= thresholdHigh) return GREEN;
    if (score >= thresholdLow) return YELLOW;
    return RED;
}

// Build exclusion matchers from config's mutate patterns (entries starting with !)
function globToRegex(pattern) {
    let result = '';
    for (let i = 0; i < pattern.length; i++) {
        const c = pattern[i];
        if (c === '*' && pattern[i + 1] === '*') {
            result += '.*';
            i++;
        } else if (c === '*') {
            result += '[^/]*';
        } else if (c === '?') {
            result += '.';
        } else if ('.+^${}()|[]\\'.includes(c)) {
            result += '\\' + c;
        } else {
            result += c;
        }
    }
    return new RegExp('^' + result + '$');
}

const exclusionPatterns = (config.mutate || [])
    .filter(p => p.startsWith('!'))
    .map(p => globToRegex(p.slice(1)));

function isExcluded(filePath) {
    return exclusionPatterns.some(re => re.test(filePath));
}

// In specific-files mode, separate excluded files from files to mutate
const excludedFiles = [];
const filesToMutate = [];
if (!fullCodebase) {
    for (const f of files) {
        if (isExcluded(f)) {
            excludedFiles.push(f);
        } else {
            filesToMutate.push(f);
        }
    }
}

// Run Stryker
if (fullCodebase) {
    console.log('\nRunning full codebase mutation testing...\n');
    try {
        execSync('./node_modules/.bin/stryker run', {stdio: 'inherit'});
    } catch {
        // Stryker may exit non-zero from overall threshold.break — we check per-file below.
    }
} else if (filesToMutate.length > 0) {
    const mutatePattern = filesToMutate.join(',');

    console.log(`\nMutating ${filesToMutate.length} file(s): ${filesToMutate.join(', ')}\n`);
    try {
        execSync(`./node_modules/.bin/stryker run --mutate '${mutatePattern}'`, {stdio: 'inherit'});
    } catch {
        // Stryker may exit non-zero from overall threshold.break — we check per-file below.
    }
}

// Report excluded files
if (excludedFiles.length > 0) {
    console.log(`\nExcluded (skipped): ${excludedFiles.join(', ')}`);
}

// If all specified files were excluded, nothing to check
if (!fullCodebase && filesToMutate.length === 0) {
    console.log('\nAll specified files are excluded from mutation testing.\n');
    process.exit(0);
}

// Parse JSON report
const reportPath = resolve('reports/mutation/mutation-report.json');
let report;
try {
    report = JSON.parse(readFileSync(reportPath, 'utf-8'));
} catch {
    console.error(`\nCould not read mutation report at ${reportPath}`);
    process.exit(1);
}

// Calculate per-file scores
const requestedFiles = fullCodebase ? null : new Set(filesToMutate);
const results = [];

for (const [filePath, fileData] of Object.entries(report.files)) {
    // In specific-files mode, only check requested files
    if (requestedFiles && !requestedFiles.has(filePath)) continue;

    // In full-codebase mode, skip files excluded in the config
    if (fullCodebase && isExcluded(filePath)) continue;

    const mutants = fileData.mutants || [];

    let killed = 0, timeout = 0, survived = 0, noCoverage = 0;
    for (const m of mutants) {
        switch (m.status) {
            case 'Killed': killed++; break;
            case 'Timeout': timeout++; break;
            case 'Survived': survived++; break;
            case 'NoCoverage': noCoverage++; break;
        }
    }

    const detected = killed + timeout;
    const total = detected + survived + noCoverage;
    const score = total > 0 ? (detected / total) * 100 : 100;

    results.push({filePath, score, detected, total, pass: score >= threshold});
}

// Sort: failures first (by score ascending), then passes
results.sort((a, b) => {
    if (a.pass !== b.pass) return a.pass ? 1 : -1;
    return a.score - b.score;
});

// Print results
const failures = results.filter(r => !r.pass);

if (fullCodebase) {
    // Print full codebase table with color coding
    const maxPath = Math.max(...results.map(r => r.filePath.length), 4);
    const header = `${'File'.padEnd(maxPath)}  | Score   | Killed | Survived | NoCov | Total`;
    console.log(`\n${header}`);
    console.log('—'.repeat(header.length));
    for (const r of results) {
        const fileData = report.files[r.filePath];
        const mutants = fileData.mutants || [];
        let survived = 0, noCov = 0;
        for (const m of mutants) {
            if (m.status === 'Survived') survived++;
            else if (m.status === 'NoCoverage') noCov++;
        }
        const color = scoreColor(r.score);
        const score = `${r.score.toFixed(1)}%`.padStart(6);
        console.log(`${color}${r.filePath.padEnd(maxPath)}  | ${score} | ${String(r.detected).padStart(6)} | ${String(survived).padStart(8)} | ${String(noCov).padStart(5)} | ${String(r.total).padStart(5)}${RESET}`);
    }

    if (failures.length > 0) {
        console.log(`\n${RED}Files below ${threshold}% threshold:${RESET}`);
        console.log('—'.repeat(70));
        for (const r of failures) {
            console.log(`  ${RED}❌ ${r.score.toFixed(2)}%  ${r.filePath}  (${r.detected}/${r.total})${RESET}`);
        }
    }
} else {
    const label = uncommittedMode
        ? `${files.length} uncommitted file(s)`
        : `${files.length} file(s)`;
    console.log(`\nPer-file mutation scores — ${label} (threshold: ${threshold}%):`);
    console.log('—'.repeat(70));
    for (const r of results) {
        const icon = r.pass ? '✅' : '❌';
        console.log(`  ${icon} ${r.score.toFixed(2)}%  ${r.filePath}  (${r.detected}/${r.total})`);
    }
}

if (failures.length > 0) {
    // Write surviving mutants report to file
    const survivingReportPath = resolve('reports/mutation/surviving-mutants.txt');
    mkdirSync(resolve('reports/mutation'), {recursive: true});

    let reportLines = [];
    for (const r of failures) {
        const fileData = report.files[r.filePath];
        const mutants = (fileData.mutants || []).filter(m => m.status === 'Survived' || m.status === 'NoCoverage');

        let sourceLines = [];
        try {
            sourceLines = readFileSync(resolve(r.filePath), 'utf-8').split('\n');
        } catch { /* ignore */ }

        const byLine = new Map();
        for (const m of mutants) {
            const line = m.location.start.line;
            if (!byLine.has(line)) byLine.set(line, []);
            byLine.get(line).push(m);
        }

        reportLines.push(`Surviving mutants in ${r.filePath} (${r.score.toFixed(2)}%, ${r.detected}/${r.total}):`);
        reportLines.push('—'.repeat(70));
        for (const [line, lineMutants] of [...byLine.entries()].sort((a, b) => a[0] - b[0])) {
            const src = sourceLines[line - 1]?.trimEnd() || '';
            reportLines.push(`  L${line}: ${src}`);
            for (const m of lineMutants) {
                const tag = m.status === 'NoCoverage' ? 'NoCov' : 'Survived';
                const replacement = m.replacement != null ? m.replacement.substring(0, 60) : '(removed)';
                reportLines.push(`    [${tag}] ${m.mutatorName} → ${replacement}`);
            }
        }
        reportLines.push('');
    }

    writeFileSync(survivingReportPath, reportLines.join('\n') + '\n');

    console.error(`\nFAILED: ${failures.length} file(s) below ${threshold}% threshold.`);
    console.error(`Surviving mutants report: ${survivingReportPath}\n`);
    process.exit(1);
} else {
    console.log(`\nAll ${results.length} file(s) meet the ${threshold}% threshold.\n`);
}
