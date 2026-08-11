# Task 08: Root Redirect (Mode-Aware)

**Status:** pending
**HLD Reference:** System Architecture > Data Flow - Mode Switch

## Description

Update the root `app/page.tsx` to redirect based on the current view mode. Admin mode goes to `/orders`, user mode goes to `/trade`. Convert from server component to client component since Redux state is not available in server components.

## Acceptance Criteria

- [ ] In admin mode, `/` redirects to `/orders`
- [ ] In user mode, `/` redirects to `/trade`
- [ ] No flash of content before redirect
- [ ] Page is a client component (`"use client"`)

## Dependencies

- **Depends on:** Task 01 (route groups), Task 02 (viewModeSlice)
- **Blocks:** None

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `app/page.tsx` | Modify | Mode-aware redirect using Redux state |

## Unit Tests

N/A -- redirect behavior verified by integration testing.

## Implementation Hints

- **Pattern to follow:** Current `app/page.tsx` uses `redirect()` from next/navigation
- **Key considerations:**
  - Convert to client component with `"use client"`
  - Use `useRouter` + `useEffect` pattern for client-side redirect
  - Read mode from `useAppSelector(selectViewMode)`
  - The client component overhead is negligible since this page is redirect-only

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-08-04 | Initial task created |
