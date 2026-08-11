# Task 09: Trade Page + OrderForm Components

**Status:** pending
**HLD Reference:** Technical Implementation > Trade Page / OrderForm; System Architecture > Data Flow - Order Placement

## Description

Build the trade page with a full order placement form. Supports market/limit orders, qty/notional toggle, TIF selector, and collar price. Auto-derives clientId/walletId from selected end-user. Auto-generates clientIdemKey on submit.

## Acceptance Criteria

- [ ] Trade page follows Suspense + Content + Fallback pattern
- [ ] Shows "Select an end-user" prompt when no user selected
- [ ] SymbolSelect populated from `useGetSymbolsQuery()`
- [ ] OrderTypeToggle switches between MARKET and LIMIT
- [ ] QtyNotionalToggle switches input mode between quantity and dollar amount
- [ ] TifSelect shows DAY, GTC, IOC, FOK options
- [ ] CollarPriceInput visible only for LIMIT orders
- [ ] LimitPrice input visible only for LIMIT orders
- [ ] Submit button disabled when required fields empty
- [ ] Submit generates clientIdemKey and calls placeOrder mutation
- [ ] Success shows feedback message
- [ ] Error shows error message from API response
- [ ] All decimal values sent as strings to match backend DTO

## Dependencies

- **Depends on:** Task 06 (placeOrder mutation), Task 07 (Sidebar/RoleSwitcher)
- **Blocks:** Task 13 (Tests)

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `app/(user)/trade/page.tsx` | Modify | Replace placeholder with real trade page |
| `components/trade/OrderForm.tsx` | Create | Main order form orchestrator |
| `components/trade/SymbolSelect.tsx` | Create | Symbol picker select |
| `components/trade/OrderTypeToggle.tsx` | Create | Market/Limit tabs |
| `components/trade/QtyNotionalToggle.tsx` | Create | Qty vs notional input |
| `components/trade/TifSelect.tsx` | Create | Time-in-force selector |
| `components/trade/CollarPriceInput.tsx` | Create | Collar/limit price input |

## Unit Tests

| Test Class | Purpose |
|------------|---------|
| `components/trade/__tests__/OrderForm.test.tsx` | Test form rendering, field visibility, submission |

- **Positive scenarios:** Fill and submit market order, fill and submit limit order, toggle qty/notional
- **Negative scenarios:** Submit with missing fields, submit with no user selected, API error response
- **Mocking strategy:** Mock Redux store (selectedEndUser), mock `usePlaceOrderMutation`, mock `useGetSymbolsQuery`

## Implementation Hints

- **Pattern to follow:** `components/orders/ActionButtons.tsx` for mutation pattern with feedback; `components/orders/OrderFilters.tsx` for Select/Input patterns
- **Key considerations:**
  - Use shadcn `Card` as the form container, `Tabs` for market/limit toggle
  - Form state with `useState` (no form library needed for v1)
  - `crypto.randomUUID()` called only on submit, not in render
  - Side is hardcoded to "BUY" for v1
  - Decimal values converted to strings before submission: `qty.toString()`, etc.
  - Consider showing indicative price from pricing API for the selected symbol

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-08-04 | Initial task created |
