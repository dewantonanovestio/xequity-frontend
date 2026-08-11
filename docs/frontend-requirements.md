# xequity-face — Frontend Requirements (Developer Debug Dashboard)

| | |
|---|---|
| **Purpose** | Internal developer tool for debugging, money tracking, ledger tracking, and order tracking |
| **Users** | Small xequity dev team |
| **Auth** | None (deferred) |
| **Data source** | xequity backend REST APIs |
| **Based on** | [PRD](../../xequity/docs/PRD.md), [Flows](../../xequity/docs/flows.md) |

---

## 1. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) — already scaffolded |
| Language | TypeScript |
| Styling | Tailwind CSS 4 — already configured |
| Component library | Shadcn/ui (lightweight, Tailwind-native, easy to read) |
| State / data fetching | Redux Toolkit + RTK Query |
| Tables | TanStack Table (sortable, filterable, human-readable) |
| Real-time | Polling via RTK Query (`pollingInterval`) |
| Environment switching | Env-based backend URL (`NEXT_PUBLIC_API_URL`) with a visible env indicator in the UI |

---

## 2. Views — Priority Order

### 2.1 Order Tracker (P0)

**Purpose:** Single view showing all buy orders and redemptions with full lifecycle visibility.

#### 2.1.1 Order/Redemption List

- **Combined table** of buy orders and redemptions, distinguished by a `side` column (BUY / SELL)
- **Columns:** ID, side, symbol, end-user, client, type (market/limit), qty, notional, limit price, state, created, updated
- **Filters:** client, end-user, symbol, status, date range — all combinable
- **Sorting:** any column, default by `createdAt` descending
- **Polling:** auto-refresh every 5s (configurable)
- **Pagination:** server-side cursor or offset pagination

#### 2.1.2 Order Detail / Drill-down

Clicking a row opens a detail panel or page showing:

- **Order header:** all fields from the list plus `clientIdemKey`, `alpacaOrderId`, `pinnedSpreadBps`, `walletId`
- **State timeline:** visual timeline of all state transitions with timestamps
- **Fills table:** individual Alpaca fill events — fill ID, qty, price, timestamp, cost
- **Mint/burn job status:** for each fill — mint tx hash, on-chain status, retry count
- **Ledger impact:** hold amount, debit/credit amount, spread booked
- **For redemptions:** partition breakdown — `lockedQty`, `burnedQty`, `releasedQty`

#### 2.1.3 Actions

| Action | Applies to | What it does |
|---|---|---|
| **Retry mint** | Orders in `MINT_FAILED` | Triggers backend to re-attempt the on-chain mint |
| **Retry burn** | Redemptions in `BURN_FAILED` | Triggers backend to re-attempt the on-chain burn |
| **Cancel order** | Orders in `OPEN_EXECUTING`, `QUEUED`, `PARTIALLY_FILLED` | Sends cancel to Alpaca via backend |

All actions require a confirmation dialog before execution.

---

### 2.2 Ledger Viewer (P0)

**Purpose:** See money flow across all clients — balances and transaction log.

#### 2.2.1 Balance Summary

- **Table of all clients** with: client name, available balance (USDT), held balance (USDT), total balance
- **Global totals row** at the top
- **Polling:** auto-refresh every 10s

#### 2.2.2 Transaction Log

- **Global transaction log** across all clients, newest first
- **Columns:** timestamp, client, end-user (if applicable), type, amount, running balance, reference/order ID, description
- **Transaction types:** DEPOSIT, WITHDRAWAL, BUY_HOLD, BUY_HOLD_RELEASE, BUY_DEBIT, SELL_CREDIT, DIVIDEND_CREDIT, SPREAD_REVENUE, CONVERSION
- **Filters:** client, transaction type, date range
- **Pagination:** server-side
- **Clicking a transaction** links to the related order (if applicable) in the Order Tracker

---

### 2.3 Reconciliation View (P0)

**Purpose:** At-a-glance view of whether the system is in balance.

#### 2.3.1 Cash Reconciliation

A summary card or table showing:

| Line | Value |
|---|---|
| Total USDT ledger balance (sum of all clients) | from ledger |
| Actual USDT wallet balance on-chain | from chain/backend |
| Delta (should be 0) | computed |
| USD float at Alpaca | from backend |
| Projected float requirement | from backend |
| Last recon run timestamp | from backend |

- **Visual indicator:** green if balanced, red if delta != 0
- **Action:** "Run recon now" button (triggers `POST /admin/recon/cash`)

#### 2.3.2 Supply Reconciliation (per symbol)

Simple table per symbol:

| Column | Source |
|---|---|
| Symbol | backend |
| On-chain total supply | backend |
| Sum of Alpaca sub-account positions | backend |
| Residual (should be 0) | computed |
| Symbol status (ACTIVE / HALTED / etc.) | backend |

- **Visual indicator:** green/red per row based on residual
- **Polling:** auto-refresh every 30s

---

## 3. Layout & Navigation

```
+------------------------------------------+
| xequity-face   [dev ▾]   localhost:3000  |
+--------+---------------------------------+
|        |                                 |
| Orders |   (active view content)         |
| Ledger |                                 |
| Recon  |                                 |
|        |                                 |
+--------+---------------------------------+
```

- **Left sidebar:** 3 nav items (Orders, Ledger, Recon)
- **Top bar:** app name + environment indicator (dev/staging) pulled from `NEXT_PUBLIC_API_URL`
- **No auth, no user menu**
- **Responsive:** desktop-first, no mobile requirement

---

## 4. Environment Configuration

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000

# .env.staging
NEXT_PUBLIC_API_URL=https://staging-api.xequity.internal
```

Env indicator in the top bar shows which backend the dashboard is pointing to.

---

## 5. Backend API Requirements

### 5.1 APIs That Exist (can be consumed now)

| Endpoint | Method | Used by |
|---|---|---|
| `/orders/:id` | GET | Order detail drill-down |
| `/redemptions/:id` | GET | Redemption detail drill-down |
| `/admin/recon/cash/latest` | GET | Recon — cash recon |
| `/admin/recon/cash` | POST | Recon — trigger manual recon |
| `/admin/recon/liquidity` | GET | Recon — fronted liquidity |

### 5.2 APIs That Need to Be Built

#### Order Tracker APIs

| Endpoint | Method | Purpose | Request | Response |
|---|---|---|---|---|
| `GET /orders` | GET | List/filter orders | Query: `clientId`, `endUserId`, `symbol`, `status`, `fromDate`, `toDate`, `cursor`, `limit` | Paginated list of `OrderResponseDto` |
| `GET /redemptions` | GET | List/filter redemptions | Query: same as above | Paginated list of `RedemptionResponseDto` |
| `GET /orders/:id/fills` | GET | Get fills for an order | Path: order ID | Array of `{ fillId, qty, price, cost, filledAt }` |
| `GET /redemptions/:id/fills` | GET | Get fills for a redemption | Path: redemption ID | Array of `{ fillId, qty, proceeds, filledAt }` |
| `POST /orders/:id/retry-mint` | POST | Retry a failed mint | Path: order ID (must be in MINT_FAILED) | Updated `OrderResponseDto` |
| `POST /redemptions/:id/retry-burn` | POST | Retry a failed burn | Path: redemption ID (must be in BURN_FAILED) | Updated `RedemptionResponseDto` |
| `POST /orders/:id/cancel` | POST | Cancel an open/queued order | Path: order ID | Updated `OrderResponseDto` |

#### Ledger APIs

| Endpoint | Method | Purpose | Request | Response |
|---|---|---|---|---|
| `GET /admin/ledger/balances` | GET | All client balances | None | Array of `{ clientId, clientName, available, held, total }` |
| `GET /admin/ledger/transactions` | GET | Global transaction log | Query: `clientId`, `type`, `fromDate`, `toDate`, `cursor`, `limit` | Paginated list of `{ id, timestamp, clientId, clientName, endUserId, type, amount, runningBalance, referenceId, description }` |

#### Reconciliation APIs

| Endpoint | Method | Purpose | Request | Response |
|---|---|---|---|---|
| `GET /admin/recon/supply` | GET | Per-symbol supply recon | None | Array of `{ symbol, onChainSupply, alpacaPositionSum, residual, symbolStatus }` |
| `GET /admin/recon/cash/detail` | GET | Detailed cash recon | None | `{ usdtLedgerTotal, usdtWalletBalance, usdtDelta, usdFloatAtAlpaca, projectedFloatRequirement, lastRunAt }` |

**Total new endpoints needed: 11**

---

## 6. Mock Data Strategy

Until backend APIs are built:

1. Create a `/mocks` directory with static JSON fixtures for each missing endpoint
2. RTK Query base query can be wrapped to intercept missing endpoints and return mock data
3. A `NEXT_PUBLIC_USE_MOCKS=true` env flag toggles mock mode
4. Mock data should cover: multiple clients, various order states (including MINT_FAILED, BURN_FAILED), realistic ledger entries, and a recon with a non-zero delta for testing

---

## 7. Out of Scope (for now)

- Authentication / RBAC
- End-user / client management screens
- Symbol management / kill switches
- Deposit / withdrawal tracker
- Audit log viewer
- CSV/JSON export
- Mobile responsiveness
- Maker-checker UI

These can be added as future phases once the core 3 views are stable.
