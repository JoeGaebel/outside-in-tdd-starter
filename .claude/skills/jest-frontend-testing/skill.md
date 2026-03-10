---
name: jest-frontend-testing
description: Write Jest frontend tests for React components and hooks using React Testing Library. Use for testing pages, components, and custom hooks.
---

# Jest Frontend Testing

Write frontend tests for React components and hooks using React Testing Library and the established patterns in this codebase.

## Inputs

See `.claude/agents/tdd-test-writer-contract.md` — "frontend / backend" section for field definitions.

## Write All Layer Tests at Once

Write ALL tests needed for this layer in one go. This reduces RED→GREEN→REFACTOR cycles:

- All component states (loading, success, error, empty)
- All user interactions (clicks, inputs, form submissions)
- All conditional rendering
- All props variations that affect behavior

## Principles

- Use MSW mocks for any network calls, the backend isn't connected for these tests.
- Test behaviour and outcomes rather than implementation specifics.
- Aim for highly readable distinct tests
- Make use of describe blocks to cover different states and permutations when needed
- Mock `console.log` (and `console.warn`/`console.error` if used) in `beforeEach` when the unit under test logs to the console: `jest.spyOn(console, 'log').mockImplementation()`. This prevents test output pollution. Jest's `restoreAllMocks` handles cleanup.

### CSS Class Assertions

**Do NOT assert** static/decorative CSS classes — classes that are always present on an element regardless of state (e.g., verifying a button has `btn-primary`, or a heading has `text-xl`).

**DO assert** conditionally-applied CSS classes — classes that are added or removed based on logic or state. These represent visual behaviour that the component controls. Examples:
- A row gets `bg-blue-50` only when its value has changed → assert the class is present/absent based on whether the value changed
- A status badge gets `bg-green-100` for complete vs `bg-red-100` for incomplete → assert the correct class based on status
- An element gets `line-through` only for completed items → assert the class based on completion state

**Key question**: "Is this class always there, or does the component decide whether to apply it?" If the component decides → test it. If it's always there → don't.

## Directory Structure

Tests mirror the source directory structure:

```
src/pages/todos.tsx              →  test/pages/todos.test.tsx
src/components/TodoList.tsx      →  test/components/TodoList.test.tsx
src/hooks/useTodos.ts            →  test/hooks/useTodos.test.tsx
```

Note: Frontend test files use the `.test.tsx` extension.

## Running Tests

```bash
# Run a specific test file
npm run test:unit:spec path/to/test.test.tsx

# Run all frontend tests
npm run test:unit -- --selectProjects frontend

# Run tests matching a pattern
npm run test:unit:spec -- -t "TodoList"
```

## Failure Criteria

### Right Failures (Proceed to GREEN Phase)

These failures mean the test is correct and implementation is missing:

| Failure Type | Example | Why It's Right |
|--------------|---------|----------------|
| Assertion failure | `Expected: visible, Received: not found` | Element not rendered - needs implementation |
| Missing element | `Unable to find element with role "button"` | Element doesn't exist yet |
| Wrong value | `Expected: X, Received: Y` | Logic not implemented |

### Wrong Failures (Fix Before Proceeding)

These failures mean the test itself is broken:

| Failure Type | Example | Action |
|--------------|---------|--------|
| Syntax error | `SyntaxError: Unexpected token` | Fix the test code |
| Import error | `Cannot find module '@/components/...'` | Fix imports |
| Test setup error | `TypeError: Cannot read property of undefined` | Fix test fixtures/mocks |
| Type error | `Type 'X' is not assignable to type 'Y'` | Fix types in test |
| Undefined function | `ReferenceError: fail is not defined` | `fail()` is not available — use `expect(x).toEqual(expected)` with descriptive structures or `throw new Error()` instead |

**Key Question**: "Is this failing because implementation is missing, or because my test is broken?"

## Test File Template for Page/Component Testing

```typescript
import {fireEvent, render, screen} from '@testing-library/react';
import {act} from 'react';
import {http, HttpResponse} from 'msw';
import MyComponent from '@/pages/my-component';

describe('MyComponent', () => {
    const mockData = [
        {id: 1, title: 'Item 1'},
        {id: 2, title: 'Item 2'}
    ];

    beforeEach(() => {
        mswServer.use(http.get('/api/items', () => {
            return new HttpResponse(JSON.stringify({items: mockData}), {status: 200});
        }));
    });

    it('renders data from API', async () => {
        render(<MyComponent />);

        await screen.findByText('Item 1');
        await screen.findByText('Item 2');
    });

    it('handles user interaction', async () => {
        render(<MyComponent />);

        await screen.findByText('Item 1');

        const buttons = screen.getAllByRole('button', {name: /action/i});
        expect(buttons).toHaveLength(2);

        await act(async () => {
            fireEvent.click(buttons[0]);
        });

        await screen.findByText('Action completed!');
    });
});
```

## Test File Template for Hook Testing

```typescript
import {renderHook, act, waitFor} from '@testing-library/react';
import {useMyHook} from '@/hooks/useMyHook';

describe('useMyHook', () => {
    it('returns expected data', async () => {
        const {result} = renderHook(() => useMyHook());

        let data;
        await act(async () => {
            data = await result.current.fetchData();
        });

        expect(data).toEqual({/* expected shape */});
        expect(result.current.error).toBeNull();
    });
});
```

## Key Testing Patterns

### 1. MSW Server (Global)

The frontend test environment provides a global `mswServer` for mocking API calls. It's automatically set up in `jest.frontend.setup.ts`.

**Match existing API contracts**: Before creating a mock response, check if the API route already exists (e.g., Glob for `src/pages/api/<endpoint>`). If it does, read it to match the actual response shape. If the route is new (being created as part of this feature), use the Architecture context from the plan to determine the expected shape. Don't invent mock response shapes that diverge from the real API.

```typescript
import {http, HttpResponse} from 'msw';

beforeEach(() => {
    mswServer.use(http.get('/api/endpoint', () => {
        return new HttpResponse(JSON.stringify({data: 'value'}), {status: 200});
    }));
});

// For error responses
mswServer.use(http.get('/api/endpoint', () => {
    return new HttpResponse(null, {status: 500});
}));
```

Note: Use `mswServer` directly (it's a global). The server is reset after each test automatically.

### 2. React Testing Library Queries

#### Selector Priority

Use queries in this priority order:

1. **`getByRole`** — buttons, headings, checkboxes, etc. with `name` option for specificity
2. **`getByLabelText`** — elements with `aria-label` or associated `<label>`
3. **`getByText`** — text content visible to the user
4. **`getByTestId`** — only when no semantic alternative exists

Never query by CSS class, tag name, or DOM structure.

```typescript
import {render, screen} from '@testing-library/react';

render(<MyComponent />);

// Best: role + name
screen.getByRole('button', {name: /submit/i});
screen.getByRole('heading', {name: 'Title'});

// Good: aria-label
screen.getByLabelText('Select item');

// Good: text content
screen.getByText('Static text');

// Async queries - use for data that loads async
await screen.findByText('Loading complete');

// Query (returns null if not found) - use for asserting absence
expect(screen.queryByText('Should not exist')).toBeNull();
```

### 3. User Interactions with act()

Always wrap user interactions and state updates in `act()`:

```typescript
import {fireEvent} from '@testing-library/react';
import {act} from 'react';

await act(async () => {
    fireEvent.click(button);
});

await screen.findByText('Updated content');
```

### 4. Testing Hooks with renderHook

**React 19 + RTL 16.3.0 behavior**: `renderHook` wraps in `act()` which synchronously flushes ALL effects including `useEffect`. After `renderHook()` returns, `result.current` reflects the **post-effect** state — you cannot observe the pre-effect initial state. This means tests like "initial value is X before useEffect reads localStorage" are **impossible** at the unit level. If a hook initializes to a default and then reads a different value from localStorage/DOM in useEffect, `result.current` will show the localStorage/DOM value, not the default. Test these SSR-safety constraints at the E2E level instead.

```typescript
import {renderHook, act, waitFor} from '@testing-library/react';

const {result} = renderHook(() => useMyHook());

expect(result.current.someValue).toBe(expected);

await act(async () => {
    await result.current.someMethod();
});

await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
});
```

### 5. Common Assertions

```typescript
// Element presence
expect(screen.getByText('Hello')).toBeInTheDocument();
expect(screen.queryByText('Gone')).not.toBeInTheDocument();

// Element count
expect(screen.getAllByRole('listitem')).toHaveLength(3);

// Element state
expect(screen.getByRole('button')).toBeDisabled();
expect(screen.getByRole('checkbox')).toBeChecked();

// Async assertions with waitFor
await waitFor(() => {
    expect(result.current.data).toBeDefined();
});
```

## Common Imports

```typescript
// React Testing Library
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {renderHook, act} from '@testing-library/react';

// React
import {act} from 'react';

// MSW for API mocking
import {http, HttpResponse} from 'msw';

// Note: mswServer is a global, no import needed
// It's defined in jest.frontend.d.ts and set up in jest.frontend.setup.ts
```

## Type Definitions

The global `mswServer` is typed in `jest.frontend.d.ts`:

```typescript
import { SetupServerApi } from 'msw/node';

declare global {
  var mswServer: SetupServerApi;
}
```

## jest.mock Hoisting

SWC hoists `jest.mock()` calls above `const` declarations. Never declare a mock variable above `jest.mock` and reference it inside the factory — it will be in the temporal dead zone at runtime. Instead, inline `jest.fn()` inside the factory and import the mocked function directly:

```typescript
// Correct — inline jest.fn, import the mock
import {someFunction} from '@/lib/some-module';

jest.mock('@/lib/some-module', () => ({
    someFunction: jest.fn(),
}));

// Use in assertions:
expect(someFunction).toHaveBeenCalled();
(someFunction as jest.Mock).mockReturnValue('value');
```

```typescript
// Wrong — variable is in temporal dead zone when factory runs
const mockSomeFunction = jest.fn();
jest.mock('@/lib/some-module', () => ({
    someFunction: mockSomeFunction, // ReferenceError!
}));
```

## CSS Import Mocking

The jest config overrides nextJest's `moduleNameMapper`, dropping its built-in CSS file mock. When a module under test imports a `.css` file (e.g., `import "@/styles/globals.css"`), Jest will throw `SyntaxError: Unexpected token`. Mock the CSS import at the top of the test file:

```typescript
jest.mock('@/styles/globals.css', () => ({}));
```

**When to add this**: Check the module under test's imports. If it imports any `.css` file, add a `jest.mock` for that path.

## Type Assertions

Use `as unknown as SpecificType` when a type cast is needed. Check existing test files in the codebase for the correct target type. The project enforces `@typescript-eslint/no-explicit-any`.
