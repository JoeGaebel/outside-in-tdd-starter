---
name: outside-in-tdd
description: Outside-In TDD starting from E2E tests, drilling down to unit tests. Auto-triggers for new features. Trigger phrases include "implement", "add feature", "build", "create functionality". Does NOT trigger for bug fixes, documentation, or configuration changes.
---

# Outside-In TDD

Enforce strict Outside-In Test-Driven Development. Determine the lowest architecture layer test needed to ensure full coverage, then drill down to lower test layers as needed. Only after the tests are written does the implementation begin. The feature is complete only when the tests pass.

## Mandatory Workflow

Every new feature MUST follow this strict workflow. Do NOT skip phases.

## Philosophy

- **Clean state**: The codebase is clean before this workflow starts — lint passes, typecheck passes, all tests green and none are flakey. It must be clean after the workflow finishes. Any failure (lint, typecheck, test, timeout) encountered during the workflow was caused by work done in this session. Never dismiss a failure as pre-existing, intermittent. It's your responsibility to ensure this is clean prior to the workflow ending.
- **Right Layer of Testing**: The feature-complete test layer is the lowest layer at which tests can prove the feature works holistically. Not every feature needs E2E.
- **Outside-In**: When E2E is needed, start there and let failures guide you to lower levels
- **Scope-specific testing**: E2E tests verify business processes and cross-layer integration. Unit tests verify layer-specific behavior. Each layer's testing skill defines what that layer's tests cover.
- **Behavior-Focused**: E2E tests should be stable across refactors. If you split a component into two, or merge two into one, the E2E shouldn't need to change.
- **Complete Coverage**: Each layer touched needs tests at that layer

## Architecture Layers

Architecture layers are defined in `.claude/tdd-registry.md`. Read the registry at the start of the workflow to understand available layers, their testing and implementation skills, any layer dependencies, and the project's test commands.

An architecture layer is a slice of the system comprising both implementation code and its testing approach. The inner TDD cycle targets one architecture layer at a time.

---

## Workflow Overview

```
Phase 1: Explore, Plan & Test Strategy
    │   Explore codebase, design domain context + architecture, determine test strategy
    │
    ▼
Phase 2: Write E2E Feature-Complete Test (skip for single-unit changes)
    │
    ▼
Phase 3: Inner Loop(s) — RED → GREEN → REFACTOR
    │   3a: Identify next layer (skip if single-unit — layer known from Phase 1)
    │   3b: RED — write ALL tests for the target layer
    │   3c: GREEN — implement until tests pass
    │   3d: REFACTOR
    │   3e: Re-check feature-complete test (E2E if outer loop, unit tests if not)
    │       Pass? → Exit inner loop
    │       Fail? → Loop back to 3a
    │
    ▼
Phase 4: Completion
    │   4a: Run full verification — adjust broken assertions if needed
    │   4b: Mutation testing gate — backfill if below threshold
    │   4c: Summary
```

---

## Efficiency Guidelines

1. **Pass paths, not contents** — subagents read files themselves. Only read files when the main agent needs content for an orchestration decision (e.g., analyzing failure output).
2. **Trust subagent returns** — don't re-read files subagents just created/modified. Use their returned summaries and carry forward field values to the next phase.
3. **Targeted context only** — Phase 1 handles broad exploration. In later phases, use Glob/Grep to find the 2-4 relevant paths rather than spawning additional Explore agents.
4. **Summarize after each inner cycle** — After completing Steps 3b–3e, record a 2-3 line summary of what the cycle achieved (layer, files changed, test outcome). Do not carry full subagent returns or test failure outputs forward into subsequent cycles.

---

## Progress Indicator

Output a progress tree before each phase/step transition. Status: `✓` done `●` active `○` pending `—` skipped

### Outer bar
`TDD 🔭_ 🧪_ 🔄_ 🛡️_` (Plan, E2E Test, Inner Loop, Verify)

### Phase 1 (no expansion — single subagent)
`TDD 🔭● 🧪○ 🔄○ 🛡️○ ▸ Explore, Plan & Test Strategy`

### Phase 3 expansion (show cycle count + target layer)
```
TDD 🔭✓ 🧪✓ 🔄● 🛡️○ ▸ Inner Loop (cycle 1: frontend)
  ├ 3a 🔍 Find Layer   _
  ├ 3b 🔴 RED          _ [agent (layer)]
  ├ 3c 🟢 GREEN        _ [agent (layer)]
  ├ 3d 🔵 REFACTOR     _ [agent (layer)]
  └ 3e ↩️ Check        _
```
Use the layer name from the registry after the cycle number.

### Phase 4 expansion
```
  ├ 4a 🚦 Full verify   _
  ├ 4b 🧬 Mutations    _
  └ 4c 📋 Summary       _
```

Output at: Phase 1 entry, Phase 2 entry/skip, each 3a–3e step, each 4a–4c step, completion (all `✓`).

---

## Debug Mode

If the user's feature request contains `--debug`, activate debug mode:

1. **Strip the flag**: Remove `--debug` from the feature requirement before passing to subagents
2. **Add to every subagent prompt**: Append `Debug mode: ON` as a field in every subagent invocation
3. **Collect debug notes**: After each subagent returns, extract the `Debug Notes` section and store it with the agent name and phase
4. **Orchestrator self-reflection**: At each phase transition, note any orchestrator-level issues:
   - Re-invocations (had to call an agent again because of failures)
   - Routing uncertainty (wasn't sure which layer to target)
   - Context assembly difficulty (unclear which fields to pass or where to get values)
   - Missing information (had to ask the user or make assumptions)
5. **Report at Step 4c**: Output a consolidated Debug Report after the normal summary (see format below)

**Debug Report format:**
```
## Debug Report

### Subagent Issues
- [Phase X — agent-name (layer)] CATEGORY: description
- ...

### Orchestrator Issues
- [Phase X — Step Y] description
- ...

### Summary
- N instruction issues across M agents
- N execution issues across M agents
- N orchestrator observations
```

---

## Detailed Workflow

### Phase 1: EXPLORE, PLAN & TEST STRATEGY

Build understanding of the feature's domain context and scope, produce a plan, and determine the test strategy. The plan is output to the user for visibility but does NOT gate on approval — the workflow auto-proceeds based on the test strategy.

**Invoke `tdd-planner` subagent.** The planner explores the codebase itself (spawning Explore agents internally) and produces the plan including the test strategy. Fields per `.claude/agents/tdd-planner-contract.md` — "Inputs".

| Field                        | Value source                                                    |
|------------------------------|-----------------------------------------------------------------|
| Feature requirement          | User's original request                                         |

**Expected return:** See `.claude/agents/tdd-planner-contract.md` — "Return".

**Output to user:** After the agent returns, output the plan as an informational summary.

**Scope check:** Count the **target files** across all layers in the plan. Batches do NOT count toward this limit — they are mechanical repetitions driven by the target files. If there are **more than 8 target files**, stop and ask the user to identify a smaller vertical slice before proceeding. The full feature can be implemented across multiple TDD sessions — each session should target a scope that fits comfortably in context.

**Proceed:** Based on the Test Strategy in the plan:
- **If E2E is required**: Proceed to Phase 2 (write E2E test), then Phase 3 (inner loops)
- **If single-layer unit tests suffice**: Skip Phase 2, go directly to Phase 3 (inner loop)

---

### Phase 2: E2E FEATURE-COMPLETE TEST (Conditional — Outer Loop)

**Skip this phase if Phase 1 determined unit-level tests suffice. If so, go directly to Phase 3.**

Write an E2E test that defines "done" for this feature from the user's perspective — what the users do and what outcomes they expect. Tests assert behavior, not implementation details. The test should fail because nothing is implemented yet.

#### Step 1: Find the test file

Use the business process classification from Phase 1 (Domain Context section) to locate the test file. Read the "E2E Test Directories" table from `.claude/tdd-registry.md` for the directory paths:
1. Business process: Glob the business process directory for the existing test.
2. Infrastructure: Glob the infrastructure directory for the existing test.

#### Step 2: Determine the variant

The default is always **Variant A** — extend the existing `it` block. Business process tests are long-running workflows; new features add steps to that workflow.

- **Test file exists (business process)** → Read it. Check the `it` block names and the end of the target `it` block (last ~30 lines).
  - **Variant A** (default) — The new scenario can be inserted into or appended to the existing `it` block's flow. Use this unless there's a specific data incompatibility.
  - **Variant B** (rare) — The existing `it` block's accumulated data state is fundamentally incompatible with the new scenario. A scenario being "different" or the test being "long" is NOT sufficient justification — only true data incompatibility qualifies.
- **Test file exists (infrastructure)** → Read it. Use **Variant A** to extend the relevant `it` block, or **Variant B** if a new `it` block is needed. Infrastructure tests are typically shorter and more focused than business process tests, so new `it` blocks are more common here (e.g., testing a new auth mechanism alongside an existing one).
- **No test file exists (business process)** → **Variant C** (new file) — This is a genuinely new business process that doesn't fit any existing process described in `.claude/business-processes.md`. Before continuing, you must define the business process (see below).
- **No test file exists (infrastructure)** → **Variant C** (new file) — Create a new file in the infrastructure directory (from registry). No need to define a business process.

**If Variant C — define the business process first:**

Before writing any tests, ask the user to clarify the new business process by providing:
1. **Name** — a short name for the business process (e.g., "Payroll", "Job Profitability")
2. **Value** — what the business process achieves and why it matters
3. **Steps** — the sequential steps that constitute the process
4. **Personas** — which personas are involved and what they do

After receiving this information, add the new business process to `.claude/business-processes.md` following the existing format (Value, Personas, Steps). Then continue to Step 3 using Variant C with the user-provided name and description.

#### Step 3: Invoke `tdd-test-writer` with layer `e2e`

Fields per `.claude/agents/tdd-test-writer-contract.md` — "e2e". Use the variant determined in Step 2 to select which fields to include:

| Field                       | Value source                                                                                                          | Variants |
|-----------------------------|-----------------------------------------------------------------------------------------------------------------------|----------|
| Layer                       | Always `e2e`                                                                                                          | All      |
| Feature requirement         | User's original request                                                                                               | All      |
| Business process            | From Domain Context section, or "infrastructure"                                                                      | All      |
| Existing test file          | Path from Step 1 search, or "none" for Variant C                                                                      | All      |
| Existing it block to extend | Name of the target it block                                                                                           | A only   |
| Why new it block            | Justification for data incompatibility                                                                                | B only   |
| Add ALL assertions for      | User's goals and expected outcomes — what users do and see. Write from user's perspective, not implementation details. Never reference CSS classes, DOM attributes, or HTML structure — describe only what the user sees change (e.g., "page background changes to dark color" not "adds dark class to html element"). When a build-time step mediates between code and visible result, specify the expected **outcomes** (e.g., "background color changes") not mechanisms (e.g., "class is added"). | All      |
| Architecture context        | Phase 1 plan: Domain Context + Architecture (layer-relevant parts) + Approach (including Constraints)                                         | All      |
| Partial implementation note | What already exists (only when returning from Phase 4b)                                                               | Optional |

The subagent will load the E2E testing skill for patterns and batching rules, and write the test accordingly.

**Expected return:** See `.claude/agents/tdd-test-writer-contract.md` — "Normal Mode Return".

**Store for later:**
- `featureCompleteTestPath`: The E2E test file(s)
- `featureCompleteTestCommand`: Command to run it
- `e2eDomSelectors`: The "New DOM Selectors" from the return (pass to inner-layer test writers and implementers so they know what attributes the E2E expects)

**Do NOT proceed until the E2E test fails for the right reason.** The failure output from the tdd-test-writer return is used for the first Step 3a analysis.

---

### Phase 3: INNER CYCLES (Repeat Until Feature-Complete Test Passes)

#### Step 3a: Determine Next Layer

First determine the layer — either by analyzing the E2E failure (outer loop active) or from Phase 1 (outer loop skipped) — then identify units.

**When outer loop is active (Phase 2 was executed):** Analyze WHY the E2E test is failing. Read the "E2E Failure → Layer Routing" table from `.claude/tdd-registry.md` to map the failure type to a target layer.

**Layer dependency sequencing:** Check the "Layer Dependencies" table in the registry. If the target layer depends on another layer, complete the dependency's inner cycle first (Steps 3b–3d), then return to Step 3a — the next failure will guide you to the dependent layer. The dependency MUST complete before the dependent layer because it produces artifacts the dependent layer needs.

**When outer loop was skipped (single-unit change):** The layer and units are already known from the Phase 1 plan's Test Strategy. Proceed to Step 3b.

- **Standard layers (frontend, backend)**: Use the layer and units from the Phase 1 plan.
- **Layers with dependencies (per registry)**: This requires sequential inner cycles — complete the dependency first. After that cycle completes (Steps 3b–3d), return here and begin the next cycle with the dependent layer.

**Rule: Always write a test before implementing.** Don't just fix code without test coverage.

**After identifying the layer, use the Phase 1 plan's unit enumeration for that layer.** If the E2E failure reveals a unit the plan didn't anticipate, add it to the enumeration. The unit list is passed to the test-writer and implementer in Steps 3b and 3c.

#### Step 3b: RED - Write ALL Tests for the Target Layer

Invoke the `tdd-test-writer` agent to Write ALL tests needed for the target layer — all behaviors, states, and interactions across all units in this layer that need work. Each inner cycle targets one layer; the E2E loop (or feature-complete test) sequences additional layers if needed.

**When outer loop is active:** Pass all target files and batch info for the target layer to the test writer.

**When outer loop was skipped:** Write ALL tests for the unit(s) from Phase 1's Test Strategy. These tests ARE the feature-complete test. They define "done".

**Do not assert the absence of old behavior being replaced.** Tests for the new design implicitly replace the old (e.g., don't write "button should NOT be red" alongside "button should be blue"). Negation is fine when testing boundaries, validation, or access control (e.g., "request should be rejected when rate limit exceeded").

**Before invoking subagent:**
1. Use Glob to find ALL existing test files for the units being changed (search `test/**/*<filename>*` for each implementation file name). This includes page-level tests which mock API responses — when backend API response shapes change, these tests need mock data updated too. Pass all paths to the subagent so the RED phase covers every test file for the layer.
2. Use the Phase 1 plan's unit enumeration for this layer as the implementation file list.
3. **For custom layers (per registry):** Consult the layer's testing skill for required fields and inputs. Use the values from the Phase 1 plan's "Third-Party API Integration Inputs" section if applicable.

4. **Translate constraints to testable behaviors**: For each design constraint in the plan's Approach/Constraints, include an explicit testable behavior in "Expected Behaviour". State the observable outcome, not the mechanism. E.g., constraint "read localStorage only in useEffect" → behavior "initial state is always the default regardless of localStorage". Avoid parenthetical mechanism hints (e.g., "reads X on mount (useEffect, SSR-safe)") — the test writer may test the behavior without enforcing the constraint, wasting an inner cycle.

5. **Exclude static styling from Expected Behaviour**: Static visual attributes (positioning, decorative appearance, layout) are implementation details, not testable behaviors. Only include behaviors involving state changes, user interactions, or conditional rendering. E.g., "floating button in top-right" → exclude (static layout); "shows sun icon in light mode, moon icon in dark mode" → include (conditional on state). Static styling reaches the implementer via architecture context.

**Invoke `tdd-test-writer`** with the layer from Step 3a (or from Phase 1 if the outer loop was skipped).

Fields per `.claude/agents/tdd-test-writer-contract.md`:

**`frontend` / `backend`:**

| Field                  | Value source                                                                       |
|------------------------|-------------------------------------------------------------------------------------|
| Layer                  | From Step 3a (or Phase 1 if outer loop skipped)                                    |
| Feature requirement    | User's original request                                                            |
| E2E failure reason     | From Step 3e failure output (only if outer loop active — omit otherwise)           |
| E2E DOM selectors      | Stored `e2eDomSelectors` from Phase 2 return (only if outer loop active — omit otherwise) |
| Existing test paths    | Paths found by Glob in "Before invoking subagent" point 1 (omit if none found)    |
| Implementation files   | Target files from Phase 1 plan, filtered by layer (augmented in Step 3a if needed). Exclude supporting files (CSS, config). |
| Batch              | Batch from Phase 1 plan for this layer (if any): change description + discovery pattern + count. Not file paths. Omit if none. |
| Expected Behaviour     | All behaviors across all units — derived from user request + Step 3a enumeration + constraint-derived behaviors (see point 4 above) |
| Architecture context   | Phase 1 plan: Domain Context + Architecture (layer-relevant parts) + Approach (including Constraints) |

**Custom layers:** For layers defined in the registry beyond frontend/backend, use the common fields (Layer, Feature requirement, Architecture context) plus any third-party API context from the Phase 1 plan's "Third-Party API Integration Inputs" section. The subagent will load the layer's testing skill for layer-specific conventions.

**Example prompts:** See `.claude/agents/tdd-test-writer-contract.md` — "Example prompts".

**Expected return:** See `.claude/agents/tdd-test-writer-contract.md` — "Normal Mode Return".

**When outer loop was skipped — store feature-complete test info:**

- **Standard layer (single cycle):** Store the returned `Test Files` as `featureCompleteTestPath` and `Test Command` as `featureCompleteTestCommand`.
- **Layers with dependencies (per registry):** For the dependency cycle: store the returned test info but do NOT set `featureCompleteTestCommand` yet. Proceed through Steps 3c–3d–3e. After Step 3c, store any output artifacts the dependent layer needs (e.g., wrapper paths). Step 3e will route you back to Step 3a for the dependent layer. For the dependent cycle: combine all stored test commands into a single `featureCompleteTestCommand` using `--testPathPattern` with all file patterns joined by `|`. Both tests together prove the feature works.

#### Step 3c: GREEN - Implement Until ALL Tests Pass

**Invoke `tdd-implementer` subagent.** Fields per `.claude/agents/tdd-implementer-contract.md` — "Inputs".

| Field                | Value source                                                                                                              |
|----------------------|---------------------------------------------------------------------------------------------------------------------------|
| Feature requirement  | Carry forward from the original user request                                                                              |
| Layer                | Layer from Step 3b return                                                                                                 |
| Test files           | Test Files from Step 3b return                                                                                            |
| Test command         | Test Command from Step 3b return                                                                                          |
| Tests to pass        | Tests Written from Step 3b return — all of them                                                                           |
| Implementation files | Target files from Phase 1 plan, filtered by layer (augmented in Step 3a if needed). Include supporting files (CSS, config). |
| Batch                | Batch from Phase 1 plan for this layer (if any): change description + discovery pattern + count. Not file paths — the implementer runs the discovery pattern to find files. Omit if none. |
| E2E DOM selectors    | Stored `e2eDomSelectors` from Phase 2 return (only if outer loop active — omit otherwise)                                 |
| Third-party API context | From Phase 1 plan's "Third-Party API Integration Inputs" (only for custom layers that need it — omit otherwise)        |
| Architecture context | Phase 1 plan: Domain Context + Architecture (layer-relevant parts) + Approach (including Constraints) |

**Expected return:** See `.claude/agents/tdd-implementer-contract.md` — "Return — Success".

**Do NOT proceed until ALL tests pass.**

**If the implementer reports it cannot make tests pass** (e.g., it believes the tests are wrong, or it hit an infrastructure issue it cannot resolve):
1. Read the implementer's explanation
2. If the implementer says the tests are wrong: re-examine the test expectations — spawn an Explore agent to investigate if needed.
   - If the tests ARE wrong: re-invoke `tdd-test-writer` using the normal Step 3b prompt format with corrected requirements (the subagent will read the existing tests and update them). **Stale fields**: Omit the E2E failure reason (it's from before implementation began). Include the implementer's BLOCKED explanation in the correction context so the test writer understands what failed and why.
   - If the tests are correct and the implementer is mistaken: re-invoke `tdd-implementer` with the same inputs plus a clarification note explaining why the test expectations are correct (e.g., "The codebase uses 200 for this endpoint type because X. Implement accordingly.").
3. If the implementer hit an infrastructure issue: investigate (check `.claude/infrastructure.md` for debugging commands) and retry.
4. If the issue persists after investigation: ask the user for guidance.

After re-invocation of tdd-test-writer, treat the updated return as the new Step 3b return and continue to Step 3c.

#### Step 3d: REFACTOR

**Invoke `tdd-refactorer` subagent.** Fields per `.claude/agents/tdd-refactorer-contract.md` — "Inputs".

| Field                  | Value source                                                                                                             |
|------------------------|--------------------------------------------------------------------------------------------------------------------------|
| Layer                  | Layer from Step 3b return                                                                                                |
| Test files             | Test Files from Step 3b return                                                                                           |
| Test command           | Test Command from Step 3b return                                                                                         |
| Implementation files   | Files Modified from Step 3c return                                                                                                |
| Batch              | Batch from Phase 1 plan for this layer (if any): change description + discovery pattern + count. Not file paths. Omit if none. |
| Implementation summary | Implementation Summary from Step 3c return                                                                               |
| Architecture context   | Phase 1 plan: Domain Context + Architecture (layer-relevant parts) + Approach (including Constraints) |

**Expected return:** See `.claude/agents/tdd-refactorer-contract.md` — "Return — Changes Made" and "Return — No Changes".

**If the refactorer created new files** (extraction): Note the new implementation and test files — mutation testing in Step 4b will verify their coverage.

#### Step 3e: RE-CHECK Feature-Complete Test
If `featureCompleteTestCommand` is stored, run it. If not yet stored (a dependency cycle just completed per the registry's Layer Dependencies — the dependency's test is stored but `featureCompleteTestCommand` is not), skip this step and return to Step 3a for the dependent layer's cycle.

**If PASSES:** Proceed to Phase 4.

**If FAILS:**
1. Analyze the new failure reason from the Bash output
2. **Quick-diagnose before re-running:** When the failure is an assertion mismatch (not a missing element), use available browser debugging tools (e.g., MCP browser tools, framework CLI) to inspect the actual DOM/CSS state rather than re-running the full E2E. Check computed styles, classList, attribute values, or localStorage to pinpoint the root cause. This avoids wasting cycles on blind retries.
3. **After CSS/build-time changes:** If the inner cycle modified CSS directives, PostCSS config, or other build-time artifacts, the E2E test container's cache may be stale. Consult `.claude/infrastructure.md` for how to clear the E2E test cache before re-running.
4. This failure becomes the failure output for the next Step 3a analysis. Return to Step 3a to start another inner cycle.

**If FAILS DUE TO ASSERTION FORMAT MISMATCH** (the implemented behavior IS present but the test assertion mechanism doesn't match the actual output format — e.g., color space `lab()` vs `rgb()`, date string format, number precision):
1. Invoke `tdd-test-writer` in adjustment mode (same fields as Step 4a table)
2. After the adjustment return, verify:
   a. Check `Assertions Removed` — if ANY removed assertions test behaviors from the feature requirement, the implementation is incomplete. Treat the missing behaviors as the failure reason and return to Step 3a.
   b. Check `Genuine Bug Detected` — if Yes, treat as an implementation failure. Return to Step 3a with the bug description as the failure reason.
   c. All assertions preserved with only mechanisms updated? Re-run the feature-complete test. Continue Step 3e flow based on the result.

**Distinguishing format mismatch from implementation failure:** A format mismatch means the element HAS the expected visual property but the computed value uses an unexpected string representation. An implementation failure means the element does NOT have the expected property at all (e.g., background didn't change, element is missing, wrong text content).

**If FAILS UNEXPECTEDLY (server errors, 500s, "Unknown argument" errors):**

These are NOT "right reason" failures — they indicate infrastructure issues:
1. **Check infrastructure** — read `.claude/infrastructure.md` for debugging commands. Quick checklist:
   - Are services running?
   - Check logs for errors (E2E tests hit `dev-test`, not `dev`)
   - If schema was changed: run migration commands and restart the dev server
   - If mock handlers were modified: restart the mock server
   - If "module not found" for an installed package: clear build caches
2. **Don't debug in main context** — If the issue isn't obvious, spawn an Explore agent to investigate rather than consuming main agent context with debugging
3. **After fixing**: Re-run the feature-complete test command (still in Step 3e). Continue the normal 3e flow based on the result.

**Distinguishing infrastructure from implementation failures:**
- Infrastructure: ECONNREFUSED, "Unknown argument", stale ORM client, timeouts, compilation errors in unrelated files, stale build cache
- Implementation: wrong data values, missing fields, incorrect logic, assertion failures referencing feature behavior
- Ambiguous: check if the error occurs in a file modified during this TDD cycle

---

### Phase 4: COMPLETION

The feature-complete test passes. Before declaring victory:

**Step 4a — Run full verification**: Run the full verification command from `.claude/tdd-registry.md`. Repeat this step until it passes, up to a maximum of **3 fix-and-rerun cycles**. If still failing after 3 cycles, stop and ask the user for guidance — report which tests are failing, what fixes were attempted, and whether the failures appear related to the feature or pre-existing.
   - **If PASSES**: Proceed to Step 4b.
   - **If FAILS UNEXPECTEDLY** (server errors, 500s, infrastructure issues): Follow the same infrastructure checklist from Step 3e. After fixing, re-run the full suite.
   - **If tests FAIL with broken assertions** (the implementation changed behavior that existing tests rely on): For each failing test file, determine why it's failing:
     - **Expected breakage** (assertions reference old values like renamed labels, changed selectors, updated formats — the behavior intentionally changed): Invoke `tdd-test-writer` in adjustment mode for that test file.
     - **Genuine failure** (the test reveals the implementation broke something it shouldn't have — unintended behavioral change): This is a real bug — see the genuine failure recovery steps below.

     How to distinguish: If the failing test is testing the SAME business process that the feature targets and expects a broader change, this is likely under-scoping (see below). If the failing test is testing an UNRELATED area and the implementation inadvertently broke it, this is a genuine failure.

     For genuine failures, the existing failing test serves as the RED test:
     1. Spawn an Explore agent to investigate the root cause
     2. Invoke tdd-implementer to fix the implementation:

        | Field                | Value source                                                          |
        |----------------------|-----------------------------------------------------------------------|
        | Feature requirement  | Carry forward from the original user request                          |
        | Layer                | Layer of the failing test file                                        |
        | Test files           | The failing test file path                                            |
        | Test command         | Specific test command from registry with the failing test file path   |
        | Tests to pass        | The specific failing test case(s)                                     |
        | Implementation files | Files identified by the Explore agent as the root cause               |
        | Architecture context | Phase 1 plan: Domain Context + Architecture + Approach                |

     3. After the fix, return to Step 4a and re-run the full suite

     **Processing order**: Handle genuine failures first — they may change code that affects other assertions. After resolving, re-run the full suite before processing expected breakage.

     For each test file needing adjustment, invoke `tdd-test-writer` in adjustment mode. Fields per `.claude/agents/tdd-test-writer-contract.md` — "Adjustment Mode Inputs":

     | Field               | Value source                                                          |
     |---------------------|-----------------------------------------------------------------------|
     | Layer               | Layer of the failing test file                                        |
     | Feature requirement | User's original request (carry forward)                               |
     | Existing test path  | Failing test file path from full suite output                         |
     | Failure output      | Relevant failure output from full suite Bash output                   |
     | Business process    | From Domain Context section (only when layer is `e2e` — omit otherwise) |
     | Mode                | Always `adjustment`                                                   |
     **Expected return:** See `.claude/agents/tdd-test-writer-contract.md` — "Adjustment Mode Return". Note the `Genuine Bug Detected` field — if the subagent reports a genuine implementation bug instead of adjusting assertions, treat it as a genuine failure (above).
     **Post-adjustment verification:** After receiving each adjustment return, check the `Assertions Removed` field. If any removed assertions test PRIMARY feature behaviors (not tangential/unrelated behaviors), the implementation is incomplete — treat as "FAILS with missing implementation" (below).

     The subagent will load the appropriate skill for that layer, fix all broken assertions, and verify the tests pass before returning. After all adjustments, re-run the full suite to confirm it passes.
   - **If FAILS with missing implementation** (failure indicates the feature needs additional layers): Phase 1 under-scoped the feature. Return to Phase 2 — the decision is already made (E2E is needed). Write the feature-complete E2E test using the `Partial implementation note` field to describe what already exists. Then resume Phase 3 inner cycles.

**Step 4b — Mutation testing gate**: Run mutation testing on all uncommitted implementation files to verify test strength meets the threshold defined in `.claude/tdd-registry.md`. This catches logic branches that TDD tests don't exercise.

1. **Run mutation testing**: Use the mutation testing command from the registry.
2. **If all files meet the threshold** (exit code 0): Proceed to Step 4c.
3. **If files are below threshold** (exit code 1):
   a. Read the surviving mutants report (path from registry)
   b. For each failing file, use Glob to find existing test files: `test/**/*<filename-stem>*`
   c. Spawn a `test-backfiller` agent **in parallel** for each failing file. Fields per `.claude/agents/test-backfiller-contract.md` — "Inputs".

      | Field                 | Value source                                       |
      |-----------------------|----------------------------------------------------|
      | Implementation file   | Path of the file below threshold                   |
      | Existing test file(s) | Paths from Glob in step (b) above                  |
      | Test command          | Specific test command from `.claude/tdd-registry.md` with test file path |
      | Surviving mutants     | File-specific section from the surviving mutants report |

      **Expected return:** See `.claude/agents/test-backfiller-contract.md` — "Return".

   d. Re-run mutation testing to verify threshold is met.
   e. If a backfill agent reports a test failure: This indicates an implementation bug. Invoke tdd-implementer to fix it using the failing test. After fixing, re-run the backfill test, then continue with 4b.d.
   f. If still below threshold after one round of backfill, report the remaining gaps to the user and proceed to Step 4c. Do not loop indefinitely.

**Step 4c — Summary**: Report what was built and tested. If debug mode is active, append the consolidated Debug Report (see Debug Mode section above).

---

## Rules and Guardrails

### Main Agent — ORCHESTRATOR ONLY

The main agent orchestrates the TDD workflow but NEVER writes code directly. If you find yourself about to use Edit or Write on a `.ts`, `.tsx`, or `.prisma` file, STOP — invoke a subagent instead.

**The only tools the main agent should use are:** Glob, Grep, Read, Bash (for running tests), and Task (to invoke subagents).

### Guardrails

- DO NOT: Write implementation before writing a failing test
- DO NOT: Proceed from RED without seeing the test fail for the right reason
- DO NOT: Skip Phase 1 test strategy and default to E2E for every feature
- DO NOT: Duplicate unit-level assertions in E2E tests
- DO NOT: Include CSS classes, DOM structure, or styling details in E2E test prompts to subagents — describe only what the user sees and does
- DO NOT: Skip the REFACTOR phase (Step 3d). Always invoke the `tdd-refactorer` subagent — it decides whether refactoring is needed, not the main agent. This applies regardless of how small the change is.
- DO NOT: Start a new feature before the current feature-complete test passes
- DO NOT: Skip Step 3b (RED) for any inner cycle — no exceptions. Always invoke `tdd-test-writer`: it determines which files need tests. The orchestrator must not pre-judge this.
- DO NOT: Pass the E2E test as the implementer's test command in an inner cycle. The E2E is the feature-complete check in Step 3e only. Inner cycle implementers must receive unit-level test commands from Step 3b. (Only applies when the outer loop is active.)
- DO NOT: Stop early — if the feature-complete test passes "by accident," verify sufficient coverage. Ask: "If I broke this logic, would the tests fail appropriately?"
- DO NOT: Accept weakened tests. After any adjustment mode return (Step 3e or Step 4a), verify that all assertions for primary feature behaviors are still present. A test that passes because assertions were removed is not a valid pass — the implementation must be fixed to satisfy the original assertions.

---

## Multiple Features

Complete the full workflow for EACH feature before starting the next:

```
Feature 1 (single unit):  [Inner loop(red→green→refactor)]* → full suite ✓ → mutation gate ✓
Feature 2 (multi-unit):   E2E(red) → [Inner loops(red→green→refactor)]* → full suite ✓ → mutation gate ✓
Feature 3 (cross-layer):  E2E(red) → [Layer inner loops*] → full suite ✓ → mutation gate ✓
```
