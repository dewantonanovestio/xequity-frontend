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
import type { ClientBalance } from "@/lib/types/ledger";
import { formatCurrency } from "@/lib/utils/formatters";

interface BalanceSummaryProps {
  balances: ClientBalance[];
  isLoading: boolean;
  isError: boolean;
}

export function BalanceSummary({
  balances,
  isLoading,
  isError,
}: BalanceSummaryProps) {
  const totals = balances.reduce(
    (sum, balance) => ({
      available: sum.available + balance.available,
      held: sum.held + balance.held,
      total: sum.total + balance.total,
    }),
    { available: 0, held: 0, total: 0 },
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Balances</CardTitle>
        <CardDescription>
          Current available, reserved, and total USDT by client.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Client</TableHead>
              <TableHead>Available (USDT)</TableHead>
              <TableHead>Held (USDT)</TableHead>
              <TableHead className="pr-4">Total (USDT)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }, (_, rowIndex) => (
                <TableRow key={rowIndex} data-testid="balance-row-skeleton">
                  {Array.from({ length: 4 }, (__, cellIndex) => (
                    <TableCell
                      key={cellIndex}
                      className={cellIndex === 0 ? "pl-4" : undefined}
                    >
                      <Skeleton className="h-5 w-28" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 px-4 text-center">
                  <p role="alert" className="font-medium text-destructive">
                    Client balances could not be loaded.
                  </p>
                </TableCell>
              </TableRow>
            ) : balances.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 px-4 text-center text-muted-foreground"
                >
                  No client balances are available.
                </TableCell>
              </TableRow>
            ) : (
              <>
                <TableRow
                  data-global="true"
                  className="bg-muted/70 font-semibold hover:bg-muted/70"
                >
                  <TableCell className="pl-4">Global Totals</TableCell>
                  <TableCell>{formatCurrency(totals.available)}</TableCell>
                  <TableCell>{formatCurrency(totals.held)}</TableCell>
                  <TableCell className="pr-4">
                    {formatCurrency(totals.total)}
                  </TableCell>
                </TableRow>
                {balances.map((balance) => (
                  <TableRow key={balance.clientId}>
                    <TableCell className="pl-4 font-medium">
                      {balance.clientName}
                    </TableCell>
                    <TableCell>{formatCurrency(balance.available)}</TableCell>
                    <TableCell>{formatCurrency(balance.held)}</TableCell>
                    <TableCell className="pr-4">
                      {formatCurrency(balance.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
