# TASK-01 Foundation Design

**Date:** 2026-08-03
**Status:** Approved
**Source requirements:** `docs/feature/developer-dashboard/tasks/task-01-project-setup.md`

## Purpose

Build the shared foundation for the xequity developer dashboard so the Orders, Ledger, and Reconciliation feature tasks can be implemented independently on top of a consistent application shell, state layer, mock-data boundary, type system, and test harness.

## Scope

This change implements TASK-01 only. It installs the specified runtime and test dependencies; adds the Redux and RTK Query foundation; creates the mock-aware data boundary, environment and formatting utilities, domain types, application shell, navigation, placeholder feature routes, and automated test configuration.

The order tracker, ledger viewer, reconciliation UI, real endpoint definitions, populated feature fixtures, authentication, mobile layouts, and production administration features remain outside this change.

## Architecture

The root App Router layout remains a Server Component. It renders a client-side `StoreProvider`, which owns the Redux provider and a stable store instance. The provider wraps a desktop-first shell containing a route-aware sidebar, a top bar, and the active route content.

All server state flows through one RTK Query `baseApi`. Its base query chooses between `fetchBaseQuery` and `mockBaseQuery` from `NEXT_PUBLIC_USE_MOCKS`. Feature tasks will inject endpoints into this shared API rather than creating additional API stores.

The mock boundary accepts the same URL and method information as RTK Query's fetch base query. Known foundation routes return imported JSON fixture data. Unknown routes return a typed HTTP-style 404 result. Placeholder fixtures use stable top-level shapes that later feature tasks can populate without changing imports.

## Components and Responsibilities

- `lib/store/store.ts` configures RTK Query's reducer and middleware and exports store-derived types.
- `lib/store/hooks.ts` exposes typed Redux hooks.
- `lib/store/StoreProvider.tsx` creates the client boundary and supplies the store.
- `lib/api/baseApi.ts` owns the real-versus-mock query decision and RTK Query tag declarations.
- `lib/mocks/mockBaseQuery.ts` normalizes request input, routes known mock requests, and returns typed 404 errors for unknown requests.
- `lib/mocks/*.json` provide empty, valid fixture structures for each feature domain.
- `lib/utils/env.ts` centralizes API URL defaults, mock-mode parsing, and the environment display label.
- `lib/utils/formatters.ts` provides deterministic USD, quantity, and readable date formatting.
- `lib/types/*.ts` define the complete order, ledger, and reconciliation models required by the HLD.
- `components/layout/Sidebar.tsx` renders Orders, Ledger, and Recon navigation and highlights the current route.
- `components/layout/TopBar.tsx` renders the application name and a host-based environment badge.
- `app/layout.tsx` composes the provider and shell and supplies application metadata.
- `app/page.tsx` redirects `/` to `/orders`.
- `app/orders/page.tsx`, `app/ledger/page.tsx`, and `app/recon/page.tsx` are accessible placeholder views for later tasks.

## Environment Behavior

`getApiUrl()` returns `NEXT_PUBLIC_API_URL` when it is a non-empty value and otherwise returns `http://localhost:3000`. `isMockMode()` is true only when `NEXT_PUBLIC_USE_MOCKS` equals the string `true`. `getEnvLabel()` returns the parsed host, including a port when present; if parsing fails, it returns the original non-empty value rather than crashing the shell.

The top-bar badge is green for localhost and loopback hosts, yellow for hostnames containing `staging`, and red for all other hosts.

`.env.local` configures the localhost API URL and enables mock mode for local development.

## Formatting Behavior

`formatCurrency()` renders US dollars with a dollar sign, grouping separators, and exactly two fraction digits. `formatQty()` renders at most six fraction digits and omits insignificant trailing zeroes. `formatDate()` turns a valid ISO timestamp into a readable local date and time.

## Interface and Visual Design

The application uses a desktop-first two-column shell. A fixed-width left sidebar contains the three feature links. The right column contains a compact top bar and a scrollable main content region. Route placeholders use a consistent heading and explanatory copy so navigation and shell behavior can be verified before feature work begins.

shadcn/ui supplies reusable primitives requested by TASK-01. Tailwind CSS 4 remains CSS-first, with `@import "tailwindcss"` preserved in the global stylesheet. The visual treatment is intentionally restrained and optimized for quick scanning by an internal developer team.

## Error Handling

- Unknown mock requests return `{ error: { status: 404, data: ... } }` rather than throwing.
- Real network and HTTP failures retain `fetchBaseQuery`'s standard error shape.
- Missing API environment configuration falls back to localhost.
- Invalid environment URLs do not prevent the top bar from rendering.
- Invalid date input is handled deterministically by the formatter rather than producing an uncaught exception.

## Testing Strategy

Vitest runs in jsdom with React Testing Library and jest-dom matchers. Tests are written before production behavior and cover:

- USD, zero-value, quantity precision, and readable date formatting.
- API URL fallback, mock-mode parsing, valid host extraction, and malformed URL fallback.
- Known mock route responses and unknown-route 404 behavior.
- Sidebar navigation and active route state.
- Top-bar application identity and environment label.

Each behavior is first observed failing for the expected missing-feature reason. After implementation, the focused tests, complete test suite, ESLint, TypeScript/build checks, and the Next.js production build must pass without warnings attributable to the change.

## Acceptance Criteria

The implementation is complete when every acceptance criterion in TASK-01 passes: dependencies are installed; Redux and RTK Query are usable; mock mode avoids network requests; the application shell and route highlighting render correctly; the environment badge is accurate; `/` redirects to `/orders`; domain types compile; formatting utilities and mock routing behave as specified; placeholder feature routes are reachable; and tests, lint, and production build all succeed.
