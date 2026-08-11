"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PnlEntry } from '@/lib/types/user';
import { formatCurrency } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';

export function PnlSummary({ entries }: { readonly entries: PnlEntry[] }) {
  const values = [
    ['Total Realized', entries.reduce((sum, row) => sum + row.realizedPnl, 0)],
    ['Total Unrealized', entries.reduce((sum, row) => sum + row.unrealizedPnl, 0)],
    ['Total P&L', entries.reduce((sum, row) => sum + row.totalPnl, 0)],
  ] as const;
  return <div className="grid gap-4 md:grid-cols-3">{values.map(([label, value]) => <Card key={label}><CardHeader><CardTitle className="text-sm text-muted-foreground">{label}</CardTitle></CardHeader><CardContent className={cn('text-2xl font-semibold', value >= 0 ? 'text-emerald-600' : 'text-destructive')}>{formatCurrency(value)}</CardContent></Card>)}</div>;
}
