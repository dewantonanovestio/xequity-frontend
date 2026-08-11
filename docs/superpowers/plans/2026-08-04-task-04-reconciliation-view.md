# TASK-04 Reconciliation View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build the mock-backed Reconciliation View with 30-second cash and supply polling, immediate break indicators, and a confirmed manual cash-reconciliation action.

**Architecture:** Inject one Reconciliation API into the shared RTK Query base API and resolve deterministic balanced/unbalanced fixtures at the centralized mock boundary. Keep domain formatting and tone rules in a focused utility, let `CashRecon` own its single mutation workflow, keep `SupplyRecon` pure, and let the page coordinate only query polling and section state.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Redux Toolkit/RTK Query, Tailwind CSS 4, shadcn/ui, Lucide React, Vitest, React Testing Library.

## Global Constraints

- Implement TASK-04 only; existing Order Tracker and Ledger behavior remain unchanged.
- Poll both Reconciliation queries every 30,000 milliseconds.
- Use `activeCashScenario: "balanced"` to select the displayed fixture without adding UI or query parameters.
- Keep the manual mock mutation side-effect free and return `{ success: true }`.
- Invalidate the shared `Recon` tag after a successful manual run.
- Display reconciliation quantities and residuals with exactly six decimal places.
- Treat exact zero as balanced and every non-zero delta or residual as unbalanced.
- Keep cash and supply loading, empty, and error states independent.
- Keep the confirmation dialog open and controls disabled while the mutation is pending.
- Use test-first red-green-refactor cycles for runtime behavior.
- Make no Git commits, per the user's standing instruction.

---

### Task 1: Reconciliation Contracts, Formatting, and Tones

**Files:**
- Modify: `lib/types/recon.ts`
- Create: `lib/recon/reconUtils.ts`
- Create: `lib/recon/__tests__/reconUtils.test.ts`

**Interfaces:**
- Consumes: existing `CashRecon`, `SupplyRecon`, and `SymbolStatus`.
- Produces: `ReconScenario`, `RunCashReconResult`, `formatReconQuantity(value)`, `getDeltaTone(delta)`, `getResidualTone(residual)`, and `getSymbolStatusTone(status)`.

- [x] **Step 1: Write failing utility tests**

Use hand-derived literal expectations:

```typescript
expect(formatReconQuantity(1234.56789)).toBe("1,234.567890");
expect(formatReconQuantity(890)).toBe("890.000000");
expect(formatReconQuantity(0.000056)).toBe("0.000056");
expect(getDeltaTone(0)).toBe("balanced");
expect(getDeltaTone(-50)).toBe("unbalanced");
expect(getResidualTone(0)).toBe("balanced");
expect(getResidualTone(0.000056)).toBe("unbalanced");
```

Use a table test for every status:

```typescript
[
  ["ACTIVE", "success"],
  ["HALTED", "danger"],
  ["MINT_HALTED", "warning"],
  ["REDEEM_HALTED", "warning"],
  ["RETIRED", "neutral"],
  ["DELISTING", "neutral"],
]
```

- [x] **Step 2: Run utility tests and verify RED**

Run: `npm test -- lib/recon/__tests__/reconUtils.test.ts`

Expected: FAIL because `lib/recon/reconUtils.ts` does not exist.

- [x] **Step 3: Add the exact type contracts**

Append to `lib/types/recon.ts`:

```typescript
export type ReconScenario = "balanced" | "unbalanced";

export interface RunCashReconResult {
  success: boolean;
}
```

- [x] **Step 4: Implement the domain utility**

Create one module-scoped formatter:

```typescript
const reconQuantityFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 6,
  maximumFractionDigits: 6,
});
```

Return `balanced | unbalanced` for exact-zero comparisons and `success | danger | warning | neutral` for statuses using the mapping in Step 1.

- [x] **Step 5: Run utility tests to GREEN**

Run: `npm test -- lib/recon/__tests__/reconUtils.test.ts`

Expected: all formatting and tone tests pass.

### Task 2: Reconciliation Fixtures and Mock Routes

**Files:**
- Modify: `lib/mocks/recon.json`
- Modify: `lib/mocks/mockBaseQuery.ts`
- Modify: `lib/mocks/__tests__/mockBaseQuery.test.ts`

**Interfaces:**
- Consumes: Task 1 Reconciliation contracts and the shared `mockBaseQuery` request parser.
- Produces: scenario-selected `GET /admin/recon/cash/detail`, five-row `GET /admin/recon/supply`, and side-effect-free `POST /admin/recon/cash`.

- [x] **Step 1: Replace empty recon expectations with failing fixture assertions**

Assert the balanced route exactly:

```typescript
expect(await readData<CashRecon>("/admin/recon/cash/detail")).toEqual({
  usdtLedgerTotal: 80700,
  usdtWalletBalance: 80700,
  usdtDelta: 0,
  usdFloatAtAlpaca: 45000,
  projectedFloatRequirement: 42000,
  lastRunAt: "2026-08-03T14:30:00Z",
});
```

Import `recon.json` and assert `cashScenarios.unbalanced.usdtDelta === -50`, `activeCashScenario === "balanced"`, five symbols in the exact AAPL/TSLA/MSFT/GOOGL/SPY order, TSLA residual `0.000056`, and TSLA status `MINT_HALTED`.

- [x] **Step 2: Add failing mutation and fallback tests**

Assert:

```typescript
expect(await mockBaseQuery({
  url: "/admin/recon/cash",
  method: "POST",
})).toEqual({ data: { success: true } });
```

Temporarily set the imported fixture object's `activeCashScenario` to an unknown key, call the cash route, assert the balanced result, and restore the original key in `finally` so no test leaks state.

- [x] **Step 3: Run mock tests and verify RED**

Run: `npm test -- lib/mocks/__tests__/mockBaseQuery.test.ts`

Expected: FAIL because cash is null, supply is empty, and the POST route is missing.

- [x] **Step 4: Populate both cash scenarios and supply fixtures**

Use this JSON shape:

```json
{
  "activeCashScenario": "balanced",
  "cashScenarios": {
    "balanced": {
      "usdtLedgerTotal": 80700,
      "usdtWalletBalance": 80700,
      "usdtDelta": 0,
      "usdFloatAtAlpaca": 45000,
      "projectedFloatRequirement": 42000,
      "lastRunAt": "2026-08-03T14:30:00Z"
    },
    "unbalanced": {
      "usdtLedgerTotal": 80700,
      "usdtWalletBalance": 80650,
      "usdtDelta": -50,
      "usdFloatAtAlpaca": 45000,
      "projectedFloatRequirement": 42000,
      "lastRunAt": "2026-08-03T14:30:00Z"
    }
  },
  "supply": []
}
```

Fill `supply` with the exact five examples from TASK-04: only TSLA is non-zero and `MINT_HALTED`; every other row is zero and `ACTIVE`.

- [x] **Step 5: Implement scenario selection and POST handling**

Replace the old cash static route with a function that reads `activeCashScenario`, returns the matching `cashScenarios` entry, and falls back to `.balanced`. Keep supply as a static GET route. Add `POST /admin/recon/cash` returning a fresh `{ success: true }` object without updating the timestamp or scenario.

- [x] **Step 6: Run mock and utility suites to GREEN**

Run: `npm test -- lib/mocks/__tests__/mockBaseQuery.test.ts lib/recon/__tests__`

Expected: all Reconciliation and existing order/ledger mock tests pass.

### Task 3: Reconciliation RTK Query API

**Files:**
- Create: `lib/api/reconApi.ts`
- Create: `lib/api/__tests__/reconApi.test.ts`

**Interfaces:**
- Consumes: `baseApi`, `CashRecon`, `SupplyRecon[]`, `RunCashReconResult`, and Task 2 mock routes.
- Produces: `reconApi`, `useGetCashReconQuery`, `useGetSupplyReconQuery`, and `useRunCashReconMutation`.

- [x] **Step 1: Write failing API integration tests**

Enable mock mode, dispatch endpoints through the real store, and assert:

```typescript
const cash = await store.dispatch(reconApi.endpoints.getCashRecon.initiate());
expect(cash.data?.usdtDelta).toBe(0);

const supply = await store.dispatch(reconApi.endpoints.getSupplyRecon.initiate());
expect(supply.data?.map((row) => row.symbol)).toEqual([
  "AAPL", "TSLA", "MSFT", "GOOGL", "SPY",
]);

const run = await store.dispatch(reconApi.endpoints.runCashRecon.initiate());
expect(run.data).toEqual({ success: true });
```

Keep a cash query subscription active, capture its cache `requestId`, run the mutation, use `vi.waitFor` until the selected query has a different `requestId`, then unsubscribe. This proves `Recon` invalidation triggers refetch rather than merely asserting source configuration.

- [x] **Step 2: Run API tests and verify RED**

Run: `npm test -- lib/api/__tests__/reconApi.test.ts`

Expected: FAIL because `reconApi.ts` does not exist.

- [x] **Step 3: Implement the three endpoint definitions**

```typescript
getCashRecon: build.query<CashRecon, void>({
  query: () => "/admin/recon/cash/detail",
  providesTags: ["Recon"],
}),
getSupplyRecon: build.query<SupplyRecon[], void>({
  query: () => "/admin/recon/supply",
  providesTags: ["Recon"],
}),
runCashRecon: build.mutation<RunCashReconResult, void>({
  query: () => ({ url: "/admin/recon/cash", method: "POST" }),
  invalidatesTags: ["Recon"],
}),
```

Export all generated hooks named in Interfaces.

- [x] **Step 4: Run API tests to GREEN**

Run: `npm test -- lib/api/__tests__/reconApi.test.ts`

Expected: all Reconciliation API and invalidation tests pass.

### Task 4: Cash Reconciliation Card and Manual Run

**Files:**
- Create: `components/recon/CashRecon.tsx`
- Create: `components/recon/__tests__/CashRecon.test.tsx`

**Interfaces:**
- Consumes: `cash: CashRecon | null`, `isLoading`, `isError`, Task 1 tones, shared currency/date formatters, and `useRunCashReconMutation`.
- Produces: `CashRecon({ cash, isLoading, isError })` with six fields, delta state, and confirmed mutation feedback.

- [x] **Step 1: Write failing field and state tests**

Render the balanced fixture and assert all six labels plus `$80,700.00`, `$45,000.00`, `$42,000.00`, `$0.00`, and `Aug 3, 2026, 2:30 PM`. Assert the delta container has `data-tone="balanced"` and the indicator has a green class.

Rerender with `usdtWalletBalance: 80650` and `usdtDelta: -50`; assert `-$50.00`, `data-tone="unbalanced"`, and red indicator classes. Separately assert six skeleton fields during loading, exact empty copy for a null success, and the cash-specific alert for request failure.

- [x] **Step 2: Write failing confirmation and mutation tests**

Mock `useRunCashReconMutation`. Click `Run Recon Now`, assert an alert dialog containing `This will trigger a full cash reconciliation run. Continue?`, and assert the mutation has not run. Click cancel and assert it remains uncalled.

Open again, confirm, and assert the mutation trigger is called once. Resolve `.unwrap()` and expect status text `Cash reconciliation run triggered.` Reject with `{ data: { message: "Recon service unavailable" } }` and expect that backend copy in an alert; reject with an unknown value and expect the stable fallback.

- [x] **Step 3: Write a failing pending-state test**

Return a deferred `.unwrap()` promise. After confirmation, assert the dialog remains open, `Running…` is visible beside an animated loader, and cancel/confirm controls are disabled. Resolve the promise and assert the dialog closes and success status appears.

- [x] **Step 4: Run cash tests and verify RED**

Run: `npm test -- components/recon/__tests__/CashRecon.test.tsx`

Expected: FAIL because the component does not exist.

- [x] **Step 5: Implement display and request states**

Use shadcn Card and a definition-list/grid for the six values. Render loading first, then error, then empty, then populated data. Apply `getDeltaTone()` to `data-tone`, dot, background, and text classes. Use `formatCurrency()` and `formatDate()` exclusively for cash values.

- [x] **Step 6: Implement the controlled confirmation workflow**

Track `isOpen`, local `isSubmitting`, and feedback. On confirm, call `event.preventDefault()` so AlertDialog does not close automatically, set submitting, await `runCashRecon().unwrap()`, then close and set success or error feedback. Disable trigger, cancel, and confirm while submitting; render `LoaderCircle` with `animate-spin` and `Running…` in the confirm action. Clear stale feedback only when opening a new run.

- [x] **Step 7: Run cash tests to GREEN**

Run: `npm test -- components/recon/__tests__/CashRecon.test.tsx`

Expected: all cash display, confirmation, pending, success, and error tests pass.

### Task 5: Supply Reconciliation Table

**Files:**
- Create: `components/recon/SupplyRecon.tsx`
- Create: `components/recon/__tests__/SupplyRecon.test.tsx`

**Interfaces:**
- Consumes: `rows: SupplyRecon[]`, `isLoading`, `isError`, and Task 1 formatting/tone utilities.
- Produces: `SupplyRecon({ rows, isLoading, isError })` with six static columns and no table state.

- [x] **Step 1: Write failing rendering and precision tests**

Using the five fixture rows, assert column headings `Status Indicator`, `Symbol`, `On-Chain Supply`, `Alpaca Positions`, `Residual`, and `Status`. Assert all five symbols and literal fixed-precision values including `1,234.567890`, `890.000000`, `0.000000`, and `0.000056`.

- [x] **Step 2: Write failing indicator and status tests**

Assert AAPL row has `data-tone="balanced"`, green dot/residual classes, and ACTIVE badge `data-tone="success"`. Assert TSLA has `data-tone="unbalanced"`, red dot/residual classes, and MINT_HALTED `warning`.

Add literal rows for `HALTED`, `REDEEM_HALTED`, `RETIRED`, and `DELISTING`, then assert badge tones `danger`, `warning`, `neutral`, and `neutral` respectively.

- [x] **Step 3: Write failing loading, empty, and error tests**

Assert five `supply-row-skeleton` rows during loading, exact empty copy for an empty successful response, and a supply-specific alert for request failure.

- [x] **Step 4: Run supply tests and verify RED**

Run: `npm test -- components/recon/__tests__/SupplyRecon.test.tsx`

Expected: FAIL because the component does not exist.

- [x] **Step 5: Implement the static supply table**

Use shadcn Card/Table/Badge/Skeleton primitives. Keep indicator header visually hidden but accessible as `Status Indicator`. Format all three numeric columns with `formatReconQuantity()`. Apply row, dot, residual, and badge tones from utilities. Render loading, error, empty, and populated states as mutually exclusive branches.

- [x] **Step 6: Run supply tests to GREEN**

Run: `npm test -- components/recon/__tests__/SupplyRecon.test.tsx`

Expected: all supply rendering, precision, tone, and request-state tests pass.

### Task 6: Reconciliation Page and Full Verification

**Files:**
- Replace: `app/recon/page.tsx`
- Create: `app/recon/__tests__/page.test.tsx`
- Modify: `app/__tests__/pages.test.tsx`
- Modify: `docs/superpowers/plans/2026-08-04-task-04-reconciliation-view.md` (check completed steps only)

**Interfaces:**
- Consumes: `useGetCashReconQuery`, `useGetSupplyReconQuery`, `CashRecon`, and `SupplyRecon`.
- Produces: the complete `/recon` page with independent 30-second polling and section state.

- [x] **Step 1: Write failing page integration tests**

Mock only the two query hooks and render the real section components. Assert:

```typescript
expect(useGetCashReconQuery).toHaveBeenCalledWith(undefined, {
  pollingInterval: 30000,
});
expect(useGetSupplyReconQuery).toHaveBeenCalledWith(undefined, {
  pollingInterval: 30000,
});
```

Assert the `Reconciliation` heading, both section titles, cash fixture value, and all five supply symbols. Return a cash error with valid supply and assert only the cash alert; then return valid cash with a supply error and assert only the supply alert.

- [x] **Step 2: Run page tests and verify RED**

Run: `npm test -- app/recon/__tests__/page.test.tsx`

Expected: FAIL because the route remains a placeholder.

- [x] **Step 3: Implement the page**

Make `app/recon/page.tsx` a client component. Call each query with the shared constant `{ pollingInterval: 30000 }`. Render a compact System Balance header, then:

```typescript
<CashRecon
  cash={cashQuery.data ?? null}
  isLoading={cashQuery.isLoading}
  isError={cashQuery.isError}
/>
<SupplyRecon
  rows={supplyQuery.data ?? []}
  isLoading={supplyQuery.isLoading}
  isError={supplyQuery.isError}
/>
```

- [x] **Step 4: Remove only the obsolete Recon placeholder assertion**

`app/__tests__/pages.test.tsx` no longer owns Recon behavior after the dedicated page suite exists. Remove its `ReconPage` import and placeholder test without changing Orders or root-route coverage.

- [x] **Step 5: Run page and route tests to GREEN**

Run: `npm test -- app/recon/__tests__/page.test.tsx app/__tests__/pages.test.tsx`

Expected: both page suites pass without requiring a Redux provider in the old placeholder test.

- [x] **Step 6: Run complete automated verification**

Run:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Expected: all Vitest suites pass, ESLint produces no errors or warnings, TypeScript exits zero, and Next.js produces a successful production build. If `next/font` network access is blocked in the sandbox, rerun only `npm run build` through the normal approval flow.

- [x] **Step 7: Perform browser acceptance in mock mode**

Open `/recon` and verify:

1. Cash shows the six exact balanced fixture fields and a green `$0.00` delta.
2. Supply shows all five symbols with exactly six decimal places.
3. TSLA has residual `0.000056`, a red break indicator, and an amber `MINT_HALTED` badge.
4. `Run Recon Now` opens the exact confirmation copy.
5. Cancel closes the dialog without feedback.
6. Confirm triggers the mutation and shows `Cash reconciliation run triggered.`
7. Both sections remain visible after invalidation refetch.
8. No browser console warning or error occurs.

- [x] **Step 8: Record final evidence without committing**

Mark this plan's checkboxes complete, report exact test/lint/type/build results and browser scenarios, list key files, stop the temporary acceptance server, and explicitly state that no Git commit was made.
