import { Button } from '@/components/ui/button';
import type { OrderType } from '@/lib/types/order';

interface Props { readonly value: OrderType; readonly onChange: (value: OrderType) => void; readonly disabled?: boolean }

export function OrderTypeToggle({ value, onChange, disabled }: Props) {
  return (
    <fieldset className="grid gap-1.5" disabled={disabled}>
      <legend className="text-xs font-medium text-muted-foreground">Order type</legend>
      <div className="grid grid-cols-2 gap-2">
        {(['MARKET', 'LIMIT'] as const).map((type) => (
          <Button key={type} type="button" variant={value === type ? 'default' : 'outline'} onClick={() => onChange(type)} disabled={disabled}>{type}</Button>
        ))}
      </div>
    </fieldset>
  );
}
