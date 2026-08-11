import type { SymbolStatus } from "@/lib/types/recon";

const reconQuantityFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 6,
  maximumFractionDigits: 6,
});

export type ReconciliationTone = "balanced" | "unbalanced";
export type SymbolStatusTone = "success" | "danger" | "warning" | "neutral";

export function formatReconQuantity(value: number): string {
  return reconQuantityFormatter.format(value);
}

export function getDeltaTone(delta: number): ReconciliationTone {
  return delta === 0 ? "balanced" : "unbalanced";
}

export function getResidualTone(residual: number): ReconciliationTone {
  return residual === 0 ? "balanced" : "unbalanced";
}

export function getSymbolStatusTone(status: SymbolStatus): SymbolStatusTone {
  if (status === "ACTIVE") return "success";
  if (status === "HALTED") return "danger";
  if (status === "MINT_HALTED" || status === "REDEEM_HALTED") {
    return "warning";
  }
  return "neutral";
}
