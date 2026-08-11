# Task 11: Frontend — UserOrderActions + History Page Inline Cancel

**Status:** pending
**HLD Reference:** Technical Implementation — UserOrderActions (Frontend)

## Description

Create a shared `UserOrderActions` component that renders Cancel (and later Edit — Task 12) buttons for user-mode orders. Wire Cancel into the History page `OrderTable` via an optional `actions` column prop. Cancel is **BUY-only** — no `POST /redemptions/:id/cancel` backend endpoint exists.

## Acceptance Criteria

- [ ] `UserOrderActions` renders Cancel button only when `order.side === 'BUY' AND order.state IN ['QUEUED', 'OPEN_EXECUTING', 'PARTIALLY_FILLED']`
- [ ] Cancel button does NOT render for SELL orders or terminal states (FILLED, CANCELLED, etc.)
- [ ] Clicking Cancel opens an `AlertDialog` confirmation before calling the mutation
- [ ] Confirming calls `useCancelOrderMutation` and shows success feedback
- [ ] Cancelling the dialog leaves the order unchanged
- [ ] Error feedback shows when cancel API fails
- [ ] `OrderTable` renders without an actions column when `actions` prop is not provided (admin view unchanged)
- [ ] History page passes `UserOrderActions` factory to `OrderTable`

## Dependencies

- **Depends on:** —
- **Blocks:** Task 12 (EditOrderModal — UserOrderActions will host the Edit button)

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `components/orders/UserOrderActions.tsx` | Create | Cancel (+ future Edit) actions for user-context orders |
| `components/orders/OrderTable.tsx` | Modify | Add optional `actions?: (order: Order) => ReactNode` column prop |
| `app/(user)/history/page.tsx` | Modify | Pass `UserOrderActions` factory to `OrderTable` |

## Unit Tests

| Test Class | Purpose |
|------------|---------|
| `components/orders/__tests__/UserOrderActions.test.tsx` | Test cancel button visibility and mutation |
| `app/(user)/history/__tests__/HistoryPage.test.tsx` (or existing history test) | Test Cancel button presence in table |

- **Positive scenarios:** BUY order in QUEUED state → Cancel button visible. Confirmation dialog → confirmed → mutation called → success feedback.
- **Negative scenarios:** SELL order → no Cancel button. FILLED order → no Cancel button. Cancel API error → error feedback shown.
- **Mocking strategy:** Mock `useCancelOrderMutation` via `vi.mock('@/lib/api/ordersApi')`. Mock `useAppSelector` if needed.

## Implementation Hints

**`OrderTable.tsx` change:**
```typescript
interface OrderTableProps {
  // ...existing props
  actions?: (order: Order) => ReactNode;
}

// Inside columns definition (conditional):
const actionsColumn = columnHelper.display({
  id: 'actions',
  header: '',
  cell: ({ row }) => actions?.(row.original) ?? null,
});
const allColumns = actions ? [...baseColumns, actionsColumn] : baseColumns;
```

**`UserOrderActions.tsx` cancel visibility logic:**
```typescript
const isCancellable = order.side === 'BUY' &&
  ['QUEUED', 'OPEN_EXECUTING', 'PARTIALLY_FILLED'].includes(order.state);
```

**Pattern to follow:** `ActionButtons.tsx` — specifically the `AlertDialog` confirmation pattern and `feedback` state (`{ tone: 'success' | 'error', message: string }`).

**History page wiring:**
```tsx
<OrderTable
  // ...existing props
  actions={(order) => <UserOrderActions order={order} />}
/>
```

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-08-05 | Initial task created |
