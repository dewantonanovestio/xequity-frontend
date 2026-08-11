# Task 07: Sidebar Refactor + RoleSwitcher Component

**Status:** pending
**HLD Reference:** Technical Implementation > Role Switcher; System Architecture > Data Flow - Mode Switch

## Description

Modify the Sidebar to render context-appropriate navigation based on view mode. Create a RoleSwitcher component at the bottom of the sidebar using shadcn Select. When mode changes, redirect to the appropriate landing page.

## Acceptance Criteria

- [ ] Admin mode shows: Orders, Ledger, Recon navigation items
- [ ] User mode shows: Trade, Portfolio, P&L, History navigation items
- [ ] Active link highlighting works for both navigation sets
- [ ] RoleSwitcher renders at bottom of sidebar with "View as:" label
- [ ] In mock mode: Select shows "Admin" + end-user names from `useGetEndUsersQuery()`
- [ ] In real mode: Select shows "Admin" + text Input for manual endUserId entry
- [ ] Selecting "Admin" dispatches `setAdminMode()` and navigates to `/orders`
- [ ] Selecting an end-user dispatches `selectEndUser()` and navigates to `/trade`
- [ ] RoleSwitcher renders without errors while end-user query is loading

## Dependencies

- **Depends on:** Task 02 (viewModeSlice), Task 05 (userApi for end-user list)
- **Blocks:** Tasks 09, 10, 11, 12

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `components/layout/Sidebar.tsx` | Modify | Conditional nav arrays + mount RoleSwitcher |
| `components/layout/RoleSwitcher.tsx` | Create | Select component for mode switching |

## Unit Tests

| Test Class | Purpose |
|------------|---------|
| `components/layout/__tests__/RoleSwitcher.test.tsx` | Test mode switching and navigation |

- **Positive scenarios:** Select admin, select user, navigation triggers correctly
- **Negative scenarios:** Loading state, empty end-user list, query error state
- **Mocking strategy:** Mock Redux store, mock `useGetEndUsersQuery`, mock `useRouter`

## Implementation Hints

- **Pattern to follow:** Existing Sidebar.tsx for nav rendering; shadcn `Select` component in `components/ui/select.tsx`
- **Key considerations:**
  - User nav icons: `ArrowLeftRight` (Trade), `Wallet` (Portfolio), `TrendingUp` (P&L), `Clock` (History) from lucide-react
  - Use `mt-auto` on RoleSwitcher wrapper to push to bottom of sidebar (sidebar already uses `flex flex-col`)
  - Add a `Separator` component above the RoleSwitcher for visual separation
  - Use `isMockMode()` from `lib/utils/env.ts` to determine Select vs Input rendering

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-08-04 | Initial task created |
