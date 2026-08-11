# Task 04: Extend mockBaseQuery with New Handlers

**Status:** pending
**HLD Reference:** Technical Implementation > Mock/Real routing strategy

## Description

Add mock route handlers for all new endpoints to the existing `mockBaseQuery.ts`. This includes GET routes for end-users, symbols, portfolio, P&L, pricing, and a POST handler for order creation.

## Acceptance Criteria

- [ ] `GET /end-users` returns end-user list from fixture
- [ ] `GET /symbols` returns symbols list from fixture
- [ ] `GET /portfolio/:endUserId` returns holdings for the specified user
- [ ] `GET /pnl/:endUserId` returns P&L for the specified user
- [ ] `GET /pricing/:symbol` returns mock pricing data (with small random variation for realism)
- [ ] `POST /orders` returns a mock order response with state "SUBMITTED" and a generated UUID id
- [ ] Unknown routes still return 404
- [ ] Existing mock routes still work

## Dependencies

- **Depends on:** Task 03 (fixtures created)
- **Blocks:** Tasks 05, 06

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `lib/mocks/mockBaseQuery.ts` | Modify | Add new static and dynamic route handlers |

## Unit Tests

| Test Class | Purpose |
|------------|---------|
| `lib/mocks/__tests__/mockBaseQuery.test.ts` | Test new mock routes return expected data |

- **Positive scenarios:** Each new route returns correct data shape
- **Negative scenarios:** Unknown endUserId returns empty array, unknown symbol returns 404
- **Mocking strategy:** No additional mocks -- mockBaseQuery is the mock layer itself

## Implementation Hints

- **Pattern to follow:** Existing `staticRoutes` map and dynamic route matching in `mockBaseQuery.ts`
- **Key considerations:**
  - Pricing mock should return `{ symbol, rawPrice: "150.000000", buyPrice: "151.500000", sellPrice: "148.500000", buySpreadBps: 100, sellSpreadBps: 100 }` as strings (matching real API)
  - POST /orders handler should read request body, generate a UUID, and return an order-like response with state "SUBMITTED"
  - Portfolio and P&L routes should match by endUserId (extract from URL path)

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-08-04 | Initial task created |
