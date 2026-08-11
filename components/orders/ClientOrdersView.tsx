"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { ClientBalanceCard } from "@/components/orders/ClientBalanceCard";
import { ClientOrderFilters } from "@/components/orders/ClientOrderFilters";
import { PlaceOrderPanel } from "@/components/orders/PlaceOrderPanel";
import { OrderTable } from "@/components/orders/OrderTable";
import { TradingViewChart } from "@/components/orders/TradingViewChart";
import { UserOrderActions } from "@/components/orders/UserOrderActions";
import {
  useGetOrdersQuery,
  useGetRedemptionsQuery,
} from "@/lib/api/ordersApi";
import { useGetSymbolsQuery } from "@/lib/api/userApi";
import {
  BUY_ORDER_STATES,
  REDEMPTION_STATES,
} from "@/lib/orders/orderUtils";
import type { HistoryFilters } from "@/components/orders/ClientOrderFilters";
import type { OrderQueryParams, OrderState } from "@/lib/types/order";

const pollingOptions = { pollingInterval: 5000 };

const HIDDEN_COLUMNS = new Set(["endUserId", "clientName"]);

type AllFilters = HistoryFilters & {
  endUserId: string;
  symbol: string;
};

const EMPTY_HISTORY_FILTERS: HistoryFilters = {
  status: "",
  fromDate: "",
  toDate: "",
};

function readFilters(params: URLSearchParams): AllFilters {
  return {
    endUserId: params.get("endUserId") ?? "",
    symbol: params.get("symbol") ?? "",
    status: params.get("status") ?? "",
    fromDate: params.get("fromDate") ?? "",
    toDate: params.get("toDate") ?? "",
  };
}

function writeFilters(filters: AllFilters): string {
  const params = new URLSearchParams();
  if (filters.endUserId) params.set("endUserId", filters.endUserId);
  if (filters.symbol) params.set("symbol", filters.symbol);
  if (filters.status) params.set("status", filters.status);
  if (filters.fromDate) params.set("fromDate", filters.fromDate);
  if (filters.toDate) params.set("toDate", filters.toDate);
  return params.toString();
}

interface ClientOrdersViewProps {
  clientId: string;
}

export function ClientOrdersView({ clientId }: ClientOrdersViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const symbolsQuery = useGetSymbolsQuery();

  const filters = readFilters(new URLSearchParams(searchParams.toString()));

  // Chart uses the symbol from the Place Order form (URL), falling back to first available
  const chartSymbol = filters.symbol || symbolsQuery.data?.[0]?.ticker || "AAPL";

  const updateUrl = (next: AllFilters) => {
    const qs = writeFilters(next);
    router.replace(qs ? `/client/${clientId}/orders?${qs}` : `/client/${clientId}/orders`);
  };

  const handleSymbolChange = (symbol: string) => {
    updateUrl({ ...filters, symbol });
  };

  const handleEndUserChange = (endUserId: string) => {
    updateUrl({ ...filters, endUserId });
  };

  const handleHistoryFilterChange = (next: HistoryFilters) => {
    updateUrl({ ...filters, ...next });
  };

  const status = filters.status as OrderState | "";

  const commonQuery: OrderQueryParams = {
    clientId,
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

  const isLoading =
    (requestsOrders && ordersQuery.isLoading) ||
    (requestsRedemptions && redemptionsQuery.isLoading);
  const isError =
    (requestsOrders && ordersQuery.isError) ||
    (requestsRedemptions && redemptionsQuery.isError);

  const combinedOrders = isError
    ? []
    : [
        ...(ordersQuery.data?.items ?? []),
        ...(redemptionsQuery.data?.items ?? []),
      ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const filterKey = writeFilters(filters) + clientId;
  const basePath = `/client/${clientId}/orders`;

  const historyFilters: HistoryFilters = {
    status: filters.status,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  };

  return (
    <section className="mx-auto grid w-full max-w-[1500px] gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Trading
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Place and track orders on behalf of your end-users.
          </p>
        </div>
        {!isLoading && !isError ? (
          <p className="text-sm text-muted-foreground">
            {combinedOrders.length} matching records
          </p>
        ) : null}
      </header>

      {/* Chart + Order panel side by side */}
      <div className="grid gap-5 lg:grid-cols-[1fr_400px]">
        <div className="min-h-[500px] overflow-hidden rounded-xl border bg-card shadow-sm">
          <TradingViewChart symbol={chartSymbol} />
        </div>
        <div className="grid gap-5 content-start">
          <ClientBalanceCard clientId={clientId} />
          <PlaceOrderPanel
            symbol={chartSymbol}
            onSymbolChange={handleSymbolChange}
            selectedEndUserId={filters.endUserId}
            onEndUserChange={handleEndUserChange}
          />
        </div>
      </div>

      <ClientOrderFilters
        value={historyFilters}
        onChange={handleHistoryFilterChange}
        onClear={() => handleHistoryFilterChange(EMPTY_HISTORY_FILTERS)}
      />

      {isError ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-5"
        >
          <p className="font-medium text-destructive">Orders could not be loaded.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Both order sources must be available before this view is shown.
          </p>
        </div>
      ) : (
        <OrderTable
          orders={combinedOrders}
          isLoading={isLoading}
          filterKey={filterKey}
          hiddenColumns={HIDDEN_COLUMNS}
          onOpenOrder={(id) => {
            const selected = combinedOrders.find((order) => order.id === id);
            const kind = selected?.side === "SELL" ? "redemption" : "order";
            const isBackendId = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id);
            router.push(
              isBackendId ? `${basePath}/${id}?kind=${kind}` : `${basePath}/${id}`,
            );
          }}
          actions={(order) => <UserOrderActions order={order} />}
        />
      )}
    </section>
  );
}
