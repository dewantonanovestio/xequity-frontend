import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { OrderTable } from "@/components/orders/OrderTable";
import type { Order, OrderState } from "@/lib/types/order";

function makeOrder(
  id: string,
  overrides: Partial<Order> & { state?: OrderState } = {},
): Order {
  return {
    id,
    side: "BUY",
    symbol: "AAPL",
    endUserId: `user-${id}`,
    clientId: "client_nanovest",
    clientName: "Nanovest",
    type: "LIMIT",
    qty: 12.34,
    notional: 1234.5,
    limitPrice: 100,
    state: "SETTLED",
    clientIdemKey: `idem-${id}`,
    alpacaOrderId: `alpaca-${id}`,
    pinnedSpreadBps: 35,
    walletId: `wallet-${id}`,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:30:00.000Z",
    stateTransitions: [],
    ...overrides,
  };
}

const orders = [
  makeOrder("ord_001", {
    symbol: "AAPL",
    state: "MINT_FAILED",
    createdAt: "2026-08-01T10:00:00.000Z",
  }),
  makeOrder("red_001", {
    side: "SELL",
    symbol: "TSLA",
    clientName: "Acme Capital",
    notional: null,
    limitPrice: null,
    state: "SETTLED",
    createdAt: "2026-08-03T10:00:00.000Z",
  }),
  makeOrder("ord_002", {
    symbol: "MSFT",
    createdAt: "2026-08-02T10:00:00.000Z",
  }),
];

describe("OrderTable", () => {
  it("renders all columns, formatting, tones, and newest-first rows", () => {
    render(
      <OrderTable
        orders={orders}
        isLoading={false}
        filterKey="all"
        onOpenOrder={vi.fn()}
      />,
    );

    expect(
      screen.getAllByRole("columnheader").map((header) => header.textContent),
    ).toEqual([
      "ID",
      "Side",
      "Symbol",
      "End-User",
      "Client",
      "Type",
      "Qty",
      "Notional",
      "Limit Price",
      "State",
      "Created",
      "Updated",
    ]);

    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("red_001")).toBeInTheDocument();
    expect(screen.getAllByText("BUY")[0]).toHaveAttribute("data-tone", "buy");
    expect(screen.getByText("SELL")).toHaveAttribute("data-tone", "sell");
    expect(screen.getByText("MINT_FAILED")).toHaveAttribute(
      "data-tone",
      "danger",
    );
    expect(screen.getAllByText("SETTLED")[0]).toHaveAttribute(
      "data-tone",
      "success",
    );
    expect(screen.getAllByText("12.34")[0]).toBeInTheDocument();
    expect(screen.getAllByText("$1,234.50")[0]).toBeInTheDocument();
    expect(within(rows[1]).getAllByText("-")).toHaveLength(2);
  });

  it("sorts by a selected column", async () => {
    const user = userEvent.setup();
    render(
      <OrderTable
        orders={orders}
        isLoading={false}
        filterKey="all"
        onOpenOrder={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Sort by Symbol" }));

    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("AAPL")).toBeInTheDocument();
  });

  it("paginates ten rows and resets when filters change", async () => {
    const user = userEvent.setup();
    const manyOrders = Array.from({ length: 11 }, (_, index) =>
      makeOrder(`ord_${String(index + 1).padStart(3, "0")}`, {
        createdAt: `2026-08-${String(index + 1).padStart(2, "0")}T10:00:00.000Z`,
      }),
    );
    const { rerender } = render(
      <OrderTable
        orders={manyOrders}
        isLoading={false}
        filterKey="all"
        onOpenOrder={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("row")).toHaveLength(11);
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();

    rerender(
      <OrderTable
        orders={manyOrders}
        isLoading={false}
        filterKey="symbol=AAPL"
        onOpenOrder={vi.fn()}
      />,
    );

    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
  });

  it("opens a row with pointer and keyboard activation", async () => {
    const onOpenOrder = vi.fn();
    const user = userEvent.setup();
    render(
      <OrderTable
        orders={[orders[0]]}
        isLoading={false}
        filterKey="all"
        onOpenOrder={onOpenOrder}
      />,
    );

    const row = screen.getByRole("row", { name: /Open order ord_001/i });
    await user.click(row);
    fireEvent.keyDown(row, { key: "Enter" });

    expect(onOpenOrder).toHaveBeenNthCalledWith(1, "ord_001");
    expect(onOpenOrder).toHaveBeenNthCalledWith(2, "ord_001");
  });

  it("renders loading skeletons and a specific empty state", () => {
    const { rerender } = render(
      <OrderTable
        orders={[]}
        isLoading
        filterKey="all"
        onOpenOrder={vi.fn()}
      />,
    );

    expect(screen.getAllByTestId("order-row-skeleton")).toHaveLength(5);

    rerender(
      <OrderTable
        orders={[]}
        isLoading={false}
        filterKey="all"
        onOpenOrder={vi.fn()}
      />,
    );

    expect(
      screen.getByText("No orders match the current filters."),
    ).toBeInTheDocument();
  });
});
