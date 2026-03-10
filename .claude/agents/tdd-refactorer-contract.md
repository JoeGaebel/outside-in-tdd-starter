# tdd-refactorer Contract

Reference for input/output specifications. Read by both the orchestrator
(outside-in-tdd) and the tdd-refactorer agent.

## Inputs

- **Layer**: as defined in `.claude/tdd-registry.md` — determines which testing skill to load for test refactoring conventions
- **Test files**: Path(s) to the test files — may be one or more files. Read all to understand test coverage.
- **Test command**: Command to verify ALL tests still pass
- **Implementation files**: Paths to files modified in the GREEN phase — read to evaluate for refactoring
- **Batch** (if any): change description + discovery pattern for mechanical edits applied across many files. Not file paths.
- **Implementation summary**: What was changed in GREEN phase — use to focus your evaluation
- **Architecture context**: Phase 1 plan: Domain Context + Architecture (layer-relevant parts) + Approach (including Constraints)

## Return — Changes Made

```
Refactoring Applied: Yes

Files Modified:
- [file path]: [brief description of refactoring]
- [file path]: [brief description of refactoring]

Files Created: (omit if none)
- [file path]: [brief description — e.g., "extracted utility from X"]
- [file path]: [brief description — e.g., "tests for extracted utility"]

Test Result:
[paste test output showing ALL tests still pass]

Improvements Made:
[1-2 sentences explaining what was improved and why]

Debug Notes: (only if Debug mode: ON was in the input — omit entirely otherwise)

Instruction Issues:
- [MISSING/BROKEN_REF/UNCLEAR/CONFLICT] description
- (or "None")

Execution Reflection:
- [BACK_AND_FORTH/STUCK/INEFFICIENT/RETRY/ASSUMPTION] description
- (or "Clean execution")
```

## Return — No Changes

```
Refactoring Applied: No

Reason: [brief explanation]

Examples:
- "Implementation is minimal and focused - no duplication or complexity to address"
- "Code is clean and readable as-is"
- "Only one use case exists - abstraction would be premature"

Debug Notes: (only if Debug mode: ON was in the input — omit entirely otherwise)

Instruction Issues:
- [MISSING/BROKEN_REF/UNCLEAR/CONFLICT] description
- (or "None")

Execution Reflection:
- [BACK_AND_FORTH/STUCK/INEFFICIENT/RETRY/ASSUMPTION] description
- (or "Clean execution")
```
