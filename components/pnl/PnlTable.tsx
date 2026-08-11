"use client";

import { PnlSummary } from '@/components/pnl/PnlSummary';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGetPnlQuery } from '@/lib/api/pnlApi';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/formatters';

const pnlClass = (value: number) => cn(value >= 0 ? 'text-emerald-600' : 'text-destructive');

interface PnlTableProps {
  endUserId: string;
  clientId: string;
}

export function PnlTable({ endUserId, clientId }: PnlTableProps) {
  const query = useGetPnlQuery(
    { endUserId, clientId },
    { skip: !endUserId },
  );
  if (!endUserId) return <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Select an end user above to view P&amp;L.</div>;
  if (query.isLoading) return <Skeleton className="h-72 w-full rounded-xl" />;
  if (query.isError) return <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-destructive">P&amp;L could not be loaded.</div>;
  const entries = query.data ?? [];
  if (!entries.length) return <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">No P&amp;L data available.</div>;
  return <div className="grid gap-5"><PnlSummary entries={entries} /><section className="overflow-hidden rounded-xl border bg-card shadow-sm"><Table><TableHeader><TableRow><TableHead>Symbol</TableHead><TableHead>Realized P&amp;L</TableHead><TableHead>Unrealized P&amp;L</TableHead><TableHead>Total P&amp;L</TableHead></TableRow></TableHeader><TableBody>{entries.map((entry) => <TableRow key={entry.symbol}><TableCell className="font-medium">{entry.symbol}</TableCell><TableCell className={pnlClass(entry.realizedPnl)}>{formatCurrency(entry.realizedPnl)}</TableCell><TableCell className={pnlClass(entry.unrealizedPnl)}>{formatCurrency(entry.unrealizedPnl)}</TableCell><TableCell className={pnlClass(entry.totalPnl)}>{formatCurrency(entry.totalPnl)}</TableCell></TableRow>)}</TableBody></Table></section></div>;
}
