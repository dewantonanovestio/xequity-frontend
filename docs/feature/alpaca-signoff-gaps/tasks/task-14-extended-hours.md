# Task 14: Frontend — Extended Hours Toggle in OrderForm

**Status:** pending
**HLD Reference:** Technical Implementation — OrderForm (extended hours); FR-05

## Description

Add an always-visible Extended Hours checkbox to `OrderForm`. Enabling it forces `type` to `LIMIT` (locks `OrderTypeToggle`), shows the limit price field, and includes `extendedHours: true` in the submitted order payload. If the selected symbol has `tradableOvernight === false`, show an informational warning.

## Acceptance Criteria

- [ ] Extended hours checkbox is always visible in the form, unchecked by default
- [ ] Enabling the checkbox forces `type` to `LIMIT`
- [ ] `OrderTypeToggle` is disabled while extended hours is enabled
- [ ] Limit price field (`CollarPriceInput` or equivalent) renders when extended hours is enabled
- [ ] Warning text shown when `selectedSymbolMeta.tradableOvernight === false` and extended hours is enabled
- [ ] Disabling the checkbox unlocks the type toggle (user retains their last chosen type)
- [ ] `buildPlaceOrderRequest` includes `extendedHours: true` in payload when enabled
- [ ] `buildPlaceRedemptionRequest` includes `extendedHours: true` in payload when enabled

## Dependencies

- **Depends on:** Task 03 (extendedHours in TradeFormValues + PlaceOrderRequest)
- **Blocks:** —

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `components/trade/ExtendedHoursToggle.tsx` | Create | Checkbox with label and optional warning |
| `components/trade/OrderForm.tsx` | Modify | Add `extendedHours` state; force LIMIT; disable type toggle; wire to builders |
| `lib/trade/tradeUtils.ts` | Modify | Include `extendedHours` in both `buildPlaceOrderRequest` and `buildPlaceRedemptionRequest` |

## Unit Tests

| Test Class | Purpose |
|------------|---------|
| `components/trade/__tests__/OrderForm.test.tsx` | Add extended hours toggle behavior tests |
| `lib/trade/__tests__/tradeUtils.test.ts` | Test extendedHours in request builders |

- **Positive scenarios:** Checking extended hours → type forced to LIMIT → limit price field visible. `buildPlaceOrderRequest` with `extendedHours: true` → output includes `extendedHours: true`.
- **Negative scenarios:** Symbol with `tradableOvernight: false` + extended hours enabled → warning text appears. Unchecking → type toggle re-enabled.
- **Mocking strategy:** Mock `useAppSelector`, `useGetSymbolsQuery` in component tests. Pure function tests for `tradeUtils`.

## Implementation Hints

**`ExtendedHoursToggle.tsx`:**
```tsx
import { Checkbox } from "@/components/ui/checkbox";

interface ExtendedHoursToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  showOvernightWarning?: boolean;
}

export function ExtendedHoursToggle({ checked, onChange, disabled, showOvernightWarning }: ExtendedHoursToggleProps) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <Checkbox checked={checked} onCheckedChange={(v) => onChange(Boolean(v))} disabled={disabled} />
        Extended hours
      </label>
      {showOvernightWarning && (
        <p className="text-xs text-yellow-600">This symbol may not support extended hours trading.</p>
      )}
    </div>
  );
}
```

**`OrderForm.tsx` state:**
```tsx
const [extendedHours, setExtendedHours] = useState(false);

// Force LIMIT when extended hours enabled:
const handleExtendedHoursChange = (checked: boolean) => {
  setExtendedHours(checked);
  if (checked) setType('LIMIT');
};

// In values spread:
const values: TradeFormValues = { ..., extendedHours };
```

**`tradeUtils.ts` builder change:**
```typescript
export function buildPlaceOrderRequest(values: TradeFormValues, user: EndUser): PlaceOrderRequest {
  return {
    // ...existing fields
    ...(values.extendedHours ? { extendedHours: true } : {}),
  };
}
```
Same pattern for `buildPlaceRedemptionRequest`.

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-08-05 | Initial task created |
