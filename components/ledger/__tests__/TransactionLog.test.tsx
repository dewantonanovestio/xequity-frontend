import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TransactionLog } from "@/components/ledger/TransactionLog";
import type { Transaction } from "@/lib/types/ledger";

const transactions: Transaction[] = [
  {
    id: "txn_credit",
    timestamp: "2026-08-03T10:00:00.000Z",
    clientId: "client_nanovest",
    accountType: "CLIENT_AVAILABLE",
    sourceType: "DEPOSIT",
    debit: 0,
    credit: 1200,
    referenceId: null,
    description: "Treasury deposit",
  },
  {
    id: "txn_debit",
    timestamp: "2026-08-02T09:00:00.000Z",
    clientId: "client_nanovest",
    accountType: "CLIENT_AVAILABLE",
    sourceType: "REGULATORY_FEE",
    debit: 250.5,
    credit: 0,
    referenceId: "ord_001",
    description: "AAPL purchase settlement",
  },
  {
    id: "txn_hold",
    timestamp: "2026-08-01T08:00:00.000Z",
    clientId: "client_acme",
    accountType: "CLIENT_HOLD",
    sourceType: "HOLD",
    debit: 100,
    credit: 0,
    referenceId: "ord_005",
    description: "Reserved order funds",
  },
  {
    id: "txn_info",
    timestamp: "2026-07-31T07:00:00.000Z",
    clientId: null,
    accountType: "XEQUITY_USDT_TREASURY",
    sourceType: "CONVERSION",
    debit: 0,
    credit: 0,
    referenceId: null,
    description: "Treasury conversion",
  },
];

const defaultProps = {
  transactions,
  isLoading: false,
  sortBy: "timestamp" as const,
  sortDirection: "desc" as const,
  onSortChange: vi.fn(),
  pageSize: 10,
  onPageSizeChange: vi.fn(),
  pageNumber: 1,
  totalCount: 4,
  canPreviousPage: false,
  canNextPage: false,
  onPreviousPage: vi.fn(),
  onNextPage: vi.fn(),
};

describe("TransactionLog", () => {
  it("renders every column, formatted value, null fallback, and reference link", () => {
    render(<TransactionLog {...defaultProps} />);

    expect(screen.getByText("Ledger Log")).toBeInTheDocument();
    expect(
      screen.getAllByRole("columnheader").map((node) => node.textContent),
    ).toEqual([
      "Timestamp",
      "Client ID",
      "Account Type",
      "Source Type",
      "Debit",
      "Credit",
      "Reference",
      "Description",
    ]);
    expect(screen.getByText(/Aug 3, 2026/)).toBeInTheDocument();
    expect(screen.getByText("$1,200.00")).toBeInTheDocument();
    expect(screen.getByText("$250.50")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open order ord_001" }),
    ).toHaveAttribute("href", "/admin/orders/ord_001");

    const creditRow = screen.getByText("Treasury deposit").closest("tr");
    expect(creditRow).not.toBeNull();
    expect(within(creditRow!).getAllByText("-")).toHaveLength(2);
  });

  it("applies all badge categories and signed amount tones", () => {
    render(<TransactionLog {...defaultProps} />);

    expect(screen.getByText("DEPOSIT")).toHaveAttribute("data-tone", "success");
    expect(screen.getByText("REGULATORY_FEE")).toHaveAttribute("data-tone", "danger");
    expect(screen.getByText("HOLD")).toHaveAttribute("data-tone", "warning");
    expect(screen.getByText("CONVERSION")).toHaveAttribute("data-tone", "info");
    expect(screen.getByText("$1,200.00")).toHaveClass("text-emerald-600");
    expect(screen.getByText("$250.50")).toHaveClass("text-red-600");
  });

  it("emits controlled global sort changes and exposes active direction", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    const { rerender } = render(
      <TransactionLog {...defaultProps} onSortChange={onSortChange} />,
    );

    expect(
      screen.getByRole("columnheader", { name: /Timestamp/ }),
    ).toHaveAttribute("aria-sort", "descending");
    await user.click(screen.getByRole("button", { name: "Sort by Timestamp" }));
    expect(onSortChange).toHaveBeenLastCalledWith("timestamp", "asc");

    rerender(
      <TransactionLog
        {...defaultProps}
        sortDirection="asc"
        onSortChange={onSortChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Sort by Timestamp" }));
    expect(onSortChange).toHaveBeenLastCalledWith("timestamp", "desc");

    await user.click(screen.getByRole("button", { name: "Sort by Client ID" }));
    expect(onSortChange).toHaveBeenLastCalledWith("clientId", "asc");
  });

  it("renders loading skeletons and a specific empty state", () => {
    const { rerender } = render(
      <TransactionLog {...defaultProps} transactions={[]} isLoading />,
    );

    expect(screen.getAllByTestId("transaction-row-skeleton")).toHaveLength(5);

    rerender(
      <TransactionLog
        {...defaultProps}
        transactions={[]}
        isLoading={false}
        totalCount={0}
      />,
    );
    expect(
      screen.getByText("No ledger entries match the current filters."),
    ).toBeInTheDocument();
  });

  it("delegates page size and cursor navigation with correct disabled states", async () => {
    const user = userEvent.setup();
    const onPageSizeChange = vi.fn();
    const onPreviousPage = vi.fn();
    const onNextPage = vi.fn();
    render(
      <TransactionLog
        {...defaultProps}
        pageNumber={2}
        totalCount={36}
        canPreviousPage
        canNextPage
        onPageSizeChange={onPageSizeChange}
        onPreviousPage={onPreviousPage}
        onNextPage={onNextPage}
      />,
    );

    expect(screen.getByText("36 matching entries")).toBeInTheDocument();
    expect(screen.getByText("Page 2")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Rows per page"), {
      target: { value: "20" },
    });
    await user.click(screen.getByRole("button", { name: "Previous page" }));
    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(onPageSizeChange).toHaveBeenCalledWith(20);
    expect(onPreviousPage).toHaveBeenCalledOnce();
    expect(onNextPage).toHaveBeenCalledOnce();
  });
});
