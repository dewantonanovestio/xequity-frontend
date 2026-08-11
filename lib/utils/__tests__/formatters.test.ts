import { describe, expect, it } from "vitest";

import {
  formatCurrency,
  formatDate,
  formatQty,
} from "@/lib/utils/formatters";

describe("formatCurrency", () => {
  it("uses USD grouping and two decimal places", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
  });

  it("formats zero without dropping decimal places", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("keeps the sign on negative amounts", () => {
    expect(formatCurrency(-50)).toBe("-$50.00");
  });
});

describe("formatQty", () => {
  it("rounds quantities to six fractional digits", () => {
    expect(formatQty(1.123456789)).toBe("1.123457");
  });

  it("omits insignificant trailing zeroes", () => {
    expect(formatQty(12.34)).toBe("12.34");
  });
});

describe("formatDate", () => {
  it("renders a readable UTC timestamp", () => {
    expect(formatDate("2026-08-03T14:30:00Z")).toBe(
      "Aug 3, 2026, 2:30 PM",
    );
  });

  it("uses a safe fallback for invalid input", () => {
    expect(formatDate("invalid")).toBe("-");
  });
});
