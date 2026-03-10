# tdd-test-writer Contract

Reference for input/output specifications. Read by both the orchestrator
(outside-in-tdd) and the tdd-test-writer agent.

## Normal Mode Inputs

### Inputs by Layer

#### Common fields (all layers)
- **Layer**: as defined in `.claude/tdd-registry.md`
- **Feature requirement**: What behavior to test
- **Architecture context**: Phase 1 plan: Domain Context + Architecture (layer-relevant parts) + Approach (including Constraints)

#### e2e
- **Business process**: name from `.claude/business-processes.md`, or "infrastructure"
- **Existing test file**: path or "none"
- **Add ALL assertions for**: user goals and expected outcomes
- When extending: ONE of **Existing `it` block to extend** / **Why new `it` block**
- (Optional) **Partial implementation note**: what already exists

#### frontend / backend
- **E2E failure reason** (only if outer loop active)
- **E2E DOM selectors** (only if outer loop active): selectors the E2E test depends on, expected to exist on the appropriate elements
- **Existing test paths** (if any; may be multiple)
- **Implementation files**: list of (path, new/modify, description) tuples — target files only, not supporting files (CSS, config, assets)
- **Batch** (if any): list of (change description, discovery pattern, ~count) — mechanical edits to be applied across many files. Not file paths.
- **Expected Behaviour**: all behaviors across all units in this layer

#### Custom layers (per registry)
- **Third-party API context** (if applicable): context from the Phase 1 plan's "Third-Party API Integration Inputs"
- Additional fields as defined by the layer's testing skill

### Example prompts

For `frontend` or `backend`:
```
Layer: [frontend | backend]
Feature requirement: [specific behavior needed]
E2E failure reason: [only if outer loop active — why the E2E is failing]
E2E DOM selectors: [only if outer loop active — selectors the E2E test depends on that must exist in the implementation]
Existing test paths: [PATHS if tests exist for any of these units, otherwise omit]
Implementation files:
    - [PATH] (new/modify) — [brief description of what this unit does]
    - [PATH] (new/modify) — [brief description]
Batch (if any):
    - change: [description of what to modify]
      pattern: `[grep/glob command]` (~N files)
Expected Behaviour: [list all behaviors across all units in this layer.]
Architecture context: [Phase 1 plan: Domain Context + Architecture (layer-relevant parts) + Approach (including Constraints)]
```

For custom layers (per registry):
```
Layer: [custom layer name]
Feature requirement: [specific behavior needed]
Third-party API context: [context from Phase 1 plan, if applicable]
Architecture context: [Phase 1 plan: Domain Context + Architecture (layer-relevant parts) + Approach (including Constraints)]
[additional fields per the layer's testing skill]
```

## Normal Mode Return

```
Layer: [layer name]
Test Files:
- [path to test file]
- [path to test file (if multiple)]
Test Command: [single command covering all test files]

Tests Written:
- [test name]: [brief description of what it tests]
- [test name]: [brief description of what it tests]
- ...

Failure Summary:
[X tests fail because implementation is missing]

Failure Output:
[paste the relevant failure output showing all failures]

Failure Analysis:
[brief explanation of WHY these are the right failures, referencing the skill's criteria]

New DOM Selectors (e2e layer only):
- [selector] on [element description] in [component] — [exists yet? yes/no]
- (or "None — all selectors reference existing DOM attributes")

Debug Notes: (only if Debug mode: ON was in the input — omit entirely otherwise)

Instruction Issues:
- [MISSING/BROKEN_REF/UNCLEAR/CONFLICT] description
- (or "None")

Execution Reflection:
- [BACK_AND_FORTH/STUCK/INEFFICIENT/RETRY/ASSUMPTION] description
- (or "Clean execution")
```

## Adjustment Mode Inputs

- **Layer**: any layer whose tests broke (as defined in `.claude/tdd-registry.md`)
- **Feature requirement**: What changed (implementation is already complete)
- **Existing test path**: Path to the test file with broken assertions
- **Failure output**: Test failure output showing which assertions broke
- **Business process**: Name from `.claude/business-processes.md`, or "infrastructure" (only when layer is `e2e`)
- **Mode**: `adjustment`

## Adjustment Mode Return

```
Layer: [layer name]
Test File: [path to test file]
Test Command: [command to run this specific test]

Assertions Updated:
- [assertion description]: [old value → new value]
- ...

Assertions Removed:
- [list any assertions removed entirely, with justification for each]
- (empty list if no assertions were removed)

Genuine Bug Detected: [Yes/No — Yes ONLY if: (a) a test failure persists AFTER your adjustments, indicating the implementation doesn't work correctly, (b) you had to REMOVE a feature-behavior assertion to make tests pass (the implementation doesn't provide the behavior), or (c) a workaround would be needed to make the test pass. Do NOT flag Yes based on code-path analysis or theoretical reasoning — if your adjustments produce passing tests without removing behavioral assertions, report No.]
Bug Description: [only if Genuine Bug Detected is Yes — describe the bug and which test reveals it]

Test Result:
[paste test output showing tests PASS after adjustment, or showing remaining failures if a genuine bug was detected]

Adjustment Summary:
[brief explanation of what changed and why]

Debug Notes: (only if Debug mode: ON was in the input — omit entirely otherwise)

Instruction Issues:
- [MISSING/BROKEN_REF/UNCLEAR/CONFLICT] description
- (or "None")

Execution Reflection:
- [BACK_AND_FORTH/STUCK/INEFFICIENT/RETRY/ASSUMPTION] description
- (or "Clean execution")
```
