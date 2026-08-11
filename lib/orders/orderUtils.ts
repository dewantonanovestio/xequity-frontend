import type {
  Fill,
  LedgerImpact,
  Order,
  OrderFilters,
  OrderSide,
  OrderState,
} from "@/lib/types/order";

export type OrderKind = "order" | "redemption" | "unknown";
export type StateTone = "success" | "danger" | "warning" | "neutral";
export type SideTone = "buy" | "sell";

export const EMPTY_ORDER_FILTERS: OrderFilters = {
  clientId: "",
  endUserId: "",
  symbol: "",
  status: "",
  fromDate: "",
  toDate: "",
};

export const BUY_ORDER_STATES = new Set<OrderState>([
  "SUBMITTED",
  "VALIDATED",
  "QUEUED",
  "OPEN_EXECUTING",
  "FILLED",
  "PARTIALLY_FILLED",
  "MINTING",
  "SETTLED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
  "MINT_FAILED",
]);

export const REDEMPTION_STATES = new Set<OrderState>([
  "SUBMITTED",
  "VALIDATED",
  "LOCKING",
  "LOCKED",
  "SELLING",
  "PARTIALLY_FILLED",
  "FILLED",
  "BURNING",
  "SETTLED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
  "BURN_FAILED",
]);

export function getOrderKind(id: string): OrderKind {
  if (id.startsWith("ord_")) return "order";
  if (id.startsWith("red_")) return "redemption";
  return "unknown";
}

export function getStateTone(state: OrderState): StateTone {
  if (state === "SETTLED" || state === "FILLED") return "success";
  if (
    state === "MINT_FAILED" ||
    state === "BURN_FAILED" ||
    state === "REJECTED"
  ) {
    return "danger";
  }
  if (state === "EXPIRED" || state === "CANCELLED") return "neutral";
  return "warning";
}

export function getSideTone(side: OrderSide): SideTone {
  return side === "BUY" ? "buy" : "sell";
}

export function deriveLedgerImpact(order: Order, fills: Fill[]): LedgerImpact {
  const settlementAmount = fills.reduce((total, fill) => total + fill.cost, 0);
  const holdAmount =
    order.notional ??
    (order.limitPrice === null ? settlementAmount : order.qty * order.limitPrice);

  return {
    holdAmount,
    settlementAmount,
    spreadBooked: (settlementAmount * order.pinnedSpreadBps) / 10_000,
  };
}
