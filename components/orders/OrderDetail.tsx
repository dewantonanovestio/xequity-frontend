import type { ReactNode } from "react";

import { FillsTable } from "@/components/orders/FillsTable";
import { StateTimeline } from "@/components/orders/StateTimeline";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { deriveLedgerImpact, getStateTone } from "@/lib/orders/orderUtils";
import type { Fill, Order } from "@/lib/types/order";
import { formatCurrency, formatDate, formatQty } from "@/lib/utils/formatters";

interface OrderDetailProps {
  order: Order;
  fills: Fill[];
  actions: ReactNode;
}

interface DetailItemProps {
  label: string;
  value: ReactNode;
  mono?: boolean;
}

function DetailItem({ label, value, mono = false }: DetailItemProps) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className={`mt-1 break-words text-sm ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <CardTitle>
      <h2>{children}</h2>
    </CardTitle>
  );
}

export function OrderDetail({ order, fills, actions }: OrderDetailProps) {
  const ledger = deriveLedgerImpact(order, fills);
  const stateTone = getStateTone(order.state);

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-xl font-semibold">{order.id}</h1>
            <Badge
              variant="outline"
              className={
                order.side === "BUY"
                  ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300"
                  : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"
              }
            >
              {order.side}
            </Badge>
            <Badge
              variant="outline"
              data-tone={stateTone}
              className={stateTone === "danger" ? "text-destructive" : ""}
            >
              {order.state}
            </Badge>
          </div>
          <CardDescription>
            {order.clientName} · {order.symbol} · {order.type}
          </CardDescription>
          {actions ? <CardAction>{actions}</CardAction> : null}
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
            <DetailItem label="Symbol" value={order.symbol} />
            <DetailItem label="Client" value={order.clientName} />
            <DetailItem label="End user" value={order.endUserId} mono />
            <DetailItem label="Type" value={order.type} />
            <DetailItem label="Quantity" value={formatQty(order.qty)} />
            <DetailItem
              label="Notional"
              value={order.notional === null ? "-" : formatCurrency(order.notional)}
            />
            <DetailItem
              label="Limit price"
              value={
                order.limitPrice === null ? "-" : formatCurrency(order.limitPrice)
              }
            />
            <DetailItem label="State" value={order.state} />
            <DetailItem label="Created" value={formatDate(order.createdAt)} />
            <DetailItem label="Updated" value={formatDate(order.updatedAt)} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <SectionTitle>Diagnostics</SectionTitle>
          <CardDescription>Identifiers used across execution and settlement systems.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
            <DetailItem
              label="Client idempotency key"
              value={order.clientIdemKey || "-"}
              mono
            />
            <DetailItem
              label="Alpaca order ID"
              value={order.alpacaOrderId ?? "-"}
              mono
            />
            <DetailItem
              label="Pinned spread"
              value={`${formatQty(order.pinnedSpreadBps)} bps`}
            />
            <DetailItem label="Wallet ID" value={order.walletId || "-"} mono />
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card aria-label="Ledger impact" role="region">
          <CardHeader>
            <SectionTitle>Ledger impact</SectionTitle>
            <CardDescription>Calculated from the order and recorded fills.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-3">
              <DetailItem label="Hold amount" value={formatCurrency(ledger.holdAmount)} />
              <DetailItem
                label={order.side === "BUY" ? "Debit amount" : "Credit amount"}
                value={formatCurrency(ledger.settlementAmount)}
              />
              <DetailItem
                label="Spread booked"
                value={formatCurrency(ledger.spreadBooked)}
              />
            </dl>
          </CardContent>
        </Card>

        {order.side === "SELL" ? (
          <Card aria-label="Redemption partition" role="region">
            <CardHeader>
              <SectionTitle>Redemption partition</SectionTitle>
              <CardDescription>Locked token quantity and its disposition.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-5 sm:grid-cols-3">
                <DetailItem
                  label="Locked quantity"
                  value={order.lockedQty === undefined ? "-" : formatQty(order.lockedQty)}
                />
                <DetailItem
                  label="Burned quantity"
                  value={order.burnedQty === undefined ? "-" : formatQty(order.burnedQty)}
                />
                <DetailItem
                  label="Released quantity"
                  value={
                    order.releasedQty === undefined
                      ? "-"
                      : formatQty(order.releasedQty)
                  }
                />
              </dl>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <SectionTitle>State timeline</SectionTitle>
          <CardDescription>Lifecycle transitions from submission to current state.</CardDescription>
        </CardHeader>
        <CardContent>
          <StateTimeline transitions={order.stateTransitions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <SectionTitle>Fills</SectionTitle>
          <CardDescription>Execution and on-chain settlement diagnostics.</CardDescription>
        </CardHeader>
        <CardContent>
          <FillsTable fills={fills} />
        </CardContent>
      </Card>
    </div>
  );
}
