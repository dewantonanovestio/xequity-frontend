"use client";

import { useGetBalanceQuery } from "@/lib/api/balanceApi";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils/formatters";

function Stat({
  label,
  value,
  isLoading,
}: {
  label: string;
  value: number;
  isLoading: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {isLoading ? (
        <Skeleton className="mt-1 h-5 w-24" />
      ) : (
        <p className="mt-0.5 text-lg font-semibold tabular-nums">
          {formatCurrency(value)}
        </p>
      )}
    </div>
  );
}

interface ClientBalanceCardProps {
  clientId: string;
}

export function ClientBalanceCard({ clientId }: ClientBalanceCardProps) {
  const { data: balance, isLoading } = useGetBalanceQuery(
    clientId,
    { pollingInterval: 10000 },
  );

  return (
    <Card>
      <CardContent className="flex flex-wrap gap-8 py-4">
        <Stat
          label="Available (USDT)"
          value={balance?.available ?? 0}
          isLoading={isLoading}
        />
        <Stat
          label="Held (USDT)"
          value={balance?.held ?? 0}
          isLoading={isLoading}
        />
        <Stat
          label="Total (USDT)"
          value={balance?.total ?? 0}
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  );
}
