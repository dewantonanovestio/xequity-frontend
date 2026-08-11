export type OrderSide = "BUY" | "SELL";

export type OrderType = "MARKET" | "LIMIT";

export type OrderState =
  | "SUBMITTED"
  | "VALIDATED"
  | "QUEUED"
  | "OPEN_EXECUTING"
  | "FILLED"
  | "PARTIALLY_FILLED"
  | "LOCKING"
  | "LOCKED"
  | "SELLING"
  | "BURNING"
  | "MINTING"
  | "SETTLED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED"
  | "MINT_FAILED"
  | "BURN_FAILED";

export interface StateTransition {
  fromState: OrderState | null;
  toState: OrderState;
  transitionedAt: string;
}

export interface Order {
  id: string;
  side: OrderSide;
  symbol: string;
  endUserId: string;
  clientId: string;
  clientName: string;
  type: OrderType;
  qty: number;
  notional: number | null;
  limitPrice: number | null;
  state: OrderState;
  clientIdemKey: string;
  alpacaOrderId: string | null;
  pinnedSpreadBps: number;
  walletId: string;
  createdAt: string;
  updatedAt: string;
  stateTransitions: StateTransition[];
  lockedQty?: number;
  burnedQty?: number;
  releasedQty?: number;
}

export interface Fill {
  fillId: string;
  qty: number;
  price: number;
  cost: number;
  filledAt: string;
  mintTxHash?: string;
  burnTxHash?: string;
  onChainStatus?: "PENDING" | "CONFIRMED" | "FAILED";
  retryCount?: number;
}

export interface OrderQueryParams {
  clientId?: string;
  endUserId?: string;
  symbol?: string;
  status?: OrderState;
  fromDate?: string;
  toDate?: string;
  cursor?: string;
  limit?: number;
}

export interface PaginatedOrders {
  items: Order[];
  nextCursor: string | null;
  totalCount: number;
}

export interface LedgerImpact {
  holdAmount: number;
  settlementAmount: number;
  spreadBooked: number;
}

export interface OrderFilters {
  clientId: string;
  endUserId: string;
  symbol: string;
  status: string;
  fromDate: string;
  toDate: string;
}
