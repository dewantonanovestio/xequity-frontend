"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { OrderFilters } from "@/components/orders/OrderFilters";
import { OrderTable } from "@/components/orders/OrderTable";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetOrdersQuery, useGetRedemptionsQuery } from "@/lib/api/ordersApi";
import { useGetClientsQuery } from "@/lib/api/clientApi";
import { BUY_ORDER_STATES, EMPTY_ORDER_FILTERS, REDEMPTION_STATES } from "@/lib/orders/orderUtils";
import { readOrderFilters, writeOrderFilters } from "@/lib/orders/filterParams";
import type { OrderQueryParams, OrderState } from "@/lib/types/order";

const pollingOptions = { pollingInterval: 5000 };

function AdminOrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientsQuery = useGetClientsQuery();
  const filters = readOrderFilters(new URLSearchParams(searchParams.toString()));
  const status = filters.status as OrderState | "";
  const commonQuery: OrderQueryParams = {
    ...(filters.clientId ? { clientId: filters.clientId } : {}),
    ...(filters.endUserId ? { endUserId: filters.endUserId } : {}),
    ...(filters.symbol ? { symbol: filters.symbol } : {}),
    ...(filters.fromDate ? { fromDate: filters.fromDate } : {}),
    ...(filters.toDate ? { toDate: filters.toDate } : {}),
    limit: 100,
  };
  const requestsOrders = !status || BUY_ORDER_STATES.has(status);
  const requestsRedemptions = !status || REDEMPTION_STATES.has(status);
  const ordersQuery = useGetOrdersQuery(
    { ...commonQuery, ...(status && requestsOrders ? { status } : {}) },
    { ...pollingOptions, ...(!requestsOrders ? { skip: true } : {}) },
  );
  const redemptionsQuery = useGetRedemptionsQuery(
    { ...commonQuery, ...(status && requestsRedemptions ? { status } : {}) },
    { ...pollingOptions, ...(!requestsRedemptions ? { skip: true } : {}) },
  );
  const isLoading = (requestsOrders && ordersQuery.isLoading) || (requestsRedemptions && redemptionsQuery.isLoading);
  const isError = (requestsOrders && ordersQuery.isError) || (requestsRedemptions && redemptionsQuery.isError);
  const combinedOrders = isError ? [] : [
    ...(ordersQuery.data?.items ?? []),
    ...(redemptionsQuery.data?.items ?? []),
  ];
  const filterKey = writeOrderFilters(filters);

  const updateUrl = (nextFilters: typeof filters) => {
    const queryString = writeOrderFilters(nextFilters);
    router.replace(queryString ? `/admin/orders?${queryString}` : "/admin/orders");
  };

  return (
    <section className="mx-auto grid w-full max-w-[1500px] gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">Operations</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Order Tracker</h1>
          <p className="mt-1 text-sm text-muted-foreground">Combined order and redemption lifecycle diagnostics.</p>
        </div>
        {!isLoading && !isError ? (
          <p className="text-sm text-muted-foreground">{combinedOrders.length} matching records</p>
        ) : null}
      </header>
      <OrderFilters
        value={filters}
        onChange={updateUrl}
        onClear={() => updateUrl(EMPTY_ORDER_FILTERS)}
        clients={(clientsQuery.data ?? []).map((c) => [c.id, c.legalName] as const)}
      />
      {isError ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <p className="font-medium text-destructive">The complete order list could not be loaded.</p>
          <p className="mt-1 text-sm text-muted-foreground">Both order sources must be available before this combined view is shown.</p>
        </div>
      ) : (
        <OrderTable
          orders={combinedOrders}
          isLoading={isLoading}
          filterKey={filterKey}
          onOpenOrder={(id) => {
            const selected = combinedOrders.find((order) => order.id === id);
            const kind = selected?.side === "SELL" ? "redemption" : "order";
            const isBackendId = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id);
            router.push(isBackendId ? `/admin/orders/${id}?kind=${kind}` : `/admin/orders/${id}`);
          }}
        />
      )}
    </section>
  );
}

function Fallback() {
  return (
    <section className="mx-auto grid w-full max-w-[1500px] gap-5">
      <Skeleton className="h-16 w-80" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </section>
  );
}

export default function AdminOrdersPage() {
  return <Suspense fallback={<Fallback />}><AdminOrdersContent /></Suspense>;
}
