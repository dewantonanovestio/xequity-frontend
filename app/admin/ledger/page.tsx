"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { BalanceSummary } from "@/components/ledger/BalanceSummary";
import { SystemBalanceSummary } from "@/components/ledger/SystemBalanceSummary";
import { TransactionFilters } from "@/components/ledger/TransactionFilters";
import { TransactionLog } from "@/components/ledger/TransactionLog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetBalancesQuery,
  useGetSystemBalancesQuery,
  useGetTransactionsQuery,
} from "@/lib/api/ledgerApi";
import { useGetClientsQuery } from "@/lib/api/clientApi";
import {
  readTransactionFilters,
  writeTransactionFilters,
} from "@/lib/ledger/filterParams";
import {
  BACKEND_TRANSACTION_TYPES,
  EMPTY_TRANSACTION_FILTERS,
} from "@/lib/ledger/ledgerUtils";
import type {
  SortDirection,
  SourceType,
  TransactionQueryParams,
  TransactionSortField,
} from "@/lib/types/ledger";

const balancePollingOptions = { pollingInterval: 10000 };

function LedgerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = readTransactionFilters(
    new URLSearchParams(searchParams.toString()),
  );
  const [sortBy, setSortBy] =
    useState<TransactionSortField>("timestamp");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("desc");
  const [pageSize, setPageSize] = useState(10);
  const [cursor, setCursor] = useState<string | undefined>();
  const [cursorHistory, setCursorHistory] = useState<
    Array<string | undefined>
  >([]);

  const transactionQueryParams: TransactionQueryParams = {
    ...(filters.clientId ? { clientId: filters.clientId } : {}),
    ...(filters.type ? { type: filters.type as SourceType } : {}),
    ...(filters.fromDate ? { fromDate: filters.fromDate } : {}),
    ...(filters.toDate ? { toDate: filters.toDate } : {}),
    ...(cursor ? { cursor } : {}),
    limit: pageSize,
    sortBy,
    sortDirection,
  };
  const balancesQuery = useGetBalancesQuery(undefined, balancePollingOptions);
  const systemBalancesQuery = useGetSystemBalancesQuery(undefined, balancePollingOptions);
  const clientsQuery = useGetClientsQuery();
  const transactionsQuery = useGetTransactionsQuery(transactionQueryParams);
  const transactionPage = transactionsQuery.data;
  const clientOptions = (clientsQuery.data ?? []).map(
    (client) => [client.id, client.legalName] as const,
  );

  const resetPagination = () => {
    setCursor(undefined);
    setCursorHistory([]);
  };

  const updateFilters = (nextFilters: typeof filters) => {
    resetPagination();
    const query = writeTransactionFilters(nextFilters);
    router.replace(query ? `/admin/ledger?${query}` : "/admin/ledger");
  };

  const updateSort = (
    nextSortBy: TransactionSortField,
    nextSortDirection: SortDirection,
  ) => {
    setSortBy(nextSortBy);
    setSortDirection(nextSortDirection);
    resetPagination();
  };

  const updatePageSize = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    resetPagination();
  };

  const openNextPage = () => {
    if (!transactionPage?.nextCursor) return;
    setCursorHistory((history) => [...history, cursor]);
    setCursor(transactionPage.nextCursor);
  };

  const openPreviousPage = () => {
    if (cursorHistory.length === 0) return;
    const previousCursor = cursorHistory.at(-1);
    setCursorHistory((history) => history.slice(0, -1));
    setCursor(previousCursor);
  };

  return (
    <section className="mx-auto grid w-full max-w-[1500px] gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Money flow
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Ledger Viewer
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Current client balances and globally ordered ledger activity.
          </p>
        </div>
        {!transactionsQuery.isLoading && !transactionsQuery.isError ? (
          <p className="text-sm text-muted-foreground">
            {transactionPage?.totalCount ?? 0} matching entries
          </p>
        ) : null}
      </header>

      <BalanceSummary
        balances={balancesQuery.data ?? []}
        isLoading={balancesQuery.isLoading}
        isError={balancesQuery.isError}
      />

      <SystemBalanceSummary
        balances={systemBalancesQuery.data ?? []}
        isLoading={systemBalancesQuery.isLoading}
        isError={systemBalancesQuery.isError}
      />

      <TransactionFilters
        value={filters}
        onChange={updateFilters}
        onClear={() => updateFilters(EMPTY_TRANSACTION_FILTERS)}
        clients={clientOptions}
        transactionTypes={BACKEND_TRANSACTION_TYPES}
      />

      {transactionsQuery.isError ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-5"
        >
          <p className="font-medium text-destructive">
            Ledger entries could not be loaded.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep the current filters and try the request again.
          </p>
        </div>
      ) : (
        <TransactionLog
          transactions={transactionPage?.items ?? []}
          isLoading={transactionsQuery.isLoading}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSortChange={updateSort}
          pageSize={pageSize}
          onPageSizeChange={updatePageSize}
          pageNumber={cursorHistory.length + 1}
          totalCount={transactionPage?.totalCount ?? 0}
          canPreviousPage={cursorHistory.length > 0}
          canNextPage={Boolean(transactionPage?.nextCursor)}
          onPreviousPage={openPreviousPage}
          onNextPage={openNextPage}
          sortableFields={["timestamp"]}
        />
      )}
    </section>
  );
}

function LedgerPageFallback() {
  return (
    <section className="mx-auto grid w-full max-w-[1500px] gap-5">
      <Skeleton className="h-16 w-80" />
      <Skeleton className="h-56 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </section>
  );
}

export default function LedgerPage() {
  return (
    <Suspense fallback={<LedgerPageFallback />}>
      <LedgerContent />
    </Suspense>
  );
}
