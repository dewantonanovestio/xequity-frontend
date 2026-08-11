import { describe, expect, it } from "vitest";

import {
  BACKEND_TRANSACTION_TYPES,
  getAmountTone,
  getTransactionTone,
} from "@/lib/ledger/ledgerUtils";

describe("ledgerUtils", () => {
  it.each([
    ["DEPOSIT", "success"],
    ["DIVIDEND", "success"],
    ["REDEMPTION_FILL", "success"],
    ["WITHDRAWAL", "danger"],
    ["REGULATORY_FEE", "danger"],
    ["HOLD", "warning"],
    ["HOLD_RELEASE", "warning"],
    ["FILL", "info"],
    ["CONVERSION", "info"],
  ] as const)("maps %s to the %s badge category", (type, expected) => {
    expect(getTransactionTone(type)).toBe(expected);
  });

  it("classifies signed amounts", () => {
    expect(getAmountTone(10)).toBe("positive");
    expect(getAmountTone(-10)).toBe("negative");
    expect(getAmountTone(0)).toBe("neutral");
  });

  it("exposes every transaction type exactly once", () => {
    expect(BACKEND_TRANSACTION_TYPES).toEqual([
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
    ]);
  });
});
