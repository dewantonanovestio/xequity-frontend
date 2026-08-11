import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BalanceSummary } from "@/components/ledger/BalanceSummary";
import type { ClientBalance } from "@/lib/types/ledger";

const balances: ClientBalance[] = [
  {
    clientId: "client_nanovest",
    clientName: "Nanovest",
    available: 50000,
    held: 12000,
    total: 62000,
  },
  {
    clientId: "client_acme",
    clientName: "Acme Capital",
    available: 8500,
    held: 4200,
    total: 12700,
  },
  {
    clientId: "client_blockprime",
    clientName: "BlockPrime",
    available: 4000,
    held: 2000,
    total: 6000,
  },
];

describe("BalanceSummary", () => {
  it("renders global totals first and formats every client balance", () => {
    render(
      <BalanceSummary balances={balances} isLoading={false} isError={false} />,
    );

    expect(screen.getByText("Client Balances")).toBeInTheDocument();
    expect(
      screen.getAllByRole("columnheader").map((node) => node.textContent),
    ).toEqual([
      "Client",
      "Available (USDT)",
      "Held (USDT)",
      "Total (USDT)",
    ]);

    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(5);
    expect(rows[1]).toHaveAttribute("data-global", "true");
    expect(within(rows[1]).getByText("Global Totals")).toBeInTheDocument();
    expect(within(rows[1]).getByText("$62,500.00")).toBeInTheDocument();
    expect(within(rows[1]).getByText("$18,200.00")).toBeInTheDocument();
    expect(within(rows[1]).getByText("$80,700.00")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Nanovest")).toBeInTheDocument();
    expect(within(rows[3]).getByText("$8,500.00")).toBeInTheDocument();
    expect(within(rows[4]).getByText("$6,000.00")).toBeInTheDocument();
  });

  it("renders four table-shaped skeleton rows while loading", () => {
    render(
      <BalanceSummary balances={[]} isLoading isError={false} />,
    );

    expect(screen.getAllByTestId("balance-row-skeleton")).toHaveLength(4);
  });

  it("distinguishes an empty successful response from an error", () => {
    const { rerender } = render(
      <BalanceSummary balances={[]} isLoading={false} isError={false} />,
    );

    expect(screen.getByText("No client balances are available.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    rerender(
      <BalanceSummary balances={[]} isLoading={false} isError />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Client balances could not be loaded.",
    );
    expect(
      screen.queryByText("No client balances are available."),
    ).not.toBeInTheDocument();
  });
});
