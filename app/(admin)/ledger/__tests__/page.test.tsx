import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LedgerPage from "@/app/admin/ledger/page";
import type {
  ClientBalance,
  PaginatedTransactions,
} from "@/lib/types/ledger";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  search: { value: "" },
  useGetBalancesQuery: vi.fn(),
  useGetSystemBalancesQuery: vi.fn(),
  useGetTransactionsQuery: vi.fn(),
  useGetClientsQuery: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => new URLSearchParams(mocks.search.value),
}));

vi.mock("@/lib/api/ledgerApi", () => ({
  useGetBalancesQuery: mocks.useGetBalancesQuery,
  useGetSystemBalancesQuery: mocks.useGetSystemBalancesQuery,
  useGetTransactionsQuery: mocks.useGetTransactionsQuery,
}));

vi.mock("@/lib/api/clientApi", () => ({
  useGetClientsQuery: mocks.useGetClientsQuery,
}));

const balances: ClientBalance[] = [
  {
    clientId: "client_nanovest",
    clientName: "Nanovest",
    available: 50000,
    held: 12000,
    total: 62000,
  },
];

const transactionPage: PaginatedTransactions = {
  items: [
    {
      id: "txn_001",
      timestamp: "2026-08-03T14:42:00.000Z",
      clientId: "client_nanovest",
      accountType: "CLIENT_AVAILABLE",
      sourceType: "DEPOSIT",
      debit: 0,
      credit: 25000,
      referenceId: null,
      description: "Treasury wallet top-up",
    },
  ],
  nextCursor: "10",
  totalCount: 36,
};

beforeEach(() => {
  mocks.replace.mockReset();
  mocks.search.value = "";
  mocks.useGetBalancesQuery.mockReset().mockReturnValue({
    data: balances,
    isLoading: false,
    isError: false,
  });
  mocks.useGetTransactionsQuery.mockReset().mockReturnValue({
    data: transactionPage,
    isLoading: false,
    isError: false,
  });
  mocks.useGetSystemBalancesQuery.mockReset().mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  });
  mocks.useGetClientsQuery.mockReset().mockReturnValue({
    data: [{ id: "client_acme", legalName: "Acme Capital" }],
    isLoading: false,
    isError: false,
  });
});

describe("LedgerPage", () => {
  it("polls balances and requests the default globally sorted page", () => {
    render(<LedgerPage />);

    expect(mocks.useGetBalancesQuery).toHaveBeenCalledWith(undefined, {
      pollingInterval: 10000,
    });
    expect(mocks.useGetTransactionsQuery).toHaveBeenCalledWith({
      limit: 10,
      sortBy: "timestamp",
      sortDirection: "desc",
    });
    expect(screen.getByRole("heading", { name: "Ledger Viewer" })).toBeInTheDocument();
    expect(screen.getByText("Client Balances")).toBeInTheDocument();
    expect(screen.getByText("Ledger Log")).toBeInTheDocument();
  });

  it("maps URL filters to the transaction query and clears them", async () => {
    const user = userEvent.setup();
    mocks.search.value =
      "clientId=client_acme&type=FILL&fromDate=2026-07-28&toDate=2026-08-03";
    render(<LedgerPage />);

    expect(mocks.useGetTransactionsQuery).toHaveBeenCalledWith({
      clientId: "client_acme",
      type: "FILL",
      fromDate: "2026-07-28",
      toDate: "2026-08-03",
      limit: 10,
      sortBy: "timestamp",
      sortDirection: "desc",
    });

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(mocks.replace).toHaveBeenCalledWith("/admin/ledger");
  });

  it("writes filter changes to the URL", async () => {
    const user = userEvent.setup();
    render(<LedgerPage />);

    screen.getByRole("combobox", { name: "Client" }).focus();
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("option", { name: "Acme Capital" }));

    expect(mocks.replace).toHaveBeenCalledWith(
      "/admin/ledger?clientId=client_acme",
    );
  });

  it("navigates cursor history and resets it for sort and page-size changes", async () => {
    const user = userEvent.setup();
    render(<LedgerPage />);

    await user.click(screen.getByRole("button", { name: "Next page" }));
    await waitFor(() => {
      expect(mocks.useGetTransactionsQuery).toHaveBeenLastCalledWith({
        cursor: "10",
        limit: 10,
        sortBy: "timestamp",
        sortDirection: "desc",
      });
    });
    expect(screen.getByText("Page 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous page" }));
    await waitFor(() => {
      expect(mocks.useGetTransactionsQuery).toHaveBeenLastCalledWith({
        limit: 10,
        sortBy: "timestamp",
        sortDirection: "desc",
      });
    });

    await user.click(screen.getByRole("button", { name: "Next page" }));
    await user.click(screen.getByRole("button", { name: "Sort by Timestamp" }));
    await waitFor(() => {
      expect(mocks.useGetTransactionsQuery).toHaveBeenLastCalledWith({
        limit: 10,
        sortBy: "timestamp",
        sortDirection: "asc",
      });
    });
    expect(screen.getByText("Page 1")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Rows per page"), {
      target: { value: "20" },
    });
    await waitFor(() => {
      expect(mocks.useGetTransactionsQuery).toHaveBeenLastCalledWith({
        limit: 20,
        sortBy: "timestamp",
        sortDirection: "asc",
      });
    });
  });

  it("renders balance and transaction failures independently", () => {
    mocks.useGetBalancesQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    const { rerender } = render(<LedgerPage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Client balances could not be loaded.",
    );
    expect(screen.getByText("Ledger Log")).toBeInTheDocument();

    mocks.useGetBalancesQuery.mockReturnValue({
      data: balances,
      isLoading: false,
      isError: false,
    });
    mocks.useGetTransactionsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    rerender(<LedgerPage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Ledger entries could not be loaded.",
    );
    expect(screen.getByText("Client Balances")).toBeInTheDocument();
  });
});
