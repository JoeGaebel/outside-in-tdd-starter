---
name: jest-backend-testing
description: Write Jest backend tests for Next.js API routes following established patterns. Use for testing API handlers, lib utilities, and backend logic.
---

# Jest Backend Testing

Write backend tests for Next.js API routes and library utilities using the established patterns in this codebase.

## Inputs

See `.claude/agents/tdd-test-writer-contract.md` — "frontend / backend" section for field definitions.

## Write All Layer Tests at Once

Write ALL tests needed for this layer in one go. This reduces RED→GREEN→REFACTOR cycles:

- All HTTP methods the endpoint handles (GET, POST, PUT, DELETE)
- All query/body parameter variations
- All response scenarios (success, validation errors, not found)
- All business logic branches

## Principles

- Aim for integration-style tests. Avoid mocking where possible. If you can set up the database state, do so.
- Test behaviour and outcomes rather than implementation specifics.
- Aim for highly readable distinct tests
- Make use of describe blocks to cover different states and permutations when needed
- Mock `console.log` (and `console.warn`/`console.error` if used) in `beforeEach` when the unit under test logs to the console: `jest.spyOn(console, 'log').mockImplementation()`. This prevents test output pollution. Jest's `restoreAllMocks` handles cleanup.

## Directory Structure

Tests mirror the source directory structure:

```
src/pages/api/todos/index.ts     →  test/pages/api/todos/index.test.ts
src/lib/todo-utils.ts            →  test/lib/todo-utils.test.ts
```

## Running Tests

```bash
# Run a specific test file
npm run test:unit:spec path/to/test.test.ts

# Run all backend tests
npm run test:unit -- --selectProjects backend

# Run tests matching a pattern
npm run test:unit:spec -- -t "Todos API"
```

## Failure Criteria

### Right Failures (Proceed to GREEN Phase)

These failures mean the test is correct and implementation is missing:

| Failure Type | Example | Why It's Right |
|--------------|---------|----------------|
| Wrong status | `Expected: 200, Received: 404` | API route not implemented |
| Wrong response | `Expected: X, Received: Y` | Logic not implemented |
| Missing function | `TypeError: X is not a function` | Function needs to be created |
| Missing Prisma model | `The table 'X' does not exist` / `PrismaClientValidationError` | New model needs schema + migration (test uses `as any` to bypass compile-time types) |

### Wrong Failures (Fix Before Proceeding)

These failures mean the test itself is broken:

| Failure Type | Example | Action |
|--------------|---------|--------|
| Syntax error | `SyntaxError: Unexpected token` | Fix the test code |
| Import error | `Cannot find module '@/lib/...'` | Fix imports |
| Type error | `Type 'X' is not assignable to type 'Y'` | Fix types in test (exception: for new Prisma models, use `as any` to bypass — see Right Failures) |

**Key Question**: "Is this failing because implementation is missing, or because my test is broken?"

## Test File Template for API Routes

```typescript
import {NextApiRequest, NextApiResponse} from 'next';
import handler from '@/pages/api/your-api/index';
import {createMocks, MockRequest, MockResponse, Body, Cookies, RequestMethod} from 'node-mocks-http';
import prisma from "@/lib/cached-prisma-client";
import {User} from '@prisma/client';

describe('Your API', () => {
    let testUser: User;

    beforeEach(async () => {
        const uniqueId = Date.now() + Math.random();
        testUser = await prisma.user.create({
            data: {name: `Test User ${uniqueId}`, email: `test-${uniqueId}@example.com`}
        });
    });

    function createApiRequest(options: {
        method?: RequestMethod;
        body?: object;
        query?: object;
        cookies?: Cookies;
    }): {
        req: MockRequest<NextApiRequest>,
        res: MockResponse<NextApiResponse>
    } {
        return createMocks<NextApiRequest, NextApiResponse>({
            method: options.method || 'GET',
            body: options.body ? JSON.stringify(options.body) as unknown as Body : undefined,
            query: options.query,
            cookies: options.cookies,
        });
    }

    describe('GET /api/your-api', () => {
        it('returns expected data', async () => {
            const {req, res} = createApiRequest({});

            await handler(req, res);

            expect(res.statusCode).toBe(200);
            const data = JSON.parse(res._getData());
            expect(data).toEqual(expect.objectContaining({
                // expected shape
            }));
        });
    });
});
```

## Test File Template for Library Utilities

```typescript
import {yourFunction} from "@/lib/your-utils";

describe('your-utils', () => {
    function buildTestInput(options: Partial<InputType>): InputType {
        return {
            defaultField: 'default',
            ...options,
        };
    }

    describe('yourFunction', () => {
        it('handles normal case', () => {
            const input = buildTestInput({field: 'value'});
            const result = yourFunction(input);
            expect(result).toEqual(expectedValue);
        });
    });
});
```

## Testing API Error Handling

All API handlers are wrapped with `withErrorHandling` from `@/lib/api-error-handler`. Use the shared `describeErrorHandling` helper:

```typescript
import {describeErrorHandling} from '@test/helpers/error-handling-assertions';

describeErrorHandling(handler, {
    createRequest: () => createGetRequest(),
    causeError: () => {
        jest.spyOn(prisma.todo, 'findMany').mockRejectedValueOnce(new Error('DB error'));
    },
});
```

## Key Testing Patterns

### 1. Prisma Transactions (Automatic Rollback)

The test environment uses `jest-prisma` which wraps each test in a transaction that automatically rolls back. This means:

- Data created in tests is automatically cleaned up
- Tests are isolated from each other
- Use `prisma` via `@/lib/cached-prisma-client` - it's already set up to use the transactional client
- **Never alias a Prisma model delegate to a variable** — always use `prisma.<model>` directly. The mock uses a getter that resolves to the current test's transactional client; storing `prisma.<model>` in a variable captures a stale reference.
- **Never use dynamic imports** (`await import(...)`) — use static imports with `jest.mock()`. Dynamic imports bypass jest mocks and can resolve to unmocked modules.
- **Never use `jestPrisma.originalClient`** — it bypasses transaction isolation and permanently mutates the dev database.
- **Clean pre-existing data in `beforeEach`** — the dev DB may contain data from manual testing. Tests that assert on record counts must delete relevant records in `beforeEach` using the transactional `prisma` client (deletes are rolled back after each test). Delete child records first (FK constraints).

```typescript
import prisma from "@/lib/cached-prisma-client";

// BAD — captures delegate before transaction is active:
// const todoModel = prisma.todo;

// GOOD — resolves lazily each time:
const todo = await prisma.todo.create({
    data: {title: 'Test Todo', userId: testUser.id}
});
```

### 2. Response Assertions

```typescript
expect(res.statusCode).toBe(200);

const data = JSON.parse(res._getData());

expect(data).toEqual({message: 'Success'});
expect(data).toEqual(expect.objectContaining({id: expect.any(Number)}));
expect(data.items).toHaveLength(2);
```

## Common Imports

```typescript
import {NextApiRequest, NextApiResponse} from 'next';
import {createMocks, MockRequest, MockResponse, Body, Cookies, RequestMethod} from 'node-mocks-http';
import prisma from "@/lib/cached-prisma-client";
import {User, Todo} from '@prisma/client';
import {v4 as uuid} from 'uuid';
```

## New Prisma Models

When writing backend tests that reference a Prisma model that doesn't exist yet, use `as any` to bypass TypeScript compilation so the test fails at **runtime** (the right failure) instead of at **compile time** (the wrong failure):

```typescript
// Model doesn't exist yet — use `as any` so the test fails at runtime
const entry = await (jestPrisma.client as any).category.create({
  data: { name: 'Work' }
})
```

The runtime error ("The table `Category` does not exist" or similar) IS the right failure — it tells the implementer exactly what Prisma model to create.

**Lint exception**: `eslint-disable-next-line` is permitted on lines using `as any` for new Prisma models — the refactorer removes these after the implementer creates the model.

## jest.mock Hoisting

SWC hoists `jest.mock()` calls above `const` declarations. Never declare a mock variable above `jest.mock` and reference it inside the factory — it will be in the temporal dead zone at runtime. Instead, inline `jest.fn()` inside the factory and import the mocked function directly:

```typescript
// Correct — inline jest.fn, import the mock
import {someFunction} from '@/lib/some-module';

jest.mock('@/lib/some-module', () => ({
    someFunction: jest.fn(),
}));

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

## Type Assertions

`as any` is ONLY permitted for new Prisma models (above). In all other test code, use `as unknown as SpecificType` when a type cast is needed. Check existing test files in the codebase for the correct target type. The project enforces `@typescript-eslint/no-explicit-any`.
