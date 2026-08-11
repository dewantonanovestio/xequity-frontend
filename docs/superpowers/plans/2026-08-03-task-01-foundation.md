# TASK-01 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build the tested application foundation required by the Orders, Ledger, and Reconciliation dashboard tasks.

**Architecture:** Preserve the Next.js App Router server layout while placing Redux behind a small client provider. Route all RTK Query requests through one mock-aware base API, and keep the shell, environment helpers, formatting helpers, domain types, and mock fixtures in focused modules.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, Redux Toolkit with RTK Query, TanStack Table, date-fns, Vitest, React Testing Library.

## Global Constraints

- Implement only TASK-01; feature data tables and detail views remain out of scope.
- Use `NEXT_PUBLIC_API_URL=http://localhost:3000` and `NEXT_PUBLIC_USE_MOCKS=true` as local defaults.
- Keep the root layout as a Server Component and put Redux in a dedicated client provider.
- Use test-first red-green-refactor cycles for runtime behavior.
- Do not make Git commits; the user explicitly waived commits and this workspace has no Git repository.
- Preserve Tailwind CSS 4's CSS-first `@import "tailwindcss"` setup.

---

### Task 1: Dependency and Test Harness

**Files:**
- Modify: `package.json`
- Create: `package-lock.json`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create/modify through shadcn CLI: `components.json`, `app/globals.css`, `lib/utils.ts`, `components/ui/*.tsx`

**Interfaces:**
- Consumes: existing Next.js 16 and Tailwind CSS 4 scaffold.
- Produces: `npm test`, jsdom matchers, shadcn imports under `@/components/ui/*`, and the runtime packages used by later tasks.

- [x] **Step 1: Install runtime and test dependencies**

Run:

```bash
npm install @reduxjs/toolkit react-redux @tanstack/react-table date-fns
npm install --save-dev vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Expected: `package.json` and `package-lock.json` contain the requested packages without peer-dependency errors.

- [x] **Step 2: Initialize shadcn and requested primitives**

Run:

```bash
npx shadcn@latest init --defaults
npx shadcn@latest add button badge card table dialog alert-dialog select input dropdown-menu separator tabs skeleton --yes
```

Expected: `components.json`, `lib/utils.ts`, and all requested `components/ui` modules exist; Tailwind's CSS import remains intact.

- [x] **Step 3: Add the Vitest scripts and configuration**

Add scripts to `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Create `vitest.config.ts`:

```typescript
import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

process.env.TZ = "UTC";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    clearMocks: true,
  },
});
```

Create `vitest.setup.ts`:

```typescript
import "@testing-library/jest-dom/vitest";
```

- [x] **Step 4: Verify the empty test harness and dependency graph**

Run:

```bash
npm test -- --passWithNoTests
npm ls --depth=0
```

Expected: the empty test run exits successfully and the dependency graph has no missing packages.

### Task 2: Environment and Formatting Utilities

**Files:**
- Create: `lib/utils/__tests__/env.test.ts`
- Create: `lib/utils/__tests__/formatters.test.ts`
- Create: `lib/utils/env.ts`
- Create: `lib/utils/formatters.ts`
- Create: `.env.local`

**Interfaces:**
- Produces: `getApiUrl(): string`, `isMockMode(): boolean`, `getEnvLabel(): string`, `formatCurrency(amount: number): string`, `formatQty(qty: number): string`, and `formatDate(iso: string): string`.

- [x] **Step 1: Write failing environment tests**

Cover these assertions:

```typescript
expect(getApiUrl()).toBe("http://localhost:3000");
expect(isMockMode()).toBe(true);
expect(getEnvLabel()).toBe("staging-api.xequity.internal");
expect(getEnvLabel()).toBe("not a url");
```

Use `vi.stubEnv()` and `vi.unstubAllEnvs()` so each behavior reads the current environment without module resets.

- [x] **Step 2: Run the environment tests and observe the expected failure**

Run: `npm test -- lib/utils/__tests__/env.test.ts`

Expected: FAIL because `@/lib/utils/env` does not exist.

- [x] **Step 3: Implement the minimal environment helpers**

Implement a localhost default, exact string comparison for mock mode, URL host extraction, and malformed non-empty URL fallback. Add `.env.local` with the two approved defaults.

- [x] **Step 4: Run the environment tests to green**

Run: `npm test -- lib/utils/__tests__/env.test.ts`

Expected: all environment tests pass.

- [x] **Step 5: Write failing formatter tests**

Cover:

```typescript
expect(formatCurrency(1234.5)).toBe("$1,234.50");
expect(formatCurrency(0)).toBe("$0.00");
expect(formatCurrency(-50)).toBe("-$50.00");
expect(formatQty(1.123456789)).toBe("1.123457");
expect(formatQty(12.34)).toBe("12.34");
expect(formatDate("2026-08-03T14:30:00Z")).toBe("Aug 3, 2026, 2:30 PM");
expect(formatDate("invalid")).toBe("-");
```

- [x] **Step 6: Run the formatter tests and observe the expected failure**

Run: `npm test -- lib/utils/__tests__/formatters.test.ts`

Expected: FAIL because `@/lib/utils/formatters` does not exist.

- [x] **Step 7: Implement the minimal formatters and rerun both utility suites**

Use `Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })`, `Intl.NumberFormat` with six maximum fraction digits, and `date-fns/format` with `MMM d, yyyy, h:mm a`. Guard invalid dates with `isValid`.

Run: `npm test -- lib/utils/__tests__`

Expected: both suites pass.

### Task 3: Domain Types and Mock Query Boundary

**Files:**
- Create: `lib/types/order.ts`
- Create: `lib/types/ledger.ts`
- Create: `lib/types/recon.ts`
- Create: `lib/mocks/orders.json`
- Create: `lib/mocks/ledger.json`
- Create: `lib/mocks/recon.json`
- Create: `lib/mocks/__tests__/mockBaseQuery.test.ts`
- Create: `lib/mocks/mockBaseQuery.ts`

**Interfaces:**
- Produces: exported HLD domain unions and interfaces; `mockBaseQuery(args: string | FetchArgs): Promise<QueryReturnValue<unknown, FetchBaseQueryError>>` compatible with RTK Query.

- [x] **Step 1: Add the compile-time domain contracts**

Export the exact HLD types: `OrderSide`, `OrderType`, `OrderState`, `Order`, `StateTransition`, `Fill`, `ClientBalance`, `TransactionType`, `Transaction`, `CashRecon`, `SupplyRecon`, and `SymbolStatus`.

Use the exact union members and fields from HLD section 6 without adding feature-only behavior.

- [x] **Step 2: Add empty but shape-stable JSON fixtures**

Use these structures:

```json
// orders.json
{"orders":[],"redemptions":[],"orderDetails":{},"redemptionDetails":{},"fills":{}}

// ledger.json
{"balances":[],"transactions":[]}

// recon.json
{"cash":null,"supply":[]}
```

- [x] **Step 3: Write failing mock query tests**

Assert that `GET /orders`, `/redemptions`, `/admin/ledger/balances`, `/admin/ledger/transactions`, `/admin/recon/cash/detail`, and `/admin/recon/supply` return their corresponding fixture members. Assert that a query string is ignored for matching and that `/unknown` returns status 404 with `{ message: "No mock handler for GET /unknown" }`.

- [x] **Step 4: Run the mock query test and observe the expected failure**

Run: `npm test -- lib/mocks/__tests__/mockBaseQuery.test.ts`

Expected: FAIL because `mockBaseQuery` does not exist.

- [x] **Step 5: Implement the minimal route registry**

Normalize string and `FetchArgs` inputs, uppercase the method with `GET` as default, strip the query string, and key the registry as `${method} ${pathname}`. Return imported JSON members for known GET routes and a typed 404 error for all unmatched method/path pairs.

- [x] **Step 6: Run the mock query and utility suites**

Run: `npm test -- lib/mocks/__tests__ lib/utils/__tests__`

Expected: all tests pass.

### Task 4: Redux Store and Mock-Aware Base API

**Files:**
- Create: `lib/api/baseApi.ts`
- Create: `lib/store/store.ts`
- Create: `lib/store/hooks.ts`
- Create: `lib/store/StoreProvider.tsx`
- Create: `lib/store/__tests__/store.test.ts`

**Interfaces:**
- Produces: `baseApi`, `store`, `RootState`, `AppDispatch`, `useAppDispatch`, `useAppSelector`, and the default `StoreProvider` component.
- Consumes: `getApiUrl()`, `isMockMode()`, and `mockBaseQuery()` from Tasks 2 and 3.

- [x] **Step 1: Write the failing store integration test**

Assert that the exported store state contains `api`, and that dispatching `baseApi.util.resetApiState()` succeeds without changing unrelated reducers.

- [x] **Step 2: Run the store test and observe the expected failure**

Run: `npm test -- lib/store/__tests__/store.test.ts`

Expected: FAIL because the store and base API modules do not exist.

- [x] **Step 3: Implement the shared base API**

Create a `fetchBaseQuery({ baseUrl: getApiUrl() })`. Implement a typed delegating base query that calls `mockBaseQuery(args)` only when `isMockMode()` is true and otherwise calls the real base query with `api` and `extraOptions`. Configure `createApi` with reducer path `api`, tag types `Orders`, `Balances`, `Transactions`, and `Recon`, and no initial endpoints.

- [x] **Step 4: Configure the store and typed hooks**

Configure the API reducer under `baseApi.reducerPath`, append its middleware, derive `RootState` and `AppDispatch`, and expose Redux's `.withTypes` hooks. Implement `StoreProvider` as a client component that renders `<Provider store={store}>{children}</Provider>`.

- [x] **Step 5: Run the store and all lower-level tests**

Run: `npm test -- lib`

Expected: all tests pass.

### Task 5: Application Shell Components

**Files:**
- Create: `components/layout/__tests__/Sidebar.test.tsx`
- Create: `components/layout/__tests__/TopBar.test.tsx`
- Create: `components/layout/Sidebar.tsx`
- Create: `components/layout/TopBar.tsx`

**Interfaces:**
- Produces: default `Sidebar` and `TopBar` client components.
- Consumes: Next.js `Link`, `usePathname`, shadcn `Badge`, and `getEnvLabel()`.

- [x] **Step 1: Write failing sidebar behavior tests**

Mock `next/navigation` so `usePathname()` returns `/ledger`. Render the sidebar and assert accessible links for Orders, Ledger, and Recon with exact hrefs; assert Ledger exposes `aria-current="page"` while the other links do not.

- [x] **Step 2: Run the sidebar test and observe the expected failure**

Run: `npm test -- components/layout/__tests__/Sidebar.test.tsx`

Expected: FAIL because the sidebar module does not exist.

- [x] **Step 3: Implement the sidebar**

Create a client component backed by a three-item navigation constant. Treat a route as active when the pathname equals the link or begins with `${href}/`. Apply a 200px desktop width, visible focus styles, and active link styling; expose `aria-current="page"`.

- [x] **Step 4: Run the sidebar test to green**

Run: `npm test -- components/layout/__tests__/Sidebar.test.tsx`

Expected: PASS.

- [x] **Step 5: Write failing top-bar tests**

Stub `NEXT_PUBLIC_API_URL` for localhost, staging, and production cases. Assert the application name and host label are rendered and the badge includes `data-environment="local"`, `staging`, or `production` respectively.

- [x] **Step 6: Run the top-bar test and observe the expected failure**

Run: `npm test -- components/layout/__tests__/TopBar.test.tsx`

Expected: FAIL because the top-bar module does not exist.

- [x] **Step 7: Implement the top bar and rerun shell tests**

Create a compact top bar using `getEnvLabel()`. Classify localhost, `127.0.0.1`, and `[::1]` as local; labels containing `staging` as staging; everything else as production. Render the classification in `data-environment` and use green, amber, and red styles.

Run: `npm test -- components/layout/__tests__`

Expected: both suites pass.

### Task 6: Routes, Root Layout, and Global Styling

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Create: `app/orders/page.tsx`
- Create: `app/ledger/page.tsx`
- Create: `app/recon/page.tsx`
- Create: `app/__tests__/pages.test.tsx`

**Interfaces:**
- Consumes: `StoreProvider`, `Sidebar`, and `TopBar`.
- Produces: `/` redirect plus reachable `/orders`, `/ledger`, and `/recon` placeholders inside the common shell.

- [x] **Step 1: Write failing route component tests**

Render each feature page directly and assert headings `Order Tracker`, `Ledger Viewer`, and `Reconciliation`. Mock `next/navigation`'s `redirect`, call the home page component, and assert `redirect("/orders")`.

- [x] **Step 2: Run the route tests and observe the expected failure**

Run: `npm test -- app/__tests__/pages.test.tsx`

Expected: FAIL because the feature page modules do not exist and the home page does not redirect.

- [x] **Step 3: Implement the redirect and placeholder routes**

Use the App Router `redirect("/orders")` in `app/page.tsx`. Give each placeholder a concise purpose statement and consistent card-like layout without feature functionality.

- [x] **Step 4: Run route tests to green**

Run: `npm test -- app/__tests__/pages.test.tsx`

Expected: PASS.

- [x] **Step 5: Compose the root shell**

Set metadata title to `xequity-face` and description to `Developer debug dashboard for xequity`. Wrap the two-column application shell in `StoreProvider`; render the sidebar beside a right column containing the top bar and `<main>{children}</main>`.

- [x] **Step 6: Finalize restrained desktop styling**

Keep `@import "tailwindcss"`; define light neutral background/foreground variables; set `box-sizing`, full-height body, antialiasing, and inherited font defaults. Do not add mobile-specific behavior or feature UI.

- [x] **Step 7: Run all tests**

Run: `npm test`

Expected: every suite passes with no React act warnings.

### Task 7: Verification and Acceptance Audit

**Files:**
- Modify only files implicated by verification failures.

**Interfaces:**
- Consumes: all prior deliverables.
- Produces: a verified TASK-01 foundation ready for TASK-02 through TASK-04.

- [x] **Step 1: Run formatting-independent static checks**

Run:

```bash
npm run lint
npx tsc --noEmit
```

Expected: both commands exit 0 with no errors.

- [x] **Step 2: Run the production build**

Run: `npm run build`

Expected: Next.js compiles successfully and emits `/`, `/orders`, `/ledger`, and `/recon` routes.

- [x] **Step 3: Run the final complete test suite**

Run: `npm test`

Expected: all tests pass with pristine output.

- [x] **Step 4: Audit the TASK-01 acceptance criteria**

Confirm dependencies, typed store hooks, mock-aware API behavior, shell, active link, environment badge, root redirect, domain types, formatters, lint, tests, and build are each supported by a passing automated check or the production build output.
