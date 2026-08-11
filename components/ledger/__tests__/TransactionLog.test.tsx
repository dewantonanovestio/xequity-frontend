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
    clientName: "Nanovest",
    endUserId: null,
    type: "DEPOSIT",
    amount: 1200,
    runningBalance: 5000,
    referenceId: null,
    description: "Treasury deposit",
  },
  {
    id: "txn_debit",
    timestamp: "2026-08-02T09:00:00.000Z",
    clientId: "client_nanovest",
    clientName: "Nanovest",
    endUserId: "user-nano-001",
    type: "BUY_DEBIT",
    amount: -250.5,
    runningBalance: 4750.5,
    referenceId: "ord_001",
    description: "AAPL purchase settlement",
  },
  {
    id: "txn_hold",
    timestamp: "2026-08-01T08:00:00.000Z",
    clientId: "client_acme",
    clientName: "Acme Capital",
    endUserId: "user-acme-005",
    type: "BUY_HOLD",
    amount: -100,
    runningBalance: 900,
    referenceId: "ord_005",
    description: "Reserved order funds",
  },
  {
    id: "txn_info",
    timestamp: "2026-07-31T07:00:00.000Z",
    clientId: "client_blockprime",
    clientName: "BlockPrime",
    endUserId: null,
    type: "CONVERSION",
    amount: 0,
    runningBalance: 6000,
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

    expect(screen.getByText("Transaction Log")).toBeInTheDocument();
    expect(
      screen.getAllByRole("columnheader").map((node) => node.textContent),
    ).toEqual([
      "Timestamp",
      "Client",
      "End-User",
      "Type",
      "Amount",
      "Running Balance",
      "Reference",
      "Description",
    ]);
    expect(screen.getByText(/Aug 3, 2026/)).toBeInTheDocument();
    expect(screen.getByText("$1,200.00")).toBeInTheDocument();
    expect(screen.getByText("-$250.50")).toBeInTheDocument();
    expect(screen.getByText("$4,750.50")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open order ord_001" }),
    ).toHaveAttribute("href", "/orders/ord_001");

    const creditRow = screen.getByText("Treasury deposit").closest("tr");
    expect(creditRow).not.toBeNull();
    expect(within(creditRow!).getAllByText("-")).toHaveLength(2);
  });

  it("applies all badge categories and signed amount tones", () => {
    render(<TransactionLog {...defaultProps} />);

    expect(screen.getByText("DEPOSIT")).toHaveAttribute("data-tone", "success");
    expect(screen.getByText("BUY_DEBIT")).toHaveAttribute("data-tone", "danger");
    expect(screen.getByText("BUY_HOLD")).toHaveAttribute("data-tone", "warning");
    expect(screen.getByText("CONVERSION")).toHaveAttribute("data-tone", "info");
    expect(screen.getByTestId("amount-positive")).toHaveClass("text-emerald-600");
    expect(screen.getAllByTestId("amount-negative")[0]).toHaveClass("text-red-600");
    expect(screen.getByTestId("amount-neutral")).not.toHaveClass(
      "text-emerald-600",
      "text-red-600",
    );
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

    await user.click(screen.getByRole("button", { name: "Sort by Client" }));
    expect(onSortChange).toHaveBeenLastCalledWith("clientName", "asc");
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
      screen.getByText("No transactions match the current filters."),
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

    expect(screen.getByText("36 matching transactions")).toBeInTheDocument();
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
