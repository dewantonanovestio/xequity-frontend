# TASK-03 Ledger Viewer Design

**Date:** 2026-08-03
**Status:** Approved 2026-08-04
**Source requirements:** `docs/feature/developer-dashboard/tasks/task-03-ledger-viewer.md`

## Purpose

Implement the dashboard's ledger-debugging workflow: a continuously refreshed client balance summary and a filterable, globally sortable, cursor-paginated transaction history that cross-links ledger entries to the Order Tracker.

## Scope

This change implements TASK-03 only. It adds Ledger-domain RTK Query endpoints, realistic balance and transaction fixtures, mock route behavior, the ledger page, balance and transaction components, URL-backed filters, global server-side sorting, and automated and browser acceptance coverage.

Order Tracker behavior, reconciliation behavior, authentication, exports, mobile-specific layouts, and real backend implementation remain outside this change. Existing shared UI, API, store, formatter, and test infrastructure will be reused.

## Chosen Approach

Transactions use server-driven filtering, sorting, and cursor pagination. The rejected alternatives were sorting only the current page, which produces misleading results across pages, and fetching the entire ledger into the browser, which does not model the planned backend contract.

The source task's transaction query contract is extended with `sortBy` and `sortDirection`, as explicitly approved. Sorting therefore runs across the entire filtered result set before pagination in mock mode and can map directly to a future backend implementation.

## Architecture

`lib/api/ledgerApi.ts` injects `getBalances` and `getTransactions` into the shared `baseApi`. The ledger page owns filter, sort, cursor-history, and page-size state and calls the generated hooks. Presentation components receive typed data and callbacks.

The balance query polls every 10,000 milliseconds. The transaction query does not poll. Filter, sort, or page-size changes reset pagination to the first cursor. Previous-page navigation uses a client-side stack of previously visited cursors because the response contract supplies only `nextCursor`.

## Data Contracts

The existing `ClientBalance`, `Transaction`, and `TransactionType` types remain the core domain model. TASK-03 adds:

- `TransactionFilters` with `clientId`, `type`, `fromDate`, and `toDate` string values for controlled UI state.
- `TransactionQueryParams` with optional filters plus `cursor`, `limit`, `sortBy`, and `sortDirection`.
- `TransactionSortField`, limited to the transaction fields exposed as sortable table columns.
- `SortDirection` as `asc | desc`.
- `PaginatedTransactions` with `items`, `nextCursor`, and `totalCount`.

The default query uses `sortBy=timestamp`, `sortDirection=desc`, and a page size of 10. Empty filter values are omitted from the URL and API query.

## Mock Data and Routing

`lib/mocks/ledger.json` contains the required balances:

- Nanovest: 50,000 available, 12,000 held, 62,000 total.
- Acme Capital: 8,500 available, 4,200 held, 12,700 total.
- BlockPrime: 4,000 available, 2,000 held, 6,000 total.

It also contains at least 30 transactions across all three clients and the seven calendar days ending 2026-08-03. All nine declared transaction types appear. Amounts are signed: credits are positive and debits or holds are negative. Running balances remain plausible within each client timeline. Client-level events such as deposits may omit `endUserId`; trading events normally include one. Multiple entries reference valid mock order or redemption identifiers from TASK-02.

The mock balance route returns the balance array. The transaction route performs operations in this order:

1. Parse and validate query parameters, falling back to timestamp-descending order and a bounded default limit.
2. Filter by exact client and transaction type.
3. Apply inclusive calendar-day boundaries to timestamps.
4. Globally sort all matching entries with deterministic transaction-ID tie-breaking.
5. Interpret the cursor as an offset and return one page with `nextCursor` and `totalCount`.

Invalid cursor, limit, sort field, or sort direction values fall back safely rather than crashing mock mode. Unsupported routes retain the shared typed 404 behavior.

## Ledger Page and URL State

`app/ledger/page.tsx` is a client page wrapped in `Suspense` for `useSearchParams()`. It renders a compact page header followed by the balance summary and transaction log sections.

Client, transaction type, from-date, and to-date filters initialize from the URL and update through `router.replace()`. Clear removes every ledger filter and restores `/ledger`. Sorting and cursor history remain session-local table state; filters are the shareable state. The page reports readable, section-specific request errors without hiding a successfully loaded sibling section.

The client options come from the known balance clients rather than introducing another endpoint. While balances are still loading, the fixed three fixture/domain clients remain available so the filter controls do not jump or disappear.

## Balance Summary

`BalanceSummary` is a card titled `Client Balances` containing a simple shadcn-styled table. Columns are Client, Available (USDT), Held (USDT), and Total (USDT).

The component reduces the supplied balances into a synthetic `Global Totals` row rendered first with stronger weight and a highlighted background. All values use `formatCurrency()`. The required fixtures produce totals of $62,500.00 available, $18,200.00 held, and $80,700.00 total. Loading renders table-shaped skeleton rows; an empty successful response renders a clear empty message.

## Transaction Filters

`TransactionFilters` is a controlled filter card containing:

- Client select: all clients, Nanovest, Acme Capital, and BlockPrime.
- Transaction Type select: all types plus each of the nine `TransactionType` values.
- Native date inputs for inclusive from and to dates.
- Clear Filters button.

Each control emits a complete next filter object. The clear action is delegated to the page so URL and table state reset together. Labels and accessible names mirror the visible field names.

## Transaction Log

`TransactionLog` uses TanStack Table to define and render Timestamp, Client, End-User, Type, Amount, Running Balance, Reference, and Description columns. Sorting is manual: header interactions emit the chosen field and direction to the page, which requests the globally sorted page from RTK Query. Timestamp starts descending. A selected header exposes its sort direction through accessible state.

Type badges use the required categories:

- Green: `DEPOSIT`, `SELL_CREDIT`, `DIVIDEND_CREDIT`.
- Red: `WITHDRAWAL`, `BUY_DEBIT`.
- Yellow/amber: `BUY_HOLD`, `BUY_HOLD_RELEASE`.
- Blue: `SPREAD_REVENUE`, `CONVERSION`.

Positive amounts use green text, negative amounts use red text, and zero uses the default foreground. Amount and running balance use `formatCurrency()`; timestamps use `formatDate()`. Null end users and references render `-`. Non-null references use a Next.js `Link` to `/orders/[referenceId]` with an explicit accessible label.

Loading renders table-shaped skeleton rows. An empty result renders `No transactions match the current filters.` Pagination offers 10, 20, and 50 rows per page, Previous and Next buttons, current page information derived from cursor history, and a matching-record count. Previous is disabled on the first page; Next is disabled without `nextCursor`.

## State Transitions and Error Handling

- Filter changes reset the cursor stack and current cursor.
- Sort-field or sort-direction changes reset pagination.
- Page-size changes reset pagination.
- Next pushes the current cursor onto history and selects `nextCursor`.
- Previous pops the latest cursor and returns to it.
- Balance failures render within the balance section.
- Transaction failures render within the transaction section while preserving filters.
- Missing optional values render `-` and never generate broken links.
- Empty successful results remain distinct from request failures.

## Testing Strategy

Tests follow red-green-refactor cycles and cover:

- Ledger API URL serialization, default and explicit sorting parameters, balance tags, and transaction tags.
- Mock fixture size, all transaction types, valid client balances, cross-references, and date span.
- Mock filtering by client, type, and inclusive date range.
- Global ascending and descending sorting before pagination, deterministic ties, cursor metadata, and bounded page sizes.
- Balance rows, global totals, formatting, first-row emphasis, loading, and empty states.
- Filter control changes and complete clearing.
- Transaction columns, default sort metadata, sort callbacks, badge categories, signed amount colors, currency/date formatting, references, null handling, skeletons, and empty states.
- Pagination cursor transitions, history reset after filters/sort/page-size changes, URL synchronization, polling configuration, and independent section errors at page level.

Final verification requires the complete Vitest suite, ESLint, TypeScript checking, a Next.js production build, and browser checks of totals, filters, clearing, global sorting, page-size changes, Previous/Next navigation, reference navigation, loading/empty behavior where practicable, and request-free mock rendering.

## Acceptance Criteria

TASK-03 is complete when every acceptance criterion in the source task passes with mock mode enabled: both sections render; totals and currency formatting are correct; balances poll every ten seconds; transactions expose every required column; badges and signed amounts use the required colors; references navigate into the Order Tracker; filters, clearing, global sorting, and cursor pagination work; loading, empty, and error states are distinct; and automated plus browser verification are green.
