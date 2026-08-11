import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Fill } from "@/lib/types/order";
import { formatCurrency, formatDate, formatQty } from "@/lib/utils/formatters";

interface FillsTableProps {
  fills: Fill[];
}

function statusClass(status: Fill["onChainStatus"]) {
  if (status === "CONFIRMED") return "text-emerald-700 dark:text-emerald-300";
  if (status === "FAILED") return "text-destructive";
  return "text-amber-700 dark:text-amber-300";
}

export function FillsTable({ fills }: FillsTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fill ID</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>Transaction Hash</TableHead>
            <TableHead>On-chain Status</TableHead>
            <TableHead>Retries</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fills.length ? (
            fills.map((fill) => {
              const transactionHash = fill.mintTxHash ?? fill.burnTxHash ?? "-";

              return (
                <TableRow key={fill.fillId}>
                  <TableCell className="font-mono text-xs">{fill.fillId}</TableCell>
                  <TableCell>{formatQty(fill.qty)}</TableCell>
                  <TableCell>{formatCurrency(fill.price)}</TableCell>
                  <TableCell>{formatCurrency(fill.cost)}</TableCell>
                  <TableCell>{formatDate(fill.filledAt)}</TableCell>
                  <TableCell className="max-w-48 truncate font-mono text-xs" title={transactionHash}>
                    {transactionHash}
                  </TableCell>
                  <TableCell>
                    {fill.onChainStatus ? (
                      <Badge
                        variant="outline"
                        className={statusClass(fill.onChainStatus)}
                      >
                        {fill.onChainStatus}
                      </Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{fill.retryCount ?? "-"}</TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={8}
                className="h-24 text-center text-muted-foreground"
              >
                No fills recorded
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
