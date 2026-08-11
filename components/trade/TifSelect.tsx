import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TimeInForce } from '@/lib/types/trade';

interface Props { readonly value: TimeInForce; readonly onChange: (value: TimeInForce) => void; readonly disabled?: boolean }
const options: TimeInForce[] = ['DAY', 'GTC', 'IOC', 'FOK'];

export function TifSelect({ value, onChange, disabled }: Props) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
      Time in force
      <Select modal={false} value={value} onValueChange={(next) => onChange(String(next) as TimeInForce)} disabled={disabled}>
        <SelectTrigger aria-label="Time in force" className="w-full" disabled={disabled}><SelectValue>{value}</SelectValue></SelectTrigger>
        <SelectContent>{options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
      </Select>
    </label>
  );
}
