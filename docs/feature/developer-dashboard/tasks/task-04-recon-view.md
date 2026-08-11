# TASK-04: Reconciliation View

| | |
|---|---|
| **ID** | TASK-04 |
| **Status** | Complete |
| **Size** | M (1-2 days) |
| **Dependencies** | TASK-01 |
| **Blocks** | None |
| **HLD Reference** | Sections 5.4, 6.3, 7, 10 |

---

## Background

The Reconciliation View provides at-a-glance verification that the xequity system is in balance — both on the cash side (USDT ledger vs. on-chain wallet) and the supply side (on-chain token supply vs. Alpaca positions per symbol).

Two of the four backend endpoints exist today: `GET /admin/recon/cash/latest` and `POST /admin/recon/cash`. The detailed cash recon endpoint (`GET /admin/recon/cash/detail`) and the supply recon endpoint (`GET /admin/recon/supply`) are not yet built and will be mocked.

This is the simplest of the three feature views — no drill-down, no complex tables, primarily display cards and a small table.

---

## Description

### 1. RTK Query Endpoints

Create `lib/api/reconApi.ts` injecting endpoints into `baseApi`:

**Query endpoints:**
- `getCashRecon` — `GET /admin/recon/cash/detail`. Returns `CashRecon` object. Polling: 30s.
- `getSupplyRecon` — `GET /admin/recon/supply`. Returns array of `SupplyRecon`. Polling: 30s.

**Mutation endpoints:**
- `runCashRecon` — `POST /admin/recon/cash`. Triggers a manual recon run. Invalidates the `Recon` tag to refetch data.

### 2. Mock Data

Populate `lib/mocks/recon.json` with:

**Cash Recon:**
```json
{
  "usdtLedgerTotal": 80700.00,
  "usdtWalletBalance": 80700.00,
  "usdtDelta": 0,
  "usdFloatAtAlpaca": 45000.00,
  "projectedFloatRequirement": 42000.00,
  "lastRunAt": "2026-08-03T14:30:00Z"
}
```

Also include a second mock scenario (togglable or as a comment) with a non-zero delta for testing the red indicator:
```json
{
  "usdtLedgerTotal": 80700.00,
  "usdtWalletBalance": 80650.00,
  "usdtDelta": -50.00,
  ...
}
```

**Supply Recon:**
- 5 symbols: AAPL, TSLA, MSFT, GOOGL, SPY
- Most with residual = 0 (balanced)
- One symbol (e.g., TSLA) with a small non-zero residual for testing red indicator
- Various statuses: most `ACTIVE`, one `MINT_HALTED`

Update `lib/mocks/mockBaseQuery.ts` to handle recon endpoint patterns.

### 3. Recon Page (`app/recon/page.tsx`)

A client component that renders two sections stacked vertically:

1. **Cash Reconciliation** card at the top
2. **Supply Reconciliation** table below

### 4. CashRecon Component

A shadcn Card displaying the cash recon summary as a structured layout:

| Line | Value | Source |
|------|-------|--------|
| USDT Ledger Total | $80,700.00 | Computed from all client balances |
| USDT Wallet Balance | $80,700.00 | On-chain wallet balance |
| **Delta** | **$0.00** | Difference (ledger - wallet) |
| USD Float at Alpaca | $45,000.00 | Alpaca omnibus balance |
| Projected Float Requirement | $42,000.00 | Estimated upcoming need |
| Last Recon Run | Aug 3, 2026 2:30 PM | Backend recon timestamp |

Visual indicators:
- **Delta row**: green background/text if delta === 0, red background/text if delta !== 0
- Delta value shows the signed amount (e.g., "-$50.00")
- A large colored dot or icon next to the delta for quick scanning

**"Run Recon Now" button:**
- Below the card
- Calls `runCashRecon` mutation on click
- Shows a brief confirmation dialog ("This will trigger a full cash reconciliation run. Continue?")
- Shows loading spinner during the mutation
- On success, the 30s polling picks up the updated data (or the tag invalidation refetches immediately)

### 5. SupplyRecon Component

A table showing per-symbol supply reconciliation:

| Symbol | On-Chain Supply | Alpaca Positions | Residual | Status |
|--------|----------------|-----------------|----------|--------|
| AAPL | 1,234.567890 | 1,234.567890 | 0.000000 | ACTIVE |
| TSLA | 567.123456 | 567.123400 | 0.000056 | MINT_HALTED |
| MSFT | 890.000000 | 890.000000 | 0.000000 | ACTIVE |
| GOOGL | 234.500000 | 234.500000 | 0.000000 | ACTIVE |
| SPY | 2,100.000000 | 2,100.000000 | 0.000000 | ACTIVE |

Visual indicators per row:
- **Residual column**: green text if residual === 0, red text if residual !== 0
- **Row-level indicator**: a green/red dot in the first column (or left border) for quick scanning
- **Status column**: badge with color — green for `ACTIVE`, red for `HALTED`, yellow for `MINT_HALTED` / `REDEEM_HALTED`, gray for `RETIRED`

Features:
- Polls every 30s
- Loading skeleton
- No pagination needed (symbol count is small, 20-50 max)
- No sorting needed (static list)

---

## Acceptance Criteria

- [x] Recon page renders both cash recon card and supply recon table
- [x] Cash recon card shows all 6 fields with correctly formatted values
- [x] Delta indicator is green when delta is 0
- [x] Delta indicator is red when delta is non-zero
- [x] Delta value shows the signed amount (e.g., "-$50.00")
- [x] "Run Recon Now" button shows confirmation dialog before executing
- [x] "Run Recon Now" button shows loading state during mutation
- [x] Supply recon table shows all symbols with correct columns
- [x] Residual column is green for zero, red for non-zero
- [x] Status badges are color-coded (green=ACTIVE, red=HALTED, yellow=MINT_HALTED, gray=RETIRED)
- [x] Both sections auto-refresh every 30 seconds
- [x] Loading skeletons show while data is fetching
- [x] All data renders correctly in mock mode

---

## Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `lib/api/reconApi.ts` | RTK Query endpoints for recon |
| Modify | `lib/mocks/recon.json` | Populate with realistic mock data |
| Modify | `lib/mocks/mockBaseQuery.ts` | Add recon endpoint handlers |
| Create | `app/recon/page.tsx` | Reconciliation view page |
| Create | `components/recon/CashRecon.tsx` | Cash reconciliation summary card |
| Create | `components/recon/SupplyRecon.tsx` | Per-symbol supply recon table |

---

## Unit Test Plan

| Test | What it verifies |
|------|-----------------|
| CashRecon renders all 6 fields | All data points displayed |
| CashRecon shows green indicator when delta is 0 | Correct visual for balanced state |
| CashRecon shows red indicator when delta is non-zero | Correct visual for unbalanced state |
| CashRecon formats currency values correctly | Formatting |
| CashRecon formats timestamp correctly | Date formatting |
| CashRecon "Run Recon Now" opens confirmation dialog | Button behavior |
| SupplyRecon renders all symbol rows | Table completeness |
| SupplyRecon shows green for zero residual | Row-level indicator |
| SupplyRecon shows red for non-zero residual | Row-level indicator |
| SupplyRecon status badges have correct colors | Badge color mapping |
| SupplyRecon formats supply numbers correctly | Number formatting |

---

## Implementation Hints

1. **Cash recon layout**: Use shadcn's `Card` with `CardHeader` and `CardContent`. Inside, use a definition list (`dl/dt/dd`) or a simple two-column grid for the key-value pairs. The delta row should stand out visually — consider a larger font size or a colored background strip.

2. **Delta indicator logic**: A single utility function:
   ```typescript
   const getDeltaStyle = (delta: number) => ({
     className: delta === 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50',
     icon: delta === 0 ? 'check-circle' : 'alert-triangle',
   });
   ```

3. **Supply recon table**: This is a small, simple table — a plain shadcn `Table` component is sufficient. No need for TanStack Table since there is no sorting, filtering, or pagination. If the symbol count grows beyond 50 in the future, TanStack Table can be added then.

4. **Existing vs. mocked endpoints**: The existing `GET /admin/recon/cash/latest` may return a different shape than the designed `CashRecon` type. If the team wants to use the existing endpoint now:
   - Map the existing response shape to the `CashRecon` type in the RTK Query `transformResponse`
   - Fill in missing fields (like `projectedFloatRequirement`) with placeholder values
   - Switch to the full `GET /admin/recon/cash/detail` endpoint when the backend ships it

5. **Run recon mutation in mock mode**: In mock mode, the `runCashRecon` mutation should return `{ data: { success: true } }` without side effects. The invalidation of the `Recon` tag will cause a refetch of the mock data, which simulates the UX correctly.

6. **Polling interval**: 30s is conservative. Both the cash and supply recon sections use the same interval. The backend recon job runs every 15 minutes, so polling more frequently than 30s would not yield new data — but it keeps the UI feeling responsive in case a manual recon was triggered.
