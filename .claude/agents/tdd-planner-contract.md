# tdd-planner Contract

Reference for input/output specifications. Read by both the orchestrator
(outside-in-tdd) and the tdd-planner agent.

## Inputs

- **Feature requirement**: The user's original feature request

## Return

```
## Implementation Plan

### Domain Context
- **Business process**: [name from `.claude/business-processes.md`, or "infrastructure", or "new — needs definition"]
- **Process step**: [which step(s) this feature relates to, or "N/A" for infrastructure]
- **Current behavior**: [what users see/do today in this area]
- **New behavior**: [how the feature changes/extends what users see/do]
- **Affected flows**: [other parts of the process that might be impacted, or "none"]

### Architecture
[which layers are involved, component hierarchy, data flow, API shape — with likely file paths as supporting detail, not a definitive file list]

### Test Strategy
- **Feature-complete layer**: [layer name from `.claude/tdd-registry.md`]
- **Rationale**: [why — references the decision matrix]
- **Units**:
  - [layer]:
    - [file path] (new/modify) — [description]
    - [file path] (new/modify) — [description]
    - Supporting files:
      - [file path] (modify) — [description]
    - Batch:
      - change: [description of what to modify (for migrations: old → new mapping)]
        pattern: `[grep/glob command]` (~N files)
  - [layer]:
    - [file path] (new/modify) — [description]

### Approach
[key design decisions and rationale]

#### Constraints
[technical constraints the implementer must respect — discovered during exploration (facts in existing code/config) or identified by validating the proposed approach against the runtime environment (design conflicts) — or "none"]

### Third-Party API Integration Inputs (only if custom layers with external API dependencies are present)
- [fields as required by the custom layer's testing skill — e.g., example cURL, relevant data description]

Debug Notes: (only if Debug mode: ON was in the input — omit entirely otherwise)

Instruction Issues:
- [MISSING/BROKEN_REF/UNCLEAR/CONFLICT] description
- (or "None")

Execution Reflection:
- [BACK_AND_FORTH/STUCK/INEFFICIENT/RETRY/ASSUMPTION] description
- (or "Clean execution")
```
