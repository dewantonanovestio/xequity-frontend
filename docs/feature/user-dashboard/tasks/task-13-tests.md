# Task 13: Unit + Component Tests

**Status:** pending
**HLD Reference:** All sections

## Description

Write unit and component tests for the new user dashboard features. Covers ViewMode slice, API adapters, OrderForm, HoldingsTable, PnlTable, and RoleSwitcher. Tests for existing reused components (OrderTable) are already in place.

## Acceptance Criteria

- [ ] ViewMode slice tests: initial state, setViewMode, setSelectedEndUser, clearSelectedEndUser, selectViewMode, selectSelectedEndUser selectors
- [ ] Adapter tests: endUserAdapter, holdingAdapter, pnlAdapter, pricingAdapter handle valid data, missing fields, and malformed input
- [ ] OrderForm tests: renders fields, toggles market/limit visibility, validates required fields, submits with correct payload
- [ ] HoldingsTable tests: renders holdings, computes market value and unrealized P&L, shows summary row, handles empty state
- [ ] PnlTable tests: renders per-symbol rows, correct color styling for positive/negative values, handles empty state
- [ ] RoleSwitcher tests: renders mode options, switches mode, shows end-user selector in user mode, clears selection on mode change

## Dependencies

- **Depends on:** Task 02, Task 05, Task 07, Task 09, Task 10, Task 11
- **Blocks:** None

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `lib/store/__tests__/viewModeSlice.test.ts` | Create | Redux slice unit tests |
| `lib/api/__tests__/adapters.test.ts` | Modify | Add adapter tests for new types |
| `components/trade/__tests__/OrderForm.test.tsx` | Create | Order form component tests |
| `components/portfolio/__tests__/HoldingsTable.test.tsx` | Create | Holdings table component tests |
| `components/pnl/__tests__/PnlTable.test.tsx` | Create | P&L table component tests |
| `components/layout/__tests__/RoleSwitcher.test.tsx` | Create | Role switcher component tests |

## Unit Tests

### ViewMode Slice (`viewModeSlice.test.ts`)

- **Positive scenarios:** Sets mode to "user", stores selected end-user, clears end-user, selectors return correct values
- **Negative scenarios:** clearSelectedEndUser when already null, setViewMode to same value
- **Mocking strategy:** Direct reducer testing (no mocks needed)

### Adapters (`adapters.test.ts`)

- **Positive scenarios:** Transforms valid API responses to typed objects with correct field mapping
- **Negative scenarios:** Missing fields return defaults, non-object input returns empty/default, string numbers convert correctly
- **Mocking strategy:** Raw fixture data as input

### OrderForm (`OrderForm.test.tsx`)

- **Positive scenarios:** Renders all fields, limit fields appear when LIMIT selected, submit calls mutation with correct payload, success message shown
- **Negative scenarios:** Submit disabled with empty fields, no user selected shows prompt, API error displays message
- **Mocking strategy:** Mock `usePlaceOrderMutation`, mock `useGetSymbolsQuery`, mock Redux store with `selectedEndUser`

### HoldingsTable (`HoldingsTable.test.tsx`)

- **Positive scenarios:** Renders symbol/qty/cost columns, market value = qty * price, unrealized P&L = (price - cost) * qty, summary totals correct
- **Negative scenarios:** Empty holdings array, pricing error shows "N/A", loading skeleton displayed
- **Mocking strategy:** Mock `useGetHoldingsQuery`, mock `useGetPricingQuery`, mock Redux store

### PnlTable (`PnlTable.test.tsx`)

- **Positive scenarios:** Renders per-symbol rows, positive values have `text-emerald-600` class, negative values have `text-destructive` class, totals row
- **Negative scenarios:** Empty P&L data shows empty state, loading skeleton
- **Mocking strategy:** Mock `useGetPnlQuery`, mock Redux store

### RoleSwitcher (`RoleSwitcher.test.tsx`)

- **Positive scenarios:** Shows Admin/User options, switching to user mode dispatches action, end-user dropdown appears, selecting user dispatches setSelectedEndUser
- **Negative scenarios:** Switching to admin clears selected end-user, end-user list loading state
- **Mocking strategy:** Mock Redux store, mock `useGetEndUsersQuery`

## Implementation Hints

- **Pattern to follow:** Existing test files in `components/orders/__tests__/` and `lib/api/__tests__/`
- **Key considerations:**
  - Use `vitest` + `@testing-library/react` (already configured)
  - Wrap components with test Redux store provider using `configureStore`
  - For RTK Query hook mocking, use `vi.mock('lib/api/...')` pattern
  - Test user interactions with `@testing-library/user-event`
  - Adapter tests are pure function tests — simplest to write first

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-08-04 | Initial task created |
