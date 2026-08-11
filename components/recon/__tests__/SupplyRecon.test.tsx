import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SupplyRecon } from "@/components/recon/SupplyRecon";
import type { SupplyRecon as SupplyReconData } from "@/lib/types/recon";

const supply: SupplyReconData[] = [
  {
    symbol: "AAPL",
    onChainSupply: 1234.56789,
    alpacaPositionSum: 1234.56789,
    residual: 0,
    symbolStatus: "ACTIVE",
  },
  {
    symbol: "TSLA",
    onChainSupply: 567.123456,
    alpacaPositionSum: 567.1234,
    residual: 0.000056,
    symbolStatus: "MINT_HALTED",
  },
  {
    symbol: "MSFT",
    onChainSupply: 890,
    alpacaPositionSum: 890,
    residual: 0,
    symbolStatus: "ACTIVE",
  },
  {
    symbol: "GOOGL",
    onChainSupply: 234.5,
    alpacaPositionSum: 234.5,
    residual: 0,
    symbolStatus: "ACTIVE",
  },
  {
    symbol: "SPY",
    onChainSupply: 2100,
    alpacaPositionSum: 2100,
    residual: 0,
    symbolStatus: "ACTIVE",
  },
];

describe("SupplyRecon", () => {
  it("renders all columns, symbols, and exact six-decimal quantities", () => {
    render(<SupplyRecon rows={supply} isLoading={false} isError={false} />);

    expect(screen.getByText("Supply Reconciliation")).toBeInTheDocument();
    expect(
      screen.getAllByRole("columnheader").map((node) => node.textContent),
    ).toEqual([
      "Status Indicator",
      "Symbol",
      "On-Chain Supply",
      "Alpaca Positions",
      "Residual",
      "Status",
    ]);
    expect(screen.getAllByRole("row")).toHaveLength(6);
    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("TSLA")).toBeInTheDocument();
    expect(screen.getByText("MSFT")).toBeInTheDocument();
    expect(screen.getByText("GOOGL")).toBeInTheDocument();
    expect(screen.getByText("SPY")).toBeInTheDocument();
    expect(screen.getAllByText("1,234.567890")).toHaveLength(2);
    expect(screen.getAllByText("890.000000")).toHaveLength(2);
    expect(screen.getAllByText("0.000000")).toHaveLength(4);
    expect(screen.getByText("0.000056")).toBeInTheDocument();
  });

  it("marks balanced and broken rows with matching residual and badge tones", () => {
    render(<SupplyRecon rows={supply} isLoading={false} isError={false} />);

    const aaplRow = screen.getByText("AAPL").closest("tr");
    const tslaRow = screen.getByText("TSLA").closest("tr");
    expect(aaplRow).toHaveAttribute("data-tone", "balanced");
    expect(tslaRow).toHaveAttribute("data-tone", "unbalanced");
    expect(screen.getByTestId("supply-indicator-AAPL")).toHaveClass(
      "bg-emerald-500",
    );
    expect(screen.getByTestId("supply-indicator-TSLA")).toHaveClass("bg-red-500");
    expect(screen.getByTestId("supply-residual-AAPL")).toHaveClass(
      "text-emerald-600",
    );
    expect(screen.getByTestId("supply-residual-TSLA")).toHaveClass(
      "text-red-600",
    );
    expect(within(aaplRow!).getByText("ACTIVE")).toHaveAttribute(
      "data-tone",
      "success",
    );
    expect(within(tslaRow!).getByText("MINT_HALTED")).toHaveAttribute(
      "data-tone",
      "warning",
    );
  });

  it.each([
    ["HALTED", "danger"],
    ["REDEEM_HALTED", "warning"],
    ["RETIRED", "neutral"],
    ["DELISTING", "neutral"],
  ] as const)("renders %s with the %s badge tone", (symbolStatus, tone) => {
    render(
      <SupplyRecon
        rows={[
          {
            symbol: "TEST",
            onChainSupply: 1,
            alpacaPositionSum: 1,
            residual: 0,
            symbolStatus,
          },
        ]}
        isLoading={false}
        isError={false}
      />,
    );

    expect(screen.getByText(symbolStatus)).toHaveAttribute("data-tone", tone);
  });

  it("distinguishes loading, empty, and request-error states", () => {
    const { rerender } = render(
      <SupplyRecon rows={[]} isLoading isError={false} />,
    );
    expect(screen.getAllByTestId("supply-row-skeleton")).toHaveLength(5);

    rerender(<SupplyRecon rows={[]} isLoading={false} isError={false} />);
    expect(
      screen.getByText("No supply reconciliation results are available."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    rerender(<SupplyRecon rows={[]} isLoading={false} isError />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Supply reconciliation could not be loaded.",
    );
  });
});
