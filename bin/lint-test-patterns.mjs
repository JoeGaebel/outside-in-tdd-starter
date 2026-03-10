#!/usr/bin/env node

// Custom lint rules for test files.
//
// 1. No Prisma delegate aliases
// 2. No dynamic imports

import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const rules = [
  {
    pattern: /=\s*prisma\.\w+\s*;/,
    message: 'No Prisma delegate aliases — use prisma.<model> directly instead',
  },
  {
    pattern: /await\s+import\s*\(/,
    message: 'No dynamic imports in tests — use static imports with jest.mock()',
  },
];

let files;
try {
  files = execSync('find test -name "*.ts" -o -name "*.tsx"', { encoding: 'utf-8' })
    .trim()
    .split('\n')
    .filter(Boolean);
} catch {
  // No test directory yet
  process.exit(0);
}

const violations = [];

for (const file of files) {
  const lines = readFileSync(file, 'utf-8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const rule of rules) {
      if (rule.pattern.test(lines[i])) {
        violations.push({ file, line: i + 1, text: lines[i].trim(), message: rule.message });
      }
    }
  }
}

if (violations.length > 0) {
  const grouped = new Map();
  for (const v of violations) {
    if (!grouped.has(v.message)) grouped.set(v.message, []);
    grouped.get(v.message).push(v);
  }
  for (const [message, items] of grouped) {
    console.error(`${message}:\n`);
    for (const v of items) {
      console.error(`  ${v.file}:${v.line}  ${v.text}`);
    }
    console.error('');
  }
  process.exit(1);
}
