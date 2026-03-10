---
name: cypress-end-to-end-testing
description: Write Cypress end-to-end tests for business processes and cross-cutting infrastructure. Use for testing complete business workflows, authentication flows, and UI state verification.
---

# Cypress End-to-End Testing

Write end-to-end tests organized as **business process tests** or **infrastructure tests**. Business process tests prove a complete business process achieves its outcome. Infrastructure tests verify cross-cutting concerns (auth, security) that don't belong to a specific business process.

## Inputs

See `.claude/agents/tdd-test-writer-contract.md` — "e2e" section for field definitions.

## Write Complete Tests Upfront

Write ALL assertions for the complete feature flow at once. The test should fail because NOTHING is implemented yet, not because one piece is missing. This gives a complete definition of "done" before any implementation begins.

Include all:
- Content the user sees (text, labels, data values — NOT CSS classes or DOM structure)
- User interactions (clicks, inputs, form submissions)
- Expected outcomes (navigation, data changes, confirmation messages)
- Error handling if applicable

## How to Write the Test

Based on which input you receive:

- **If `Existing it block to extend` is provided**: Insert or append ALL new assertions at the appropriate point in that `it` block's flow. Change existing assertions if needed.
- **If `Why new it block` is provided**: Create a new `it` block with ALL assertions in the existing test file.
- **If `Existing test file` is "none"**: Create a new file. If the business process is "infrastructure", create it in `cypress/e2e/infrastructure/`. Otherwise create it in `cypress/e2e/business-process/`.

## Test Philosophy

### Business Process Tests (`cypress/e2e/business-process/`)

Each file represents one business process. Multiple personas participate in a single test (e.g., user creates todo → admin reviews).

**Default action: Extend the existing `it` block.** A business process test should be one long-running `it` that proves the entire process end-to-end. New assertions go at the appropriate point within the existing flow — insert them where they naturally occur in the process.

**Only create a new `it` block when** the existing `it` block's accumulated data state is fundamentally incompatible with the new scenario.

**Key question:** "Can I reach this scenario by continuing from or inserting into the existing `it` block's flow?" If yes → extend. If no → justify why.

### Infrastructure Tests (`cypress/e2e/infrastructure/`)

Each file covers a cross-cutting concern (auth, security) that doesn't belong to a specific business process. Infrastructure tests are typically shorter and more focused. Cypress tests are time-consuming, so default to extending existing `it` tests when they are present, or when making new test files, ensure you attempt to use a single `it` to cover the whole flow.

## Directory Structure

```
cypress/e2e/
  business-process/     — One file per business process
    todo-management.cy.ts
  infrastructure/       — Cross-cutting concerns
    auth.cy.ts
```

## Running Tests

Tests run against `dev-test` (port 4001) with a separate test database (`todoapp_test`). `bin/run-cypress-tests.sh` manages the lifecycle — each run gets a clean database. See `.claude/infrastructure.md` for details.

```bash
# Run a specific test file
npm run cypress:test "path/to/test.cy.ts"

# Run all Cypress tests headless
npm run test:e2e

# Interactive mode (also uses test DB isolation)
npm run cypress:open
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
| Wrong selector | `Unable to find element` when element exists | Fix the selector |
| Test setup error | `TypeError: Cannot read property of undefined` | Fix test fixtures |

**Key Question**: "Is this failing because implementation is missing, or because my test is broken?"

## Test File Templates

### Business Process Template

```typescript
describe('[Business Process Name] Business Process', () => {
    beforeEach(() => {
        // Setup: data cleanup
    });

    it('produces correct [outcome] through the complete [process] workflow', () => {
        // Phase 1: User logs in and creates data
        cy.login();

        // Phase 2: User performs actions
        // Phase 3: Assertions on business outcomes
    });
});
```

### Infrastructure Template

```typescript
describe('[Concern Name]', () => {
    it('validates [specific mechanism]', () => {
        // Test one cross-cutting concern
    });

    it('protects against [specific threat]', () => {
        // Test another independent concern
    });
});
```

## Key Testing Patterns

### 1. Authentication

Use `cy.login()` to authenticate as the test user (defined via credentials provider):

```typescript
cy.login();  // Signs in with Test Credentials
```

The command is defined in `cypress/support/commands.ts`.

### 2. Deciding on test data strategy

How to set up the test data depends on the type of data:
- **Database data (Todos, Users)**: Create by interacting with the app as the user — this gives the most realistic test coverage.
- **Backend API data**: Avoid stubbing unless absolutely necessary (error states and edge cases only).

#### Backend Response Stubbing

Warning: Avoid this pattern unless absolutely necessary:

```typescript
cy.intercept('GET', '/api/your-endpoint', {
    statusCode: 200,
    body: { data: mockData }
}).as('getData');

cy.visit('/your-page');
cy.wait('@getData');
```

#### Backend Response Modification

Warning: Avoid this pattern unless absolutely necessary:

```typescript
cy.intercept({method: 'GET', url: '/api/endpoint/*'}, (req) => {
    req.continue((res) => {
        res.body.someField = 'modified value';
    });
}).as('modifiedResponse');
```

#### Custom Database Tasks

Warning: Avoid this pattern unless absolutely necessary. We want to ensure that setup data is created by interacting with the app as a user. Only create or use Cypress tasks which modify database data when it is impossible or very time consuming to produce this data.

Use `cy.task()` to interact with the database via Prisma. Tasks are defined in `cypress.config.ts`.

#### Cleaning Up Test Data

The test database is freshly created each run, so data from previous runs doesn't persist. However, cleanup tasks are still needed for isolation between specs within a single run.

```typescript
beforeEach(() => {
    cy.task('cleanupTodos');
});
```

For new Prisma models that don't have generated types yet, use raw SQL in `cy.task` cleanup: `prisma.$executeRaw\`DELETE FROM "Equipment"\`` — this avoids needing generated Prisma types.

### 3. Element Selection Strategies

#### Selector Discovery for Existing Components

When writing E2E tests that reference **existing** components (components that already exist in the codebase but are being modified), read the component source file first to discover available selectors:

1. Check for existing `aria-label`, `data-testid`, `role` attributes on the elements you need to query
2. Use existing selectors in your test assertions when possible
3. If no suitable selector exists, you may specify the needed selector in your test — but you MUST document it in the "New DOM Selectors" section of your return so the inner-layer implementation knows to add it

**Do NOT invent `aria-label` values for existing elements without first checking what's already there.**

For **new** components (ones that don't exist yet), you may freely specify the selectors the implementation should use — document all of them in "New DOM Selectors."

#### Selector Priority

Always use semantic selectors. Never use raw CSS selectors like `table tbody tr`, `td`, `div`, `span`, etc.

```typescript
// Best: aria-label attributes
cy.get('[aria-label="Add todo"]').click();
cy.get('[aria-label="Todo list"]').within(() => { ... });

// Good: Role and name
cy.get('button').contains('Submit').click();

// Good: Text content
cy.contains('My Todos').click();

// Acceptable: data-testid when no semantic alternative exists
cy.get('[data-testid="todo-count"]').should('exist');
```

If elements lack aria-labels or roles, add them to the implementation rather than falling back to CSS selectors. This makes both the tests and the application more accessible.

#### Scoped Assertions with within()

Use `aria-label` to scope into sections, then use text content or roles within:

```typescript
cy.get('[aria-label="Todo list"]').within(() => {
    cy.contains('Buy groceries').should('exist');
    cy.contains('Walk the dog').should('exist');
});
```

**Stale scopes after re-renders:** When the DOM re-renders, elements captured by `.within()` go stale. Avoid holding a `.within()` scope across actions that trigger re-renders. Instead, re-query from a fresh root each time:

```typescript
// Bad: scope goes stale after the first action triggers a re-render
cy.get('[aria-label="Todo list"]').within(() => {
    cy.contains('Buy groceries').click(); // works, triggers re-render
    cy.contains('Walk the dog').click();  // FAILS — stale scope
});

// Good: re-query for each action
cy.get('[aria-label="Todo list"]').contains('Buy groceries').click();
cy.get('[aria-label="Todo list"]').contains('Walk the dog').click();
```

### 4. Assertions

#### Content Assertions

```typescript
cy.contains('Expected text').should('exist');
cy.contains('Expected text').should('be.visible');
cy.contains('Unwanted text').should('not.exist');
```

#### URL Assertions

```typescript
cy.url().should('include', '/todos');
cy.url().should('not.include', '/api/auth/signin');
```

#### Element State Assertions

```typescript
cy.contains('Button').should('be.enabled');
cy.contains('Button').should('be.disabled');
```

#### What NOT to Assert in E2E Tests

E2E tests verify what users see, click, and experience. Do NOT assert:
- CSS classes (e.g., `have.class('text-red-600')`) — even conditionally-applied ones. Conditional CSS behaviour belongs in frontend component tests, not E2E.
- Exact computed CSS values (e.g., `have.css('background-color', 'rgb(...)')`) — Tailwind v4 uses `lab()` color space, making exact color string assertions unreliable. However, when a build-time step mediates between code and visible outcome (CSS classes → build pipeline → computed styles), assert the **outcome**, not the mechanism. Use **comparative computed style assertions**: capture `getComputedStyle(el).propertyName` before the action, perform it, assert the value changed. **Target the element where the style is applied, not where the class is toggled.** A CSS class may be toggled on `html` but the stylesheet may apply the resulting style to `body` or inner elements — the parent element will still report `rgba(0,0,0,0)` (transparent).
- Intermediate state that nothing responds to. A CSS class, data attribute, or other mechanism is intermediate state if a build-time step must process it before it affects the user — comparative computed style assertions prove the full chain works.
- DOM structure or nesting
- Viewport-specific rendering (table vs cards)

Do NOT select elements using:
- Raw CSS selectors (`table tbody tr`, `td`, `div.classname`, `span`)
- Element tag selectors (`cy.get('select')`, `cy.get('input')`)
- Instead, use `aria-label`, roles, text content, or `data-testid` (see Selector Priority above)

#### Regex Pattern Matching

```typescript
// Match time displays with flexible formatting
cy.contains(/\d{1,2}:\d{2}\s?(?:AM|PM)/i);
```

### 5. Conditional DOM Checks

```typescript
cy.get('body').then(($body) => {
    const hasOption1 = $body.text().includes('Option 1');
    const hasOption2 = $body.text().includes('Option 2');
    cy.wrap(hasOption1 || hasOption2).should('be.true');
});
```

### 6. Clipboard Testing

```typescript
it('copies link to clipboard', () => {
    cy.window().then((win: Window) => {
        if (win.navigator.clipboard) {
            cy.stub(win.navigator.clipboard, 'writeText').as('clipboardWrite').resolves();
        } else {
            Object.assign(win.navigator, {
                clipboard: {writeText: cy.stub().as('clipboardWrite').resolves()}
            });
        }
    });

    cy.contains('Copy Link').click();

    cy.get('@clipboardWrite').then((stub: sinon.SinonStub) => {
        cy.wrap(stub.args[0][0]).as('copiedText');
    });

    cy.get('@copiedText').then((url: string) => {
        expect(url).to.include('/expected-path');
    });
});
```

### 7. Direct API Testing

```typescript
it('protects routes from unauthorized access', () => {
    cy.request({
        method: 'POST',
        url: '/api/admin/endpoint',
        body: JSON.stringify({ data: 'test' }),
        failOnStatusCode: false,
        followRedirect: false
    }).then((response) => {
        expect(response.status).to.equal(307);
        expect(response.headers.location).to.include('/api/auth/signin');
    });
});
```

## Adding New Custom Commands

If there is a lot of repetition of the same Cypress code, consider creating a Cypress command to abstract this.

1. Add the command in `cypress/support/commands.ts`:

```typescript
Cypress.Commands.add('yourCommand', (arg: string) => {
    // Command implementation
});
```

2. Add TypeScript types in `cypress/support/index.d.ts`:

```typescript
declare namespace Cypress {
    interface Chainable {
        yourCommand(arg: string): Chainable<any>;
    }
}
```

## Adding New Database Tasks

1. Add the task in `cypress.config.ts` under `setupNodeEvents`:

```typescript
on('task', {
    async yourTaskName(data: YourDataType) {
        const result = await prisma.model.findMany({...});
        return result;  // Must return something (null if void)
    }
});
```

2. Add TypeScript types in `cypress/support/index.d.ts` if using custom types.

## Best Practices

1. **Organize by business process or infrastructure concern** - each test file represents one business process or one cross-cutting concern
2. **Extend existing tests** - when adding features, find and extend the relevant test rather than creating new files
3. **Batch assertions** - group related checks in one `it()` block to reduce browser spin-up overhead
4. **Never use CSS selectors** — always use `aria-label`, role, text content, or `data-testid`. Add aria-labels to the implementation if needed.
5. **Isolate test data** - clean up before and after tests using `cy.task()`
6. **Use intercepts sparingly** - prefer real API calls; stub only for error states and edge cases only when absolutely needed
7. **Use `cy.visit()` for page navigation** — client-side navigation is not necessarily faster than `cy.visit()` due to animation and rendering overhead
8. **Never shrink elements to fit the viewport** — if a page is designed to be wide, the viewport config in `cypress.config.ts` should be wide enough to accommodate it. The design drives the viewport, not the other way around. This does NOT mean ignoring genuine test failures — if a test catches broken behavior (wrong text, missing elements, broken interactions), that's a real bug in the implementation, not a viewport issue.
