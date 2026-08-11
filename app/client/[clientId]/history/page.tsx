"use client";

import { useParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { OrderTable } from "@/components/orders/OrderTable";
import { UserOrderActions } from "@/components/orders/UserOrderActions";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetOrdersQuery, useGetRedemptionsQuery } from "@/lib/api/ordersApi";

function HistoryContent() {
  const { clientId } = useParams<{ clientId: string }>();
  const router = useRouter();
  const query = { clientId, limit: 100 };
  const options = { pollingInterval: 5000 };
  const orders = useGetOrdersQuery(query, options);
  const redemptions = useGetRedemptionsQuery(query, options);
  const isError = orders.isError || redemptions.isError;
  const rows = isError ? [] : [...(orders.data?.items ?? []), ...(redemptions.data?.items ?? [])];
  return (
    <section className="mx-auto grid w-full max-w-[1500px] gap-5">
      <header>
        <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">Activity</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Order History</h1>
        <p className="mt-1 text-sm text-muted-foreground">All buy and sell orders for this client.</p>
      </header>
      {isError ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-destructive">Order history could not be loaded.</div>
      ) : (
        <OrderTable
          orders={rows}
          isLoading={orders.isLoading || redemptions.isLoading}
          filterKey={clientId}
          onOpenOrder={(id) => {
            const selected = rows.find((row) => row.id === id);
            router.push(`/client/${clientId}/orders/${id}${selected?.side === "SELL" ? "?kind=redemption" : "?kind=order"}`);
          }}
          actions={(order) => <UserOrderActions order={order} />}
        />
      )}
    </section>
  );
}

export default function HistoryPage() {
  return <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}><HistoryContent /></Suspense>;
}
