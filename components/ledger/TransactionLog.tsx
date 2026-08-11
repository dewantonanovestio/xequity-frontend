"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTransactionTone } from "@/lib/ledger/ledgerUtils";
import type {
  SortDirection,
  Transaction,
  TransactionSortField,
} from "@/lib/types/ledger";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";

const columnHelper = createColumnHelper<Transaction>();

const badgeClasses = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  danger:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  warning:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  info: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
};

const amountClasses = {
  positive: "text-emerald-600 dark:text-emerald-400",
  negative: "text-red-600 dark:text-red-400",
  neutral: "text-foreground",
};

const columns = [
  columnHelper.accessor("timestamp", {
    header: "Timestamp",
    cell: (info) => formatDate(info.getValue()),
  }),
  columnHelper.accessor("clientId", {
    header: "Client ID",
    cell: (info) => (
      <span className="font-mono text-xs">{info.getValue() ?? <span className="text-muted-foreground italic">global</span>}</span>
    ),
  }),
  columnHelper.accessor("accountType", {
    header: "Account Type",
    cell: (info) => (
      <span className="font-mono text-xs">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("sourceType", {
    header: "Source Type",
    cell: (info) => {
      const type = info.getValue();
      const tone = getTransactionTone(type);
      return (
        <Badge variant="outline" data-tone={tone} className={badgeClasses[tone]}>
          {type}
        </Badge>
      );
    },
  }),
  columnHelper.accessor("debit", {
    header: "Debit",
    cell: (info) => {
      const value = info.getValue();
      return (
        <span className={`tabular-nums font-medium ${value > 0 ? amountClasses.negative : "text-muted-foreground"}`}>
          {value > 0 ? formatCurrency(value) : "-"}
        </span>
      );
    },
  }),
  columnHelper.accessor("credit", {
    header: "Credit",
    cell: (info) => {
      const value = info.getValue();
      return (
        <span className={`tabular-nums font-medium ${value > 0 ? amountClasses.positive : "text-muted-foreground"}`}>
          {value > 0 ? formatCurrency(value) : "-"}
        </span>
      );
    },
  }),
  columnHelper.accessor("referenceId", {
    header: "Reference",
    cell: (info) => {
      const referenceId = info.getValue();
      return referenceId ? (
        <Link
          href={`/admin/orders/${referenceId}`}
          aria-label={`Open order ${referenceId}`}
          className="font-mono text-xs font-medium text-blue-600 underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {referenceId.slice(0, 7)}
        </Link>
      ) : (
        "-"
      );
    },
  }),
  columnHelper.accessor("description", {
    header: "Description",
    cell: (info) => {
      const val = info.getValue();
      return (
        <span className="block max-w-72 truncate" title={val ?? undefined}>
          {val ?? "-"}
        </span>
      );
    },
  }),
];

interface TransactionLogProps {
  transactions: Transaction[];
  isLoading: boolean;
  sortBy: TransactionSortField;
  sortDirection: SortDirection;
  onSortChange: (
    sortBy: TransactionSortField,
    sortDirection: SortDirection,
  ) => void;
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  pageNumber: number;
  totalCount: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  sortableFields?: readonly TransactionSortField[];
}

export function TransactionLog({
  transactions,
  isLoading,
  sortBy,
  sortDirection,
  onSortChange,
  pageSize,
  onPageSizeChange,
  pageNumber,
  totalCount,
  canPreviousPage,
  canNextPage,
  onPreviousPage,
  onNextPage,
  sortableFields,
}: TransactionLogProps) {
  const data = useMemo(() => transactions, [transactions]);
  const sorting: SortingState = [
    { id: sortBy, desc: sortDirection === "desc" },
  ];
  // TanStack Table exposes callback-rich state that React Compiler intentionally skips.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const requestSort = (field: TransactionSortField) => {
    const nextDirection =
      field === sortBy && sortDirection === "desc" ? "asc" : "desc";
    onSortChange(field, field === sortBy ? nextDirection : "asc");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ledger Log</CardTitle>
        <CardDescription>
          Double-entry ledger entries across all client and global accounts.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const field = header.column.id as TransactionSortField;
                  const label = String(header.column.columnDef.header);
                  const isSortable =
                    sortableFields === undefined || sortableFields.includes(field);

                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={
                        field === sortBy
                          ? sortDirection === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                      className="first:pl-4 last:pr-4"
                    >
                      {header.isPlaceholder ? null : isSortable ? (
                        <button
                          type="button"
                          aria-label={`Sort by ${label}`}
                          className="inline-flex items-center gap-1 font-medium focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                          onClick={() => requestSort(field)}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          <ArrowUpDown aria-hidden="true" className="size-3" />
                        </button>
                      ) : (
                        <span className="font-medium">{label}</span>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }, (_, rowIndex) => (
                <TableRow key={rowIndex} data-testid="transaction-row-skeleton">
                  {columns.map((_, cellIndex) => (
                    <TableCell
                      key={cellIndex}
                      className="first:pl-4 last:pr-4"
                    >
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.original.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="first:pl-4 last:pr-4"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 px-4 text-center text-muted-foreground"
                >
                  No ledger entries match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex-wrap justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Rows per page
            <select
              aria-label="Rows per page"
              className="h-8 rounded-lg border bg-background px-2 text-foreground"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <span className="text-sm text-muted-foreground">
            {totalCount} matching entries
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Page {pageNumber}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Previous page"
            disabled={!canPreviousPage}
            onClick={onPreviousPage}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Next page"
            disabled={!canNextPage}
            onClick={onNextPage}
          >
            Next
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
