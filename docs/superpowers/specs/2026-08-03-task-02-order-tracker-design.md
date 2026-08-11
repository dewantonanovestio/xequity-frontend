# TASK-02 Order Tracker Design

**Date:** 2026-08-03
**Status:** Approved
**Source requirements:** `docs/feature/developer-dashboard/tasks/task-02-order-tracker.md`

## Purpose

Implement the dashboard's primary debugging workflow: a combined order and redemption tracker with shareable filters, global sorting and pagination, lifecycle drill-down, fill and ledger diagnostics, and confirmed recovery actions.

## Scope

This change implements TASK-02 only. It adds the Orders-domain RTK Query endpoints, realistic mock data and mock route behavior, combined list UI, filters, order detail route and components, lifecycle timeline, fills, ledger-impact calculations, redemption partition data, and conditional retry or cancellation actions.

Ledger and reconciliation feature pages, authentication, exports, mobile layouts, and new backend endpoints remain outside this change.

## Architecture

`lib/api/ordersApi.ts` injects all order and redemption endpoints into the shared `baseApi`. Pages consume generated RTK Query hooks, while reusable components receive typed data and callbacks rather than reaching into the store directly where practical.

The list page requests filtered orders and redemptions independently with a five-second polling interval. Because the backend exposes two separate paginated resources but the UI requires one globally ordered table, the mock-backed TASK-02 implementation requests the complete matching fixture sets from both resources, merges them, and applies global sorting and pagination in `OrderTable`. Correct global server-side pagination will require a future unified backend endpoint; the UI boundary is isolated so that replacement does not affect presentation components.

Order identifiers begin with `ord_` and redemption identifiers begin with `red_`. The detail route uses this stable prefix to select the appropriate detail and fill queries without intentionally issuing a request that is expected to fail.

## Data Contracts

The existing `Order`, `Fill`, and lifecycle types remain the central domain model. TASK-02 adds:

- `OrderQueryParams` for `clientId`, `endUserId`, `symbol`, `status`, `fromDate`, `toDate`, `cursor`, and `limit`.
- `PaginatedOrders` with `items`, `nextCursor`, and `totalCount`.
- `LedgerImpact` with `holdAmount`, `settlementAmount`, and `spreadBooked`.
- A detail-query side discriminator derived from the identifier prefix.

Ledger impact is deterministic from the order and fills. Fill cost is the sum of `fill.cost`. `settlementAmount` uses that total. `spreadBooked` is `fillCost * pinnedSpreadBps / 10_000`. `holdAmount` is the order notional when present, otherwise `qty * limitPrice` when a limit price exists, otherwise the fill-cost total.

## Mock Data and Routing

`lib/mocks/orders.json` contains at least 20 BUY orders and five SELL redemptions across Nanovest, Acme Capital, and BlockPrime. It covers every declared lifecycle state, including two `MINT_FAILED` orders, one `BURN_FAILED` redemption, at least one `QUEUED` order, and at least one `PARTIALLY_FILLED` order. Symbols include AAPL, TSLA, MSFT, GOOGL, and SPY. Every record contains state transitions. At least four records contain fills, including one multi-fill partial execution.

`mockBaseQuery` supports:

- Filtered list GET requests for `/orders` and `/redemptions`.
- Dynamic detail GET requests for `/orders/:id` and `/redemptions/:id`.
- Dynamic fill GET requests for `/orders/:id/fills` and `/redemptions/:id/fills`.
- POST mutations for retry mint, retry burn, and cancellation.

Filters combine with AND semantics. Text identifiers use case-insensitive substring matching; client, symbol, and status use exact matching. Date boundaries are inclusive. Unknown IDs and unsupported routes return typed 404 errors.

Mock mutations validate the current state before returning success. They update module-local in-memory state so the current development session reflects the action without writing fixture files. Retry mint changes `MINT_FAILED` to `MINTING`; retry burn changes `BURN_FAILED` back to `FILLED`, the closest declared pre-burn lifecycle state; cancellation changes allowed states to `CANCELLED`. Invalid state transitions return status 409.

## List Page and Filters

`app/orders/page.tsx` is a client page composed from `OrderFilters` and `OrderTable`. Filter state initializes from `useSearchParams()` and updates the URL with `router.replace()`. Empty filters are omitted. Clearing filters resets every control and returns the URL to `/orders`.

The filters are:

- Client: Nanovest, Acme Capital, or BlockPrime, displayed as labels whose values are the exact fixture `clientId` strings.
- End-user: free-text identifier.
- Symbol: AAPL, TSLA, MSFT, GOOGL, or SPY.
- Status: one lifecycle state at a time for the v1 control.
- Inclusive from/to dates.

Both list queries receive the same filters, request up to 100 matching fixture records per resource, and poll every 5,000 milliseconds. Date filtering treats `fromDate` as the start of its calendar day and `toDate` as the end of its calendar day. Their successful results are merged and initially sorted by `createdAt` descending. A query error renders a compact error state; data from one source is not silently presented as a complete combined result when the other source fails.

## Order Table

`OrderTable` uses TanStack Table for core rows, sorting, and client pagination. It renders ID, side, symbol, end-user, client, type, quantity, notional, limit price, state, created, and updated columns.

The default sort is `createdAt` descending. Clicking a sortable heading toggles ascending and descending order. The table supports page sizes 10, 20, and 50, with previous and next controls. Changing filters resets the page index to zero.

BUY uses a blue badge and SELL uses a red badge. Successful states use green, failed or rejected states use red, active states use amber, and expired or cancelled terminal states use neutral gray. Rows are keyboard-focusable and activate `/orders/[id]` by click or Enter. Loading renders table-shaped skeleton rows; no matches render a specific empty message.

## Detail Route and Components

`app/orders/[id]/page.tsx` reads the dynamic identifier and renders an `OrderDetail` container. The container selects order or redemption hooks from the identifier prefix, polls the detail every five seconds, loads fills, and presents loading, not-found, and request-error states.

The detail page contains:

- Header card with all standard and debug fields.
- Vertical `StateTimeline`, ordered oldest to newest, with the latest state highlighted and failed states shown in red.
- `FillsTable` with ID, quantity, price, cost, timestamp, transaction hash, on-chain status, and retry count.
- Ledger-impact card with hold, settlement debit or credit, and spread booked.
- Redemption partition card only when `side === "SELL"`.
- Conditional `ActionButtons`.

Missing optional values render `-`. Fill transaction hashes are displayed in monospace without external links because no block-explorer URL is specified.

## Actions and Feedback

`Retry Mint` appears only for `MINT_FAILED`, `Retry Burn` only for SELL records in `BURN_FAILED`, and `Cancel Order` only for BUY records in `OPEN_EXECUTING`, `QUEUED`, or `PARTIALLY_FILLED`.

Each button opens a shadcn AlertDialog describing the exact action and identifier. Confirming invokes the matching mutation, disables the action while pending, and then renders an inline success or error message. RTK Query invalidates the `Orders` tag so list and detail data refetch immediately.

## Error Handling

- List and detail network errors render readable inline states rather than empty content.
- Unknown identifiers return a not-found view.
- Mutation state conflicts return a specific inline message derived from the 409 mock response.
- One failed source prevents the list from being labeled complete.
- Missing optional prices, notional values, transaction hashes, and IDs render `-`.
- Empty fills render a `No fills recorded` row.

## Testing Strategy

Tests follow red-green-refactor cycles and cover:

- Mock list filtering with combined filters, inclusive dates, and pagination metadata.
- Dynamic detail, fill, mutation-success, mutation-conflict, and 404 mock routes.
- Generated RTK Query endpoint URLs, methods, and invalidation behavior through the real store.
- Filter control changes, URL-ready values, and clearing.
- Table columns, formatting, side and state variants, default ordering, sorting, pagination, loading, empty states, and row activation.
- Timeline ordering, latest-state emphasis, and failed-state styling.
- Fill values, hashes, status, retry counts, and empty state.
- Ledger-impact calculations and SELL-only partition rendering.
- Action visibility, confirmation, pending behavior, success, and error feedback.
- Page-level merged rendering, polling configuration, detail selection by prefix, and not-found behavior.

Final verification requires the complete Vitest suite, ESLint, TypeScript, Next.js production build, and browser checks of filters, sorting, navigation, detail content, conditional actions, and confirmation dialogs.

## Acceptance Criteria

TASK-02 is complete when every acceptance criterion in the source task passes with mock mode enabled: the combined list contains all specified columns and data; sorting, filters, clearing, polling, pagination, row navigation, loading, and empty states work; detail pages show lifecycle, fills, ledger impact, and SELL partition data; conditional actions are correctly gated and confirmed; and automated and browser verification are green.
