# Task 06: Frontend — balanceApi.ts + adaptBalance Adapter

**Status:** pending
**HLD Reference:** Technical Implementation — TradePageHeader balance widget

## Description

Create the RTK Query API slice for the balance endpoint (`GET /balance?clientId=<uuid>`) and the `adaptBalance` adapter function. Requires Task 01 (backend `BalanceModule`) to be deployed.

## Acceptance Criteria

- [ ] `useGetBalanceQuery(clientId)` hook is exported and callable
- [ ] Calling with a valid `clientId` fetches `GET /balance?clientId=<uuid>`
- [ ] `adaptBalance` correctly coerces decimal strings (`"50000.000000"`) to numbers (`50000`)
- [ ] `adaptBalance` returns `{ available: 0, held: 0, total: 0 }` for missing/malformed input
- [ ] Mock mode returns data from `lib/mocks/balance.json`

## Dependencies

- **Depends on:** Task 01 (backend BalanceModule), Task 03 (UserBalance type)
- **Blocks:** Task 08 (TradePageHeader)

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `lib/api/adapters.ts` | Modify | Add `adaptBalance()` function |
| `lib/api/balanceApi.ts` | Create | `useGetBalanceQuery` RTK slice |
| `lib/mocks/balance.json` | Create | Mock balance data for development |

## Unit Tests

| Test Class | Purpose |
|------------|---------|
| `lib/api/__tests__/adapters.test.ts` | Test `adaptBalance` decimal coercion |

- **Positive scenarios:** `"50000.000000"` → `50000`. All three fields present → correct `UserBalance`.
- **Negative scenarios:** Missing fields → defaults to `0`. Non-record input → `{ available: 0, held: 0, total: 0 }`.
- **Mocking strategy:** Pure function, no mocks needed.

## Implementation Hints

**`adaptBalance` in `adapters.ts`:**
```typescript
export function adaptBalance(value: unknown): UserBalance {
  if (!isRecord(value)) return { available: 0, held: 0, total: 0 };
  return {
    available: asNumber(value.available),
    held: asNumber(value.held),
    total: asNumber(value.total),
  };
}
```

**`balanceApi.ts`:**
```typescript
export const balanceApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getBalance: build.query<UserBalance, string>({
      query: (clientId) => `/balance?clientId=${encodeURIComponent(clientId)}`,
      transformResponse: adaptBalance,
      providesTags: ['Balances'],
    }),
  }),
});
export const { useGetBalanceQuery } = balanceApi;
```

**`lib/mocks/balance.json`:**
```json
{ "available": "50000.000000", "held": "1200.500000", "total": "51200.500000" }
```

Note: The `"Balances"` tag already exists in `baseApi.ts` `tagTypes` — no change needed there.

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-08-05 | Initial task created |
