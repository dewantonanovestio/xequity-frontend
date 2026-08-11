# TASK-02: Order Management View (Client POV)

| | |
|---|---|
| **ID** | TASK-02 |
| **Status** | Complete |
| **Size** | L (3-4 days) |
| **Dependencies** | TASK-01 |
| **Blocks** | None |
| **HLD Reference** | Sections 5.2, 6.1, 7, 10 |

---

## Background

The Order Management view is the primary interface for a **client** (a B2B corporate customer) to operate on the xequity platform. Clients trade on behalf of their registered end-users — they never trade for themselves.

Key client capabilities:
- Submit buy/sell orders for a specific end-user (identified by `external_id`)
- See an indicative all-in price (including their configured spread) before confirming
- Track their USDT balance and per-end-user positions
- View full order history and transaction log

The backend exposes `GET /orders/:id` and `GET /redemptions/:id` today. List endpoints, fills endpoints, quote endpoint, and action endpoints (retry mint, retry burn, cancel) are not yet built. All missing endpoints are mocked.

---

## Description

### 1. RTK Query Endpoints

Create `lib/api/ordersApi.ts` injecting endpoints into `baseApi`:

**Query endpoints:**
- `getClientBalance` — `GET /client/wallet/balance`. Returns `{ available: number, held: number, total: number, currency: 'USDT' }`. Polling: 10s.
- `getEndUsers` — `GET /client/end-users`. Returns paginated list of registered end-users with `externalId`, `alpacaAccountId`, `status`, `createdAt`.
- `getUserPositions` — `GET /client/end-users/:externalId/positions`. Returns array of `{ symbol, qty, marketValue, avgCost }`. Polling: 30s.
- `getIndicativePrice` — `GET /client/quotes?symbol=&side=&qty=&notional=`. Returns `{ symbol, side, indicativePrice, spreadBps, grossPrice, spreadAmount, qty, notional, sessionType, validUntil }`. No polling — triggered on demand.
- `getOrders` — `GET /orders` with query params: `externalId`, `symbol`, `status`, `fromDate`, `toDate`, `cursor`, `limit`. Returns paginated list. Polling: 5s.
- `getOrder` — `GET /orders/:id`. Returns single order with `stateTransitions`. Polling: 5s.
- `getOrderFills` — `GET /orders/:id/fills`. Returns array of fills.
- `getRedemptions` — `GET /redemptions` with same query params. Returns paginated list. Polling: 5s.
- `getRedemption` — `GET /redemptions/:id`. Returns single redemption with `stateTransitions`.
- `getRedemptionFills` — `GET /redemptions/:id/fills`. Returns array of fills.

**Mutation endpoints:**
- `submitOrder` — `POST /orders`. Body: `{ externalId, walletAddress, symbol, side, type, qty?, notional?, limitPrice?, clientIdemKey }`. Invalidates `Orders` tag.
- `retryMint` — `POST /orders/:id/retry-mint`. Invalidates `Orders` tag.
- `retryBurn` — `POST /redemptions/:id/retry-burn`. Invalidates `Orders` tag.
- `cancelOrder` — `POST /orders/:id/cancel`. Invalidates `Orders` tag.

### 2. Mock Data

Populate `lib/mocks/orders.json` with realistic mock data:

- **Client balance**: `available: 125000`, `held: 12500`, `total: 137500`, `currency: 'USDT'`
- **End-users**: At least 5 registered end-users with distinct `externalId` values (e.g., `usr_acme_001`, `usr_acme_002`), covering `ACTIVE` and `PENDING` statuses
- **Positions**: Position data for 2-3 end-users, each holding 2-3 symbols
- **Indicative price**: Mock responses for BUY/SELL quotes on AAPL, TSLA, MSFT (spread ~25bps)
- **Orders**: At least 20 orders across 5 end-users, covering all order states
- **Redemptions**: At least 5 redemptions with various states including `BURN_FAILED`
- At least 2 orders in `MINT_FAILED` state (for testing retry action)
- At least 1 order in `QUEUED` state, 1 in `PARTIALLY_FILLED`
- Fill data for 3-4 orders (including one with multiple partial fills)
- State transitions for all orders (for timeline rendering)
- Realistic symbols: AAPL, TSLA, MSFT, GOOGL, SPY

Update `lib/mocks/mockBaseQuery.ts` to handle all order-related URL patterns.

### 3. Page Layout (`app/orders/page.tsx`)

The orders page is split into two main areas:

**Left / top area** — client dashboard panel:
- `ClientBalanceCard` — shows current USDT balance
- `PlaceOrderForm` — order submission form with quote preview

**Main area** — order history:
- `OrderFilters` above `OrderTable`
- Combined orders + redemptions list

### 4. ClientBalanceCard Component

A card at the top of the page showing:
- **Available**: USDT available for new orders
- **Held**: USDT locked in open holds
- **Total**: sum of available + held
- Polls every 10s via `useGetClientBalanceQuery`
- Shows loading skeleton while fetching

### 5. PlaceOrderForm Component

A form panel (card or sheet) that lets the client submit a new order. Fields:

| Field | Control | Notes |
|-------|---------|-------|
| End-User | `<Select>` or searchable combobox | Populated from `useGetEndUsersQuery`; displays `externalId`. Only `ACTIVE` end-users. |
| Wallet Address | `<Select>` | Dropdown of the client's registered wallet addresses |
| Symbol | `<Select>` | AAPL, TSLA, MSFT, GOOGL, SPY |
| Side | Radio or `<Select>` | BUY / SELL |
| Order Type | Radio | MARKET (regular session only) / LIMIT (any session, 24/5) |
| Qty or Notional | Toggle + `<Input>` | Client picks "By Shares" (qty) or "By USD" (notional); mutually exclusive |
| Limit Price | `<Input>` | Shown only when Order Type = LIMIT |

**Quote Preview (inline):**

When the form has enough data (symbol, side, qty or notional filled in), a "Get Quote" button becomes active. On click:
1. Calls `useGetIndicativePriceQuery` with current form values
2. Renders a `PriceQuote` card below the form fields showing:
   - **Indicative Price** (all-in, including spread)
   - **Gross Price** (pre-spread market price)
   - **Spread Amount** (in USDT)
   - **Spread** (in bps)
   - **Estimated Total Cost** (indicativePrice × qty or notional)
   - **Session** (REGULAR / EXTENDED)
   - **Valid Until** (quote expiry timestamp)
3. Quote refreshes automatically when form values change (debounced 500ms)

**Submission flow:**
1. Client fills form → clicks "Get Quote" (or quote auto-fetches)
2. Reviews `PriceQuote` card
3. Clicks "Place Order" (disabled until a valid quote is shown)
4. `AlertDialog` confirmation shows order summary (end-user, symbol, qty/notional, indicative price, total cost)
5. On confirm, calls `submitOrder` mutation with a generated `clientIdemKey`
6. Shows success toast with new order ID, or error message if submission fails
7. On success, invalidates order list and clears form

### 6. EndUserPositions Panel (`app/positions/page.tsx` or tab)

A sub-page or tab showing per-end-user positions:

- `EndUserSelector` — `<Select>` to choose an end-user by `externalId`
- `PositionsTable` — TanStack Table with columns: Symbol, Qty, Avg Cost, Market Value
- "No positions" empty state when end-user has no holdings
- Polls every 30s via `useGetUserPositionsQuery(externalId)`

### 7. OrderFilters Component

Filter controls rendered in a horizontal bar above the order table:

- **End-User** — `<Select>` dropdown populated from end-users list (by `externalId`)
- **Symbol** — `<Select>` dropdown (AAPL, TSLA, MSFT, etc.)
- **Status** — `<Select>` for order states (single or multi-select)
- **Date Range** — two date `<Input type="date">` fields (from, to)
- **Clear Filters** button

All filters are optional and combinable. Filter values are synced to URL search params.

> Note: No "Client" filter — the view is scoped to a single client's context.

### 8. OrderTable Component

TanStack Table with columns:

- ID (truncated, monospace)
- Side (BUY badge in blue, SELL badge in red)
- Symbol
- End-User (`externalId`)
- Type (MARKET / LIMIT)
- Qty (formatted)
- Notional (formatted as currency, or "-" if null)
- Limit Price (formatted as currency, or "-" if null)
- State (colored badge — see color mapping below)
- Created (formatted date)
- Updated (formatted date)

Features:
- Column sorting (click header to sort; default: createdAt desc)
- Row click navigates to `/orders/[id]`
- Pagination controls at bottom (page size selector, prev/next)
- Loading skeleton while data is fetching
- Empty state message when no results match filters

### 9. Order Detail Page (`app/orders/[id]/page.tsx`)

Fetches order by ID using `useGetOrderQuery(id)` and fills using `useGetOrderFillsQuery(id)`. Renders:

**Order Header** — card showing all order fields:
- ID, side, symbol, end-user (`externalId`), type, qty, notional, limit price, state
- `clientIdemKey`, `alpacaOrderId`, `pinnedSpreadBps`, `walletAddress`
- Created, updated timestamps

**StateTimeline Component** — vertical timeline of `stateTransitions`:
- Each node: state name + timestamp
- Current/latest state highlighted
- Failed states in red

**FillsTable Component** — sub-table of fills:
- Columns: Fill ID, Qty, Price, Cost, Timestamp
- For each fill: mint/burn tx hash (linked?), on-chain status badge, retry count
- Simple TanStack Table, no pagination needed

**Ledger Impact Section** — summary of financial impact:
- Hold amount
- Debit/credit amount
- Spread booked (derived from `pinnedSpreadBps` and fill cost)

**Redemption Partition** (shown only when `side === 'SELL'`):
- `lockedQty`, `burnedQty`, `releasedQty` displayed in a simple card

**ActionButtons Component** — conditional buttons:
- "Retry Mint" — visible when state is `MINT_FAILED`. Triggers `retryMint` mutation after AlertDialog confirmation.
- "Retry Burn" — visible when state is `BURN_FAILED`. Triggers `retryBurn` mutation after AlertDialog confirmation.
- "Cancel Order" — visible when state is `OPEN_EXECUTING`, `QUEUED`, or `PARTIALLY_FILLED`. Triggers `cancelOrder` mutation after AlertDialog confirmation.

Each action button:
1. Opens a shadcn `AlertDialog` with a description of what will happen
2. On confirm, calls the mutation
3. Shows loading state during mutation
4. Shows success/error toast after completion

---

## Acceptance Criteria

- [ ] Client balance card shows available, held, and total USDT (polling 10s)
- [ ] Place Order form renders all fields: end-user, wallet address, symbol, side, type, qty/notional toggle, limit price (conditional)
- [ ] End-user dropdown populates from `useGetEndUsersQuery`, shows only ACTIVE users by `externalId`
- [ ] Get Quote button fetches indicative price and renders PriceQuote card (indicative price, gross price, spread bps/amount, estimated total, session, valid until)
- [ ] Quote auto-refreshes (debounced 500ms) when form values change
- [ ] Place Order button is disabled until a valid quote is shown
- [ ] Confirmation dialog shows full order summary before submission
- [ ] On successful submission, order list refreshes and form clears
- [ ] Error from submission shows inline error or toast
- [ ] End-user positions panel shows positions table per selected end-user
- [ ] Order list page renders a combined table of orders and redemptions
- [ ] All order table columns are present and correctly formatted (currency, dates, badges)
- [ ] Column sorting works (click header toggles asc/desc)
- [ ] All filters work: end-user, symbol, status, date range
- [ ] Clear filters button resets all filters
- [ ] Table auto-refreshes every 5 seconds
- [ ] Clicking a row navigates to `/orders/[id]`
- [ ] Order detail page shows all order header fields including `externalId` and `walletAddress`
- [ ] State timeline renders all transitions with timestamps
- [ ] Fills table shows fill data with mint/burn status
- [ ] Redemption partition section appears only for SELL orders
- [ ] "Retry Mint" button appears only for `MINT_FAILED` orders
- [ ] "Retry Burn" button appears only for `BURN_FAILED` redemptions
- [ ] "Cancel Order" button appears only for `OPEN_EXECUTING`, `QUEUED`, `PARTIALLY_FILLED` orders
- [ ] All action buttons show confirmation dialog before executing
- [ ] Loading skeletons show while data is fetching
- [ ] Empty state shows when no orders match filters
- [ ] All data renders correctly in mock mode (`NEXT_PUBLIC_USE_MOCKS=true`)

---

## Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `lib/api/ordersApi.ts` | RTK Query endpoints for orders, redemptions, quotes, end-users, balance |
| Modify | `lib/mocks/orders.json` | Populate with realistic mock data (balance, end-users, positions, quotes, orders) |
| Modify | `lib/mocks/mockBaseQuery.ts` | Add order, quote, end-user, and balance endpoint handlers |
| Create | `lib/types/order.ts` | Order, Redemption, Fill, EndUser, Quote, Position types |
| Create | `app/orders/page.tsx` | Order management page (balance + place order + order list) |
| Create | `app/orders/[id]/page.tsx` | Order detail drill-down page |
| Create | `app/positions/page.tsx` | Per-end-user positions page |
| Create | `components/orders/ClientBalanceCard.tsx` | USDT balance display card |
| Create | `components/orders/PlaceOrderForm.tsx` | Order submission form with quote preview |
| Create | `components/orders/PriceQuote.tsx` | Indicative price breakdown card |
| Create | `components/orders/OrderTable.tsx` | Combined order/redemption table |
| Create | `components/orders/OrderFilters.tsx` | Filter bar component |
| Create | `components/orders/OrderDetail.tsx` | Order detail panel |
| Create | `components/orders/FillsTable.tsx` | Fills sub-table |
| Create | `components/orders/StateTimeline.tsx` | Visual state transition timeline |
| Create | `components/orders/ActionButtons.tsx` | Retry/cancel action buttons with dialogs |
| Create | `components/positions/EndUserPositions.tsx` | Per-end-user positions table |

---

## Data Types

```typescript
// lib/types/order.ts — additions beyond existing Order/Fill types

interface EndUser {
  externalId: string;
  alpacaAccountId: string | null;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

interface ClientBalance {
  available: number;
  held: number;
  total: number;
  currency: 'USDT';
}

interface PriceQuote {
  symbol: string;
  side: 'BUY' | 'SELL';
  indicativePrice: number;   // all-in price per share (includes spread)
  grossPrice: number;        // raw market price before spread
  spreadBps: number;         // configured spread in basis points
  spreadAmount: number;      // spread in USDT per share
  qty: number | null;
  notional: number | null;
  estimatedTotal: number;    // indicativePrice × qty or notional
  sessionType: 'REGULAR' | 'EXTENDED';
  validUntil: string;        // ISO timestamp
}

interface Position {
  symbol: string;
  qty: number;
  avgCost: number;
  marketValue: number;
}

interface SubmitOrderRequest {
  externalId: string;
  walletAddress: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  qty?: number;
  notional?: number;
  limitPrice?: number;
  clientIdemKey: string;
}
```

---

## Unit Test Plan

| Test | What it verifies |
|------|-----------------|
| ClientBalanceCard renders available/held/total | Balance display |
| PlaceOrderForm shows limit price field only when type=LIMIT | Conditional field rendering |
| PlaceOrderForm disables Place Order button without a quote | Button state gating |
| PriceQuote renders all price breakdown fields | Quote display |
| PlaceOrderForm calls submitOrder with correct payload on confirm | Mutation dispatch |
| EndUser dropdown only shows ACTIVE users | Status filtering |
| OrderTable renders rows from mock data | Table display |
| OrderTable sorts by column on header click | Sorting |
| OrderFilters calls onChange with correct filter values | Filter state |
| OrderFilters clear button resets all filters | Clear functionality |
| StateTimeline renders all transitions | Timeline display |
| StateTimeline highlights failed states in red | Visual state |
| FillsTable renders fill rows with correct columns | Fill data |
| ActionButtons shows "Retry Mint" only for MINT_FAILED | Conditional rendering |
| ActionButtons shows "Cancel" only for cancellable states | Conditional rendering |
| ActionButtons opens confirmation dialog on click | Dialog behavior |
| Order detail page renders all sections | Full detail rendering |
| Side badge shows BUY in blue, SELL in red | Visual differentiation |
| Status badge colors match state categories | Badge coloring |

---

## Implementation Hints

1. **End-user selector**: Use a searchable combobox (shadcn `Command` inside a `Popover`) for the end-user field so clients can type-search by `externalId` when they have many users. Fall back to a plain `<Select>` if the list is small.

2. **Qty vs Notional toggle**: Render a toggle group ("By Shares" / "By USD") that swaps the input label and clears the other value. Whichever is filled gets sent to the quote endpoint and order submission. Send only one of `qty` or `notional` in the request — never both.

3. **Quote gating**: Track quote validity. If `validUntil` has passed (or form values changed after last quote fetch), mark the quote as stale. Disable "Place Order" and show "Quote expired — refresh" when stale.

4. **`clientIdemKey` generation**: Generate a UUID (`crypto.randomUUID()`) at form submission time and attach it to the request. If the user clicks confirm twice quickly, the backend deduplicates by `clientIdemKey`.

5. **Merging orders and redemptions**: The list page calls both `useGetOrdersQuery` and `useGetRedemptionsQuery`, merges results into a single array sorted by `createdAt` desc. Orders have `side: 'BUY'`, redemptions have `side: 'SELL'`.

6. **State badge colors**: Create `getStateBadgeVariant(state: OrderState)`:
   - Green: `SETTLED`, `FILLED`
   - Red: `MINT_FAILED`, `BURN_FAILED`, `REJECTED`, `CANCELLED`
   - Yellow/amber: `SUBMITTED`, `VALIDATED`, `QUEUED`, `OPEN_EXECUTING`, `PARTIALLY_FILLED`, `MINTING`
   - Gray: `EXPIRED`

7. **URL search params for filters**: Use `useSearchParams()` from `next/navigation` to read initial filter values. On filter change, update via `router.replace()`. Makes filter state shareable.

8. **Detail page routing**: The detail page at `app/orders/[id]/page.tsx` receives `params.id`. Use distinguishable ID prefixes in mock data (`ord_` and `red_`) and try order first, fall back to redemption if 404.

9. **Wallet address list**: For now, mock a static list of 2-3 wallet addresses per client. In production this will come from `GET /client/wallets`.
