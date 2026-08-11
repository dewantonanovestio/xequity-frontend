"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from 'next/navigation';

import { useGetHoldingsQuery, useGetPricingQuery } from "@/lib/api/portfolioApi";
import type { Holding } from "@/lib/types/user";
import { formatCurrency, formatQty } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface PricedHoldingProps {
  readonly holding: Holding;
  readonly clientId: string;
  readonly onValue: (symbol: string, marketValue: number, pnl: number) => void;
  readonly onClose: (symbol: string, qty: number) => void;
}

function PricedHolding({ holding, clientId, onValue, onClose }: PricedHoldingProps) {
  const pricing = useGetPricingQuery(
    { symbol: holding.symbol, clientId },
    { pollingInterval: 10_000, skip: !clientId },
  );
  const price = pricing.data?.sellPrice;
  const marketValue = price === undefined ? null : holding.qty * price;
  const pnl = price === undefined ? null : (price - holding.avgCost) * holding.qty;

  useEffect(() => {
    if (marketValue !== null && pnl !== null) {
      onValue(holding.symbol, marketValue, pnl);
    }
  }, [holding.symbol, marketValue, onValue, pnl]);

  return (
    <TableRow>
      <TableCell className="font-medium">{holding.symbol}</TableCell>
      <TableCell>{formatQty(holding.qty)}</TableCell>
      <TableCell>{formatCurrency(holding.avgCost)}</TableCell>
      <TableCell>{price === undefined ? "N/A" : formatCurrency(price)}</TableCell>
      <TableCell>{marketValue === null ? "N/A" : formatCurrency(marketValue)}</TableCell>
      <TableCell className={cn(pnl !== null && (pnl >= 0 ? "text-emerald-600" : "text-destructive"))}>
        {pnl === null ? "N/A" : formatCurrency(pnl)}
      </TableCell>
      <TableCell>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onClose(holding.symbol, holding.qty)
          }
        >
          Close
        </Button>
      </TableCell>
    </TableRow>
  );
}

interface HoldingsTableProps {
  endUserId: string;
  clientId: string;
}

export function HoldingsTable({ endUserId, clientId }: HoldingsTableProps) {
  const router = useRouter();
  const holdingsQuery = useGetHoldingsQuery(endUserId, { skip: !endUserId });
  const [totals, setTotals] = useState<Record<string, { marketValue: number; pnl: number }>>({});
  const setTotal = useCallback((symbol: string, marketValue: number, pnl: number) => {
    setTotals((current) => {
      const previous = current[symbol];
      if (previous?.marketValue === marketValue && previous.pnl === pnl) return current;
      return { ...current, [symbol]: { marketValue, pnl } };
    });
  }, []);
  const handleClose = useCallback((symbol: string, qty: number) => {
    router.push(`/trade?side=SELL&symbol=${symbol}&qty=${qty}`);
  }, [router]);

  if (!endUserId) return <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Select an end user above to view their portfolio.</div>;
  if (holdingsQuery.isLoading) return <Skeleton className="h-72 w-full rounded-xl" />;
  if (holdingsQuery.isError) return <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-destructive">Portfolio could not be loaded.</div>;
  const holdings = (holdingsQuery.data ?? []).slice(0, 5);
  if (!holdings.length) return <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">No holdings available.</div>;

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <Table>
        <TableHeader><TableRow><TableHead>Symbol</TableHead><TableHead>Qty</TableHead><TableHead>Avg Cost</TableHead><TableHead>Current Price</TableHead><TableHead>Market Value</TableHead><TableHead>Unrealized P&amp;L</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
        <TableBody>{holdings.map((holding) => <PricedHolding key={holding.symbol} holding={holding} clientId={clientId} onValue={setTotal} onClose={handleClose} />)}</TableBody>
        <TableFooter><TableRow><TableCell colSpan={5}>Total</TableCell><TableCell>{formatCurrency(Object.values(totals).reduce((sum, row) => sum + row.marketValue, 0))}</TableCell><TableCell>{formatCurrency(Object.values(totals).reduce((sum, row) => sum + row.pnl, 0))}</TableCell></TableRow></TableFooter>
      </Table>
    </section>
  );
}
