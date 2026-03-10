---
name: self-improvement
description: Instructions for adjusting outside-in-tdd skills and agents
---

# Architecture

The outside-in-tdd workflow is split into two layers:

**Generic Framework** (reusable across projects):
- **Agents** (`.claude/agents/`) — Process definitions for how each TDD phase agent behaves. Reference the registry for project-specific config.
- **Contracts** (`.claude/agents/*-contract.md`) — Data shape definitions for what flows between agents. Define WHAT data, never HOW to use it.
- **Orchestrator** (`.claude/skills/outside-in-tdd/skill.md`) — Workflow coordination across phases. References the registry for layers, commands, and routing.

**Project-Specific Extensions** (per-project):
- **TDD Registry** (`.claude/tdd-registry.md`) — The plug-in mechanism. Maps layers to skills, defines test commands, failure routing, mutation config, layer dependencies, and file path → layer mapping.
- **Testing Skills** — Loaded by test-writer, refactorer, and test-backfiller. Define test patterns, file templates, right/wrong failure criteria for a specific layer.
- **Implementation Skills** — Loaded by implementer. Define implementation conventions (hooks, wrappers, patterns) for a specific layer.
- **Business Processes** (`.claude/business-processes.md`) — Domain processes (Value, Personas, Steps) and user personas. The planner matches features to processes; the orchestrator adds new ones.
- **CLAUDE.md** — Project identity and cross-cutting conventions. Kept minimal — always loaded into context.
- **Infrastructure** (`.claude/infrastructure.md`) — Docker debugging, Prisma commands, cache management. Loaded on demand by agents.

**How layers are added:** Create testing skill + implementation skill (optional), register both in the registry's Layers table, add file path mappings and failure routing entries.

# Agents

Agent definitions (`.claude/agents/` files not ending in `-contract.md`) define process behavior. They reference the registry to discover project-specific config. Common workflow behavior lives in agents; project-specific patterns live in skills loaded via the registry.

# Skills

Skills (`.claude/skills/`) are project-specific instructions for specific tasks. Testing skills and implementation skills are separate — different agents load different skills to avoid context bloat.

# Contracts

Contracts (`*-contract.md` in `.claude/agents/`) define WHAT data flows between agents. HOW to populate the data lives in the orchestrator's field mapping tables. HOW to use the data lives in the agent definition.

# Outside-In TDD — Workflow & Agent Map

```
Orchestrator: outside-in-tdd/skill.md
  │
  ├─ Phase 1: PLAN
  │   └─ tdd-planner → explores codebase, produces implementation plan with target files + batch
  │       (spawns Explore agents internally)
  │
  ├─ Phase 2: E2E TEST (conditional — skipped for single-unit changes)
  │   └─ tdd-test-writer (layer: e2e) → writes failing E2E test
  │       loads testing skill from registry (e.g., cypress-end-to-end-testing)
  │
  ├─ Phase 3: INNER CYCLES (repeat until feature-complete test passes)
  │   ├─ 3b RED:    tdd-test-writer (layer from registry)
  │   │              loads testing skill from registry
  │   ├─ 3c GREEN:  tdd-implementer → implements until tests pass
  │   │              loads implementation skill from registry (if one exists for the layer)
  │   └─ 3d REFACTOR: tdd-refactorer → evaluates and improves code quality
  │                    loads testing skill from registry
  │
  └─ Phase 4: COMPLETION
      ├─ 4a Full verification (command from registry) — may invoke tdd-test-writer in adjustment mode
      └─ 4b Mutation gate (command from registry) — may invoke test-backfiller agents in parallel
```

**Key files per agent:**

| Agent | Definition | Contract |
|-------|-----------|----------|
| Orchestrator | `.claude/skills/outside-in-tdd/skill.md` | — |
| Planner | `.claude/agents/tdd-planner.md` | `.claude/agents/tdd-planner-contract.md` |
| Test Writer | `.claude/agents/tdd-test-writer.md` | `.claude/agents/tdd-test-writer-contract.md` |
| Implementer | `.claude/agents/tdd-implementer.md` | `.claude/agents/tdd-implementer-contract.md` |
| Refactorer | `.claude/agents/tdd-refactorer.md` | `.claude/agents/tdd-refactorer-contract.md` |
| Test Backfiller | `.claude/agents/test-backfiller.md` | `.claude/agents/test-backfiller-contract.md` |

**Shared files:**
- `.claude/agents/debug-protocol.md` — Debug mode return format, referenced by all agents

# Best Practices

1. **Right location**: Instructions go where they're needed. Workflow → agents/orchestrator. Project patterns → skills. Data shape → contracts. Cross-cutting conventions → CLAUDE.md. Infrastructure commands → `.claude/infrastructure.md`. Layer config → registry.
2. **Propagate changes**: A change to one agent's output may require updates to its contract, the orchestrator's field mapping, downstream agents' contracts and definitions, and their skills.
3. **Contracts are data-only**: WHAT data, never HOW. HOW belongs in the agent or skill.
4. **No MEMORY.md lessons**: Improvements go directly into workflow instructions. If a lesson matters, change the instructions so agents behave differently next time.
5. **Be succinct**: Instructions consume context. Be as brief as possible, only as verbose as necessary.
6. **Generic vs project-specific**: When adding instructions, ask whether they apply to any project using this TDD workflow (→ generic framework) or only to this project's stack/patterns (→ skill or CLAUDE.md).
