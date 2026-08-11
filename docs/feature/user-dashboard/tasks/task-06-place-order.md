# Task 06: Extend ordersApi with placeOrder Mutation

**Status:** pending
**HLD Reference:** Technical Implementation > Trade Page / OrderForm

## Description

Add a `placeOrder` mutation to the existing `ordersApi` slice. This keeps order-related operations in a single RTK Query slice with shared `"Orders"` tag invalidation. Also create trade utility functions.

## Acceptance Criteria

- [ ] `ordersApi` exports `usePlaceOrderMutation` hook
- [ ] Mutation sends `POST /orders` with `PlaceOrderRequest` body
- [ ] All decimal fields (`qty`, `notional`, `limitPrice`, `collarPrice`) sent as strings
- [ ] Mutation invalidates `"Orders"` tag on success
- [ ] `lib/trade/tradeUtils.ts` exports `generateIdemKey()`, `validateTradeForm()`, `buildPlaceOrderRequest()`
- [ ] `generateIdemKey()` calls `crypto.randomUUID()`
- [ ] `validateTradeForm()` enforces: symbol required, qty or notional required (not both), limitPrice required for LIMIT orders

## Dependencies

- **Depends on:** Task 02 (types), Task 04 (mock handler for POST /orders)
- **Blocks:** Task 09 (Trade Page)

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `lib/api/ordersApi.ts` | Modify | Add `placeOrder` mutation endpoint |
| `lib/trade/tradeUtils.ts` | Create | Trade form utilities (UUID gen, validation, request builder) |

## Unit Tests

| Test Class | Purpose |
|------------|---------|
| `lib/trade/__tests__/tradeUtils.test.ts` | Test validation and request building |

- **Positive scenarios:** Valid market order, valid limit order, UUID generation
- **Negative scenarios:** Missing symbol, both qty and notional provided, LIMIT without limitPrice, empty form
- **Mocking strategy:** Pure function tests for tradeUtils; mock baseQuery for mutation test

## Implementation Hints

- **Pattern to follow:** Existing mutations in `ordersApi.ts` (retryMint, cancelOrder) for the mutation pattern
- **Key considerations:**
  - `PlaceOrderRequest` must match backend `PlaceOrderDto`: string decimals, enum values
  - `side` is always "BUY" for v1
  - `clientIdemKey` is generated per submission, not per render
  - Add `placeOrder` endpoint inside existing `ordersApi.injectEndpoints()` call

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-08-04 | Initial task created |
