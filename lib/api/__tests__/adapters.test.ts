import { describe, expect, it } from "vitest";

import {
  adaptBalances,
  adaptCashRecon,
  adaptFills,
  adaptOrderDetail,
  adaptOrderPage,
  adaptSupplyRecon,
  adaptTransactionPage,
} from "@/lib/api/adapters";

describe("real API response adapters", () => {
  it("converts database order decimals and supplies safe UI fallbacks", () => {
    const page = adaptOrderPage(
      {
        items: [
          {
            id: "123",
            clientId: "client-uuid",
            endUserId: "user-uuid",
            walletId: "wallet-uuid",
            symbol: "AAPL",
            side: "BUY",
            type: "LIMIT",
            qty: "1.500000000",
            notional: null,
            limitPrice: "205.250000",
            pinnedSpreadBps: 35,
            state: "FILLED",
            clientIdemKey: "idem",
            alpacaOrderId: null,
            createdAt: "2026-08-04T10:00:00.000Z",
            updatedAt: "2026-08-04T10:01:00.000Z",
          },
        ],
        nextCursor: "next",
        totalCount: 4,
      },
      "BUY",
    );

    expect(page).toMatchObject({ nextCursor: "next", totalCount: 4 });
    expect(page.items[0]).toMatchObject({
      clientName: "client-uuid",
      qty: 1.5,
      notional: null,
      limitPrice: 205.25,
      stateTransitions: [],
    });
  });

  it("normalizes redemption entities and both fill shapes", () => {
    expect(
      adaptOrderDetail(
        {
          id: "redemption-uuid",
          clientId: "client-uuid",
          lockedQty: "2.25",
          burnedQty: "1.25",
          releasedQty: "1",
          limitPrice: null,
          state: "BURNING",
        },
        "SELL",
      ),
    ).toMatchObject({
      side: "SELL",
      type: "MARKET",
      qty: 2.25,
      lockedQty: 2.25,
      burnedQty: 1.25,
      releasedQty: 1,
    });

    expect(
      adaptFills(
        [
          {
            alpacaFillId: "buy-fill",
            filledQty: "2",
            fillPrice: "10.5",
            mintState: "SUBMITTED",
            createdAt: "2026-08-04T10:00:00.000Z",
          },
        ],
        "BUY",
      )[0],
    ).toMatchObject({
      fillId: "buy-fill",
      qty: 2,
      price: 10.5,
      cost: 21,
      onChainStatus: "PENDING",
    });

    expect(
      adaptFills(
        [
          {
            id: "sell-fill",
            filledQty: "4",
            netProceeds: "39",
            burnState: "CONFIRMED",
            createdAt: "2026-08-04T10:00:00.000Z",
          },
        ],
        "SELL",
      )[0],
    ).toMatchObject({
      fillId: "sell-fill",
      qty: 4,
      price: 9.75,
      cost: 39,
      onChainStatus: "CONFIRMED",
    });
  });

  it("normalizes ledger and supply decimal strings", () => {
    expect(
      adaptBalances([
        {
          clientId: "client-uuid",
          clientName: "Nanovest",
          available: "50000.25",
          held: "1200.5",
          total: "51200.75",
        },
      ])[0],
    ).toEqual({
      clientId: "client-uuid",
      clientName: "Nanovest",
      available: 50000.25,
      held: 1200.5,
      total: 51200.75,
    });

    expect(
      adaptTransactionPage({
        items: [
          {
            id: "entry-uuid",
            timestamp: "2026-08-04T10:00:00.000Z",
            clientId: "client-uuid",
            accountType: "CLIENT_HOLD",
            sourceType: "HOLD",
            debit: "125.5",
            credit: "0",
            referenceId: "order-uuid",
            description: null,
          },
        ],
        nextCursor: null,
        totalCount: 1,
      }).items[0],
    ).toMatchObject({
      clientId: "client-uuid",
      accountType: "CLIENT_HOLD",
      sourceType: "HOLD",
      debit: 125.5,
      credit: 0,
      description: null,
    });

    expect(
      adaptSupplyRecon([
        {
          symbol: "AAPL",
          onChainSupply: "0",
          alpacaPositionSum: "150.5",
          residual: "-150.5",
          symbolStatus: "ACTIVE",
        },
      ])[0],
    ).toMatchObject({
      onChainSupply: 0,
      alpacaPositionSum: 150.5,
      residual: -150.5,
    });
  });

  it("maps the backend cash recon result to the dashboard card", () => {
    expect(
      adaptCashRecon({
        timestamp: "2026-08-04T10:00:00.000Z",
        trialBalance: { balanced: true, difference: "0" },
        netSettlement: {
          internalNetObligation: "100.25",
          alpacaDeficit: "100",
          difference: "0.25",
          buyFillsTotal: "150",
          sellProceedsTotal: "49.75",
        },
        passed: false,
      }),
    ).toEqual({
      source: "backend",
      usdtLedgerTotal: 100.25,
      usdtWalletBalance: 100,
      usdtDelta: 0.25,
      usdFloatAtAlpaca: 150,
      projectedFloatRequirement: 49.75,
      lastRunAt: "2026-08-04T10:00:00.000Z",
    });
  });
});
