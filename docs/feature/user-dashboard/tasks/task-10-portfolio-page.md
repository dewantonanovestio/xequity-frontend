# Task 10: Portfolio Page + HoldingsTable with Live Pricing

**Status:** pending
**HLD Reference:** Technical Implementation > Portfolio / HoldingsTable; System Architecture > Data Flow - Portfolio with Live Pricing

## Description

Build the portfolio page showing user holdings with live prices from the real pricing API. Compute market value and unrealized P&L client-side. Prices poll every 10 seconds.

## Acceptance Criteria

- [ ] Portfolio page follows Suspense + Content + Fallback pattern
- [ ] Shows "Select an end-user" prompt when no user selected
- [ ] Holdings fetched via `useGetHoldingsQuery(endUserId)` with skip when no user
- [ ] For each symbol, `useGetPricingQuery({ symbol, clientId })` polls every 10 seconds
- [ ] Table columns: Symbol, Qty, Avg Cost, Current Price, Market Value, Unrealized P&L
- [ ] Market Value = qty * currentPrice
- [ ] Unrealized P&L = (currentPrice - avgCost) * qty
- [ ] Positive P&L styled green, negative styled red
- [ ] Summary row at bottom with total market value and total unrealized P&L
- [ ] Loading skeleton while data fetches
- [ ] Max 5 symbols polled concurrently

## Dependencies

- **Depends on:** Task 05 (portfolioApi), Task 07 (Sidebar/RoleSwitcher)
- **Blocks:** Task 13 (Tests)

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `app/(user)/portfolio/page.tsx` | Modify | Replace placeholder with real portfolio page |
| `components/portfolio/HoldingsTable.tsx` | Create | Holdings grid with live prices |

## Unit Tests

| Test Class | Purpose |
|------------|---------|
| `components/portfolio/__tests__/HoldingsTable.test.tsx` | Test rendering with mock data, P&L computation |

- **Positive scenarios:** Renders holdings, computes values correctly, shows summary totals
- **Negative scenarios:** Empty holdings, pricing API error (show "N/A"), no user selected
- **Mocking strategy:** Mock `useGetHoldingsQuery`, mock `useGetPricingQuery`, mock Redux store

## Implementation Hints

- **Pattern to follow:** `components/orders/OrderTable.tsx` for table structure; `app/orders/page.tsx` for page pattern
- **Key considerations:**
  - `clientId` for pricing comes from `selectedEndUser.clientId` in Redux
  - Price adapter converts string decimals to numbers
  - Use `sellPrice` from pricing response for portfolio valuation (the price user would receive)
  - Skip pricing queries when holdings are still loading
  - Use shadcn `Table`, `Card`, `Skeleton`, `Badge` components

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-08-04 | Initial task created |
