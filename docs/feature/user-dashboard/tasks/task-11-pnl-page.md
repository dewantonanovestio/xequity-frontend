# Task 11: P&L Page + PnlSummary + PnlTable

**Status:** pending
**HLD Reference:** Technical Implementation > P&L View

## Description

Build the P&L page showing realized and unrealized P&L per position. All data is mock for v1. Display summary cards and a per-symbol breakdown table.

## Acceptance Criteria

- [ ] P&L page follows Suspense + Content + Fallback pattern
- [ ] Shows "Select an end-user" prompt when no user selected
- [ ] PnlSummary renders 3 cards: Total Realized, Total Unrealized, Total P&L
- [ ] PnlTable renders per-symbol rows with: Symbol, Realized P&L, Unrealized P&L, Total P&L
- [ ] Positive values styled green, negative styled red
- [ ] Loading skeleton while data fetches
- [ ] Empty state when no P&L data available

## Dependencies

- **Depends on:** Task 05 (pnlApi), Task 07 (Sidebar/RoleSwitcher)
- **Blocks:** Task 13 (Tests)

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `app/(user)/pnl/page.tsx` | Modify | Replace placeholder with real P&L page |
| `components/pnl/PnlSummary.tsx` | Create | Aggregate P&L cards |
| `components/pnl/PnlTable.tsx` | Create | Per-position P&L table |

## Unit Tests

| Test Class | Purpose |
|------------|---------|
| `components/pnl/__tests__/PnlTable.test.tsx` | Test rendering and value display |

- **Positive scenarios:** Renders cards with totals, table with per-symbol entries, correct styling for positive/negative
- **Negative scenarios:** Empty P&L data, no user selected, loading state
- **Mocking strategy:** Mock `useGetPnlQuery`, mock Redux store

## Implementation Hints

- **Pattern to follow:** `components/recon/CashRecon.tsx` for card-based summary layout; `components/ledger/BalanceSummary.tsx` for balance cards
- **Key considerations:**
  - All data is mock -- focus on UI layout and data shape
  - Use shadcn `Card` for summary cards, `Table` for breakdown
  - Color-coding: use `text-emerald-600` for positive, `text-destructive` for negative (matching existing pattern)

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-08-04 | Initial task created |
