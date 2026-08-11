# Task 09: Frontend — SymbolSelect + OrderForm Asset Filtering

**Status:** pending
**HLD Reference:** Technical Implementation — SymbolSelect + OrderForm Asset Filtering

## Description

Update `SymbolSelect` to accept `SymbolMeta[]` (instead of `string[]`) and filter non-tradable symbols. Update `OrderForm` to pass the enriched symbol data and expose `selectedSymbolMeta` for use by the extended hours toggle (Task 14).

## Acceptance Criteria

- [ ] `SymbolSelect` accepts `symbols: SymbolMeta[]` prop (not `string[]`)
- [ ] `SymbolSelect` only renders symbols where `tradable === true`
- [ ] Symbol ticker strings are used as both option value and label
- [ ] `OrderForm` derives `selectedSymbolMeta` from `symbolsQuery.data` and current `symbol` state
- [ ] `OrderForm` reads `side`, `symbol`, `qty` from `useSearchParams()` and pre-fills form on mount
- [ ] Pre-fill only runs once (use a `useRef` flag)
- [ ] Existing `OrderForm` tests pass without changes

## Dependencies

- **Depends on:** Task 04 (adaptSymbolMeta + SymbolMeta[] from userApi)
- **Blocks:** —

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `components/trade/SymbolSelect.tsx` | Modify | Accept `SymbolMeta[]`, filter `tradable === true` |
| `components/trade/OrderForm.tsx` | Modify | Pass `SymbolMeta[]` to SymbolSelect; read search params for pre-fill; derive `selectedSymbolMeta` |

## Unit Tests

| Test Class | Purpose |
|------------|---------|
| `components/trade/__tests__/OrderForm.test.tsx` | Add tests for query param pre-fill |
| `components/portfolio/__tests__/HoldingsTable.test.tsx` | Add test for Close button navigation |

- **Positive scenarios:**
  - `SymbolSelect` with `[{ ticker: "AAPL", tradable: true }, { ticker: "SPY", tradable: false }]` — only "AAPL" appears as an option
  - `OrderForm` with `?side=SELL&symbol=AAPL&qty=10` in URL — form pre-fills correctly on mount
- **Negative scenarios:**
  - `SymbolSelect` with all non-tradable symbols — dropdown is empty
  - URL params absent — form initializes with defaults (empty symbol, BUY side)
- **Mocking strategy:** Mock `useGetSymbolsQuery` to return `SymbolMeta[]`. Mock `useSearchParams` for pre-fill tests.

## Implementation Hints

**`SymbolSelect.tsx` change:**
```tsx
// Change prop type
interface SymbolSelectProps {
  symbols: SymbolMeta[];  // was: string[]
  // ...rest unchanged
}

// Inside component
const tradableSymbols = symbols.filter(s => s.tradable);
// Map over tradableSymbols using s.ticker as value and label
```

**`OrderForm.tsx` search params pre-fill:**
```tsx
const searchParams = useSearchParams();
const prefillApplied = useRef(false);

useEffect(() => {
  if (prefillApplied.current) return;
  const side = searchParams.get('side');
  const symbol = searchParams.get('symbol');
  const qty = searchParams.get('qty');
  if (side === 'SELL' || side === 'BUY') setSide(side);
  if (symbol) setSymbol(symbol);
  if (qty) setAmount(qty);
  prefillApplied.current = true;
}, [searchParams]);
```

**`selectedSymbolMeta` derivation (for Task 14):**
```tsx
const selectedSymbolMeta = symbolsQuery.data?.find(s => s.ticker === symbol);
```
Pass this as a prop or context value for `ExtendedHoursToggle`.

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-08-05 | Initial task created |
