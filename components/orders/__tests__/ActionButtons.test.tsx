import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ActionButtons } from "@/components/orders/ActionButtons";
import type { Order, OrderState } from "@/lib/types/order";

const mocks = vi.hoisted(() => ({
  retryMint: vi.fn(),
  retryBurn: vi.fn(),
  cancelOrder: vi.fn(),
  unwrapMint: vi.fn(),
  unwrapBurn: vi.fn(),
  unwrapCancel: vi.fn(),
}));

vi.mock("@/lib/api/ordersApi", () => ({
  useRetryMintMutation: () => [mocks.retryMint, { isLoading: false }],
  useRetryBurnMutation: () => [mocks.retryBurn, { isLoading: false }],
  useCancelOrderMutation: () => [mocks.cancelOrder, { isLoading: false }],
}));

function makeOrder(side: Order["side"], state: OrderState): Order {
  return {
    id: side === "BUY" ? "ord_001" : "red_001",
    side,
    symbol: "AAPL",
    endUserId: "user-001",
    clientId: "client_nanovest",
    clientName: "Nanovest",
    type: "LIMIT",
    qty: 10,
    notional: 1000,
    limitPrice: 100,
    state,
    clientIdemKey: "idem-001",
    alpacaOrderId: "alpaca-001",
    pinnedSpreadBps: 35,
    walletId: "wallet-001",
    createdAt: "2026-08-03T10:00:00.000Z",
    updatedAt: "2026-08-03T10:30:00.000Z",
    stateTransitions: [],
  };
}

describe("ActionButtons", () => {
  beforeEach(() => {
    mocks.retryMint.mockReturnValue({ unwrap: mocks.unwrapMint });
    mocks.retryBurn.mockReturnValue({ unwrap: mocks.unwrapBurn });
    mocks.cancelOrder.mockReturnValue({ unwrap: mocks.unwrapCancel });
    mocks.unwrapMint.mockResolvedValue({ state: "MINTING" });
    mocks.unwrapBurn.mockResolvedValue({ state: "FILLED" });
    mocks.unwrapCancel.mockResolvedValue({ state: "CANCELLED" });
  });

  it.each([
    ["BUY", "MINT_FAILED", "Retry Mint"],
    ["SELL", "BURN_FAILED", "Retry Burn"],
    ["BUY", "QUEUED", "Cancel Order"],
    ["BUY", "OPEN_EXECUTING", "Cancel Order"],
    ["BUY", "PARTIALLY_FILLED", "Cancel Order"],
  ] as const)("shows %s %s action as %s", (side, state, label) => {
    render(<ActionButtons order={makeOrder(side, state)} />);
    expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
  });

  it("renders no action container for a terminal state", () => {
    render(<ActionButtons order={makeOrder("BUY", "SETTLED")} />);
    expect(screen.queryByTestId("order-actions")).not.toBeInTheDocument();
  });

  it("confirms a retry mint before running it and reports success", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ActionButtons order={makeOrder("BUY", "MINT_FAILED")} />,
    );

    await user.click(screen.getByRole("button", { name: "Retry Mint" }));
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveTextContent("ord_001");
    expect(dialog).toHaveTextContent("retry the on-chain mint");
    expect(mocks.retryMint).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Retry Mint" }));

    expect(mocks.retryMint).toHaveBeenCalledWith("ord_001");
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Retry Mint completed successfully.",
      ),
    );

    rerender(<ActionButtons order={makeOrder("BUY", "MINTING")} />);
    expect(screen.queryByRole("button", { name: "Retry Mint" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Retry Mint completed successfully.",
    );
  });

  it("routes retry burn and cancellation to their matching mutations", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ActionButtons order={makeOrder("SELL", "BURN_FAILED")} />,
    );

    await user.click(screen.getByRole("button", { name: "Retry Burn" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Retry Burn",
      }),
    );
    expect(mocks.retryBurn).toHaveBeenCalledWith("red_001");

    rerender(<ActionButtons order={makeOrder("BUY", "QUEUED")} />);
    await user.click(screen.getByRole("button", { name: "Cancel Order" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Cancel Order",
      }),
    );
    expect(mocks.cancelOrder).toHaveBeenCalledWith("ord_001");
  });

  it("shows a server mutation error inline", async () => {
    mocks.unwrapCancel.mockRejectedValue({
      data: { message: "Order ord_001 cannot be cancelled" },
    });
    const user = userEvent.setup();
    render(<ActionButtons order={makeOrder("BUY", "QUEUED")} />);

    await user.click(screen.getByRole("button", { name: "Cancel Order" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Cancel Order",
      }),
    );

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Order ord_001 cannot be cancelled",
      ),
    );
  });
});
