# Task 03: Frontend — lib/types Additions

**Status:** pending
**HLD Reference:** Technical Implementation — Types layer

## Description

Add new TypeScript interfaces to the `lib/types/` directory to support all 7 feature gaps. These type definitions are the foundation for the RTK Query adapters, API slices, and UI components in subsequent tasks. No runtime logic is added here — types only.

## Acceptance Criteria

- [ ] `lib/types/user.ts` exports `SymbolMeta` interface
- [ ] `lib/types/balance.ts` (new file) exports `UserBalance` interface
- [ ] `lib/types/activity.ts` (new file) exports `Activity` and `PaginatedActivities` interfaces
- [ ] `lib/types/trade.ts` has `extendedHours?: boolean` added to `PlaceOrderRequest`, `PlaceRedemptionRequest`, and `TradeFormValues`
- [ ] `lib/types/trade.ts` exports `ReplaceOrderRequest` interface
- [ ] TypeScript compiler (`tsc --noEmit`) passes with no new errors
- [ ] No `any` types introduced

## Dependencies

- **Depends on:** —
- **Blocks:** Task 04, Task 05, Task 06, Task 07, Task 14

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `lib/types/user.ts` | Modify | Add `SymbolMeta` interface |
| `lib/types/balance.ts` | Create | `UserBalance` interface |
| `lib/types/activity.ts` | Create | `Activity` and `PaginatedActivities` interfaces |
| `lib/types/trade.ts` | Modify | Add `extendedHours` to three interfaces; add `ReplaceOrderRequest` |

## Unit Tests

N/A — covered by integration tests. TypeScript compiler is the primary validation. Run `npx tsc --noEmit` after this task to verify.

## Implementation Hints

**`lib/types/user.ts` — SymbolMeta:**
```typescript
export interface SymbolMeta {
  readonly ticker: string;
  readonly tradable: boolean;
  readonly fractionable: boolean;
  readonly tradableOvernight: boolean;
}
```

**`lib/types/balance.ts` — UserBalance:**
```typescript
export interface UserBalance {
  readonly available: number;
  readonly held: number;
  readonly total: number;
}
```

**`lib/types/activity.ts` — Activity:**
```typescript
export interface Activity {
  readonly id: string;
  readonly type: 'BUY' | 'SELL';
  readonly symbol: string;
  readonly qty: number;
  readonly amount: number;
  readonly price?: number;
  readonly state: string;
  readonly alpacaFillId: string;
  readonly referenceId: string;
  readonly createdAt: string;
}

export interface PaginatedActivities {
  items: Activity[];
  nextCursor: string | null;
  totalCount: number;
}
```

**`lib/types/trade.ts` — additions:**
- Add `readonly extendedHours?: boolean` to `PlaceOrderRequest`, `PlaceRedemptionRequest`, and `TradeFormValues`
- Add new `ReplaceOrderRequest` interface:
```typescript
export interface ReplaceOrderRequest {
  readonly id: string;
  readonly qty?: string;
  readonly limitPrice?: string;
  readonly tif?: TimeInForce;
}
```

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-08-05 | Initial task created |
