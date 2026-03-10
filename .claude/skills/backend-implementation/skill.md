---
name: backend-implementation
description: Implementation conventions for backend API routes and lib utilities. Loaded by tdd-implementer when the layer is backend.
---

# Backend Implementation Conventions

When creating or modifying API handlers and library utilities, follow these project-specific patterns.

## API Handler Pattern

Wrap all handlers with `withErrorHandling` from `@/lib/api-error-handler`:

```typescript
export default withErrorHandling(async function handler(req, res) {
    // handler logic
});
```

This returns `{ error: string }` JSON on unhandled exceptions. Do not silently swallow errors from external API calls or other dependencies — let them propagate to `withErrorHandling`.
