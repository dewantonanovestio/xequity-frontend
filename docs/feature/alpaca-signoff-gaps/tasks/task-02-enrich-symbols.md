# Task 02: Backend — Enrich GET /symbols to Return SymbolMetaDto

**Status:** pending
**HLD Reference:** Technical Implementation — Symbol Metadata Enrichment (Backend)

## Description

Change `GET /symbols` from returning `string[]` to returning `SymbolMetaDto[]`. Each item exposes `ticker`, `tradable`, `fractionable`, and `tradableOvernight` fields. These columns already exist on `SymbolEntity` and are synced daily by `AssetSyncJob`. This is a **breaking change** — it must be deployed atomically with Task 04 (frontend adapter update).

## Acceptance Criteria

- [ ] `GET /symbols` returns `[{ "ticker": "AAPL", "tradable": true, "fractionable": true, "tradableOvernight": false }, ...]`
- [ ] Only symbols with `status = ACTIVE` are returned
- [ ] Results are sorted by `ticker` ascending
- [ ] Swagger spec shows `SymbolMetaDto[]` (not `string[]`) for this endpoint
- [ ] Existing `listActive(): Promise<string[]>` method is preserved unchanged (admin code may call it)

## Dependencies

- **Depends on:** —
- **Blocks:** Task 04 (adaptSymbolMeta adapter)
- **⚠️ Deployment:** Must be deployed in the same release as Task 04. See HLD deployment notes.

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `src/modules/symbols/dto/symbol-meta.dto.ts` | Create | `SymbolMetaDto` with `@ApiProperty` decorators |
| `src/modules/symbols/symbols.service.ts` | Modify | Add `listActiveMeta(): Promise<SymbolMetaDto[]>` |
| `src/modules/symbols/public-symbols.controller.ts` | Modify | Call `listActiveMeta()`, update return type and Swagger annotation |

## Unit Tests

| Test Class | Purpose |
|------------|---------|
| `src/modules/symbols/symbols.service.spec.ts` | Test `listActiveMeta()` field selection and ordering |

- **Positive scenarios:** Returns all ACTIVE symbols with correct field mapping. `tradable = false` symbol is included (not filtered — filtering is frontend responsibility). Results sorted A→Z by ticker.
- **Negative scenarios:** Empty symbol table — returns `[]`. Symbols with null `tradableOvernight` — coerce to `false`.
- **Mocking strategy:** Mock `RepositoryService.symbolRepo.find()` with a fixture array of `SymbolEntity` objects.

## Implementation Hints

- **Pattern to follow:** `listActive()` in `symbols.service.ts` — add a parallel `listActiveMeta()` that selects `['ticker', 'tradable', 'fractionable', 'tradableOvernight']` using TypeORM's `select` option.
- **DTO field:** Use `ticker` (not `symbol`) — matches `SymbolEntity.ticker` column name. The frontend adapter must read `item.ticker`.
- **Controller change:** `@ApiOkResponse({ type: [SymbolMetaDto] })` replaces the current `string[]` annotation.
- **Backward compat:** Keep `listActive(): Promise<string[]>` unchanged for any internal callers.

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-08-05 | Initial task created |
