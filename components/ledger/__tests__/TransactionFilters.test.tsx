import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TransactionFilters } from "@/components/ledger/TransactionFilters";
import {
  EMPTY_TRANSACTION_FILTERS,
  TRANSACTION_TYPES,
} from "@/lib/ledger/ledgerUtils";

describe("TransactionFilters", () => {
  it.each([
    ["Client", "Nanovest", "clientId", "client_nanovest"],
    ["Transaction Type", "BUY_DEBIT", "type", "BUY_DEBIT"],
  ])(
    "emits the complete value when %s changes",
    async (label, option, key, expectedValue) => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <TransactionFilters
          value={EMPTY_TRANSACTION_FILTERS}
          onChange={onChange}
          onClear={vi.fn()}
        />,
      );

      screen.getByRole("combobox", { name: label }).focus();
      await user.keyboard("{Enter}");
      await user.click(screen.getByRole("option", { name: option }));

      expect(onChange).toHaveBeenCalledWith({
        ...EMPTY_TRANSACTION_FILTERS,
        [key]: expectedValue,
      });
    },
  );

  it("emits complete values for both date boundaries", () => {
    const onChange = vi.fn();
    render(
      <TransactionFilters
        value={{ ...EMPTY_TRANSACTION_FILTERS, clientId: "client_acme" }}
        onChange={onChange}
        onClear={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("From date"), {
      target: { value: "2026-07-28" },
    });
    fireEvent.change(screen.getByLabelText("To date"), {
      target: { value: "2026-08-03" },
    });

    expect(onChange).toHaveBeenNthCalledWith(1, {
      ...EMPTY_TRANSACTION_FILTERS,
      clientId: "client_acme",
      fromDate: "2026-07-28",
    });
    expect(onChange).toHaveBeenNthCalledWith(2, {
      ...EMPTY_TRANSACTION_FILTERS,
      clientId: "client_acme",
      toDate: "2026-08-03",
    });
  });

  it("offers every required transaction type", async () => {
    const user = userEvent.setup();
    render(
      <TransactionFilters
        value={EMPTY_TRANSACTION_FILTERS}
        onChange={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    screen.getByRole("combobox", { name: "Transaction Type" }).focus();
    await user.keyboard("{Enter}");

    expect(
      TRANSACTION_TYPES.every((type) =>
        Boolean(screen.getByRole("option", { name: type })),
      ),
    ).toBe(true);
  });

  it("delegates clearing every filter", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <TransactionFilters
        value={{
          clientId: "client_nanovest",
          type: "DEPOSIT",
          fromDate: "2026-07-28",
          toDate: "2026-08-03",
        }}
        onChange={vi.fn()}
        onClear={onClear}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
