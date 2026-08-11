"use client";

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
import type { Activity } from "@/lib/types/activity";
import { formatCurrency, formatDate, formatQty } from "@/lib/utils/formatters";

interface ActivityTableProps {
  activities: Activity[];
  isLoading: boolean;
  nextCursor: string | null;
  onLoadMore: () => void;
}

export function ActivityTable({ activities, isLoading, nextCursor, onLoadMore }: ActivityTableProps) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Symbol</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>State</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && activities.length === 0 ? (
            Array.from({ length: 5 }, (_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 6 }, (__, j) => (
                  <TableCell key={j}><Skeleton className="h-5 w-20" /></TableCell>
                ))}
              </TableRow>
            ))
          ) : activities.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                No activities found.
              </TableCell>
            </TableRow>
          ) : (
            activities.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell>{formatDate(activity.createdAt)}</TableCell>
                <TableCell>
                  <Badge variant={activity.type === "BUY" ? "default" : "secondary"}>
                    {activity.type}
                  </Badge>
                </TableCell>
                <TableCell>{activity.symbol}</TableCell>
                <TableCell>{formatQty(activity.qty)}</TableCell>
                <TableCell>{formatCurrency(activity.amount)}</TableCell>
                <TableCell>{activity.state}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex justify-center border-t px-4 py-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!nextCursor || isLoading}
          onClick={onLoadMore}
        >
          {isLoading ? "Loading…" : "Load more"}
        </Button>
      </div>
    </section>
  );
}
