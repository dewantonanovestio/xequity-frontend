import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OrderDetail } from "@/components/orders/OrderDetail";
import type { Fill, Order } from "@/lib/types/order";

const sellOrder: Order = {
  id: "red_001",
  side: "SELL",
  symbol: "AAPL",
  endUserId: "user-nano-001",
  clientId: "client_nanovest",
  clientName: "Nanovest",
  type: "LIMIT",
  qty: 10,
  notional: 1000,
  limitPrice: 100,
  state: "BURN_FAILED",
  clientIdemKey: "idem-red-001",
  alpacaOrderId: "alpaca-red-001",
  pinnedSpreadBps: 50,
  walletId: "wallet-nano-001",
  createdAt: "2026-08-03T10:00:00.000Z",
  updatedAt: "2026-08-03T10:30:00.000Z",
  stateTransitions: [
    {
      fromState: null,
      toState: "SUBMITTED",
      transitionedAt: "2026-08-03T10:00:00.000Z",
    },
    {
      fromState: "FILLED",
      toState: "BURN_FAILED",
      transitionedAt: "2026-08-03T10:30:00.000Z",
    },
  ],
  lockedQty: 10,
  burnedQty: 4,
  releasedQty: 2,
};

const fills: Fill[] = [
  {
    fillId: "fill-red-001",
    qty: 10,
    price: 99,
    cost: 990,
    filledAt: "2026-08-03T10:20:00.000Z",
    burnTxHash: "0xburn",
    onChainStatus: "FAILED",
    retryCount: 1,
  },
];

describe("OrderDetail", () => {
  it("renders standard, diagnostic, ledger, lifecycle, and SELL fields", () => {
    render(
      <OrderDetail
        order={sellOrder}
        fills={fills}
        actions={<button type="button">Recovery action</button>}
      />,
    );

    expect(screen.getByRole("heading", { name: "red_001" })).toBeInTheDocument();
    expect(screen.getByText("SELL")).toBeInTheDocument();
    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("Nanovest")).toBeInTheDocument();
    expect(screen.getByText("user-nano-001")).toBeInTheDocument();
    expect(screen.getByText("LIMIT")).toBeInTheDocument();
    expect(screen.getAllByText("BURN_FAILED")[0]).toBeInTheDocument();
    expect(screen.getByText("idem-red-001")).toBeInTheDocument();
    expect(screen.getByText("alpaca-red-001")).toBeInTheDocument();
    expect(screen.getByText("wallet-nano-001")).toBeInTheDocument();
    expect(screen.getByText("50 bps")).toBeInTheDocument();
    expect(screen.getByText("Recovery action")).toBeInTheDocument();

    const ledger = screen.getByRole("region", { name: "Ledger impact" });
    expect(within(ledger).getByText("$1,000.00")).toBeInTheDocument();
    expect(within(ledger).getByText("Credit amount")).toBeInTheDocument();
    expect(within(ledger).getByText("$990.00")).toBeInTheDocument();
    expect(within(ledger).getByText("$4.95")).toBeInTheDocument();

    const partition = screen.getByRole("region", {
      name: "Redemption partition",
    });
    expect(within(partition).getByText("Locked quantity")).toBeInTheDocument();
    expect(within(partition).getByText("10")).toBeInTheDocument();
    expect(within(partition).getByText("4")).toBeInTheDocument();
    expect(within(partition).getByText("2")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "State timeline" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Fills" })).toBeInTheDocument();
    expect(screen.getByText("fill-red-001")).toBeInTheDocument();
  });

  it("labels BUY settlement as a debit and omits redemption partition", () => {
    render(
      <OrderDetail
        order={{
          ...sellOrder,
          id: "ord_001",
          side: "BUY",
          state: "MINT_FAILED",
          lockedQty: undefined,
          burnedQty: undefined,
          releasedQty: undefined,
        }}
        fills={fills}
        actions={null}
      />,
    );

    expect(screen.getByText("Debit amount")).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Redemption partition" }),
    ).not.toBeInTheDocument();
  });
});
