"use client";

import { useGetPricingQuery } from "@/lib/api/portfolioApi";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils/formatters";

interface PriceQuoteCardProps {
  symbol: string;
  side: "BUY" | "SELL";
  clientId: string;
  qty?: string;
  notional?: string;
  limitPrice?: string;
}

export function PriceQuoteCard({
  symbol,
  side,
  clientId,
  qty,
  notional,
  limitPrice,
}: PriceQuoteCardProps) {
  const { data: pricing, isLoading, isError } = useGetPricingQuery(
    { symbol, clientId },
    { skip: !symbol || !clientId },
  );

  if (!symbol || !clientId) return null;

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-muted/30 p-3 grid gap-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
      </div>
    );
  }

  if (isError || !pricing) {
    return (
      <p className="text-sm text-destructive">
        Quote unavailable for {symbol}.
      </p>
    );
  }

  const marketPrice = side === "BUY" ? pricing.buyPrice : pricing.sellPrice;
  const spreadBps = side === "BUY" ? pricing.buySpreadBps : pricing.sellSpreadBps;
  const spreadAmount = Math.abs(marketPrice - pricing.rawPrice);
  const parsedQty = qty ? Number(qty) : null;
  const parsedNotional = notional ? Number(notional) : null;
  const parsedLimit = limitPrice ? Number(limitPrice) : null;

  // For limit orders, estimated cost uses the client's limit price.
  // For market orders (or when no limit provided), use the indicative market price.
  const effectivePrice =
    parsedLimit && parsedLimit > 0 ? parsedLimit : marketPrice;

  const estimatedTotal =
    parsedQty && parsedQty > 0
      ? parsedQty * effectivePrice
      : parsedNotional && parsedNotional > 0
        ? parsedNotional
        : null;

  return (
    <div className="rounded-lg border bg-muted/30 p-3 grid gap-1.5 text-sm">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Indicative quote
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-muted-foreground">Market price</span>
        <span className="tabular-nums">{formatCurrency(marketPrice)}</span>

        <span className="text-muted-foreground">Gross price</span>
        <span className="tabular-nums">{formatCurrency(pricing.rawPrice)}</span>

        <span className="text-muted-foreground">Spread</span>
        <span className="tabular-nums">
          {spreadBps} bps ({formatCurrency(spreadAmount)})
        </span>

        {parsedLimit && parsedLimit > 0 ? (
          <>
            <span className="text-muted-foreground">Your limit</span>
            <span className="font-medium tabular-nums">
              {formatCurrency(parsedLimit)}
            </span>
          </>
        ) : null}

        {estimatedTotal !== null ? (
          <>
            <span className="text-muted-foreground">
              {parsedLimit && parsedLimit > 0 ? "Max cost at limit" : "Est. total"}
            </span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(estimatedTotal)}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}
