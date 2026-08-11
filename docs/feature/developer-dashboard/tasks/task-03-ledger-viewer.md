# TASK-03: Ledger Viewer

| | |
|---|---|
| **ID** | TASK-03 |
| **Status** | Complete |
| **Size** | L (2-3 days) |
| **Dependencies** | TASK-01 |
| **Blocks** | None |
| **HLD Reference** | Sections 5.3, 6.2, 7, 10 |

---

## Background

The Ledger Viewer gives the dev team visibility into money flow across all clients. It has two sub-sections: a balance summary table showing current USDT balances per client, and a transaction log showing the full history of credits/debits.

Neither backend endpoint (`GET /admin/ledger/balances`, `GET /admin/ledger/transactions`) exists yet. Both are fully mocked.

---

## Description

### 1. RTK Query Endpoints

Create `lib/api/ledgerApi.ts` injecting endpoints into `baseApi`:

**Query endpoints:**
- `getBalances` — `GET /admin/ledger/balances`. Returns array of `ClientBalance`. Polling: 10s.
- `getTransactions` — `GET /admin/ledger/transactions` with query params: `clientId`, `type`, `fromDate`, `toDate`, `cursor`, `limit`. Returns paginated list of `Transaction`. No polling (paginated, user-triggered).

### 2. Mock Data

Populate `lib/mocks/ledger.json` with:

**Balances:**
- 3 clients: "Nanovest", "Acme Capital", "BlockPrime"
- Varying balances: one with large available + some held, one with mostly held (active trading), one with small balance
- Example: Nanovest ($50,000 available, $12,000 held, $62,000 total)

**Transactions:**
- At least 30 transactions across all clients
- All transaction types represented: `DEPOSIT`, `WITHDRAWAL`, `BUY_HOLD`, `BUY_HOLD_RELEASE`, `BUY_DEBIT`, `SELL_CREDIT`, `DIVIDEND_CREDIT`, `SPREAD_REVENUE`, `CONVERSION`
- Some transactions with `referenceId` pointing to mock order IDs (for cross-linking)
- Some with `endUserId`, some without (e.g., deposits are client-level)
- Realistic amounts and running balances
- Timestamps spanning the last 7 days

Update `lib/mocks/mockBaseQuery.ts` to handle ledger endpoint patterns.

### 3. Ledger Page (`app/ledger/page.tsx`)

A client component that renders two sections stacked vertically:

1. **Balance Summary** section at the top
2. **Transaction Log** section below, with `TransactionFilters` above the table

### 4. BalanceSummary Component

A table (TanStack Table or simple HTML table) showing:

| Client | Available (USDT) | Held (USDT) | Total (USDT) |
|--------|-----------------|-------------|---------------|
| **Global Totals** | **$62,500.00** | **$18,200.00** | **$80,700.00** |
| Nanovest | $50,000.00 | $12,000.00 | $62,000.00 |
| Acme Capital | $8,500.00 | $4,200.00 | $12,700.00 |
| BlockPrime | $4,000.00 | $2,000.00 | $6,000.00 |

- Global totals row at the top, bold/highlighted
- All currency values formatted with `formatCurrency()`
- Polls every 10s via RTK Query
- Loading skeleton while fetching
- Card wrapper with "Client Balances" heading

### 5. TransactionFilters Component

Filter bar above the transaction log:
- **Client** — `<Select>` dropdown (same client list)
- **Transaction Type** — `<Select>` dropdown with all `TransactionType` values
- **Date Range** — two date `<Input>` fields (from, to)
- **Clear Filters** button

### 6. TransactionLog Component

TanStack Table with columns:
- Timestamp (formatted date/time)
- Client
- End-User (or "-" if null)
- Type (badge with color coding by category)
- Amount (formatted currency; positive in green, negative in red)
- Running Balance (formatted currency)
- Reference (order ID — clickable, navigates to `/orders/[referenceId]`)
- Description

Features:
- Pagination controls (page size, prev/next)
- Column sorting (default: timestamp desc)
- Loading skeleton
- Empty state message

**Transaction type badge colors:**
- Green: `DEPOSIT`, `SELL_CREDIT`, `DIVIDEND_CREDIT`
- Red: `WITHDRAWAL`, `BUY_DEBIT`
- Yellow: `BUY_HOLD`, `BUY_HOLD_RELEASE`
- Blue: `SPREAD_REVENUE`, `CONVERSION`

**Reference ID linking**: If `referenceId` is not null, render it as a clickable link that navigates to `/orders/[referenceId]`. Use Next.js `Link` component.

---

## Acceptance Criteria

- [x] Ledger page renders both the balance summary and transaction log sections
- [x] Balance summary table shows all clients with available, held, and total columns
- [x] Global totals row appears at the top with summed values
- [x] All currency values are formatted correctly ($ sign, thousands separator, 2 decimals)
- [x] Balance summary auto-refreshes every 10 seconds
- [x] Transaction log shows all columns: timestamp, client, end-user, type, amount, running balance, reference, description
- [x] Transaction type badges are color-coded by category
- [x] Positive amounts show in green, negative in red
- [x] Clicking a reference ID navigates to the order detail page
- [x] All filters work: client, transaction type, date range
- [x] Clear filters button resets all filters
- [x] Pagination works (page size selector, prev/next buttons)
- [x] Column sorting works (default: timestamp desc)
- [x] Loading skeletons show while data is fetching
- [x] Empty state shows when no transactions match filters
- [x] All data renders correctly in mock mode

---

## Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `lib/api/ledgerApi.ts` | RTK Query endpoints for balances + transactions |
| Modify | `lib/mocks/ledger.json` | Populate with realistic mock data |
| Modify | `lib/mocks/mockBaseQuery.ts` | Add ledger endpoint handlers |
| Create | `app/ledger/page.tsx` | Ledger viewer page |
| Create | `components/ledger/BalanceSummary.tsx` | Client balances table with totals |
| Create | `components/ledger/TransactionLog.tsx` | Transaction history table |
| Create | `components/ledger/TransactionFilters.tsx` | Filter bar for transactions |

---

## Unit Test Plan

| Test | What it verifies |
|------|-----------------|
| BalanceSummary renders all clients | Table has correct number of rows |
| BalanceSummary computes global totals correctly | Sum of available, held, total |
| BalanceSummary shows totals row at top | Global row is first and bold |
| TransactionLog renders rows with all columns | All columns present |
| TransactionLog formats positive amounts in green | Amount color coding |
| TransactionLog formats negative amounts in red | Amount color coding |
| TransactionLog renders reference as clickable link | Cross-navigation |
| TransactionLog renders "-" for null end-user and null reference | Null handling |
| TransactionFilters calls onChange with filter values | Filter state management |
| TransactionFilters clear button resets filters | Clear functionality |
| Transaction type badges have correct colors per type | Badge color mapping |

---

## Implementation Hints

1. **Global totals computation**: Compute totals in the component by reducing the `balances` array. Place the totals row as the first row in the table. Use bold text or a different background to distinguish it.

2. **Amount coloring**: Use a simple conditional class — `text-green-600` for positive, `text-red-600` for negative. The `amount` field from the API is signed (negative for debits, positive for credits).

3. **Reference linking**: Use `<Link href={/orders/${referenceId}}>{referenceId}</Link>` when `referenceId` is not null. Style it as a clickable text link (underline, blue). This naturally integrates with the Order Tracker built in TASK-02 — if TASK-02 is not complete yet, the link will navigate to a 404, which is acceptable during development.

4. **Pagination with RTK Query**: For server-side pagination, pass `cursor` and `limit` as query params to `useGetTransactionsQuery`. The response should include pagination metadata (e.g., `nextCursor`, `totalCount`). In mock mode, implement client-side pagination over the full mock dataset within `mockBaseQuery`.

5. **TanStack Table vs. simple table for balances**: The balance summary is a small, static table (3-5 rows). Using a plain HTML `<table>` styled with shadcn's Table components is simpler than TanStack Table. Reserve TanStack Table for the transaction log where sorting and pagination matter.
