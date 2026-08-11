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
import type { SystemBalance } from "@/lib/types/ledger";
import { formatCurrency } from "@/lib/utils/formatters";

const ACCOUNT_LABELS: Record<string, string> = {
  USDT_WALLET: "USDT Wallet",
  ALPACA_USD_FLOAT: "Alpaca USD Float",
  NET_SETTLEMENT_PAYABLE: "Net Settlement Payable",
  PENDING_T1_SETTLEMENT: "Pending T+1 Settlement",
  XEQUITY_SPREAD_REVENUE: "Spread Revenue",
  TREASURY_OWN_FUNDS: "Treasury Own Funds",
  GAS_EXPENSE: "Gas Expense",
  CONVERSION_COST: "Conversion Cost",
  REGULATORY_FEE_EXPENSE: "Regulatory Fee Expense",
};

const ACCOUNT_GROUP: Record<string, string> = {
  USDT_WALLET: "Treasury & Float",
  ALPACA_USD_FLOAT: "Treasury & Float",
  TREASURY_OWN_FUNDS: "Treasury & Float",
  NET_SETTLEMENT_PAYABLE: "Settlement",
  PENDING_T1_SETTLEMENT: "Settlement",
  XEQUITY_SPREAD_REVENUE: "Revenue",
  GAS_EXPENSE: "Expenses",
  CONVERSION_COST: "Expenses",
  REGULATORY_FEE_EXPENSE: "Expenses",
};

interface SystemBalanceSummaryProps {
  balances: SystemBalance[];
  isLoading: boolean;
  isError: boolean;
}

export function SystemBalanceSummary({
  balances,
  isLoading,
  isError,
}: SystemBalanceSummaryProps) {
  const grouped = balances.reduce<Record<string, SystemBalance[]>>(
    (acc, balance) => {
      const group = ACCOUNT_GROUP[balance.accountType] ?? "Other";
      (acc[group] ??= []).push(balance);
      return acc;
    },
    {},
  );

  const groupOrder = ["Treasury & Float", "Settlement", "Revenue", "Expenses", "Other"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global System Accounts</CardTitle>
        <CardDescription>
          Treasury float, spread revenue, regulatory fee expense, gas expense,
          conversion cost, and settlement accounts.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Account</TableHead>
              <TableHead>Normal Side</TableHead>
              <TableHead className="pr-4 text-right">Balance (USDT)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-4">
                    <Skeleton className="h-5 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell className="pr-4">
                    <Skeleton className="h-5 w-28 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 px-4 text-center">
                  <p role="alert" className="font-medium text-destructive">
                    System balances could not be loaded.
                  </p>
                </TableCell>
              </TableRow>
            ) : balances.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-24 px-4 text-center text-muted-foreground"
                >
                  No system account data available.
                </TableCell>
              </TableRow>
            ) : (
              groupOrder
                .filter((group) => grouped[group]?.length)
                .flatMap((group) => [
                  <TableRow
                    key={`group-${group}`}
                    className="bg-muted/40 hover:bg-muted/40"
                  >
                    <TableCell
                      colSpan={3}
                      className="pl-4 py-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                    >
                      {group}
                    </TableCell>
                  </TableRow>,
                  ...(grouped[group] ?? []).map((balance) => (
                    <TableRow key={balance.accountType}>
                      <TableCell className="pl-8 font-medium">
                        {ACCOUNT_LABELS[balance.accountType] ?? balance.accountType}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            balance.normalSide === "CREDIT"
                              ? "text-xs font-medium text-emerald-700 dark:text-emerald-400"
                              : "text-xs font-medium text-blue-700 dark:text-blue-400"
                          }
                        >
                          {balance.normalSide}
                        </span>
                      </TableCell>
                      <TableCell className="pr-4 text-right tabular-nums">
                        {formatCurrency(balance.balance)}
                      </TableCell>
                    </TableRow>
                  )),
                ])
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
