import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrderDetailContainer } from "@/components/orders/OrderDetailContainer";
import type { Order } from "@/lib/types/order";

const apiMocks = vi.hoisted(() => ({
  getOrder: vi.fn(),
  getOrderFills: vi.fn(),
  getRedemption: vi.fn(),
  getRedemptionFills: vi.fn(),
}));

vi.mock("@/lib/api/ordersApi", () => ({
  useGetOrderQuery: apiMocks.getOrder,
  useGetOrderFillsQuery: apiMocks.getOrderFills,
  useGetRedemptionQuery: apiMocks.getRedemption,
  useGetRedemptionFillsQuery: apiMocks.getRedemptionFills,
}));

vi.mock("@/components/orders/ActionButtons", () => ({
  ActionButtons: ({ order }: { order: Order }) => (
    <button type="button">Action for {order.id}</button>
  ),
}));

const order: Order = {
  id: "ord_001",
  side: "BUY",
  symbol: "AAPL",
  endUserId: "user-001",
  clientId: "client_nanovest",
  clientName: "Nanovest",
  type: "LIMIT",
  qty: 10,
  notional: 1000,
  limitPrice: 100,
  state: "MINT_FAILED",
  clientIdemKey: "idem-001",
  alpacaOrderId: "alpaca-001",
  pinnedSpreadBps: 35,
  walletId: "wallet-001",
  createdAt: "2026-08-03T10:00:00.000Z",
  updatedAt: "2026-08-03T10:30:00.000Z",
  stateTransitions: [],
};

const readyDetail = { data: order, isLoading: false, isError: false };
const readyFills = { data: [], isLoading: false, isError: false };

describe("OrderDetailContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.getOrder.mockReturnValue(readyDetail);
    apiMocks.getOrderFills.mockReturnValue(readyFills);
    apiMocks.getRedemption.mockReturnValue({
      ...readyDetail,
      data: { ...order, id: "red_001", side: "SELL" },
    });
    apiMocks.getRedemptionFills.mockReturnValue(readyFills);
  });

  it("activates only order queries for an ord_ identifier", () => {
    render(<OrderDetailContainer id="ord_001" />);

    expect(apiMocks.getOrder).toHaveBeenCalledWith("ord_001", {
      pollingInterval: 5000,
      skip: false,
    });
    expect(apiMocks.getOrderFills).toHaveBeenCalledWith("ord_001", {
      skip: false,
    });
    expect(apiMocks.getRedemption).toHaveBeenCalledWith("ord_001", {
      pollingInterval: 5000,
      skip: true,
    });
    expect(apiMocks.getRedemptionFills).toHaveBeenCalledWith("ord_001", {
      skip: true,
    });
    expect(screen.getByRole("heading", { name: "ord_001" })).toBeInTheDocument();
  });

  it("activates only redemption queries for a red_ identifier", () => {
    render(<OrderDetailContainer id="red_001" />);

    expect(apiMocks.getOrder).toHaveBeenCalledWith("red_001", {
      pollingInterval: 5000,
      skip: true,
    });
    expect(apiMocks.getRedemption).toHaveBeenCalledWith("red_001", {
      pollingInterval: 5000,
      skip: false,
    });
    expect(screen.getByRole("heading", { name: "red_001" })).toBeInTheDocument();
  });

  it("renders a loading state while details or fills are pending", () => {
    apiMocks.getOrder.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<OrderDetailContainer id="ord_001" />);
    expect(screen.getByLabelText("Loading order details")).toBeInTheDocument();
  });

  it("renders a not-found message for a 404", () => {
    apiMocks.getOrder.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { status: 404 },
    });

    render(<OrderDetailContainer id="ord_missing" />);
    expect(screen.getByText("Order ord_missing was not found.")).toBeInTheDocument();
  });

  it("renders a generic request error", () => {
    apiMocks.getOrder.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { status: 500 },
    });

    render(<OrderDetailContainer id="ord_001" />);
    expect(screen.getByText("Order details could not be loaded.")).toBeInTheDocument();
  });

  it("rejects unsupported identifier prefixes without showing data", () => {
    render(<OrderDetailContainer id="unknown_001" />);
    expect(screen.getByText("Unsupported order identifier.")).toBeInTheDocument();
    expect(apiMocks.getOrder).toHaveBeenCalledWith("unknown_001", {
      pollingInterval: 5000,
      skip: true,
    });
  });
});
