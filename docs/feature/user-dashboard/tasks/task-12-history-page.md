# Task 12: History Page (Reuses OrderTable)

**Status:** pending
**HLD Reference:** Technical Implementation > History Page

## Description

Build the order history page for the user dashboard. This is the highest-reuse task -- it reuses the existing `OrderTable` component and `ordersApi` hooks, pre-filtering by the selected end-user's ID.

## Acceptance Criteria

- [ ] History page follows Suspense + Content + Fallback pattern
- [ ] Shows "Select an end-user" prompt when no user selected
- [ ] Fetches orders via `useGetOrdersQuery({ endUserId, limit: 100 })` with 5s polling
- [ ] Fetches redemptions via `useGetRedemptionsQuery({ endUserId, limit: 100 })` with 5s polling
- [ ] Both queries use `skip: true` when no end-user selected
- [ ] Combined orders + redemptions displayed in existing `OrderTable`
- [ ] Clicking an order navigates to existing `/orders/:id` detail page
- [ ] No admin action buttons (read-only view)

## Dependencies

- **Depends on:** Task 07 (Sidebar/RoleSwitcher)
- **Blocks:** Task 13 (Tests)

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `app/(user)/history/page.tsx` | Modify | Replace placeholder with real history page |

## Unit Tests

N/A -- reuses existing `OrderTable` which is already tested. Integration testing covers the page.

## Implementation Hints

- **Pattern to follow:** `app/orders/page.tsx` -- almost identical structure, but pre-filtered by endUserId instead of URL params
- **Key considerations:**
  - Import `OrderTable` from `components/orders/OrderTable`
  - Import `useGetOrdersQuery` and `useGetRedemptionsQuery` from `lib/api/ordersApi`
  - Read `endUserId` from `useAppSelector(selectSelectedEndUser)`
  - No need for `OrderFilters` component -- user context is already set via sidebar
  - Use same `pollingInterval: 5000` as admin orders page
  - Page header should say "Order History" with subtitle like "Your buy and sell orders"

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-08-04 | Initial task created |
