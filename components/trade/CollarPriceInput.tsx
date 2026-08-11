import { Input } from '@/components/ui/input';

function withinDecimals(value: string, max: number): boolean {
  const dot = value.indexOf('.');
  return dot === -1 || value.length - dot - 1 <= max;
}

interface Props {
  readonly limitPrice: string;
  readonly collarPrice: string;
  readonly onLimitPriceChange: (value: string) => void;
  readonly onCollarPriceChange: (value: string) => void;
}

export function CollarPriceInput(props: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Limit price
        <Input aria-label="Limit price" type="number" min="0" step="any" value={props.limitPrice} onChange={(event) => { if (withinDecimals(event.target.value, 2)) props.onLimitPriceChange(event.target.value); }} />
      </label>
      <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Collar price (optional)
        <Input aria-label="Collar price" type="number" min="0" step="any" value={props.collarPrice} onChange={(event) => { if (withinDecimals(event.target.value, 2)) props.onCollarPriceChange(event.target.value); }} />
      </label>
    </div>
  );
}
