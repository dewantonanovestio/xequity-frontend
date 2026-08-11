export type EndUserState = "PROVISIONING" | "ACTIVE" | "SUSPENDED" | "CLOSED";

export interface EndUser {
  readonly endUserId: string;
  readonly clientId: string;
  readonly externalId: string;
  readonly walletId: string;
  readonly displayName: string;
  readonly subAccountId: string | null;
  readonly state: EndUserState;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateEndUserRequest {
  readonly clientId: string;
  readonly externalId: string;
}

export type SymbolStatus = "ACTIVE" | "MINT_HALTED" | "REDEEM_HALTED" | "HALTED" | "DELISTING" | "RETIRED";

export interface AdminSymbol {
  readonly ticker: string;
  readonly tokenProxyAddr: string | null;
  readonly status: SymbolStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface OnboardSymbolRequest {
  readonly ticker: string;
  readonly tokenProxyAddr: string;
}

export interface UpdateSymbolStatusRequest {
  readonly ticker: string;
  readonly status: SymbolStatus;
}

export interface Holding {
  readonly symbol: string;
  readonly qty: number;
  readonly avgCost: number;
}

export interface SymbolPricing {
  readonly symbol: string;
  readonly rawPrice: number;
  readonly buyPrice: number;
  readonly sellPrice: number;
  readonly buySpreadBps: number;
  readonly sellSpreadBps: number;
}

export interface PnlEntry {
  readonly symbol: string;
  readonly realizedPnl: number;
  readonly unrealizedPnl: number;
  readonly totalPnl: number;
}

export interface PnlSummary {
  readonly realizedPnl: number;
  readonly unrealizedPnl: number;
  readonly totalPnl: number;
}

export interface SymbolMeta {
  readonly ticker: string;
  readonly tradable: boolean;
  readonly fractionable: boolean;
  readonly tradableOvernight: boolean;
}
