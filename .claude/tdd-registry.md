# TDD Layer Registry

This file maps architecture layers to their skills and provides project-level configuration for the outside-in-tdd workflow. Generic agents read this file instead of hardcoding layer definitions.

## Layers

| Layer       | Testing Skill                      | Implementation Skill          | Description                                    |
|-------------|------------------------------------|-------------------------------|------------------------------------------------|
| e2e         | cypress-end-to-end-testing         | —                             | Cross-layer E2E verification of business processes |
| frontend    | jest-frontend-testing              | frontend-implementation       | React components, hooks, pages                 |
| backend     | jest-backend-testing               | backend-implementation        | API route handlers, lib utilities              |

## Layer Dependencies

None.

## E2E Test Directories

| Classification   | Path                              |
|------------------|-----------------------------------|
| Business process | `cypress/e2e/business-process/`   |
| Infrastructure   | `cypress/e2e/infrastructure/`     |

## E2E Failure → Layer Routing

When the E2E test fails, use these indicators to determine which inner layer to target:

| E2E Failure Type                                  | Target Layer |
|---------------------------------------------------|--------------|
| UI element missing/wrong                          | frontend     |
| UI interaction not working                        | frontend     |
| Page doesn't exist (Next.js 404)                  | frontend     |
| Data not displaying correctly                     | frontend (if rendering) or backend (if API) |
| API returns wrong data                            | backend      |
| API route doesn't exist (404/405)                 | backend      |
| Business logic incorrect                          | backend      |
| Database state wrong                              | backend      |

## Commands

| Purpose              | Command                                    |
|----------------------|--------------------------------------------|
| Specific test        | `npm run test:unit:spec <path>`            |
| Full verification    | `./t`                                      |
| Lint                 | `npm run lint`                             |
| Typecheck            | `npm run typecheck`                        |
| Mutation testing     | `npm run test:mutate:uncommitted`          |

## Mutation Testing

- Threshold: 60%
- Surviving mutants report: `reports/mutation/surviving-mutants.txt`

## Design Constraint Checks

When the TDD planner validates a design approach against the runtime environment, check for these conflicts:

| Check | Conflict |
|-------|----------|
| Browser-only APIs during render? | Next.js SSR hydration mismatch |
| State initializes differently server vs client? | React hydration mismatch |
| Borrowing pattern from existing code? | Verify assumptions still hold |
| Build-time transformation? | Silent build pipeline failure |
| localStorage state visible on page load? | Pre-hydration flash |
| Deferred state sync into shared context (useEffect)? | Context consumers won't re-render unless context value triggers setState — ref-only updates are invisible to consumers |
| Fixed/absolute element overlapping? | Z-index occlusion |

## File Path → Layer Mapping

Used by test-backfiller to determine which layer (and therefore which testing skill) applies to a given implementation file.

| Path Pattern                           | Layer       |
|----------------------------------------|-------------|
| `src/pages/api/**`                     | backend     |
| `src/lib/**`                           | backend     |
| `src/pages/**` (not api)               | frontend    |
| `src/components/**`                    | frontend    |
| `src/hooks/**`                         | frontend    |
