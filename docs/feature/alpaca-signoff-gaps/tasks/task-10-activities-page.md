# Task 10: Frontend — Activities Page + ActivityTable + Sidebar Link

**Status:** pending
**HLD Reference:** Technical Implementation — ActivityTable + Activities Page

## Description

Create the `/activities` user page with a cursor-paginated activity table. The page shows BUY/SELL fill history for the selected end-user, with a "Load more" button for pagination. Add an "Activities" link to the user sidebar navigation.

## Acceptance Criteria

- [ ] `/activities` route is accessible and renders without error
- [ ] Table renders columns: Date, Type (badge), Symbol, Qty, Amount, State
- [ ] "Load more" button is disabled when `nextCursor` is null
- [ ] Clicking "Load more" appends additional rows without clearing existing ones
- [ ] Empty state shown when no user is selected
- [ ] Empty state shown when no activities exist for the user
- [ ] "Activities" link appears in user sidebar navigation
- [ ] "Activities" link does NOT appear in admin sidebar navigation

## Dependencies

- **Depends on:** Task 05 (activitiesApi + useGetActivitiesQuery)
- **Blocks:** —

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `components/activities/ActivityTable.tsx` | Create | Reusable table component for Activity[] |
| `app/(user)/activities/page.tsx` | Create | Route page with data fetching |
| `components/layout/Sidebar.tsx` | Modify | Add Activities nav item to userNavigation |

## Unit Tests

| Test Class | Purpose |
|------------|---------|
| `app/(user)/activities/__tests__/ActivitiesPage.test.tsx` | Test page states |

- **Positive scenarios:** User selected + activities returned → table rows visible. `nextCursor` present → "Load more" button enabled. Clicking "Load more" → refetch with cursor.
- **Negative scenarios:** No user selected → empty state / prompt. `nextCursor: null` → "Load more" disabled. Query error → error alert.
- **Mocking strategy:** Mock `useGetActivitiesQuery` and `useAppSelector` via `vi.mock`.

## Implementation Hints

**`ActivityTable.tsx`:**
```tsx
interface ActivityTableProps {
  activities: Activity[];
  isLoading: boolean;
  nextCursor: string | null;
  onLoadMore: () => void;
}
```
Render a shadcn `Table`. Type column: `<Badge variant={activity.type === 'BUY' ? 'default' : 'secondary'}>`. Amount: `formatCurrency(activity.amount)`. Date: `formatDate(activity.createdAt)`.

**`app/(user)/activities/page.tsx` pattern:**
Follow `history/page.tsx` structure — Suspense wrapper + `Content()` inner function. Use `useState` for `cursor`. On "Load more" click: `setCursor(data.nextCursor)` which triggers `forceRefetch` in the RTK slice and appends via `merge`.

**`Sidebar.tsx` change:**
```typescript
import { Activity } from 'lucide-react';
// Add to userNavigation array:
{ href: '/activities', label: 'Activities', icon: Activity }
```

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-08-05 | Initial task created |
