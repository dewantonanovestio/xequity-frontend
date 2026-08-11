# Task 13: Frontend — Close Position Button in HoldingsTable

**Status:** pending
**HLD Reference:** Technical Implementation — SymbolSelect + OrderForm Asset Filtering; System Architecture — Close Position Flow

## Description

Add a "Close" button to each row in `HoldingsTable` that navigates to `/trade?side=SELL&symbol=AAPL&qty=10`. The Trade page's `OrderForm` (Task 09) reads these query params and pre-fills the SELL form. No API changes needed.

## Acceptance Criteria

- [ ] "Close" button appears in each holding row in `HoldingsTable`
- [ ] Clicking navigates to `/trade?side=SELL&symbol=<symbol>&qty=<qty>`
- [ ] The qty in the URL is the current holding quantity (may be a decimal, e.g., `10.5`)
- [ ] "Actions" column header is added to the table
- [ ] Footer total `colSpan` is updated to account for the new column
- [ ] Existing `HoldingsTable` tests pass (update colSpan expectations if needed)

## Dependencies

- **Depends on:** — (Task 09 handles the receiving side in OrderForm)
- **Blocks:** —

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `components/portfolio/HoldingsTable.tsx` | Modify | Add Close button column with `useRouter` navigation |

## Unit Tests

| Test Class | Purpose |
|------------|---------|
| `components/portfolio/__tests__/HoldingsTable.test.tsx` | Add Close button navigation test |

- **Positive scenarios:** Holding row with symbol AAPL qty 10 → Close button click navigates to `/trade?side=SELL&symbol=AAPL&qty=10`. Multiple rows → each has its own Close button with correct params.
- **Negative scenarios:** Empty holdings array → no Close buttons (empty state rendered).
- **Mocking strategy:** Mock `useRouter` from `next/navigation` with a spy on `push`.

## Implementation Hints

**In `HoldingsTable.tsx`:**
```tsx
import { useRouter } from 'next/navigation';

// Inside component:
const router = useRouter();

// Add to TableHeader row:
<TableHead>Actions</TableHead>

// Add to PricedHolding JSX (after last data cell):
<TableCell>
  <Button
    variant="outline"
    size="sm"
    onClick={() =>
      router.push(`/trade?side=SELL&symbol=${holding.symbol}&qty=${holding.qty}`)
    }
  >
    Close
  </Button>
</TableCell>
```

**Footer colSpan update:** Find the `colSpan` value in the `<TableFooter>` row and increment by 1.

**Note on qty pre-fill:** The qty is a display quantity from the portfolio snapshot. The user can edit it in the pre-filled form before submitting. The backend will validate the final quantity.

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-08-05 | Initial task created |
