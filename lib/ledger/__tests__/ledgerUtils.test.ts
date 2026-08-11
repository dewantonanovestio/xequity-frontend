import { describe, expect, it } from "vitest";

import {
  TRANSACTION_TYPES,
  getAmountTone,
  getTransactionTone,
} from "@/lib/ledger/ledgerUtils";

describe("ledgerUtils", () => {
  it.each([
    ["DEPOSIT", "success"],
    ["SELL_CREDIT", "success"],
    ["DIVIDEND_CREDIT", "success"],
    ["WITHDRAWAL", "danger"],
    ["BUY_DEBIT", "danger"],
    ["BUY_HOLD", "warning"],
    ["BUY_HOLD_RELEASE", "warning"],
    ["SPREAD_REVENUE", "info"],
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
    expect(TRANSACTION_TYPES).toEqual([
      "DEPOSIT",
      "WITHDRAWAL",
      "BUY_HOLD",
      "BUY_HOLD_RELEASE",
      "BUY_DEBIT",
      "SELL_CREDIT",
      "DIVIDEND_CREDIT",
      "SPREAD_REVENUE",
      "CONVERSION",
    ]);
  });
});
