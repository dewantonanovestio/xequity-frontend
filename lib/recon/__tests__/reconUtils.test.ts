import { describe, expect, it } from "vitest";

import {
  formatReconQuantity,
  getDeltaTone,
  getResidualTone,
  getSymbolStatusTone,
} from "@/lib/recon/reconUtils";

describe("reconciliation utilities", () => {
  it("formats reconciliation quantities with exactly six decimal places", () => {
    expect(formatReconQuantity(1234.56789)).toBe("1,234.567890");
    expect(formatReconQuantity(890)).toBe("890.000000");
    expect(formatReconQuantity(0.000056)).toBe("0.000056");
  });

  it("classifies exact zero as balanced and every non-zero value as unbalanced", () => {
    expect(getDeltaTone(0)).toBe("balanced");
    expect(getDeltaTone(-50)).toBe("unbalanced");
    expect(getResidualTone(0)).toBe("balanced");
    expect(getResidualTone(0.000056)).toBe("unbalanced");
  });

  it.each([
    ["ACTIVE", "success"],
    ["HALTED", "danger"],
    ["MINT_HALTED", "warning"],
    ["REDEEM_HALTED", "warning"],
    ["RETIRED", "neutral"],
    ["DELISTING", "neutral"],
  ] as const)("maps %s to the %s status tone", (status, tone) => {
    expect(getSymbolStatusTone(status)).toBe(tone);
  });
});
