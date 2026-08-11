import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ReconPage from "@/app/admin/recon/page";
import type { CashRecon, SupplyRecon } from "@/lib/types/recon";

const mocks = vi.hoisted(() => ({
  getCashRecon: vi.fn(),
  getSupplyRecon: vi.fn(),
  runCashRecon: vi.fn(),
  unwrapRun: vi.fn(),
}));

vi.mock("@/lib/api/reconApi", () => ({
  useGetCashReconQuery: mocks.getCashRecon,
  useGetSupplyReconQuery: mocks.getSupplyRecon,
  useRunCashReconMutation: () => [
    mocks.runCashRecon,
    { isLoading: false },
  ],
}));

const cash: CashRecon = {
  usdtLedgerTotal: 80700,
  usdtWalletBalance: 80700,
  usdtDelta: 0,
  usdFloatAtAlpaca: 45000,
  projectedFloatRequirement: 42000,
  lastRunAt: "2026-08-03T14:30:00Z",
};

const supply: SupplyRecon[] = [
  ["AAPL", 1234.56789, 1234.56789, 0, "ACTIVE"],
  ["TSLA", 567.123456, 567.1234, 0.000056, "MINT_HALTED"],
  ["MSFT", 890, 890, 0, "ACTIVE"],
  ["GOOGL", 234.5, 234.5, 0, "ACTIVE"],
  ["SPY", 2100, 2100, 0, "ACTIVE"],
].map(
  ([symbol, onChainSupply, alpacaPositionSum, residual, symbolStatus]) => ({
    symbol: symbol as string,
    onChainSupply: onChainSupply as number,
    alpacaPositionSum: alpacaPositionSum as number,
    residual: residual as number,
    symbolStatus: symbolStatus as SupplyRecon["symbolStatus"],
  }),
);

beforeEach(() => {
  mocks.getCashRecon.mockReset().mockReturnValue({
    data: cash,
    isLoading: false,
    isError: false,
  });
  mocks.getSupplyRecon.mockReset().mockReturnValue({
    data: supply,
    isLoading: false,
    isError: false,
  });
  mocks.runCashRecon.mockReset().mockReturnValue({ unwrap: mocks.unwrapRun });
  mocks.unwrapRun.mockReset().mockResolvedValue({ success: true });
});

describe("ReconPage", () => {
  it("polls both sections every thirty seconds and renders their data", () => {
    render(<ReconPage />);

    expect(mocks.getCashRecon).toHaveBeenCalledWith(undefined, {
      pollingInterval: 30000,
    });
    expect(mocks.getSupplyRecon).toHaveBeenCalledWith(undefined, {
      pollingInterval: 30000,
    });
    expect(
      screen.getByRole("heading", { name: "Reconciliation" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Cash Reconciliation")).toBeInTheDocument();
    expect(screen.getByText("Supply Reconciliation")).toBeInTheDocument();
    expect(screen.getAllByText("$80,700.00")).toHaveLength(2);
    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("TSLA")).toBeInTheDocument();
    expect(screen.getByText("MSFT")).toBeInTheDocument();
    expect(screen.getByText("GOOGL")).toBeInTheDocument();
    expect(screen.getByText("SPY")).toBeInTheDocument();
  });

  it("keeps supply visible when the cash request fails", () => {
    mocks.getCashRecon.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    render(<ReconPage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Cash reconciliation could not be loaded.",
    );
    expect(screen.getByText("TSLA")).toBeInTheDocument();
    expect(
      screen.queryByText("Supply reconciliation could not be loaded."),
    ).not.toBeInTheDocument();
  });

  it("keeps cash visible when the supply request fails", () => {
    mocks.getSupplyRecon.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    render(<ReconPage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Supply reconciliation could not be loaded.",
    );
    expect(screen.getAllByText("$80,700.00")).toHaveLength(2);
    expect(
      screen.queryByText("Cash reconciliation could not be loaded."),
    ).not.toBeInTheDocument();
  });
});
