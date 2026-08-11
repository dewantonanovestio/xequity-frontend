# TASK-02 Order Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build the mock-backed combined order and redemption tracker with filtering, sorting, pagination, drill-down diagnostics, and confirmed recovery actions.

**Architecture:** Inject one Orders API into the shared RTK Query base API, extend the centralized mock boundary with realistic mutable session data, and keep list, filter, table, timeline, fill, action, and detail responsibilities in focused components. Fetch filtered order and redemption sets independently, merge them at the page boundary, and paginate the globally sorted result in TanStack Table.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Redux Toolkit/RTK Query, TanStack Table 8, Tailwind CSS 4, shadcn/ui, Vitest, React Testing Library.

## Global Constraints

- Implement TASK-02 only; Ledger and Reconciliation remain unchanged.
- Use `ord_` identifiers for BUY orders and `red_` identifiers for SELL redemptions.
- Request at most 100 matching records per source, merge them, then sort and paginate client-side.
- Poll list and detail queries every 5,000 milliseconds.
- Use one status select, not a multi-select, for v1.
- Keep mock mutation changes in memory only; never write JSON fixtures at runtime.
- Use inline mutation feedback; add no toast dependency.
- Use test-first red-green-refactor cycles for runtime behavior.
- Make no Git commits, per the user's standing instruction.

---

### Task 1: Order Contracts and Presentation Utilities

**Files:**
- Modify: `lib/types/order.ts`
- Create: `lib/orders/orderUtils.ts`
- Test: `lib/orders/__tests__/orderUtils.test.ts`

**Interfaces:**
- Produces: `OrderQueryParams`, `PaginatedOrders`, `LedgerImpact`, `OrderFilters`, `EMPTY_ORDER_FILTERS`, `deriveLedgerImpact(order, fills)`, `getOrderKind(id)`, `getStateTone(state)`, and `getSideTone(side)`.
- Consumes: existing `Order`, `Fill`, `OrderState`, and `OrderSide`.

- [x] **Step 1: Write failing utility tests**

Use literal fixtures to verify:

```typescript
expect(getOrderKind("ord_001")).toBe("order");
expect(getOrderKind("red_001")).toBe("redemption");
expect(getOrderKind("unknown")).toBe("unknown");
expect(getStateTone("SETTLED")).toBe("success");
expect(getStateTone("MINT_FAILED")).toBe("danger");
expect(getStateTone("QUEUED")).toBe("warning");
expect(getStateTone("EXPIRED")).toBe("neutral");
expect(getSideTone("BUY")).toBe("buy");
expect(deriveLedgerImpact(order, fills)).toEqual({
  holdAmount: 1000,
  settlementAmount: 990,
  spreadBooked: 4.95,
});
```

The test order has `notional: 1000`, `pinnedSpreadBps: 50`; its two fills have costs 400 and 590.

- [x] **Step 2: Run the utility test and verify RED**

Run: `npm test -- lib/orders/__tests__/orderUtils.test.ts`

Expected: FAIL because `lib/orders/orderUtils.ts` does not exist.

- [x] **Step 3: Add the exact type contracts**

Add:

```typescript
export interface OrderQueryParams {
  clientId?: string;
  endUserId?: string;
  symbol?: string;
  status?: OrderState;
  fromDate?: string;
  toDate?: string;
  cursor?: string;
  limit?: number;
}

export interface PaginatedOrders {
  items: Order[];
  nextCursor: string | null;
  totalCount: number;
}

export interface LedgerImpact {
  holdAmount: number;
  settlementAmount: number;
  spreadBooked: number;
}

export interface OrderFilters {
  clientId: string;
  endUserId: string;
  symbol: string;
  status: string;
  fromDate: string;
  toDate: string;
}
```

- [x] **Step 4: Implement minimal utility behavior**

`deriveLedgerImpact` sums fill cost, uses notional then `qty * limitPrice` then fill cost for holds, and computes spread with basis points divided by 10,000. State tones are `success`, `danger`, `warning`, or `neutral`; side tones are `buy` or `sell`.

- [x] **Step 5: Run the utility test to GREEN**

Run: `npm test -- lib/orders/__tests__/orderUtils.test.ts`

Expected: all utility tests pass.

### Task 2: Realistic Fixtures and Dynamic Mock Routes

**Files:**
- Modify: `lib/mocks/orders.json`
- Modify: `lib/mocks/mockBaseQuery.ts`
- Modify: `lib/mocks/__tests__/mockBaseQuery.test.ts`

**Interfaces:**
- Produces: filtered `PaginatedOrders`, dynamic details and fills, and state-validating POST mutations.
- Consumes: `OrderQueryParams`, `PaginatedOrders`, and static JSON fixtures.

- [x] **Step 1: Extend mock tests before fixture changes**

Add failing assertions for:

```typescript
const allOrders = await mockBaseQuery("/orders?limit=100");
expect(allOrders.data.items).toHaveLength(20);
expect(allOrders.data.totalCount).toBe(20);

const filtered = await mockBaseQuery(
  "/orders?clientId=client_nanovest&symbol=AAPL&status=MINT_FAILED&fromDate=2026-07-28&toDate=2026-08-03",
);
expect(filtered.data.items.map((order) => order.id)).toEqual(["ord_001"]);

expect(await mockBaseQuery("/orders/ord_001")).toMatchObject({
  data: { id: "ord_001", state: "MINT_FAILED" },
});
expect(await mockBaseQuery("/orders/ord_004/fills")).toMatchObject({
  data: [{ fillId: "fill_004_a" }, { fillId: "fill_004_b" }],
});
```

Also assert 404 for missing IDs, retry-mint success and 409 on a non-failed order, retry-burn success, and cancel success for `QUEUED`.

- [x] **Step 2: Run mock tests and verify RED**

Run: `npm test -- lib/mocks/__tests__/mockBaseQuery.test.ts`

Expected: FAIL because fixtures are empty and only exact GET routes exist.

- [x] **Step 3: Populate deterministic fixture data**

Create exactly 20 orders and five redemptions using this state matrix:

```text
ord_001 MINT_FAILED AAPL client_nanovest
ord_002 SETTLED TSLA client_acme
ord_003 QUEUED MSFT client_blockprime
ord_004 PARTIALLY_FILLED GOOGL client_nanovest
ord_005 OPEN_EXECUTING SPY client_acme
ord_006 FILLED AAPL client_blockprime
ord_007 SUBMITTED TSLA client_nanovest
ord_008 VALIDATED MSFT client_acme
ord_009 MINTING GOOGL client_blockprime
ord_010 REJECTED SPY client_nanovest
ord_011 CANCELLED AAPL client_acme
ord_012 EXPIRED TSLA client_blockprime
ord_013 MINT_FAILED MSFT client_nanovest
ord_014 SETTLED GOOGL client_acme
ord_015 FILLED SPY client_blockprime
ord_016 OPEN_EXECUTING AAPL client_nanovest
ord_017 QUEUED TSLA client_acme
ord_018 PARTIALLY_FILLED MSFT client_blockprime
ord_019 SETTLED GOOGL client_nanovest
ord_020 SETTLED SPY client_acme
red_001 BURN_FAILED AAPL client_nanovest
red_002 SETTLED TSLA client_acme
red_003 OPEN_EXECUTING MSFT client_blockprime
red_004 FILLED GOOGL client_nanovest
red_005 CANCELLED SPY client_acme
```

All records include complete HLD fields and chronological state transitions. Add fills for `ord_001`, `ord_002`, `ord_004` (two fills), `ord_006`, `red_001`, and `red_002`.

- [x] **Step 4: Implement route normalization and handlers**

Parse URL query parameters with `new URL(url, "http://mock.local")`. Match list, detail, fills, and mutation routes with anchored regular expressions. Apply filters with AND semantics, inclusive day boundaries, offset cursor parsing, limit clamped from 1 to 100, and `{ items, nextCursor, totalCount }` output.

Keep `Map<string, Order>` session overrides. Mutation transitions are:

```typescript
MINT_FAILED -> MINTING
BURN_FAILED -> FILLED
QUEUED | OPEN_EXECUTING | PARTIALLY_FILLED -> CANCELLED
```

Return 409 for invalid transitions and 404 for missing IDs.

- [x] **Step 5: Run mock and lower-level tests to GREEN**

Run: `npm test -- lib/mocks/__tests__ lib/orders/__tests__ lib/utils/__tests__`

Expected: all suites pass.

### Task 3: Orders RTK Query API

**Files:**
- Create: `lib/api/ordersApi.ts`
- Create: `lib/api/__tests__/ordersApi.test.ts`

**Interfaces:**
- Produces: `useGetOrdersQuery`, `useGetOrderQuery`, `useGetOrderFillsQuery`, `useGetRedemptionsQuery`, `useGetRedemptionQuery`, `useGetRedemptionFillsQuery`, `useRetryMintMutation`, `useRetryBurnMutation`, and `useCancelOrderMutation`.
- Consumes: `baseApi`, order types, and all Task 2 mock routes.

- [x] **Step 1: Write failing API integration tests**

Enable mock mode, dispatch generated endpoint initiators through the real store, and assert:

```typescript
expect((await store.dispatch(getOrders.initiate({ limit: 100 }))).data?.totalCount).toBe(20);
expect((await store.dispatch(getOrder.initiate("ord_001"))).data?.id).toBe("ord_001");
expect((await store.dispatch(getOrderFills.initiate("ord_004"))).data).toHaveLength(2);
expect((await store.dispatch(retryMint.initiate("ord_001"))).data?.state).toBe("MINTING");
```

Reset API state after every test.

- [x] **Step 2: Run API tests and verify RED**

Run: `npm test -- lib/api/__tests__/ordersApi.test.ts`

Expected: FAIL because `ordersApi.ts` does not exist.

- [x] **Step 3: Implement all endpoint definitions**

Serialize only non-empty query parameters with `URLSearchParams`. Query endpoints provide `Orders` tags. Mutations use POST and invalidate `Orders`. Export every generated hook named in Interfaces.

- [x] **Step 4: Run API tests to GREEN**

Run: `npm test -- lib/api/__tests__/ordersApi.test.ts`

Expected: all API integration tests pass.

### Task 4: Filters and URL State

**Files:**
- Create: `components/orders/OrderFilters.tsx`
- Create: `components/orders/__tests__/OrderFilters.test.tsx`
- Create: `lib/orders/filterParams.ts`
- Create: `lib/orders/__tests__/filterParams.test.ts`

**Interfaces:**
- Produces: `OrderFilters({ value, onChange, onClear })`, `readOrderFilters(searchParams)`, and `writeOrderFilters(filters)`.
- Consumes: `OrderFilters` and `EMPTY_ORDER_FILTERS` from Task 1.

- [x] **Step 1: Write failing filter parameter tests**

Assert complete parsing, omission of empty values, stable key names, and empty serialization:

```typescript
expect(writeOrderFilters({ ...EMPTY_ORDER_FILTERS, symbol: "AAPL" })).toBe("symbol=AAPL");
expect(readOrderFilters(new URLSearchParams("clientId=client_acme&status=SETTLED"))).toMatchObject({
  clientId: "client_acme",
  status: "SETTLED",
});
```

- [x] **Step 2: Run parameter tests and verify RED**

Run: `npm test -- lib/orders/__tests__/filterParams.test.ts`

Expected: FAIL because `filterParams.ts` does not exist.

- [x] **Step 3: Implement parsing and serialization, then verify GREEN**

Use the exact six filter keys and return a new `OrderFilters` object. Run the focused test until it passes.

- [x] **Step 4: Write failing filter component tests**

Render controlled filters, change End-User and date inputs, select Client/Symbol/Status using Base UI controls, and assert `onChange` receives the full updated object. Click `Clear filters` and assert `onClear` once.

- [x] **Step 5: Run component tests and verify RED**

Run: `npm test -- components/orders/__tests__/OrderFilters.test.tsx`

Expected: FAIL because the component does not exist.

- [x] **Step 6: Implement the filter bar and verify GREEN**

Use shadcn Select, Input, and Button components with explicit labels. Client options map labels to `client_nanovest`, `client_acme`, and `client_blockprime`. Include all states and the five symbols. Run the focused test until it passes.

### Task 5: Combined Order Table

**Files:**
- Create: `components/orders/OrderTable.tsx`
- Create: `components/orders/__tests__/OrderTable.test.tsx`

**Interfaces:**
- Produces: `OrderTable({ orders, isLoading, filterKey, onOpenOrder })`.
- Consumes: formatters and Task 1 tone utilities.

- [x] **Step 1: Write failing table tests**

With three literal orders, assert all 12 column headings, newest-first default order, BUY/SELL and state `data-tone` attributes, currency/quantity display, sort toggle on Symbol, pagination after 10 rows, loading skeletons, empty copy, and `onOpenOrder("ord_001")` on click and Enter.

- [x] **Step 2: Run table tests and verify RED**

Run: `npm test -- components/orders/__tests__/OrderTable.test.tsx`

Expected: FAIL because the component does not exist.

- [x] **Step 3: Implement TanStack columns and interactions**

Use `useReactTable` with core, sorting, and pagination row models. Initial sorting is `[{ id: "createdAt", desc: true }]`; initial page size is 10. Reset page index when `filterKey` changes. Use semantic buttons for sortable headers and pagination.

- [x] **Step 4: Run table tests to GREEN**

Run: `npm test -- components/orders/__tests__/OrderTable.test.tsx`

Expected: all table tests pass.

### Task 6: Timeline, Fills, and Detail Presentation

**Files:**
- Create: `components/orders/StateTimeline.tsx`
- Create: `components/orders/FillsTable.tsx`
- Create: `components/orders/OrderDetail.tsx`
- Create: `components/orders/__tests__/StateTimeline.test.tsx`
- Create: `components/orders/__tests__/FillsTable.test.tsx`
- Create: `components/orders/__tests__/OrderDetail.test.tsx`

**Interfaces:**
- Produces: pure `StateTimeline({ transitions })`, `FillsTable({ fills })`, and `OrderDetail({ order, fills, actions })` presentation components.
- Consumes: Task 1 utility functions, formatters, and `ActionButtons` supplied in Task 7.

- [x] **Step 1: Write and fail timeline tests**

Assert chronological rendering, latest node `data-current="true"`, and failed state `data-tone="danger"`. Run the focused suite and confirm the module-missing failure.

- [x] **Step 2: Implement timeline and verify GREEN**

Sort a copied transition array by timestamp, never mutate props, and render an ordered list with formatted timestamps.

- [x] **Step 3: Write and fail fills tests**

Assert fill ID, quantity, price, cost, date, mint/burn hash, status, retry count, `-` fallbacks, and `No fills recorded` for an empty array.

- [x] **Step 4: Implement fills table and verify GREEN**

Use the existing shadcn Table primitives and formatting utilities; no TanStack instance is needed for the small fill set.

- [x] **Step 5: Write and fail detail presentation tests**

Assert all standard/debug fields, computed Hold/Settlement/Spread values, fills and timeline sections, SELL partition visibility, and absence of partition fields for BUY.

- [x] **Step 6: Implement detail presentation and verify GREEN**

Compose Cards, definition grids, `StateTimeline`, `FillsTable`, and an injected action node. Label settlement as `Debit amount` for BUY and `Credit amount` for SELL.

### Task 7: Confirmed Recovery Actions

**Files:**
- Create: `components/orders/ActionButtons.tsx`
- Create: `components/orders/__tests__/ActionButtons.test.tsx`

**Interfaces:**
- Produces: `ActionButtons({ order })` using Orders API mutation hooks.
- Consumes: Task 3 mutation hooks and shadcn AlertDialog.

- [x] **Step 1: Write failing conditional-action tests**

Mock mutation hooks with trigger functions exposing `.unwrap()`. Assert Retry Mint only for BUY `MINT_FAILED`, Retry Burn only for SELL `BURN_FAILED`, Cancel only for BUY cancellable states, and no action container for terminal states.

- [x] **Step 2: Run action tests and verify RED**

Run: `npm test -- components/orders/__tests__/ActionButtons.test.tsx`

Expected: FAIL because the component does not exist.

- [x] **Step 3: Add confirmation and feedback tests**

Click each visible action, assert the dialog contains the identifier and consequence copy, confirm, assert the correct trigger argument, then assert success text. Reject `.unwrap()` with `{ data: { message: "..." } }` and assert the inline error text.

- [x] **Step 4: Implement action configuration and dialogs**

Represent the visible action as one configuration object containing label, description, confirm label, and async trigger. Render one AlertDialog at a time, disable confirmation while the selected mutation is loading, and clear old feedback before a new action.

- [x] **Step 5: Run action tests to GREEN**

Run: `npm test -- components/orders/__tests__/ActionButtons.test.tsx`

Expected: all action tests pass without React warnings.

### Task 8: List and Detail Page Containers

**Files:**
- Modify: `app/orders/page.tsx`
- Create: `app/orders/[id]/page.tsx`
- Create: `components/orders/OrderDetailContainer.tsx`
- Modify: `app/__tests__/pages.test.tsx`
- Create: `components/orders/__tests__/OrderDetailContainer.test.tsx`

**Interfaces:**
- Produces: complete `/orders` and `/orders/[id]` experiences.
- Consumes: all Tasks 3-7 interfaces and Next.js navigation/search hooks.

- [x] **Step 1: Write failing list-page integration tests**

Mock generated list hooks, `useSearchParams`, and `useRouter`. Assert both hooks receive the same non-empty filters plus `limit: 100` and `{ pollingInterval: 5000 }`; assert merged records render; change a filter and assert `router.replace("/orders?symbol=AAPL")`; clear and assert `/orders`.

- [x] **Step 2: Run list-page tests and verify RED**

Run: `npm test -- app/__tests__/pages.test.tsx`

Expected: FAIL because the current Orders page is still a placeholder.

- [x] **Step 3: Implement the list container**

Wrap `useSearchParams` usage in a child component rendered under `Suspense`. Build `OrderQueryParams` from non-empty filters, call both hooks with the same object and polling options, merge only when both succeed, and render combined loading or error states.

- [x] **Step 4: Write failing detail-container tests**

Mock all detail/fill hooks. For `ord_001`, assert only order hooks are active and redemption hooks are skipped; for `red_001`, assert the inverse. Assert loading, 404 copy, generic request error, and successful `OrderDetail` composition.

- [x] **Step 5: Run detail tests and verify RED**

Run: `npm test -- components/orders/__tests__/OrderDetailContainer.test.tsx`

Expected: FAIL because the container does not exist.

- [x] **Step 6: Implement prefix-based detail loading**

Use `skipToken` or hook `skip` options so only the selected resource executes. Poll detail at 5,000ms. Fetch fills for the same resource. Render `ActionButtons` inside `OrderDetail`.

- [x] **Step 7: Add the dynamic route and run all feature tests**

Use `useParams<{ id: string }>()` in the client route and pass `id` to the container.

Run: `npm test -- app components/orders lib/api lib/mocks lib/orders`

Expected: all TASK-01 and TASK-02 tests pass.

### Task 9: Full Verification and Browser Acceptance

**Files:**
- Modify only files implicated by verification failures.

**Interfaces:**
- Produces: a verified TASK-02 implementation ready for Ledger and Recon work.

- [x] **Step 1: Run complete automated verification**

Run:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Expected: all commands exit 0 with no project warnings or errors.

- [x] **Step 2: Run browser acceptance checks in mock mode**

Verify `/orders` contains 25 combined records across pagination; client, end-user, symbol, status, and date filters update the URL and results; sorting toggles; clear resets controls; row activation opens detail; order and redemption details render timeline, fills, ledger impact, and conditional partition; Retry Mint, Retry Burn, and Cancel open confirmation dialogs and show success after confirmation.

- [x] **Step 3: Audit every source acceptance criterion**

Map each criterion in `task-02-order-tracker.md` to a passing automated assertion, production build output, or browser observation. Report any criterion without evidence as incomplete rather than claiming TASK-02 complete.
