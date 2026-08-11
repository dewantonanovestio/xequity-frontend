# TASK-01: Project Setup & Foundation

| | |
|---|---|
| **ID** | TASK-01 |
| **Status** | Complete |
| **Size** | M (1-2 days) |
| **Dependencies** | None |
| **Blocks** | TASK-02, TASK-03, TASK-04 |
| **HLD Reference** | Sections 2, 3, 4, 8, 9 |

---

## Background

The xequity-face project is a freshly scaffolded Next.js 16 app with Tailwind CSS 4. It has no dependencies beyond the defaults. This task installs all required libraries, sets up the Redux store with RTK Query, creates the app shell layout (sidebar + topbar), establishes the mock data infrastructure, and configures environment handling.

This is the foundation that all feature tasks build on.

---

## Description

### 1. Install Dependencies

Install the following packages:

- `@reduxjs/toolkit` + `react-redux` — state management and RTK Query
- `@tanstack/react-table` — table rendering
- `shadcn/ui` — component library (via `npx shadcn@latest init`)
  - Install these shadcn components: `button`, `badge`, `card`, `table`, `dialog`, `alert-dialog`, `select`, `input`, `dropdown-menu`, `separator`, `tabs`, `skeleton`
- `date-fns` — date formatting
- `vitest` + `@testing-library/react` + `@testing-library/jest-dom` + `@testing-library/user-event` + `jsdom` — testing

### 2. Redux Store Setup

Create the Redux store at `lib/store/store.ts` with RTK Query middleware. Create typed hooks at `lib/store/hooks.ts` (`useAppDispatch`, `useAppSelector`).

Create the RTK Query base API at `lib/api/baseApi.ts` with a mock-aware base query function that checks `NEXT_PUBLIC_USE_MOCKS` and routes to either `fetchBaseQuery` or the mock handler.

### 3. Environment Configuration

Create `lib/utils/env.ts` with:
- `getApiUrl()` — reads `NEXT_PUBLIC_API_URL`, defaults to `http://localhost:3000`
- `isMockMode()` — returns `true` if `NEXT_PUBLIC_USE_MOCKS === 'true'`
- `getEnvLabel()` — extracts a display label from the API URL (e.g., "localhost:3000", "staging-api.xequity.internal")

Create `.env.local` with default values.

### 4. App Shell Layout

Modify `app/layout.tsx` to:
- Wrap children in a Redux `<Provider>`
- Render the Sidebar and TopBar components
- Set page title to "xequity-face"

Create `components/layout/Sidebar.tsx`:
- Three nav links: Orders (`/orders`), Ledger (`/ledger`), Recon (`/recon`)
- Active link highlighting using `usePathname()`
- Fixed left sidebar, approximately 200px wide

Create `components/layout/TopBar.tsx`:
- "xequity-face" label on the left
- Environment badge on the right showing `getEnvLabel()` value
- Badge color: green for localhost, yellow for staging, red for production

### 5. Mock Data Infrastructure

Create `lib/mocks/mockBaseQuery.ts`:
- A function that takes RTK Query `FetchArgs` and returns mock data based on URL pattern matching
- URL pattern registry mapping endpoint paths to mock data
- Returns `{ data: ... }` for matched routes, `{ error: { status: 404 } }` for unmatched

Create placeholder mock JSON files (empty structures to be populated in feature tasks):
- `lib/mocks/orders.json`
- `lib/mocks/ledger.json`
- `lib/mocks/recon.json`

### 6. Formatting Utilities

Create `lib/utils/formatters.ts`:
- `formatCurrency(amount: number)` — formats as USD with 2 decimals (e.g., "$1,234.56")
- `formatDate(iso: string)` — formats ISO string to readable date/time
- `formatQty(qty: number)` — formats quantity with up to 6 decimals, trimming trailing zeros

### 7. Type Definitions

Create the base type files (full types from HLD Section 6):
- `lib/types/order.ts`
- `lib/types/ledger.ts`
- `lib/types/recon.ts`

### 8. Home Page Redirect

Modify `app/page.tsx` to redirect to `/orders` using `next/navigation`'s `redirect()`.

---

## Acceptance Criteria

- [x] All dependencies installed and project builds without errors (`npm run build`)
- [x] Redux store is configured and accessible via `useAppSelector` / `useAppDispatch`
- [x] RTK Query base API is created with mock-aware base query
- [x] `NEXT_PUBLIC_USE_MOCKS=true` causes the base query to return mock data instead of hitting the network
- [x] App shell renders: sidebar with 3 nav links, topbar with env indicator
- [x] Active sidebar link is visually highlighted based on current route
- [x] Environment badge shows the correct label derived from `NEXT_PUBLIC_API_URL`
- [x] Navigating to `/` redirects to `/orders`
- [x] Type definitions compile without errors
- [x] Formatting utilities produce correct output
- [x] `npm run lint` passes
- [x] Vitest is configured and a sample test runs

---

## Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `package.json` | Add dependencies |
| Modify | `app/layout.tsx` | Add Redux provider, sidebar, topbar |
| Modify | `app/page.tsx` | Redirect to /orders |
| Create | `app/orders/page.tsx` | Placeholder page (renders "Order Tracker") |
| Create | `app/ledger/page.tsx` | Placeholder page (renders "Ledger Viewer") |
| Create | `app/recon/page.tsx` | Placeholder page (renders "Reconciliation") |
| Create | `components/layout/Sidebar.tsx` | Left navigation sidebar |
| Create | `components/layout/TopBar.tsx` | Top bar with env indicator |
| Create | `lib/store/store.ts` | Redux store configuration |
| Create | `lib/store/hooks.ts` | Typed Redux hooks |
| Create | `lib/store/StoreProvider.tsx` | Client component wrapping Provider |
| Create | `lib/api/baseApi.ts` | RTK Query base API with mock-aware base query |
| Create | `lib/mocks/mockBaseQuery.ts` | Mock base query interceptor |
| Create | `lib/mocks/orders.json` | Placeholder mock data for orders |
| Create | `lib/mocks/ledger.json` | Placeholder mock data for ledger |
| Create | `lib/mocks/recon.json` | Placeholder mock data for recon |
| Create | `lib/types/order.ts` | Order, Fill, StateTransition types |
| Create | `lib/types/ledger.ts` | Balance, Transaction types |
| Create | `lib/types/recon.ts` | CashRecon, SupplyRecon types |
| Create | `lib/utils/env.ts` | Environment helpers |
| Create | `lib/utils/formatters.ts` | Currency, date, qty formatters |
| Create | `.env.local` | Default environment variables |
| Create | `vitest.config.ts` | Vitest configuration |
| Create | `lib/utils/__tests__/formatters.test.ts` | Unit tests for formatters |

---

## Unit Test Plan

| Test | What it verifies |
|------|-----------------|
| `formatCurrency(1234.5)` returns `"$1,234.50"` | Currency formatting with thousands separator |
| `formatCurrency(0)` returns `"$0.00"` | Zero value handling |
| `formatQty(1.123456789)` trims to 6 decimals | Quantity decimal trimming |
| `formatDate(isoString)` returns readable format | Date formatting |
| `getEnvLabel()` extracts host from URL | Environment label extraction |
| `isMockMode()` returns true when env is "true" | Mock mode detection |
| `mockBaseQuery` returns data for known routes | Mock routing works |
| `mockBaseQuery` returns 404 for unknown routes | Unknown route handling |

---

## Implementation Hints

1. **Redux Provider in App Router**: Since `app/layout.tsx` is a Server Component by default, create a `StoreProvider.tsx` client component that wraps `<Provider store={store}>` and use it in the layout. Mark it with `"use client"`.

2. **shadcn/ui init**: Run `npx shadcn@latest init` and select the default options. Then install individual components with `npx shadcn@latest add button badge card table dialog alert-dialog select input dropdown-menu separator tabs skeleton`.

3. **Sidebar with App Router**: The sidebar is a client component because it uses `usePathname()`. Import it in the layout and render it alongside the page content in a flex container.

4. **Mock base query typing**: The mock base query should match RTK Query's `BaseQueryFn` signature — return `{ data }` for success or `{ error: { status, data } }` for errors.

5. **Tailwind CSS 4**: Tailwind v4 uses a CSS-first configuration approach. shadcn/ui's setup should handle the integration, but verify that `@import "tailwindcss"` is in the global CSS file rather than a `tailwind.config.ts`.
