import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OrdersPage from "@/app/admin/orders/page";
import Home from "@/app/page";
import StoreProvider from "@/lib/store/StoreProvider";
import type { Order } from "@/lib/types/order";

const navigationMocks = vi.hoisted(() => ({
  redirect: vi.fn(),
  replace: vi.fn(),
  push: vi.fn(),
  useSearchParams: vi.fn(),
}));

const apiMocks = vi.hoisted(() => ({
  getOrders: vi.fn(),
  getRedemptions: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: navigationMocks.redirect,
  useRouter: () => ({
    replace: navigationMocks.replace,
    push: navigationMocks.push,
  }),
  useSearchParams: navigationMocks.useSearchParams,
}));

vi.mock("@/lib/api/ordersApi", () => ({
  useGetOrdersQuery: apiMocks.getOrders,
  useGetRedemptionsQuery: apiMocks.getRedemptions,
}));

vi.mock("@/lib/api/clientApi", () => ({
  useGetClientsQuery: () => ({
    data: [{ id: "client_nanovest", legalName: "Nanovest" }],
    isLoading: false,
  }),
}));

function makeOrder(id: string, side: Order["side"]): Order {
  return {
    id,
    side,
    symbol: side === "BUY" ? "AAPL" : "TSLA",
    endUserId: `user-${id}`,
    clientId: "client_nanovest",
    clientName: "Nanovest",
    type: "MARKET",
    qty: 10,
    notional: 1000,
    limitPrice: null,
    state: "SETTLED",
    clientIdemKey: `idem-${id}`,
    alpacaOrderId: `alpaca-${id}`,
    pinnedSpreadBps: 35,
    walletId: `wallet-${id}`,
    createdAt:
      side === "BUY"
        ? "2026-08-03T10:00:00.000Z"
        : "2026-08-02T10:00:00.000Z",
    updatedAt: "2026-08-03T10:30:00.000Z",
    stateTransitions: [],
  };
}

describe("dashboard routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigationMocks.useSearchParams.mockReturnValue(new URLSearchParams());
    apiMocks.getOrders.mockReturnValue({
      data: { items: [makeOrder("ord_001", "BUY")], totalCount: 1 },
      isLoading: false,
      isError: false,
    });
    apiMocks.getRedemptions.mockReturnValue({
      data: { items: [makeOrder("red_001", "SELL")], totalCount: 1 },
      isLoading: false,
      isError: false,
    });
  });

  it("loads and merges both order resources with shared filters and polling", () => {
    navigationMocks.useSearchParams.mockReturnValue(
      new URLSearchParams("clientId=client_nanovest&status=SETTLED"),
    );

    render(<StoreProvider><OrdersPage /></StoreProvider>);

    const expectedQuery = {
      clientId: "client_nanovest",
      status: "SETTLED",
      limit: 100,
    };
    expect(apiMocks.getOrders).toHaveBeenCalledWith(expectedQuery, {
      pollingInterval: 5000,
    });
    expect(apiMocks.getRedemptions).toHaveBeenCalledWith(expectedQuery, {
      pollingInterval: 5000,
    });
    expect(screen.getByText("ord_001")).toBeInTheDocument();
    expect(screen.getByText("red_001")).toBeInTheDocument();
  });

  it("writes filter changes and clearing to the orders URL", async () => {
    const user = userEvent.setup();
    render(<StoreProvider><OrdersPage /></StoreProvider>);

    screen.getByRole("combobox", { name: "Symbol" }).focus();
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("option", { name: "AAPL" }));
    expect(navigationMocks.replace).toHaveBeenCalledWith("/admin/orders?symbol=AAPL");

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(navigationMocks.replace).toHaveBeenCalledWith("/admin/orders");
  });

  it("opens a row through the router", async () => {
    const user = userEvent.setup();
    render(<StoreProvider><OrdersPage /></StoreProvider>);

    await user.click(screen.getByRole("row", { name: "Open order ord_001" }));
    expect(navigationMocks.push).toHaveBeenCalledWith("/admin/orders/ord_001");
  });

  it("renders a complete-list error when either source fails", () => {
    apiMocks.getRedemptions.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<StoreProvider><OrdersPage /></StoreProvider>);
    expect(
      screen.getByText("The complete order list could not be loaded."),
    ).toBeInTheDocument();
    expect(screen.queryByText("ord_001")).not.toBeInTheDocument();
  });

  it("redirects the root route to the order tracker", () => {
    render(<StoreProvider><Home /></StoreProvider>);
    expect(navigationMocks.replace).toHaveBeenCalledOnce();
    expect(navigationMocks.replace).toHaveBeenCalledWith("/admin/orders");
  });
});
