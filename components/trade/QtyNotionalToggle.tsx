import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { InputMode } from '@/lib/types/trade';

interface Props {
  readonly mode: InputMode;
  readonly value: string;
  readonly onModeChange: (mode: InputMode) => void;
  readonly onValueChange: (value: string) => void;
}

function withinDecimals(value: string, max: number): boolean {
  const dot = value.indexOf('.');
  return dot === -1 || value.length - dot - 1 <= max;
}

export function QtyNotionalToggle({ mode, value, onModeChange, onValueChange }: Props) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="trade-amount" className="text-xs font-medium text-muted-foreground">
          {mode === 'qty' ? 'Quantity' : 'Dollar amount'}
        </label>
        <div className="flex gap-1">
          {(['qty', 'notional'] as const).map((option) => (
            <Button key={option} type="button" size="xs" variant={mode === option ? 'secondary' : 'ghost'} onClick={() => onModeChange(option)}>
              {option === 'qty' ? 'Qty' : 'Notional'}
            </Button>
          ))}
        </div>
      </div>
      <Input id="trade-amount" type="number" min="0" step="any" value={value} placeholder={mode === 'qty' ? '10' : '1000.00'} onChange={(event) => { if (withinDecimals(event.target.value, mode === 'qty' ? 9 : 2)) onValueChange(event.target.value); }} />
    </div>
  );
}
