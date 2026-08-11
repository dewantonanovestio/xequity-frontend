# Task 07: Frontend — replaceOrder + replaceRedemption RTK Mutations

**Status:** pending
**HLD Reference:** Technical Implementation — EditOrderModal

## Description

Add `replaceOrder` and `replaceRedemption` RTK mutations to `ordersApi.ts`. The backend `PATCH /orders/:id` is fully implemented (returns **204 No Content**). These mutations power the `EditOrderModal` (Task 12).

## Acceptance Criteria

- [ ] `useReplaceOrderMutation` hook is exported and callable
- [ ] `useReplaceRedemptionMutation` hook is exported and callable
- [ ] `replaceOrder` issues `PATCH /orders/:id` with the correct body
- [ ] `replaceRedemption` issues `PATCH /redemptions/:id` with the correct body
- [ ] Both mutations invalidate the `"Orders"` tag on success (triggers detail page refetch)
- [ ] No `transformResponse` defined — success is `204 No Content`, checked via `isSuccess`

## Dependencies

- **Depends on:** Task 03 (`ReplaceOrderRequest` type)
- **Blocks:** Task 12 (EditOrderModal + user order detail page)

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `lib/api/ordersApi.ts` | Modify | Add `replaceOrder` and `replaceRedemption` mutations |

## Unit Tests

N/A — covered by integration tests. The mutations follow the exact same shape as `cancelOrder` which is already tested. Verify the endpoint URL and HTTP method in the mock test for `ordersApi`.

## Implementation Hints

**Add to `ordersApi.ts` inside `endpoints` builder:**
```typescript
replaceOrder: build.mutation<void, ReplaceOrderRequest>({
  query: ({ id, ...body }) => ({ url: `/orders/${id}`, method: 'PATCH', body }),
  invalidatesTags: ['Orders'],
}),
replaceRedemption: build.mutation<void, ReplaceOrderRequest>({
  query: ({ id, ...body }) => ({ url: `/redemptions/${id}`, method: 'PATCH', body }),
  invalidatesTags: ['Orders'],
}),
```

**Export the hooks:**
```typescript
export const {
  // ... existing exports
  useReplaceOrderMutation,
  useReplaceRedemptionMutation,
} = ordersApi;
```

**Import `ReplaceOrderRequest`** from `@/lib/types/trade`.

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-08-05 | Initial task created |
