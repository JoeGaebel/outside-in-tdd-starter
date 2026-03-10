# tdd-implementer Contract

Reference for input/output specifications. Read by both the orchestrator
(outside-in-tdd) and the tdd-implementer agent.

## Inputs

- **Feature requirement**: What behavior is being implemented
- **Layer**: as defined in `.claude/tdd-registry.md`
- **Test files**: Path(s) to the failing tests — may be one or more files.
- **Test command**: Command to run the tests
- **Tests to pass**: List of test cases that need to pass
- **Implementation files**: Path(s) to the file(s) that need modification — may be multiple files when a layer cycle covers several units. Each entry is (path, new/modify, description). May include supporting files (CSS, config, assets).
- **Batch** (if any): list of (change description, discovery pattern, ~count). Not file paths.
- **E2E DOM selectors** (conditional, only when outer loop is active): selectors the E2E test depends on
- **Third-party API context** (conditional, only for custom layers with external API dependencies): context from the Phase 1 plan's "Third-Party API Integration Inputs"
- **Architecture context**: Phase 1 plan: Domain Context + Architecture (layer-relevant parts) + Approach (including Constraints)

## Return — Success

```
Layer: [layer name]
Status: COMPLETE

Files Modified:
- [file path]: [brief description of change]
- [file path]: [brief description of change]

Test Result:
[paste the test output showing ALL tests pass]

Implementation Summary:
[1-2 sentences explaining what you implemented and why it makes the tests pass]

Debug Notes: (only if Debug mode: ON was in the input — omit entirely otherwise)

Instruction Issues:
- [MISSING/BROKEN_REF/UNCLEAR/CONFLICT] description
- (or "None")

Execution Reflection:
- [BACK_AND_FORTH/STUCK/INEFFICIENT/RETRY/ASSUMPTION] description
- (or "Clean execution")
```

## Return — Blocked

```
Layer: [layer name]
Status: BLOCKED

Reason: [explanation of why tests cannot be made to pass]
Evidence: [relevant code patterns, codebase conventions, or error details that support your assessment]
Attempted: [what you tried before concluding the tests need correction]

Debug Notes: (only if Debug mode: ON was in the input — omit entirely otherwise)

Instruction Issues:
- [MISSING/BROKEN_REF/UNCLEAR/CONFLICT] description
- (or "None")

Execution Reflection:
- [BACK_AND_FORTH/STUCK/INEFFICIENT/RETRY/ASSUMPTION] description
- (or "Clean execution")
```
