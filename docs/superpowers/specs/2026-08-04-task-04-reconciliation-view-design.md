# TASK-04 Reconciliation View Design

**Date:** 2026-08-04
**Status:** Approved 2026-08-04
**Source requirements:** `docs/feature/developer-dashboard/tasks/task-04-recon-view.md`

## Purpose

Implement the dashboard's reconciliation workflow: a continuously refreshed cash comparison and per-symbol supply comparison with immediate visual break indicators and a confirmed manual cash-reconciliation action.

## Scope

This change implements TASK-04 only. It adds Reconciliation-domain RTK Query endpoints, balanced and unbalanced cash fixtures, supply fixtures, mock route behavior, the reconciliation page, cash and supply components, manual-run confirmation and feedback, and automated plus browser acceptance coverage.

Order Tracker and Ledger behavior, authentication, exports, drill-down routes, symbol controls, and real backend implementation remain outside this change. Existing shared UI, API, store, formatter, mock, and test infrastructure will be reused.

## Chosen Approach

Both cash scenarios live in `recon.json`, selected by an `activeCashScenario` fixture key that defaults to `balanced`. Developers can change that key to exercise the unbalanced page without adding non-production URL parameters or dashboard controls.

The rejected alternatives were a scenario query parameter, which would extend the production endpoint without backend support, and an in-page scenario toggle, which could be mistaken for an operational control and is not part of TASK-04.

## Architecture

`lib/api/reconApi.ts` injects `getCashRecon`, `getSupplyRecon`, and `runCashRecon` into the shared `baseApi`. The page calls both query hooks with a 30,000-millisecond polling interval and passes their typed results and request states into focused presentation components.

`CashRecon` owns the manual-run mutation because it is the sole consumer of that action and needs direct access to pending, success, and error state. `SupplyRecon` remains a pure presentation component. Each section handles its own loading, empty, and error state so one failed request never hides successful data from the other section.

## Data Contracts

The existing `CashRecon`, `SupplyRecon`, and `SymbolStatus` types remain the domain model. TASK-04 adds:

- `ReconScenario` as `balanced | unbalanced` for typed fixture selection inside mock handling.
- `RunCashReconResult` with `success: boolean` for the manual-run response.
- Presentation tone types and utilities for cash delta, supply residual, and symbol status.

No production query parameters are added. Polling is configured at hook call sites, not within endpoint definitions.

## Mock Data and Routing

`lib/mocks/recon.json` contains:

- `activeCashScenario: "balanced"`.
- `cashScenarios.balanced` with ledger and wallet totals of 80,700, a zero delta, an Alpaca float of 45,000, a projected requirement of 42,000, and the specified timestamp.
- `cashScenarios.unbalanced` with the same ledger total, a wallet balance of 80,650, and a signed delta of -50.
- Five supply rows for AAPL, TSLA, MSFT, GOOGL, and SPY.

AAPL, MSFT, GOOGL, and SPY are balanced and active. TSLA has the required residual of 0.000056 and `MINT_HALTED` status. Fixture quantities retain six-decimal precision where applicable.

`mockBaseQuery` resolves `GET /admin/recon/cash/detail` through the active scenario key, returns the supply array for `GET /admin/recon/supply`, and returns `{ success: true }` for `POST /admin/recon/cash`. The mutation has no fixture or module-state side effects. Unknown scenarios fall back to `balanced`, and unsupported methods or routes retain the shared typed 404 behavior.

## Reconciliation API

The endpoints are:

- `getCashRecon`: GET `/admin/recon/cash/detail`, returns `CashRecon`, provides `Recon`.
- `getSupplyRecon`: GET `/admin/recon/supply`, returns `SupplyRecon[]`, provides `Recon`.
- `runCashRecon`: POST `/admin/recon/cash`, returns `RunCashReconResult`, invalidates `Recon`.

Successful manual runs therefore refetch both cash and supply data immediately. The normal 30-second polling remains active afterward.

## Reconciliation Page

`app/recon/page.tsx` is a client page with a compact header followed by `CashRecon` and `SupplyRecon`. Both query hooks receive `{ pollingInterval: 30000 }`.

The page supplies `data ?? null` to cash and `data ?? []` to supply together with each query's loading and error flags. It does not collapse section errors into one page-level failure. A heading-shaped fallback is unnecessary because the page does not use asynchronous URL state; component-level skeletons cover initial loading.

## Cash Reconciliation

`CashRecon` is a card titled `Cash Reconciliation`. It presents six labeled values:

- USDT Ledger Total, formatted with `formatCurrency()`.
- USDT Wallet Balance, formatted with `formatCurrency()`.
- Delta, formatted with `formatCurrency()` so negative values render like `-$50.00`.
- USD Float at Alpaca, formatted with `formatCurrency()`.
- Projected Float Requirement, formatted with `formatCurrency()`.
- Last Recon Run, formatted with `formatDate()`.

The delta is a visually prominent row. Exact zero uses a green background, green text, a filled green indicator, and a `balanced` data tone. Any non-zero value uses the corresponding red treatment and an `unbalanced` data tone. The comparison uses exact zero because the backend contract already supplies the computed residual.

Loading renders card-shaped skeleton fields. A missing successful result renders `No cash reconciliation result is available.` A request failure renders a specific alert.

## Manual Cash Reconciliation

The `Run Recon Now` button opens a shadcn AlertDialog. The dialog title is `Run cash reconciliation?` and its description includes the required copy: `This will trigger a full cash reconciliation run. Continue?`

The mutation is not called until confirmation. While pending, the trigger, cancel, and confirm actions are disabled; the confirm action shows an animated loader and `Running…`. On success the dialog closes and an inline status reads `Cash reconciliation run triggered.` On failure the dialog closes and an inline alert uses the backend message when available, otherwise `The cash reconciliation run could not be started.` Feedback remains visible after RTK invalidation causes new query data to arrive.

## Supply Reconciliation

`SupplyRecon` is a card titled `Supply Reconciliation` containing a simple shadcn table. Columns are indicator, Symbol, On-Chain Supply, Alpaca Positions, Residual, and Status. No sorting, filtering, or pagination is introduced.

A reconciliation-specific formatter uses `Intl.NumberFormat("en-US", { minimumFractionDigits: 6, maximumFractionDigits: 6 })` so every supply quantity and residual displays exactly six decimal places. It remains local to the reconciliation domain because existing order quantities intentionally omit insignificant trailing zeroes.

Rows with an exact zero residual use a green dot, green residual text, and `balanced` data tone. Non-zero residuals use red and `unbalanced`. Status badges use:

- Green: `ACTIVE`.
- Red: `HALTED`.
- Amber: `MINT_HALTED` and `REDEEM_HALTED`.
- Gray: `RETIRED` and `DELISTING`.

Loading renders five table-shaped skeleton rows. An empty successful response renders `No supply reconciliation results are available.` A request failure renders a specific alert inside the table card.

## Error Handling

- Cash and supply failures remain independent.
- Initial requests render skeletons instead of zero-valued data.
- Empty successful responses remain distinct from failures.
- Mutation errors prefer a typed backend message and fall back to stable dashboard copy.
- Pending mutation controls cannot be triggered twice.
- A successful mutation invalidates both Reconciliation queries without mutating mock fixture files.
- Unknown mock scenario keys safely display the balanced scenario.

## Testing Strategy

Tests follow red-green-refactor cycles and cover:

- Reconciliation tone utilities and exactly-six-decimal formatting.
- Both fixture cash scenarios, active selection, five required symbols, TSLA residual/status, and realistic values.
- Mock GET routes, POST success, fallback scenario selection, and typed unknown-route behavior.
- RTK Query GET and POST contracts plus `Recon` invalidation behavior through the real store.
- Cash field labels, formatting, balanced/unbalanced indicators, loading, empty, and error states.
- Confirmation gating, exact dialog copy, pending spinner and disabled controls, mutation success, backend error, and fallback error feedback.
- Supply columns, all five rows, fixed precision, residual indicators, every status tone, loading, empty, and error states.
- Page composition, both 30-second polling options, independent section request states, and mutation-driven refetch integration.

Final verification requires the complete Vitest suite, ESLint, TypeScript checking, a Next.js production build, and browser checks of both sections, exact fixture values, balanced cash and broken TSLA indicators, confirmation cancellation, confirmed manual execution, loading/success feedback where observable, polling configuration through tests, and a clean browser console.

## Acceptance Criteria

TASK-04 is complete when every acceptance criterion in the source task passes with mock mode enabled: both sections render; all six cash fields and five supply rows are formatted correctly; balanced and broken indicators use the required tones; status badges map correctly; manual reconciliation requires confirmation and exposes pending state; both queries poll every 30 seconds; loading, empty, mutation, and request failures are handled; and automated plus browser verification are green.
