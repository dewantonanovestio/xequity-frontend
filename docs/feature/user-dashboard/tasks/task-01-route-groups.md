# Task 01: Route Group Migration

**Status:** pending
**HLD Reference:** Technical Implementation > File Structure

## Description

Move existing admin pages into an `(admin)` route group and create placeholder user pages in a `(user)` route group. Route groups in Next.js do not affect URL paths -- `/orders` stays `/orders`.

## Acceptance Criteria

- [ ] `app/(admin)/orders/page.tsx` exists (moved from `app/orders/page.tsx`)
- [ ] `app/(admin)/orders/[id]/page.tsx` exists (moved from `app/orders/[id]/page.tsx`)
- [ ] `app/(admin)/ledger/page.tsx` exists (moved from `app/ledger/page.tsx`)
- [ ] `app/(admin)/recon/page.tsx` exists (moved from `app/recon/page.tsx`)
- [ ] `app/(user)/trade/page.tsx` exists with placeholder content
- [ ] `app/(user)/portfolio/page.tsx` exists with placeholder content
- [ ] `app/(user)/pnl/page.tsx` exists with placeholder content
- [ ] `app/(user)/history/page.tsx` exists with placeholder content
- [ ] URLs `/orders`, `/ledger`, `/recon` still render correctly
- [ ] `usePathname()` still returns `/orders` (not `/(admin)/orders`)
- [ ] `npm run build` succeeds
- [ ] All existing tests pass

## Dependencies

- **Depends on:** None
- **Blocks:** Task 08 (Root Redirect)

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `app/(admin)/orders/page.tsx` | Move | From `app/orders/page.tsx` |
| `app/(admin)/orders/[id]/page.tsx` | Move | From `app/orders/[id]/page.tsx` |
| `app/(admin)/ledger/page.tsx` | Move | From `app/ledger/page.tsx` |
| `app/(admin)/recon/page.tsx` | Move | From `app/recon/page.tsx` |
| `app/(user)/trade/page.tsx` | Create | Placeholder trade page |
| `app/(user)/portfolio/page.tsx` | Create | Placeholder portfolio page |
| `app/(user)/pnl/page.tsx` | Create | Placeholder P&L page |
| `app/(user)/history/page.tsx` | Create | Placeholder history page |

## Unit Tests

N/A -- covered by build verification and existing tests.

## Implementation Hints

- **Pattern to follow:** Placeholder pages should follow existing Suspense pattern (`app/orders/page.tsx:135-141`)
- **Key considerations:** Move `__tests__/` directories alongside their pages. Import paths using `@/` aliases are unaffected by the move. Verify that route groups do not produce `/(admin)/` in the URL.

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-08-04 | Initial task created |
