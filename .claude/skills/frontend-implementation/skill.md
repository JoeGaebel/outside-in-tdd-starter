---
name: frontend-implementation
description: Implementation conventions for frontend React components, hooks, and pages. Loaded by tdd-implementer when the layer is frontend.
---

# Frontend Implementation Conventions

When creating or modifying React components, hooks, and pages, follow these project-specific patterns.

## Data Fetching

Use standard React patterns for data fetching. For simple cases, `useState` + `useEffect` + `fetch` is fine. As the app grows, extract a custom hook (e.g., `useFetchApi`) to centralize loading/error state handling.

```typescript
const [data, setData] = useState<ResponseType | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
    fetch('/api/endpoint')
        .then(res => res.json())
        .then(setData)
        .finally(() => setLoading(false));
}, []);
```

## Selector Priority for Testability

Add semantic attributes to elements so that E2E tests can select them without CSS selectors. Use this priority:

1. **`aria-label`** — for interactive elements and content sections (buttons, inputs, tables, panels)
2. **Roles** — use semantic HTML elements that provide implicit roles (`button`, `nav`, `table`, `select`)
3. **`data-testid`** — only when no semantic alternative exists (e.g., a decorative icon that conveys state)

Specifically:
- Add `aria-label` to container elements that group related content (e.g., `<div aria-label="Todo list">`, `<section aria-label="Completed items">`)
- Add `aria-label` to interactive elements where text content alone is ambiguous (e.g., multiple "Delete" buttons — use `aria-label="Delete Buy groceries"` vs `aria-label="Delete Walk the dog"`)
- Add `aria-label` to `<select>`, `<input>`, and `<table>` elements
- Use semantic HTML (`<button>`, `<table>`, `<nav>`) over generic `<div>` where appropriate

This makes the implementation accessible AND testable. The E2E tests rely on these attributes instead of CSS selectors.
