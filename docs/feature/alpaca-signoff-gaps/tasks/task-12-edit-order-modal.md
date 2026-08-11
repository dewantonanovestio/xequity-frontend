# Task 12: Frontend — EditOrderModal + User Order Detail Page

**Status:** pending
**HLD Reference:** Technical Implementation — EditOrderModal (Frontend); Assumption A-04

## Description

Create `EditOrderModal` (Dialog form for replacing a resting LIMIT order) and wire it into `UserOrderActions`. Also create `app/(user)/orders/[id]/page.tsx` which does not currently exist — the History page navigates to `/orders/:id` but this route has no user-mode page file. The admin page at `app/(admin)/orders/[id]/page.tsx` is separate and admin-gated.

## Acceptance Criteria

- [ ] `app/(user)/orders/[id]/page.tsx` exists and renders order detail for user mode
- [ ] `UserOrderActions` Edit button renders only when `order.side === 'BUY' AND order.type === 'LIMIT' AND order.state IN ['OPEN_EXECUTING', 'PARTIALLY_FILLED']`
- [ ] `EditOrderModal` opens with pre-populated qty, limitPrice, tif from current order values
- [ ] Submitting calls `useReplaceOrderMutation` (for BUY orders)
- [ ] Success: modal closes and order detail refetches (cache invalidated via `"Orders"` tag)
- [ ] Failure: error message shown inline in modal, modal stays open
- [ ] Edit button not shown for SELL orders, MARKET orders, or terminal states

## Dependencies

- **Depends on:** Task 07 (replaceOrder + replaceRedemption mutations), Task 11 (UserOrderActions base)
- **Blocks:** —

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `app/(user)/orders/[id]/page.tsx` | Create | User-mode order detail page (route currently missing) |
| `components/orders/EditOrderModal.tsx` | Create | Dialog form for order replacement |
| `components/orders/UserOrderActions.tsx` | Modify | Add `isEditOpen` state + Edit button + render EditOrderModal |

## Unit Tests

| Test Class | Purpose |
|------------|---------|
| `components/orders/__tests__/EditOrderModal.test.tsx` | Test modal form and mutation |

- **Positive scenarios:** BUY LIMIT OPEN_EXECUTING order → Edit button visible. Edit modal opens with pre-filled values. Submit → mutation called with changed fields. Success → modal closes.
- **Negative scenarios:** SELL order → Edit button absent. MARKET order → Edit button absent. API error → error banner shown, modal stays open. Submit with unchanged values → still calls mutation (backend validates).
- **Mocking strategy:** Mock `useReplaceOrderMutation` via `vi.mock`. Pass a `mockOrder` fixture.

## Implementation Hints

**`app/(user)/orders/[id]/page.tsx`:**
```tsx
"use client";
import { useParams, useSearchParams } from "next/navigation";
import { OrderDetailContainer } from "@/components/orders/OrderDetailContainer";

export default function UserOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const kind = sp.get("kind") === "redemption" ? "redemption" : "order";
  return (
    <section className="mx-auto w-full max-w-6xl p-6">
      <OrderDetailContainer id={id} kind={kind} actionsMode="user" />
    </section>
  );
}
```

Add an `actionsMode?: 'admin' | 'user'` prop to `OrderDetailContainer`. When `'user'`, render `<UserOrderActions order={detail} />` instead of `<ActionButtons />`.

**`EditOrderModal.tsx` key constraints:**
- Only calls `useReplaceOrderMutation` (BUY side) — no `useReplaceRedemptionMutation` in the modal (SELL-side edit is out of scope)
- Pre-fill from `order.qty`, `order.limitPrice`, `order.tif`
- Response is 204 No Content — check `isSuccess` not response body

**`UserOrderActions.tsx` edit gate:**
```typescript
const isEditable = order.side === 'BUY' &&
  order.type === 'LIMIT' &&
  ['OPEN_EXECUTING', 'PARTIALLY_FILLED'].includes(order.state);
```

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-08-05 | Initial task created |
