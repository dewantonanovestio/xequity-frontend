export interface CashRecon {
  source?: "backend";
  usdtLedgerTotal: number;
  usdtWalletBalance: number;
  usdtDelta: number;
  usdFloatAtAlpaca: number;
  projectedFloatRequirement: number;
  lastRunAt: string;
}

export type SymbolStatus =
  | "ACTIVE"
  | "MINT_HALTED"
  | "REDEEM_HALTED"
  | "HALTED"
  | "DELISTING"
  | "RETIRED";

export interface SupplyRecon {
  symbol: string;
  onChainSupply: number;
  alpacaPositionSum: number;
  residual: number;
  symbolStatus: SymbolStatus;
}

export type ReconScenario = "balanced" | "unbalanced";

export interface RunCashReconResult {
  success: boolean;
}
