# Task 02: ViewMode Types and Redux Slice

**Status:** pending
**HLD Reference:** Technical Implementation > ViewMode Redux Slice

## Description

Create the first custom Redux slice for dashboard mode state. Defines `EndUser` type and `ViewModeState`, with actions to switch between admin and user modes. Wire the slice into the existing Redux store.

## Acceptance Criteria

- [ ] `lib/types/user.ts` exports `EndUser`, `Holding`, `PnlEntry`, `PnlSummary` interfaces
- [ ] `lib/types/trade.ts` exports `PlaceOrderRequest`, `TimeInForce`, `TradableSymbol` types
- [ ] `lib/store/viewModeSlice.ts` exports `setAdminMode`, `selectEndUser`, `clearEndUser` actions
- [ ] `lib/store/viewModeSlice.ts` exports `selectViewMode`, `selectSelectedEndUser`, `selectIsUserMode` selectors
- [ ] `setAdminMode()` sets mode to "admin" and clears selectedEndUser
- [ ] `selectEndUser(endUser)` sets mode to "user" and stores the EndUser
- [ ] `RootState` TypeScript type includes `viewMode` key
- [ ] Store compiles and runs without errors

## Dependencies

- **Depends on:** None
- **Blocks:** Tasks 03, 05, 06, 07, 08

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `lib/types/user.ts` | Create | EndUser, Holding, PnlEntry, PnlSummary, SymbolPricing interfaces |
| `lib/types/trade.ts` | Create | PlaceOrderRequest, TimeInForce, TradableSymbol, InputMode types |
| `lib/store/viewModeSlice.ts` | Create | Redux slice with mode + selectedEndUser state |
| `lib/store/store.ts` | Modify | Add viewMode reducer to configureStore |

## Unit Tests

| Test Class | Purpose |
|------------|---------|
| `lib/store/__tests__/viewModeSlice.test.ts` | Test reducers and selectors |

- **Positive scenarios:** setAdminMode resets state, selectEndUser stores user, selectors return correct values
- **Negative scenarios:** selectEndUser with null/malformed data, clearEndUser when already null
- **Mocking strategy:** No mocks needed -- pure Redux slice testing

## Implementation Hints

- **Pattern to follow:** Redux Toolkit `createSlice` with inline selectors (RTK 2.x pattern)
- **Key considerations:**
  - `EndUser` interface includes `walletId` (mock-only convenience field, not on backend entity)
  - `displayName` falls back to `externalId` when not provided
  - Store modification: add `[viewModeSlice.reducerPath]: viewModeSlice.reducer` to reducer map
  - Types in `user.ts` and `trade.ts` should use string types for decimal values matching backend DTOs

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-08-04 | Initial task created |
