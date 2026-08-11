# TASK-03 Ledger Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build the mock-backed Ledger Viewer with ten-second balance polling and a URL-filtered, globally sorted, cursor-paginated transaction log linked to Order Tracker details.

**Architecture:** Inject one Ledger API into the shared RTK Query base API and extend the centralized mock boundary with deterministic filter-sort-paginate behavior. Keep balance, filters, table, URL serialization, and cursor orchestration in focused units; the page owns remote query state while presentation components remain typed and independently testable.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Redux Toolkit/RTK Query, TanStack Table 8, Tailwind CSS 4, shadcn/ui, Vitest, React Testing Library.

## Global Constraints

- Implement TASK-03 only; existing Order Tracker behavior and Reconciliation remain unchanged.
- Poll balances every 10,000 milliseconds; never poll the paginated transaction query.
- Filter and globally sort all matching transactions before applying cursor pagination.
- Use `sortBy` and `sortDirection` query parameters as explicitly approved.
- Default to `sortBy=timestamp`, `sortDirection=desc`, and `limit=10`.
- Treat `fromDate` and `toDate` as inclusive calendar-day boundaries.
- Use the existing `formatCurrency()` and `formatDate()` utilities.
- Use URL state only for filters; keep sort and cursor history local to the page.
- Keep fixture timestamps deterministic across the seven days ending 2026-08-03.
- Use test-first red-green-refactor cycles for runtime behavior.
- Make no Git commits, per the user's standing instruction.

---

### Task 1: Ledger Contracts, Tones, and URL Filters

**Files:**
- Modify: `lib/types/ledger.ts`
- Create: `lib/ledger/ledgerUtils.ts`
- Create: `lib/ledger/filterParams.ts`
- Create: `lib/ledger/__tests__/ledgerUtils.test.ts`
- Create: `lib/ledger/__tests__/filterParams.test.ts`

**Interfaces:**
- Consumes: existing `ClientBalance`, `Transaction`, and `TransactionType`.
- Produces: `TransactionFilters`, `TransactionQueryParams`, `TransactionSortField`, `SortDirection`, `PaginatedTransactions`, `EMPTY_TRANSACTION_FILTERS`, `TRANSACTION_TYPES`, `getTransactionTone(type)`, `getAmountTone(amount)`, `readTransactionFilters(params)`, and `writeTransactionFilters(filters)`.

- [x] **Step 1: Write failing utility tests**

Assert the exact badge and amount categories:

```typescript
expect(getTransactionTone("DEPOSIT")).toBe("success");
expect(getTransactionTone("SELL_CREDIT")).toBe("success");
expect(getTransactionTone("WITHDRAWAL")).toBe("danger");
expect(getTransactionTone("BUY_DEBIT")).toBe("danger");
expect(getTransactionTone("BUY_HOLD")).toBe("warning");
expect(getTransactionTone("BUY_HOLD_RELEASE")).toBe("warning");
expect(getTransactionTone("SPREAD_REVENUE")).toBe("info");
expect(getTransactionTone("CONVERSION")).toBe("info");
expect(getAmountTone(10)).toBe("positive");
expect(getAmountTone(-10)).toBe("negative");
expect(getAmountTone(0)).toBe("neutral");
expect(TRANSACTION_TYPES).toHaveLength(9);
```

- [x] **Step 2: Write failing URL-parameter tests**

```typescript
expect(writeTransactionFilters({
  ...EMPTY_TRANSACTION_FILTERS,
  clientId: "client_acme",
  type: "BUY_DEBIT",
})).toBe("clientId=client_acme&type=BUY_DEBIT");

expect(readTransactionFilters(
  new URLSearchParams("fromDate=2026-07-29&toDate=2026-08-03"),
)).toEqual({
  clientId: "",
  type: "",
  fromDate: "2026-07-29",
  toDate: "2026-08-03",
});
```

Also assert unknown transaction types are normalized to `""` and empty values are omitted.

- [x] **Step 3: Run focused tests and verify RED**

Run: `npm test -- lib/ledger/__tests__`

Expected: FAIL because the new modules and contracts do not exist.

- [x] **Step 4: Add the exact contracts**

Append to `lib/types/ledger.ts`:

```typescript
export type SortDirection = "asc" | "desc";

export type TransactionSortField =
  | "timestamp"
  | "clientName"
  | "endUserId"
  | "type"
  | "amount"
  | "runningBalance"
  | "referenceId"
  | "description";

export interface TransactionFilters {
  clientId: string;
  type: string;
  fromDate: string;
  toDate: string;
}

export interface TransactionQueryParams {
  clientId?: string;
  type?: TransactionType;
  fromDate?: string;
  toDate?: string;
  cursor?: string;
  limit?: number;
  sortBy?: TransactionSortField;
  sortDirection?: SortDirection;
}

export interface PaginatedTransactions {
  items: Transaction[];
  nextCursor: string | null;
  totalCount: number;
}
```

- [x] **Step 5: Implement utilities and serialization**

Export all nine types in stable display order. Map credit types to `success`, withdrawal/debit types to `danger`, holds/releases to `warning`, and spread/conversion to `info`. Serialize filter keys in `clientId`, `type`, `fromDate`, `toDate` order. Validate `type` against `TRANSACTION_TYPES` while reading.

- [x] **Step 6: Run focused tests to GREEN**

Run: `npm test -- lib/ledger/__tests__`

Expected: both utility suites pass.

### Task 2: Deterministic Ledger Fixtures and Mock Query Behavior

**Files:**
- Modify: `lib/mocks/ledger.json`
- Modify: `lib/mocks/mockBaseQuery.ts`
- Modify: `lib/mocks/__tests__/mockBaseQuery.test.ts`

**Interfaces:**
- Consumes: Task 1 query and pagination contracts plus static JSON fixtures.
- Produces: `GET /admin/ledger/balances` as `ClientBalance[]` and `GET /admin/ledger/transactions` as `PaginatedTransactions`.

- [x] **Step 1: Replace empty-route expectations with failing ledger assertions**

Add assertions for the three exact balances and transaction coverage:

```typescript
const balances = await readData<ClientBalance[]>("/admin/ledger/balances");
expect(balances).toHaveLength(3);
expect(balances[0]).toEqual({
  clientId: "client_nanovest",
  clientName: "Nanovest",
  available: 50000,
  held: 12000,
  total: 62000,
});

const page = await readData<PaginatedTransactions>(
  "/admin/ledger/transactions?limit=100",
);
expect(page.items.length).toBeGreaterThanOrEqual(30);
expect(new Set(page.items.map((item) => item.type))).toEqual(
  new Set(TRANSACTION_TYPES),
);
```

Assert every referenced ID exists in `orders.json`, null and non-null `endUserId` values both occur, and timestamps cover seven distinct UTC date strings from `2026-07-28` through `2026-08-03`.

- [x] **Step 2: Add failing filter, sort, and cursor tests**

```typescript
const filtered = await readData<PaginatedTransactions>(
  "/admin/ledger/transactions?clientId=client_nanovest&type=BUY_DEBIT&fromDate=2026-07-28&toDate=2026-08-03&limit=100",
);
expect(filtered.items.every((item) =>
  item.clientId === "client_nanovest" && item.type === "BUY_DEBIT"
)).toBe(true);

const first = await readData<PaginatedTransactions>(
  "/admin/ledger/transactions?sortBy=amount&sortDirection=asc&limit=5",
);
expect(first.items.map((item) => item.amount)).toEqual(
  [...first.items.map((item) => item.amount)].sort((a, b) => a - b),
);
expect(first.nextCursor).toBe("5");
```

Fetch the next cursor and assert its minimum amount is at least the first page's maximum, proving sorting occurs before pagination. Add descending timestamp, inclusive exact-day, invalid sort fallback, and `limit=500` clamping tests.

- [x] **Step 3: Run mock tests and verify RED**

Run: `npm test -- lib/mocks/__tests__/mockBaseQuery.test.ts`

Expected: FAIL because ledger fixtures are empty and the transaction route is not paginated.

- [x] **Step 4: Populate ledger fixtures**

Create the three exact balances and at least 36 transactions. Use IDs `txn_001` onward, all nine types, all clients, both nullable and populated end users, valid `ord_###` or `red_###` references, signed amounts, plausible per-client running balances, and timestamps on each date from `2026-07-28` to `2026-08-03`.

Use credit-positive and debit-negative examples, including:

```json
{
  "id": "txn_001",
  "timestamp": "2026-08-03T14:42:00.000Z",
  "clientId": "client_nanovest",
  "clientName": "Nanovest",
  "endUserId": null,
  "type": "DEPOSIT",
  "amount": 25000,
  "runningBalance": 62000,
  "referenceId": null,
  "description": "Treasury wallet top-up"
}
```

- [x] **Step 5: Implement `listTransactions` in the mock boundary**

Parse ledger parameters separately from order parameters. Filter with AND semantics and `timestamp.slice(0, 10)` inclusive comparisons. Sort a copied array using the requested field; compare nullable strings as empty strings and numbers numerically, apply direction, then use `id.localeCompare()` as a stable tie-breaker. Clamp `limit` to 1–100, interpret cursor as a non-negative offset, and return:

```typescript
{
  items: sorted.slice(offset, offset + limit),
  nextCursor: offset + limit < sorted.length ? String(offset + limit) : null,
  totalCount: sorted.length,
}
```

Route balances directly and transactions through `listTransactions(searchParams)` before the generic static-route lookup.

- [x] **Step 6: Run mock and utility suites to GREEN**

Run: `npm test -- lib/mocks/__tests__/mockBaseQuery.test.ts lib/ledger/__tests__`

Expected: all ledger fixture, filtering, sorting, and pagination assertions pass without regressing order mocks.

### Task 3: Ledger RTK Query API

**Files:**
- Create: `lib/api/ledgerApi.ts`
- Create: `lib/api/__tests__/ledgerApi.test.ts`

**Interfaces:**
- Consumes: `baseApi`, `ClientBalance[]`, `TransactionQueryParams`, and `PaginatedTransactions`.
- Produces: `ledgerApi`, `useGetBalancesQuery`, and `useGetTransactionsQuery`.

- [x] **Step 1: Write failing API integration tests**

Dispatch endpoint initiators through a fresh Redux store and mock base query, then assert:

```typescript
const balances = await testStore.dispatch(
  ledgerApi.endpoints.getBalances.initiate(),
);
expect(balances.data).toHaveLength(3);

const page = await testStore.dispatch(
  ledgerApi.endpoints.getTransactions.initiate({
    clientId: "client_acme",
    type: "DEPOSIT",
    fromDate: "2026-07-28",
    toDate: "2026-08-03",
    cursor: "0",
    limit: 10,
    sortBy: "amount",
    sortDirection: "asc",
  }),
);
expect(page.data?.items.every((item) => item.clientId === "client_acme")).toBe(true);
```

Inspect dispatched query cache keys or a captured base query to verify empty values are omitted and all eight supported parameters serialize correctly. Reset API state after each test.

- [x] **Step 2: Run API tests and verify RED**

Run: `npm test -- lib/api/__tests__/ledgerApi.test.ts`

Expected: FAIL because `ledgerApi.ts` does not exist.

- [x] **Step 3: Implement Ledger endpoints**

Use a local URL builder that includes only values not equal to `undefined`, `null`, or `""`. Define:

```typescript
getBalances: build.query<ClientBalance[], void>({
  query: () => "/admin/ledger/balances",
  providesTags: ["Balances"],
}),
getTransactions: build.query<PaginatedTransactions, TransactionQueryParams>({
  query: (params) => collectionUrl("/admin/ledger/transactions", params),
  providesTags: ["Transactions"],
}),
```

Polling remains a hook option at the page boundary, not an endpoint definition.

- [x] **Step 4: Run API tests to GREEN**

Run: `npm test -- lib/api/__tests__/ledgerApi.test.ts`

Expected: all Ledger API integration tests pass.

### Task 4: Balance Summary

**Files:**
- Create: `components/ledger/BalanceSummary.tsx`
- Create: `components/ledger/__tests__/BalanceSummary.test.tsx`

**Interfaces:**
- Consumes: `ClientBalance[]`, `isLoading`, and optional `isError`.
- Produces: `BalanceSummary({ balances, isLoading, isError })`.

- [x] **Step 1: Write failing component tests**

With the three required balance rows, assert:

```typescript
expect(screen.getAllByRole("columnheader").map((node) => node.textContent)).toEqual([
  "Client",
  "Available (USDT)",
  "Held (USDT)",
  "Total (USDT)",
]);
const rows = screen.getAllByRole("row");
expect(within(rows[1]).getByText("Global Totals")).toBeInTheDocument();
expect(within(rows[1]).getByText("$62,500.00")).toBeInTheDocument();
expect(within(rows[1]).getByText("$18,200.00")).toBeInTheDocument();
expect(within(rows[1]).getByText("$80,700.00")).toBeInTheDocument();
```

Also assert all client names/currencies, `data-global="true"`, four skeleton rows during loading, a dedicated empty message, and an alert on error.

- [x] **Step 2: Run balance tests and verify RED**

Run: `npm test -- components/ledger/__tests__/BalanceSummary.test.tsx`

Expected: FAIL because the component does not exist.

- [x] **Step 3: Implement the balance card**

Reduce balances into `{ available, held, total }` starting from zeros. Render the totals row first, then client rows, using shadcn Card/Table/Skeleton primitives and `formatCurrency()` for every number. Distinguish loading, request failure, empty success, and populated success.

- [x] **Step 4: Run balance tests to GREEN**

Run: `npm test -- components/ledger/__tests__/BalanceSummary.test.tsx`

Expected: all balance tests pass.

### Task 5: Controlled Transaction Filters

**Files:**
- Create: `components/ledger/TransactionFilters.tsx`
- Create: `components/ledger/__tests__/TransactionFilters.test.tsx`

**Interfaces:**
- Consumes: `TransactionFilters`, `onChange(next)`, and `onClear()`.
- Produces: an accessible controlled filter bar for exact client/type/date values.

- [x] **Step 1: Write failing filter tests**

Render `EMPTY_TRANSACTION_FILTERS`, select Nanovest and `BUY_DEBIT`, change both date inputs, and assert each call receives the complete next object:

```typescript
expect(onChange).toHaveBeenCalledWith({
  ...EMPTY_TRANSACTION_FILTERS,
  clientId: "client_nanovest",
});
expect(onChange).toHaveBeenCalledWith({
  ...EMPTY_TRANSACTION_FILTERS,
  type: "BUY_DEBIT",
});
```

Render a non-empty value and assert Clear Filters calls `onClear` exactly once. Assert the Client and Transaction Type selects contain the three clients and all nine types.

- [x] **Step 2: Run filter tests and verify RED**

Run: `npm test -- components/ledger/__tests__/TransactionFilters.test.tsx`

Expected: FAIL because the component does not exist.

- [x] **Step 3: Implement the filter card**

Follow the established Base UI/shadcn Select pattern from `OrderFilters`. Use an internal `__all__` value mapped to `""`, explicit labels, native date Inputs, and a RotateCcw Clear Filters button. Keep the fixed client ID/name mapping identical to Order Tracker.

- [x] **Step 4: Run filter tests to GREEN**

Run: `npm test -- components/ledger/__tests__/TransactionFilters.test.tsx`

Expected: all controlled filter tests pass.

### Task 6: Globally Controlled Transaction Log

**Files:**
- Create: `components/ledger/TransactionLog.tsx`
- Create: `components/ledger/__tests__/TransactionLog.test.tsx`

**Interfaces:**
- Consumes: `transactions`, `isLoading`, `sortBy`, `sortDirection`, `onSortChange`, `pageSize`, `onPageSizeChange`, `pageNumber`, `totalCount`, `canPreviousPage`, `canNextPage`, `onPreviousPage`, and `onNextPage`.
- Produces: the eight-column transaction table with manual sort events, category styling, references, loading/empty states, and controlled pagination.

- [x] **Step 1: Write failing rendering and styling tests**

Assert exact headings and values using credit, debit, null, and reference fixtures:

```typescript
expect(screen.getAllByRole("columnheader").map((node) => node.textContent)).toEqual([
  "Timestamp",
  "Client",
  "End-User",
  "Type",
  "Amount",
  "Running Balance",
  "Reference",
  "Description",
]);
expect(screen.getByRole("link", { name: /Open order ord_001/i })).toHaveAttribute(
  "href",
  "/orders/ord_001",
);
expect(screen.getByText("DEPOSIT")).toHaveAttribute("data-tone", "success");
expect(screen.getByText("BUY_DEBIT")).toHaveAttribute("data-tone", "danger");
expect(screen.getByTestId("amount-positive")).toHaveClass("text-emerald-600");
expect(screen.getByTestId("amount-negative")).toHaveClass("text-red-600");
```

Assert `-` for null end-user/reference and formatted timestamp/currency values.

- [x] **Step 2: Write failing sorting, loading, empty, and pagination tests**

Click the Timestamp header twice and expect `onSortChange("timestamp", "asc")` then `onSortChange("timestamp", "desc")` across controlled rerenders. Click Client from a timestamp sort and expect `onSortChange("clientName", "asc")`. Assert `aria-sort`, five skeleton rows, the exact empty message, matching-count/page copy, page-size callback, button disabled states, and previous/next callbacks.

- [x] **Step 3: Run table tests and verify RED**

Run: `npm test -- components/ledger/__tests__/TransactionLog.test.tsx`

Expected: FAIL because the component does not exist.

- [x] **Step 4: Implement manual TanStack columns and sort headers**

Create all eight accessor columns. Initialize `useReactTable` with `manualSorting: true`, `getCoreRowModel()`, and controlled sorting derived from props. Each heading button requests ascending for a new field and toggles direction for the active field.

Apply `getTransactionTone()` to Badge `data-tone` plus green/red/amber/blue class maps. Apply `getAmountTone()` to amount text. Use `Link` only for non-null references. Use semantic Table rows, visible focus styles on sort and reference controls, and horizontal overflow around the table.

- [x] **Step 5: Implement controlled pagination footer**

Render page sizes 10, 20, and 50; `Page {pageNumber}`; `{totalCount} matching transactions`; and Previous/Next buttons wired only to callbacks. Do not perform client pagination or sorting in this component.

- [x] **Step 6: Run table tests to GREEN**

Run: `npm test -- components/ledger/__tests__/TransactionLog.test.tsx`

Expected: all rendering, sorting, styling, reference, loading, empty, and pagination tests pass.

### Task 7: Ledger Page Orchestration and Full Verification

**Files:**
- Replace: `app/ledger/page.tsx`
- Create: `app/ledger/__tests__/page.test.tsx`
- Modify: `docs/superpowers/plans/2026-08-04-task-03-ledger-viewer.md` (check completed steps only)

**Interfaces:**
- Consumes: all Task 1–6 hooks, types, serializers, and components.
- Produces: the complete `/ledger` route with URL filters, 10-second balance polling, global remote sorting, cursor history, page-size resets, and independent error handling.

- [x] **Step 1: Write failing page coordination tests**

Mock `next/navigation`, Ledger hooks, and child components. Assert:

```typescript
expect(useGetBalancesQuery).toHaveBeenCalledWith(undefined, {
  pollingInterval: 10000,
});
expect(useGetTransactionsQuery).toHaveBeenCalledWith({
  limit: 10,
  sortBy: "timestamp",
  sortDirection: "desc",
});
```

Invoke captured filter props and assert `router.replace("/ledger?clientId=client_acme")`. Invoke clear and assert `router.replace("/ledger")`. Invoke sort and page-size callbacks and assert subsequent transaction queries reset `cursor`. Return `nextCursor: "10"`, invoke Next, and assert the query includes `cursor: "10"`; invoke Previous and assert it returns to the first query. Assert balance and transaction errors render independently.

- [x] **Step 2: Run page tests and verify RED**

Run: `npm test -- app/ledger/__tests__/page.test.tsx`

Expected: FAIL because the route remains a placeholder and does not call Ledger hooks.

- [x] **Step 3: Implement page filter and query state**

Inside a `LedgerContent` component:

```typescript
const filters = readTransactionFilters(
  new URLSearchParams(searchParams.toString()),
);
const [sortBy, setSortBy] = useState<TransactionSortField>("timestamp");
const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
const [pageSize, setPageSize] = useState(10);
const [cursor, setCursor] = useState<string | undefined>();
const [cursorHistory, setCursorHistory] = useState<Array<string | undefined>>([]);
```

Build the transaction query by conditionally spreading non-empty filters, cursor, `limit`, `sortBy`, and `sortDirection`. Pass `{ pollingInterval: 10000 }` only to balances. Wrap `LedgerContent` in `Suspense` with a ledger-shaped skeleton fallback.

- [x] **Step 4: Implement reset and cursor callbacks**

Use one `resetPagination()` that clears `cursor` and history. Updating URL filters calls reset before `router.replace`. Sort change updates both sort values and resets. Page-size change updates size and resets. Next pushes the current cursor and adopts `nextCursor`; Previous pops history and adopts the popped cursor without mutating the existing array.

- [x] **Step 5: Compose the route and verify page tests GREEN**

Render the page header, `BalanceSummary`, `TransactionFilters`, and `TransactionLog` in that order. Pass section-specific loading/error values and compute page number as `cursorHistory.length + 1`.

Run: `npm test -- app/ledger/__tests__/page.test.tsx`

Expected: all page orchestration tests pass.

- [x] **Step 6: Run the complete automated verification suite**

Run:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Expected: all Vitest suites pass, ESLint produces no errors or warnings, TypeScript exits zero, and Next.js produces a successful production build. If `next/font` network access is blocked in the sandbox, rerun only `npm run build` through the normal approval flow.

- [x] **Step 7: Perform browser acceptance in mock mode**

Open `/ledger` and verify:

1. Global totals are `$62,500.00`, `$18,200.00`, and `$80,700.00`.
2. All three client balance rows render.
3. Default first transaction is the newest timestamp.
4. Client, type, and date filters update the URL and matching count.
5. Clear Filters restores `/ledger` and all results.
6. Amount sorting is globally ordered across the first and second pages.
7. Page sizes and Previous/Next behave correctly.
8. A reference link opens its `/orders/[referenceId]` detail.
9. No browser console or runtime errors occur.

- [x] **Step 8: Record final evidence without committing**

Mark this plan's checkboxes complete, report exact test/lint/type/build results and browser scenarios, list key created/modified files, and explicitly state that no Git commit was made.
