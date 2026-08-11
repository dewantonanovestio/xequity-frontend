"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSideTone, getStateTone } from "@/lib/orders/orderUtils";
import type { Order } from "@/lib/types/order";
import { formatCurrency, formatDate, formatQty } from "@/lib/utils/formatters";

const columnHelper = createColumnHelper<Order>();

const sideClasses = {
  buy: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  sell: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300",
};

const stateClasses = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  danger:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  warning:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  neutral:
    "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
};

const columns = [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => (
      <span className="font-mono text-xs" title={info.getValue()}>
        {info.getValue().slice(0, 7)}
      </span>
    ),
  }),
  columnHelper.accessor("side", {
    header: "Side",
    cell: (info) => {
      const tone = getSideTone(info.getValue());
      return (
        <Badge variant="outline" data-tone={tone} className={sideClasses[tone]}>
          {info.getValue()}
        </Badge>
      );
    },
  }),
  columnHelper.accessor("symbol", { header: "Symbol" }),
  columnHelper.accessor("endUserId", {
    header: "End-User",
    cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
  }),
  columnHelper.accessor("clientName", { header: "Client" }),
  columnHelper.accessor("type", { header: "Type" }),
  columnHelper.accessor("qty", {
    header: "Qty",
    cell: (info) => formatQty(info.getValue()),
  }),
  columnHelper.accessor("notional", {
    header: "Notional",
    cell: (info) => {
      const value = info.getValue();
      return value === null ? "-" : formatCurrency(value);
    },
  }),
  columnHelper.accessor("limitPrice", {
    header: "Limit Price",
    cell: (info) => {
      const value = info.getValue();
      return value === null ? "-" : formatCurrency(value);
    },
  }),
  columnHelper.accessor("state", {
    header: "State",
    cell: (info) => {
      const tone = getStateTone(info.getValue());
      return (
        <Badge variant="outline" data-tone={tone} className={stateClasses[tone]}>
          {info.getValue()}
        </Badge>
      );
    },
  }),
  columnHelper.accessor("createdAt", {
    header: "Created",
    cell: (info) => formatDate(info.getValue()),
  }),
  columnHelper.accessor("updatedAt", {
    header: "Updated",
    cell: (info) => formatDate(info.getValue()),
  }),
];

interface OrderTableProps {
  orders: Order[];
  isLoading: boolean;
  filterKey: string;
  onOpenOrder: (id: string) => void;
  actions?: (order: Order) => ReactNode;
  hiddenColumns?: Set<string>;
}

export function OrderTable({
  orders,
  isLoading,
  filterKey,
  onOpenOrder,
  actions,
  hiddenColumns,
}: OrderTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const data = useMemo(() => orders, [orders]);

  // Keep a ref to `actions` so the stable column definition can always call the latest version
  // without being recreated on every render. This prevents TanStack Table from rebuilding its
  // cell model on each polling cycle, which would reset local dialog state in action components.
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  const actionsColumn = useMemo(() => columnHelper.display({
    id: "actions",
    header: "Action",
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()}>
        {actionsRef.current?.(row.original) ?? null}
      </div>
    ),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  const visibleColumns = hiddenColumns?.size
    ? columns.filter((col) => {
        const key = (col as { accessorKey?: string }).accessorKey;
        return !hiddenColumns.has(key ?? "");
      })
    : columns;
  const hasActions = Boolean(actions);
  const allColumns = useMemo(
    () => (hasActions ? [...visibleColumns, actionsColumn] : visibleColumns),
    [hasActions, actionsColumn, visibleColumns],
  );

  // TanStack Table exposes callback-rich state that React Compiler intentionally skips.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: allColumns,
    getRowId: (row) => row.id,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  useEffect(() => {
    table.setPageIndex(0);
  }, [filterKey, table]);

  const pageCount = Math.max(table.getPageCount(), 1);
  const pageIndex = table.getState().pagination.pageIndex;

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-medium"
                      aria-label={`Sort by ${String(header.column.columnDef.header)}`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      <ArrowUpDown aria-hidden="true" className="size-3" />
                    </button>
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }, (_, rowIndex) => (
              <TableRow key={rowIndex} data-testid="order-row-skeleton">
                {allColumns.map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                tabIndex={0}
                aria-label={`Open order ${row.original.id}`}
                className="cursor-pointer focus-visible:bg-muted focus-visible:outline-none"
                onClick={() => onOpenOrder(row.original.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpenOrder(row.original.id);
                  }
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={allColumns.length}
                className="h-32 text-center text-muted-foreground"
              >
                No orders match the current filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Rows per page
          <select
            aria-label="Rows per page"
            className="h-8 rounded-lg border bg-background px-2 text-foreground"
            value={table.getState().pagination.pageSize}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
          >
            {[10, 20, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Page {pageIndex + 1} of {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Previous page"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Next page"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  );
}
