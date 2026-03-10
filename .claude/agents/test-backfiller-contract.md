# test-backfiller Contract

Reference for input/output specifications. Read by both the orchestrator
(outside-in-tdd) and the test-backfiller agent.

## Inputs

- **Implementation file**: Path to the source file with surviving mutants
- **Existing test file(s)**: Path(s) to existing test files for this unit
- **Test command**: Command to run the tests
- **Surviving mutants**: Lines of source code with their surviving mutations (see "How to Read Surviving Mutants" in the agent definition)

## Return

```
Test file(s) modified:
- [path]

Tests added:
- [test name]: [brief description, which mutant(s) it targets]
- ...

Mutants targeted: [count] of [total surviving]

Test result:
[paste test output showing all tests pass]

Debug Notes: (only if Debug mode: ON was in the input — omit entirely otherwise)

Instruction Issues:
- [MISSING/BROKEN_REF/UNCLEAR/CONFLICT] description
- (or "None")

Execution Reflection:
- [BACK_AND_FORTH/STUCK/INEFFICIENT/RETRY/ASSUMPTION] description
- (or "Clean execution")
```
