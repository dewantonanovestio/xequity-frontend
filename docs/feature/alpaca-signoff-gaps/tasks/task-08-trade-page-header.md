# Task 08: Frontend — TradePageHeader Balance Widget

**Status:** pending
**HLD Reference:** Technical Implementation — TradePageHeader (Frontend); System Architecture — Balance Widget Load

## Description

Create a `TradePageHeader` component that displays the client's available/held/total balance above the `OrderForm` on the Trade page. Uses `useGetBalanceQuery` and reads `clientId` from the Redux store.

## Acceptance Criteria

- [ ] Three balance chips render: Available, Held, Total (formatted with `formatCurrency`)
- [ ] Skeleton renders while the query is loading
- [ ] "Balance unavailable" graceful fallback renders on query error
- [ ] Nothing renders when no user is selected
- [ ] Component is placed above `<OrderForm />` in `app/(user)/trade/page.tsx`

## Dependencies

- **Depends on:** Task 06 (balanceApi + useGetBalanceQuery)
- **Blocks:** —

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `components/trade/TradePageHeader.tsx` | Create | Balance widget component |
| `app/(user)/trade/page.tsx` | Modify | Add `<TradePageHeader />` above `<OrderForm />` |

## Unit Tests

| Test Class | Purpose |
|------------|---------|
| `components/trade/__tests__/TradePageHeader.test.tsx` | Test rendering states |

- **Positive scenarios:** User selected + balance available → three formatted currency values. User selected + loading → skeleton element present.
- **Negative scenarios:** No user selected → null render (nothing in DOM). Query error → "Balance unavailable" text.
- **Mocking strategy:** Mock `useGetBalanceQuery` and `useAppSelector` via `vi.mock`.

## Implementation Hints

```tsx
"use client";
import { useGetBalanceQuery } from "@/lib/api/balanceApi";
import { useAppSelector } from "@/lib/store/hooks";
import { selectSelectedEndUser } from "@/lib/store/viewModeSlice";
import { formatCurrency } from "@/lib/utils/formatters";
import { Skeleton } from "@/components/ui/skeleton";

export function TradePageHeader() {
  const user = useAppSelector(selectSelectedEndUser);
  const { data: balance, isLoading, isError } = useGetBalanceQuery(
    user?.clientId ?? '',
    { skip: !user }
  );

  if (!user) return null;
  if (isLoading) return <Skeleton className="h-16 w-full rounded-xl" />;
  if (isError || !balance) return (
    <p className="text-sm text-muted-foreground">Balance unavailable</p>
  );

  return (
    <div className="flex gap-6 rounded-xl border bg-card px-6 py-4 text-sm">
      {([['Available', balance.available], ['Held', balance.held], ['Total', balance.total]] as const).map(([label, value]) => (
        <div key={label}>
          <span className="text-xs text-muted-foreground">{label}</span>
          <p className="font-semibold">{formatCurrency(value)}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-08-05 | Initial task created |
