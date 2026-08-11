import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  formatReconQuantity,
  getResidualTone,
  getSymbolStatusTone,
} from "@/lib/recon/reconUtils";
import type { SupplyRecon as SupplyReconData } from "@/lib/types/recon";

const badgeClasses = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  danger:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  warning:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  neutral:
    "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
};

interface SupplyReconProps {
  rows: SupplyReconData[];
  isLoading: boolean;
  isError: boolean;
}

export function SupplyRecon({ rows, isLoading, isError }: SupplyReconProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Supply Reconciliation</CardTitle>
        <CardDescription>
          On-chain token supply compared with omnibus brokerage positions.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 pl-4">
                <span className="sr-only">Status Indicator</span>
              </TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>On-Chain Supply</TableHead>
              <TableHead>Alpaca Positions</TableHead>
              <TableHead>Residual</TableHead>
              <TableHead className="pr-4">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }, (_, rowIndex) => (
                <TableRow key={rowIndex} data-testid="supply-row-skeleton">
                  {Array.from({ length: 6 }, (__, cellIndex) => (
                    <TableCell
                      key={cellIndex}
                      className="first:pl-4 last:pr-4"
                    >
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 px-4 text-center">
                  <p role="alert" className="font-medium text-destructive">
                    Supply reconciliation could not be loaded.
                  </p>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 px-4 text-center text-muted-foreground"
                >
                  No supply reconciliation results are available.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const residualTone = getResidualTone(row.residual);
                const statusTone = getSymbolStatusTone(row.symbolStatus);
                const indicatorClass =
                  residualTone === "balanced" ? "bg-emerald-500" : "bg-red-500";
                const residualClass =
                  residualTone === "balanced"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400";

                return (
                  <TableRow key={row.symbol} data-tone={residualTone}>
                    <TableCell className="pl-4">
                      <span
                        data-testid={`supply-indicator-${row.symbol}`}
                        aria-label={
                          residualTone === "balanced"
                            ? `${row.symbol} is balanced`
                            : `${row.symbol} has a reconciliation break`
                        }
                        className={`block size-2.5 rounded-full ${indicatorClass}`}
                      />
                    </TableCell>
                    <TableCell className="font-semibold">{row.symbol}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatReconQuantity(row.onChainSupply)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatReconQuantity(row.alpacaPositionSum)}
                    </TableCell>
                    <TableCell
                      data-testid={`supply-residual-${row.symbol}`}
                      className={`font-medium tabular-nums ${residualClass}`}
                    >
                      {formatReconQuantity(row.residual)}
                    </TableCell>
                    <TableCell className="pr-4">
                      <Badge
                        variant="outline"
                        data-tone={statusTone}
                        className={badgeClasses[statusTone]}
                      >
                        {row.symbolStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
