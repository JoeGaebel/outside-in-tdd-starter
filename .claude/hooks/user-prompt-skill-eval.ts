#!/usr/bin/env npx tsx
import { readFileSync } from 'node:fs'
import { stdout } from 'node:process'

function main(): void {
    readFileSync(0, 'utf-8') // consume stdin

    const instruction = `
INSTRUCTION: MANDATORY SKILL ACTIVATION SEQUENCE

Step 1 - EVALUATE:
For each skill in <available_skills>, state: [skill-name] - YES/NO - [reason]

Step 2 - ACTIVATE:
IF any skills are YES → Use Skill(skill-name) tool for EACH relevant skill NOW
IF no skills are YES → State "No skills needed" and proceed

Step 3 - IMPLEMENT:
Only after Step 2 is complete, proceed with implementation.

CRITICAL: You MUST call Skill() tool in Step 2. Do NOT skip to implementation.
`

    stdout.write(instruction.trim())
}

main()