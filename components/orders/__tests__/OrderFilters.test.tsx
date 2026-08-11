import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { OrderFilters } from "@/components/orders/OrderFilters";
import { EMPTY_ORDER_FILTERS } from "@/lib/orders/orderUtils";

describe("OrderFilters", () => {
  it("emits complete filter values for text and date changes", () => {
    const onChange = vi.fn();

    render(
      <OrderFilters
        value={{ ...EMPTY_ORDER_FILTERS, symbol: "AAPL" }}
        onChange={onChange}
        onClear={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("End user"), {
      target: { value: "user-42" },
    });
    fireEvent.change(screen.getByLabelText("From date"), {
      target: { value: "2026-08-01" },
    });

    expect(onChange).toHaveBeenNthCalledWith(1, {
      ...EMPTY_ORDER_FILTERS,
      symbol: "AAPL",
      endUserId: "user-42",
    });
    expect(onChange).toHaveBeenNthCalledWith(2, {
      ...EMPTY_ORDER_FILTERS,
      symbol: "AAPL",
      fromDate: "2026-08-01",
    });
  });

  it.each([
    ["Client", "Nanovest", "clientId", "client_nanovest"],
    ["Symbol", "AAPL", "symbol", "AAPL"],
    ["Status", "MINT_FAILED", "status", "MINT_FAILED"],
  ])(
    "emits the mapped value from the %s select",
    async (label, option, key, expectedValue) => {
    const user = userEvent.setup();
    const onChange = vi.fn();

      render(
        <OrderFilters
          value={EMPTY_ORDER_FILTERS}
          onChange={onChange}
          onClear={vi.fn()}
        />,
      );

      screen.getByRole("combobox", { name: label }).focus();
      await user.keyboard("{Enter}");
      await user.click(screen.getByRole("option", { name: option }));

      expect(onChange).toHaveBeenCalledWith({
        ...EMPTY_ORDER_FILTERS,
        [key]: expectedValue,
      });
    },
  );

  it("clears all filters", async () => {
    const onClear = vi.fn();
    const user = userEvent.setup();

    render(
      <OrderFilters
        value={{ ...EMPTY_ORDER_FILTERS, status: "SETTLED" }}
        onChange={vi.fn()}
        onClear={onClear}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
