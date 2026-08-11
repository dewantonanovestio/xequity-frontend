import { describe, expect, it } from "vitest";

import {
  deriveLedgerImpact,
  getOrderKind,
  getSideTone,
  getStateTone,
} from "@/lib/orders/orderUtils";
import type { Fill, Order } from "@/lib/types/order";

const order: Order = {
  id: "ord_test",
  side: "BUY",
  symbol: "AAPL",
  endUserId: "user_001",
  clientId: "client_nanovest",
  clientName: "Nanovest",
  type: "LIMIT",
  qty: 10,
  notional: 1000,
  limitPrice: 100,
  state: "PARTIALLY_FILLED",
  clientIdemKey: "idem_test",
  alpacaOrderId: "alpaca_test",
  pinnedSpreadBps: 50,
  walletId: "wallet_test",
  createdAt: "2026-08-03T10:00:00Z",
  updatedAt: "2026-08-03T10:05:00Z",
  stateTransitions: [],
};

const fills: Fill[] = [
  {
    fillId: "fill_a",
    qty: 4,
    price: 100,
    cost: 400,
    filledAt: "2026-08-03T10:03:00Z",
  },
  {
    fillId: "fill_b",
    qty: 6,
    price: 98.333333,
    cost: 590,
    filledAt: "2026-08-03T10:04:00Z",
  },
];

describe("order utilities", () => {
  it.each([
    ["ord_001", "order"],
    ["red_001", "redemption"],
    ["unknown", "unknown"],
  ] as const)("classifies %s as %s", (id, expected) => {
    expect(getOrderKind(id)).toBe(expected);
  });

  it.each([
    ["SETTLED", "success"],
    ["MINT_FAILED", "danger"],
    ["QUEUED", "warning"],
    ["EXPIRED", "neutral"],
  ] as const)("maps %s to the %s state tone", (state, expected) => {
    expect(getStateTone(state)).toBe(expected);
  });

  it("distinguishes buy and sell side tones", () => {
    expect(getSideTone("BUY")).toBe("buy");
    expect(getSideTone("SELL")).toBe("sell");
  });

  it("derives hold, settlement, and spread amounts", () => {
    expect(deriveLedgerImpact(order, fills)).toEqual({
      holdAmount: 1000,
      settlementAmount: 990,
      spreadBooked: 4.95,
    });
  });

  it("falls back to limit value and then fill value for the hold", () => {
    expect(
      deriveLedgerImpact({ ...order, notional: null }, fills).holdAmount,
    ).toBe(1000);
    expect(
      deriveLedgerImpact(
        { ...order, notional: null, limitPrice: null },
        fills,
      ).holdAmount,
    ).toBe(990);
  });
});
