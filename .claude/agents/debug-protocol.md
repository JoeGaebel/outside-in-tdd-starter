# Debug Protocol

When debug mode is active, read this file and append a **Debug Notes** section to your return. This section is additive — your normal return format stays unchanged.

## What to Watch For

### Instruction Issues

| Category | What to report | Example |
|----------|---------------|---------|
| **MISSING** | Information you needed but wasn't provided — you had to discover it independently | "Needed the test helper import path but it wasn't in the skill — found it by grepping the codebase" |
| **BROKEN_REF** | File paths, section names, or field names referenced in instructions that don't exist | "Skill says 'see the Mocking section' but no such section exists" |
| **UNCLEAR** | Ambiguous guidance where you had to guess the intent | "Instruction says 'add semantic attributes' but doesn't define what qualifies as semantic" |
| **REDUNDANT** | Context provided that wasn't needed for your task | "Received E2E DOM selectors but this is a backend layer — ignored them" |
| **CONFLICT** | Contradictions between agent definition, contract, skill, or architecture context | "Agent definition says to use registry for test command, but architecture context includes a different command" |
| **WORKAROUND** | Anything you had to work around rather than follow directly | "Skill template uses CommonJS imports but the project uses ESM — adapted" |

### Execution Reflection

After completing your task, reflect on how the execution went:

| Category | What to report | Example |
|----------|---------------|---------|
| **BACK_AND_FORTH** | Places where you changed direction, rewrote code, or revised your approach | "Initially wrote tests for each variant separately, then realized a shared helper was needed and refactored all 3" |
| **STUCK** | Points where progress stalled — what blocked you and how you unblocked | "Test kept failing because mock didn't match actual API shape — spent 3 attempts before reading the real handler" |
| **INEFFICIENT** | Unnecessary work — extra file reads, redundant exploration, over-engineering | "Read 5 test files looking for a pattern that was documented in the skill all along" |
| **RETRY** | Test failures or implementation attempts that required multiple tries | "First implementation used wrong date format — test failed, read the convention, fixed on second attempt" |
| **ASSUMPTION** | Decisions made without clear guidance from instructions | "No guidance on error handling for this edge case — assumed throwing is correct based on adjacent code" |

## Return Format

Append this after your normal return:

```
Debug Notes:

Instruction Issues:
- [CATEGORY] description
- [CATEGORY] description
- (or "None")

Execution Reflection:
- [CATEGORY] description
- [CATEGORY] description
- (or "Clean execution — no issues")
```

## What NOT to Report

- Don't report things that went well — only issues and friction
- Don't report test failures that are expected (RED phase failures are by design)
- Don't inflate minor friction into issues — if you hesitated for a moment but the instructions were clear enough, skip it
- Don't report issues with the codebase itself (bugs, tech debt) — only issues with the TDD workflow instructions
