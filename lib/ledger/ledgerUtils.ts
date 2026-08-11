import type {
  SourceType,
  TransactionFilters,
} from "@/lib/types/ledger";

export const BACKEND_TRANSACTION_TYPES = [
  "DEPOSIT",
  "WITHDRAWAL",
  "FILL",
  "REDEMPTION_FILL",
  "CONVERSION",
  "DIVIDEND",
  "SETTLEMENT",
  "REGULATORY_FEE",
  "HOLD",
  "HOLD_RELEASE",
  "GAS",
] as const satisfies readonly SourceType[];

export const EMPTY_TRANSACTION_FILTERS: TransactionFilters = {
  clientId: "",
  type: "",
  fromDate: "",
  toDate: "",
};

export type TransactionTone = "success" | "danger" | "warning" | "info";
export type AmountTone = "positive" | "negative" | "neutral";

export function getTransactionTone(type: string): TransactionTone {
  if (type === "DEPOSIT" || type === "DIVIDEND" || type === "REDEMPTION_FILL") {
    return "success";
  }
  if (type === "WITHDRAWAL" || type === "REGULATORY_FEE" || type === "GAS" || type === "CONVERSION_COST") {
    return "danger";
  }
  if (type === "HOLD" || type === "HOLD_RELEASE") {
    return "warning";
  }
  return "info";
}

export function getAmountTone(amount: number): AmountTone {
  if (amount > 0) return "positive";
  if (amount < 0) return "negative";
  return "neutral";
}
