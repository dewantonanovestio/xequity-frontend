# Task 04: Frontend — adaptSymbolMeta Adapter + Update userApi

**Status:** pending
**HLD Reference:** Technical Implementation — SymbolSelect + OrderForm Asset Filtering

## Description

Add `adaptSymbolMeta()` to the adapters file and update `useGetSymbolsQuery` to return `SymbolMeta[]`. This is a **breaking change** — `GET /symbols` now returns objects (`{ ticker, tradable, fractionable, tradableOvernight }`) instead of strings. The existing `adaptSymbols` reads `item.symbol` but the new backend uses `item.ticker`. Must be deployed with Task 02 (backend enrichment).

## Acceptance Criteria

- [ ] `adaptSymbolMeta()` correctly maps `[{ ticker: "AAPL", tradable: true, fractionable: true, tradableOvernight: false }]` → `SymbolMeta[]`
- [ ] `adaptSymbolMeta()` filters items with empty/null `ticker`
- [ ] `adaptSymbolMeta()` defaults `tradable=true`, `fractionable=true`, `tradableOvernight=false` when fields are missing
- [ ] `useGetSymbolsQuery` return type is `SymbolMeta[]` (not `string[]`)
- [ ] Existing unit tests for `adaptSymbols` continue to pass
- [ ] New unit tests added for `adaptSymbolMeta` in `lib/api/__tests__/adapters.test.ts`

## Dependencies

- **Depends on:** Task 03 (SymbolMeta type)
- **Blocks:** Task 09 (SymbolSelect + OrderForm filtering)
- **⚠️ Deployment:** Must be deployed in the same release as Task 02 (backend symbols enrichment). The existing `adaptSymbols` reads `item.symbol`; new DTO uses `ticker`. If these are deployed separately, the symbol dropdown will be empty.

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `lib/api/adapters.ts` | Modify | Add `adaptSymbolMeta()` function |
| `lib/api/userApi.ts` | Modify | Change `getSymbols` to `build.query<SymbolMeta[], void>`, use `adaptSymbolMeta` |
| `lib/api/__tests__/adapters.test.ts` | Modify | Add unit tests for `adaptSymbolMeta` |

## Unit Tests

| Test Class | Purpose |
|------------|---------|
| `lib/api/__tests__/adapters.test.ts` | Test `adaptSymbolMeta` with various input shapes |

- **Positive scenarios:** Full object input → all four fields populated. Input with `tradableOvernight` missing → defaults to `false`.
- **Negative scenarios:** Item with `ticker: ""` — filtered out. Non-array input — returns `[]`. Input with `tradable` missing — defaults to `true`.
- **Mocking strategy:** Pure function, no mocks needed.

## Implementation Hints

- **`adaptSymbolMeta` signature:**
  ```typescript
  export function adaptSymbolMeta(value: unknown): SymbolMeta[] {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item) => isRecord(item) && Boolean(asString(item.ticker)))
      .map((item) => ({
        ticker: asString(item.ticker),
        tradable: item.tradable !== false,      // default true
        fractionable: item.fractionable !== false, // default true
        tradableOvernight: Boolean(item.tradableOvernight ?? false),
      }));
  }
  ```
- **Do not remove `adaptSymbols`** — it may still be used in mock handling or admin flows. Add `adaptSymbolMeta` as a new export alongside it.
- **`userApi.ts`:** Change `transformResponse: adaptSymbols` → `transformResponse: adaptSymbolMeta`.

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-08-05 | Initial task created |
