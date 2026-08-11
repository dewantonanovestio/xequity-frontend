# Task 05: New API Slices + Adapters

**Status:** pending
**HLD Reference:** Technical Implementation > API Changes

## Description

Create RTK Query API slices for user management, portfolio, and P&L. Add defensive adapter functions for all new response types. Add new tag types to baseApi.

## Acceptance Criteria

- [ ] `lib/api/userApi.ts` exports `useGetEndUsersQuery` hook
- [ ] `lib/api/portfolioApi.ts` exports `useGetHoldingsQuery(endUserId)` and `useGetPricingQuery({ symbol, clientId })` hooks
- [ ] `lib/api/pnlApi.ts` exports `useGetPnlQuery(endUserId)` hook
- [ ] `baseApi.ts` tagTypes include: `"EndUsers"`, `"Portfolio"`, `"Pricing"`, `"PnL"`
- [ ] `adapters.ts` includes `adaptEndUsers()`, `adaptHoldings()`, `adaptPricing()`, `adaptPnl()` functions
- [ ] All adapters handle null, undefined, and malformed input defensively
- [ ] `getPricing` query passes `clientId` as query parameter: `GET /pricing/:symbol?clientId=<uuid>`
- [ ] `getPricing` adapter converts string prices to numbers

## Dependencies

- **Depends on:** Task 02 (types), Task 04 (mock handlers)
- **Blocks:** Tasks 07, 10, 11

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `lib/api/baseApi.ts` | Modify | Add new tag types |
| `lib/api/userApi.ts` | Create | End-user list endpoint |
| `lib/api/portfolioApi.ts` | Create | Holdings + pricing endpoints |
| `lib/api/pnlApi.ts` | Create | P&L endpoint |
| `lib/api/adapters.ts` | Modify | Add adapter functions for new types |

## Unit Tests

| Test Class | Purpose |
|------------|---------|
| `lib/api/__tests__/adapters.user.test.ts` | Test all new adapter functions |

- **Positive scenarios:** Valid responses parsed correctly, string prices converted to numbers
- **Negative scenarios:** Null input, empty arrays, missing fields, malformed price strings
- **Mocking strategy:** Test adapters as pure functions (no API mocking needed)

## Implementation Hints

- **Pattern to follow:** `lib/api/ordersApi.ts` for `injectEndpoints` pattern; `lib/api/adapters.ts` for `isRecord`/`asString`/`asNumber` pattern
- **Key considerations:**
  - `getPricing` hook must accept `{ symbol: string, clientId: string }` and build URL: `/pricing/${symbol}?clientId=${clientId}`
  - Pricing response fields are strings: `rawPrice`, `buyPrice`, `sellPrice` need `asNumber()` conversion
  - `getSymbols` endpoint is in `userApi` (returns `string[]` from mock)
  - All queries should use `skip: true` when their required params are falsy

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-08-04 | Initial task created |
