import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SymbolMeta } from '@/lib/types/user';

interface SymbolSelectProps {
  readonly symbols: SymbolMeta[];
  readonly value: string;
  readonly onChange: (value: string) => void;
}

export function SymbolSelect({ symbols, value, onChange }: SymbolSelectProps) {
  const tradable = symbols.filter((s) => s.tradable);
  return (
    <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
      Symbol
      <Select modal={false} value={value || null} onValueChange={(next) => onChange(String(next))}>
        <SelectTrigger aria-label="Symbol" className="w-full">
          <SelectValue>{value || 'Select symbol'}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {tradable.map((s) => <SelectItem key={s.ticker} value={s.ticker}>{s.ticker}</SelectItem>)}
        </SelectContent>
      </Select>
    </label>
  );
}
