# Outside-In TDD Starter

An outside-in test-driven development workflow that runs inside [Claude Code](https://docs.anthropic.com/en/docs/claude-code). It starts from E2E tests and drills down through architecture layers, writing tests before implementation at every level.

This repo serves two purposes:

1. **Sandbox** — A working todo app where you can try out the workflow immediately
2. **Starter template** — Clone it, strip out the todo app, and build your own project with Outside-In TDD from day one

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js](https://nodejs.org/) (v20+)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI installed

### Setup

```bash
git clone <repo-url> && cd outside-in-tdd-starter
npm install
npm run dev                 # starts Docker containers, runs migrations, waits for health checks
```

Services will be running at:

| Service | Port | Purpose |
|---------|------|---------|
| Dev server | 3001 | Next.js app |
| Test server | 4001 | Cypress E2E tests (separate DB) |
| PostgreSQL | 5433 | Database |

### Try It Out

Open Claude Code in the project directory and ask it to implement a feature:

```
implement the ability to add a new todo item
```

The `outside-in-tdd` skill triggers automatically for feature requests. Claude will plan, write a failing E2E test, then cycle through RED-GREEN-REFACTOR for each layer until the feature is complete.

## How It Works

When you ask Claude Code to implement a feature, the orchestrator runs four phases. The workflow completes one architecture layer at a time (e.g., frontend first, then backend). Within each layer, it writes all failing tests across every unit (components, hooks, routes, etc.) in a single RED phase, then implements all changes in a single GREEN phase — minimising the number of agent handoffs to reduce time cost.

```
Phase 1: PLAN
  └─ Explores codebase, designs implementation across architecture layers

Phase 2: E2E TEST
  └─ Writes a failing end-to-end test that defines "done" from the user's perspective

Phase 3: INNER CYCLES (one layer at a time, e.g., frontend → backend)
  ├─ RED:      Write failing unit/integration tests for the layer
  ├─ GREEN:    Implement minimal code to pass them
  ├─ REFACTOR: Improve code quality while keeping tests green
  └─ (repeat for next layer until E2E test passes)

Phase 4: COMPLETION
  ├─ Run full verification (lint, typecheck, tests)
  ├─ Mutation testing gate (kill surviving mutants)
  └─ Summary
```

### How Agents Find Their Skills

Each TDD phase is handled by a specialized agent. Agents discover project-specific patterns through the registry:

```
Agent receives layer name (e.g., "frontend")
  → Reads .claude/tdd-registry.md
  → Finds the skill name for that layer (e.g., "jest-frontend-testing")
  → Loads the skill
  → Follows the skill's conventions for writing tests or implementing code
```

- **Test-writer, refactorer, test-backfiller** load the **testing skill** for the layer
- **Implementer** loads the **implementation skill** for the layer (if one exists)

This keeps context focused — agents only load what they need for their specific task.

## File Structure

```
.claude/
├── skills/
│   ├── outside-in-tdd/skill.md         # Orchestrator — drives the entire workflow
│   ├── cypress-end-to-end-testing/     # E2E testing patterns (Cypress)
│   ├── jest-frontend-testing/          # React component/hook test patterns
│   ├── jest-backend-testing/           # API route/lib test patterns
│   ├── frontend-implementation/        # Frontend code conventions
│   ├── backend-implementation/         # Backend code conventions
│   └── self-improvement/               # Helps Claude update and adjust the TDD skills and agents
│
├── agents/                             # One agent per TDD activity
│   ├── tdd-planner.md                  # Phase 1: Explore codebase, design plan
│   ├── tdd-test-writer.md              # RED: Write failing tests
│   ├── tdd-implementer.md              # GREEN: Implement to pass tests
│   ├── tdd-refactorer.md               # REFACTOR: Improve code quality
│   ├── test-backfiller.md              # Kill surviving mutants
│   ├── debug-protocol.md              # Debug mode reporting format
│   └── *-contract.md                   # Data shape contracts between agents
│
├── tdd-registry.md                     # Layer config, commands, failure routing
├── business-processes.md               # Domain workflows and user personas
└── infrastructure.md                   # Docker, Prisma, and cache debugging commands

CLAUDE.md                               # Project identity and cross-cutting conventions
```

### Generic Framework (reusable across projects)

These files contain workflow logic only. They never reference specific tools, frameworks, or project patterns.

| File | Purpose |
|------|---------|
| `skills/outside-in-tdd/skill.md` | Orchestrator. Sequences phases, routes E2E failures to layers, manages the RED-GREEN-REFACTOR cycle. |
| `agents/tdd-planner.md` | Explores the codebase and produces an implementation plan with target files per layer. |
| `agents/tdd-test-writer.md` | Writes ALL failing tests for a layer. Validates they fail for the right reason. |
| `agents/tdd-implementer.md` | Implements minimal code to make tests pass. Never modifies tests. |
| `agents/tdd-refactorer.md` | Evaluates and improves code quality while keeping tests green. |
| `agents/test-backfiller.md` | Writes tests to kill surviving mutants from mutation testing. |
| `agents/*-contract.md` | Define the data shape passed between agents (inputs/outputs). |
| `agents/debug-protocol.md` | Defines the debug reporting format for instruction issues and execution reflection. |

### Project-Specific (you configure these)

| File | Purpose                                                                                                                                          |
|------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| `tdd-registry.md` | Maps archecture layers to skills, defines test commands, failure routing, mutation config, and file path mappings.                               |
| `business-processes.md` | Domain processes (User value, Personas, Steps). The planner matches features to processes; these are encoded as business value end-to-end tests. |
| `skills/<name>/skill.md` | Testing or implementation skill for a specific layer. Loaded by agents via the registry.                                                         |
| `infrastructure.md` | Debugging commands for Docker, databases, caches — loaded on demand by agents.                                                                   |
| `CLAUDE.md` | Cross-cutting project conventions. Always loaded into context, so keep it minimal.                                                               |

## Adapting for Your Own Project

To replace the todo app with your own project, you need to update the project-specific files. The generic framework (agents, contracts, orchestrator) stays as-is.

### 1. Update the Registry

Edit `.claude/tdd-registry.md` to define your project's layers and commands. The included registry is configured for the todo app's stack (Jest, Cypress, React). Update the skill names to match your technology choices — for example, replacing `jest-frontend-testing` with `vitest-frontend-testing`, or `frontend-implementation` with `vue-implementation`.

**Layers table** — maps each architecture layer to its testing skill and optionally an implementation skill:

```markdown
| Layer       | Testing Skill                      | Implementation Skill          | Description                                    |
|-------------|------------------------------------|-------------------------------|------------------------------------------------|
| e2e         | cypress-end-to-end-testing         | —                             | Cross-layer E2E verification of business processes |
| frontend    | jest-frontend-testing              | frontend-implementation       | React components, hooks, pages                 |
| backend     | jest-backend-testing               | backend-implementation        | API route handlers, lib utilities              |
```

**Commands** — how to run tests, lint, typecheck, and mutation test:

```markdown
| Purpose              | Command                                    |
|----------------------|--------------------------------------------|
| Specific test        | `npm run test:unit:spec <path>`            |
| Full verification    | `./t`                                      |
| Lint                 | `npm run lint`                             |
| Typecheck            | `npm run typecheck`                        |
| Mutation testing     | `npm run test:mutate:uncommitted`          |
```

**E2E Failure Routing** — tells the orchestrator which layer to target when an E2E test fails:

```markdown
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
```

**File Path → Layer Mapping** — used by the test-backfiller to determine which layer a file belongs to:

```markdown
| Path Pattern                           | Layer       |
|----------------------------------------|-------------|
| `src/pages/api/**`                     | backend     |
| `src/lib/**`                           | backend     |
| `src/pages/**` (not api)               | frontend    |
| `src/components/**`                    | frontend    |
| `src/hooks/**`                         | frontend    |
```

Optional sections: **Layer Dependencies** (if one layer must be built before another), **Mutation Testing** config (threshold percentage, report path), and **Design Constraint Checks** (runtime environment gotchas the planner should validate against).

### 2. Create Testing Skills

For each layer in your registry, create `.claude/skills/<skill-name>/skill.md`. This tells the test-writer agent how to write tests for that layer. Include:

- Test file location conventions and naming patterns
- Test file template/boilerplate
- Framework-specific patterns (mocking, setup/teardown, assertions)
- What constitutes a "right" vs "wrong" test failure (e.g., "right" = element not rendered because implementation is missing; "wrong" = syntax error in test)
- Example test structure

The existing skills (`cypress-end-to-end-testing`, `jest-frontend-testing`, `jest-backend-testing`) are working examples you can reference or adapt.

### 3. Create Implementation Skills (Optional)

For layers where the implementer needs project-specific guidance (e.g., "always wrap API handlers with this middleware", "use this hook for data fetching"), create an implementation skill. These are loaded by the implementer agent when working on that layer.

### 4. Define Business Processes

Edit `.claude/business-processes.md` with your domain processes and user personas. Each process should include:

- **Name** — short identifier (e.g., "Order Fulfilment", "User Onboarding")
- **Value** — what the process achieves and why it matters
- **Personas** — which user types are involved
- **Steps** — sequential steps that constitute the process

You don't need to define all processes upfront — when a feature introduces a genuinely new workflow (Variant C), the orchestrator will ask you to define it and will add it to this file.

### 5. Update CLAUDE.md

Add cross-cutting conventions that apply across all layers:

- Project identity and tech stack
- Infrastructure commands (how to start services, run migrations)
- Patterns that agents need everywhere (error handling, date formatting, etc.)

Keep this file minimal — it's always loaded into context.

### 6. Update Infrastructure Commands

Edit `.claude/infrastructure.md` with debugging commands for your specific setup — Docker, database, cache management, etc. This file is loaded on demand by agents when they encounter infrastructure issues.

## Adding Custom Layers

To add a new architecture layer beyond e2e/frontend/backend:

1. Create a testing skill: `.claude/skills/my-layer-testing/skill.md`
2. Optionally create an implementation skill: `.claude/skills/my-layer-implementation/skill.md`
3. Add a row to the **Layers** table in `tdd-registry.md`
4. Add **file path mappings** so the test-backfiller knows which files belong to this layer
5. Add **failure routing** entries so the orchestrator knows when to target this layer
6. If this layer depends on another, add a row to the **Layer Dependencies** table

## Debug Mode

Add `--debug` to your feature request:

```
implement a dashboard page --debug
```

Every subagent will report:
- **Instruction issues** — missing context, broken references, unclear or conflicting guidance
- **Execution reflection** — where it got stuck, went back and forth, or made inefficient choices

The orchestrator collects these notes and outputs a consolidated Debug Report at the end. Use this to find gaps in your skills, broken references after refactoring, or friction in the agent chain.

The protocol is defined in `.claude/agents/debug-protocol.md`.

## Modifying the Workflow

The `self-improvement` skill helps Claude understand the architecture of the TDD workflow so it can update and adjust the skills, agents, and contracts itself. Load it with `/self-improvement` in Claude Code, then ask Claude to make changes. It provides guidance on where changes belong:

| Change type | Where it goes |
|-------------|---------------|
| Workflow logic (phase sequencing, retries) | Agents or orchestrator |
| Data shape (what flows between agents) | Contracts (`*-contract.md`) |
| Project test patterns (mocking, assertions) | Testing skills |
| Project code patterns (hooks, middleware) | Implementation skills |
| Layer config (which layers, what commands) | Registry (`tdd-registry.md`) |
| Domain knowledge (processes, personas) | `business-processes.md` |
| Infrastructure debugging | `infrastructure.md` |
| Cross-cutting conventions | `CLAUDE.md` |

## Tech Stack (Todo App)

The included todo app uses:

- **Runtime**: Node.js, TypeScript, Next.js 16, React 19
- **Database**: PostgreSQL via Prisma 7
- **Auth**: NextAuth with credentials provider
- **Testing**: Cypress (E2E), Jest + React Testing Library (frontend), Jest + Prisma transactions (backend), Stryker (mutation testing)
- **Linting**: Oxlint
- **Infrastructure**: Docker Compose
