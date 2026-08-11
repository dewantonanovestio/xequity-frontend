import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CashRecon } from "@/components/recon/CashRecon";
import type { CashRecon as CashReconData } from "@/lib/types/recon";

const mocks = vi.hoisted(() => ({
  runCashRecon: vi.fn(),
  unwrap: vi.fn(),
}));

vi.mock("@/lib/api/reconApi", () => ({
  useRunCashReconMutation: () => [
    mocks.runCashRecon,
    { isLoading: false },
  ],
}));

const balancedCash: CashReconData = {
  usdtLedgerTotal: 80700,
  usdtWalletBalance: 80700,
  usdtDelta: 0,
  usdFloatAtAlpaca: 45000,
  projectedFloatRequirement: 42000,
  lastRunAt: "2026-08-03T14:30:00Z",
};

const defaultProps = {
  cash: balancedCash,
  isLoading: false,
  isError: false,
};

describe("CashRecon", () => {
  beforeEach(() => {
    mocks.runCashRecon.mockReset().mockReturnValue({ unwrap: mocks.unwrap });
    mocks.unwrap.mockReset().mockResolvedValue({ success: true });
  });

  it("renders all six fields and the balanced delta treatment", () => {
    render(<CashRecon {...defaultProps} />);

    expect(screen.getByText("Cash Reconciliation")).toBeInTheDocument();
    expect(screen.getByText("USDT Ledger Total")).toBeInTheDocument();
    expect(screen.getByText("USDT Wallet Balance")).toBeInTheDocument();
    expect(screen.getByText("Delta")).toBeInTheDocument();
    expect(screen.getByText("USD Float at Alpaca")).toBeInTheDocument();
    expect(screen.getByText("Projected Float Requirement")).toBeInTheDocument();
    expect(screen.getByText("Last Recon Run")).toBeInTheDocument();
    expect(screen.getAllByText("$80,700.00")).toHaveLength(2);
    expect(screen.getByText("$45,000.00")).toBeInTheDocument();
    expect(screen.getByText("$42,000.00")).toBeInTheDocument();
    expect(screen.getByText("$0.00")).toBeInTheDocument();
    expect(screen.getByText("Aug 3, 2026, 2:30 PM")).toBeInTheDocument();
    expect(screen.getByTestId("cash-delta")).toHaveAttribute(
      "data-tone",
      "balanced",
    );
    expect(screen.getByTestId("cash-delta-indicator")).toHaveClass(
      "bg-emerald-500",
    );
  });

  it("preserves a signed non-zero delta and renders the unbalanced treatment", () => {
    render(
      <CashRecon
        {...defaultProps}
        cash={{
          ...balancedCash,
          usdtWalletBalance: 80650,
          usdtDelta: -50,
        }}
      />,
    );

    expect(screen.getByText("-$50.00")).toBeInTheDocument();
    expect(screen.getByTestId("cash-delta")).toHaveAttribute(
      "data-tone",
      "unbalanced",
    );
    expect(screen.getByTestId("cash-delta-indicator")).toHaveClass(
      "bg-red-500",
    );
  });

  it("distinguishes loading, empty, and request-error states", () => {
    const { rerender } = render(
      <CashRecon cash={null} isLoading isError={false} />,
    );
    expect(screen.getAllByTestId("cash-field-skeleton")).toHaveLength(6);

    rerender(<CashRecon cash={null} isLoading={false} isError={false} />);
    expect(
      screen.getByText("No cash reconciliation result is available."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    rerender(<CashRecon cash={null} isLoading={false} isError />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Cash reconciliation could not be loaded.",
    );
  });

  it("requires confirmation and supports cancellation without running", async () => {
    const user = userEvent.setup();
    render(<CashRecon {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Run Recon Now" }));
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveTextContent("Run cash reconciliation?");
    expect(dialog).toHaveTextContent(
      "This will trigger a full cash reconciliation run. Continue?",
    );
    expect(mocks.runCashRecon).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(mocks.runCashRecon).not.toHaveBeenCalled();
  });

  it("runs after confirmation and reports success", async () => {
    const user = userEvent.setup();
    render(<CashRecon {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Run Recon Now" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Run Recon Now",
      }),
    );

    expect(mocks.runCashRecon).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Cash reconciliation run triggered.",
      ),
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it.each([
    [
      { data: { message: "Recon service unavailable" } },
      "Recon service unavailable",
    ],
    ["unknown", "The cash reconciliation run could not be started."],
  ])("reports mutation failures inline", async (failure, message) => {
    mocks.unwrap.mockRejectedValue(failure);
    const user = userEvent.setup();
    render(<CashRecon {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Run Recon Now" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Run Recon Now",
      }),
    );

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(message),
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("keeps the dialog open and disables controls while the run is pending", async () => {
    let resolveRun: (value: { success: true }) => void = () => undefined;
    mocks.unwrap.mockReturnValue(
      new Promise<{ success: true }>((resolve) => {
        resolveRun = resolve;
      }),
    );
    const user = userEvent.setup();
    render(<CashRecon {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Run Recon Now" }));
    const dialog = screen.getByRole("alertdialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Run Recon Now" }),
    );

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Running…")).toBeInTheDocument();
    expect(screen.getByTestId("recon-run-spinner")).toHaveClass("animate-spin");
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Running…" })).toBeDisabled();

    resolveRun({ success: true });
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Cash reconciliation run triggered.",
      ),
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});
