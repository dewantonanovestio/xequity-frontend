"use client";

import { useGetBalanceQuery } from "@/lib/api/balanceApi";
import { useAppSelector } from "@/lib/store/hooks";
import { selectSelectedEndUser } from "@/lib/store/viewModeSlice";
import { formatCurrency } from "@/lib/utils/formatters";
import { Skeleton } from "@/components/ui/skeleton";

function BalanceStat({ label, value, isLoading }: { label: string; value: number; isLoading: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {isLoading ? <Skeleton className="mt-1 h-4 w-20" /> : <p className="font-medium">{formatCurrency(value)}</p>}
    </div>
  );
}

export function TradePageHeader() {
  const user = useAppSelector(selectSelectedEndUser);
  const { data: balance, isLoading } = useGetBalanceQuery(user?.clientId ?? "", { skip: !user });

  if (!user) return null;

  return (
    <div className="flex gap-6 rounded-xl border bg-card p-4 text-sm">
      <BalanceStat label="Available" value={balance?.available ?? 0} isLoading={isLoading} />
      <BalanceStat label="Held" value={balance?.held ?? 0} isLoading={isLoading} />
      <BalanceStat label="Total" value={balance?.total ?? 0} isLoading={isLoading} />
    </div>
  );
}
