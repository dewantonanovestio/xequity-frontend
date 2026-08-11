# Task 01: Backend — BalanceModule + GET /balance Endpoint

**Status:** pending
**HLD Reference:** Technical Implementation — BalanceModule (Backend); Security Considerations

## Description

Create a new NestJS `BalanceModule` that exposes `GET /balance?clientId=<uuid>` returning the available/held/total balance for a given client. The balance is aggregated from `CLIENT_AVAILABLE` and `CLIENT_HOLD` ledger accounts. The aggregation logic must live in a `BalanceService` (not inline in the controller) so it can be reused to eventually DRY up `AdminLedgerController`.

## Acceptance Criteria

- [ ] `GET /balance?clientId=<valid-uuid>` returns `{ available: "50000.000000", held: "1200.500000", total: "51200.500000" }`
- [ ] `GET /balance?clientId=<invalid-uuid>` returns HTTP 400 (ParseUUIDPipe rejection)
- [ ] `GET /balance?clientId=<unknown-uuid>` returns HTTP 404
- [ ] `BalanceService.getBalanceForClient(clientId)` is a standalone injectable method (not inlined in controller)
- [ ] `BalanceModule` is registered in `app.module.ts`
- [ ] Swagger annotation shows `BalanceResponseDto` shape on the endpoint

## Dependencies

- **Depends on:** —
- **Blocks:** Task 06 (balanceApi frontend)

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `src/modules/balance/balance.module.ts` | Create | NestJS module registration |
| `src/modules/balance/balance.controller.ts` | Create | `GET /balance?clientId=` endpoint |
| `src/modules/balance/balance.service.ts` | Create | Aggregation logic for CLIENT_AVAILABLE + CLIENT_HOLD |
| `src/modules/balance/dto/balance-response.dto.ts` | Create | `{ available, held, total }` with @ApiProperty |
| `src/app.module.ts` | Modify | Add `BalanceModule` to imports array |

## Unit Tests

| Test Class | Purpose |
|------------|---------|
| `src/modules/balance/balance.service.spec.ts` | Test balance aggregation logic |

- **Positive scenarios:** Two accounts (AVAILABLE + HOLD) for a known `clientId` — returns correct decimal sum as strings. Only AVAILABLE account present — `held` is `"0.000000"`.
- **Negative scenarios:** Unknown `clientId` — service throws `NotFoundException`. Invalid UUID — controller rejects via `ParseUUIDPipe` before service is called.
- **Mocking strategy:** Mock `RepositoryService.ledgerAccountRepo.find()` to return controlled `LedgerAccount[]` fixtures.

## Implementation Hints

- **Pattern to follow:** Look at `AdminLedgerController.getBalances()` (`src/modules/admin/admin-ledger.controller.ts`) for the aggregation logic — specifically the `AccountType.CLIENT_AVAILABLE` + `AccountType.CLIENT_HOLD` filter and the `addMoney()` utility for decimal addition.
- **Service method signature:** `async getBalanceForClient(clientId: string): Promise<BalanceResponseDto>`
- **Controller path:** `@Controller('balance')` — no prefix (no global prefix set in `main.ts`)
- **Security (M1):** Apply `ParseUUIDPipe` to `clientId` query param. Production will derive `clientId` from JWT — see Security Considerations in HLD.
- **`total` field:** `total = available + held` using the same `addMoney()` utility.

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-08-05 | Initial task created |
