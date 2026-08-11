import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HoldingsTable } from "@/components/portfolio/HoldingsTable";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const mocks = vi.hoisted(() => ({
  selectedUser: null as null | { endUserId: string; clientId: string; displayName: string; externalId: string; walletId: string },
  holdingsData: undefined as undefined | { symbol: string; qty: number; avgCost: number }[],
  holdingsLoading: false,
  holdingsError: false,
  pricingData: undefined as undefined | { symbol: string; rawPrice: number; buyPrice: number; sellPrice: number; buySpreadBps: number; sellSpreadBps: number },
}));

vi.mock("@/lib/store/hooks", () => ({
  useAppSelector: () => mocks.selectedUser,
  useAppDispatch: () => vi.fn(),
}));

vi.mock("@/lib/api/portfolioApi", () => ({
  useGetHoldingsQuery: () => ({
    data: mocks.holdingsData,
    isLoading: mocks.holdingsLoading,
    isError: mocks.holdingsError,
  }),
  useGetPricingQuery: () => ({
    data: mocks.pricingData,
    isLoading: false,
  }),
}));

const mockUser = {
  endUserId: "user-001",
  clientId: "client-1",
  externalId: "ext-1",
  walletId: "wallet-1",
  displayName: "Test User",
};

const mockHoldings = [
  { symbol: "AAPL", qty: 10, avgCost: 200 },
  { symbol: "MSFT", qty: 5, avgCost: 400 },
];

describe("HoldingsTable", () => {
  it("shows a prompt when no user is selected", () => {
    mocks.selectedUser = null;
    render(<HoldingsTable />);
    expect(screen.getByText(/select an end-user/i)).toBeInTheDocument();
  });

  it("shows a loading skeleton while holdings are fetching", () => {
    mocks.selectedUser = mockUser;
    mocks.holdingsLoading = true;
    mocks.holdingsData = undefined;
    render(<HoldingsTable />);
    // Skeleton element rendered (no table present)
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    mocks.holdingsLoading = false;
  });

  it("shows an error alert when holdings fail to load", () => {
    mocks.selectedUser = mockUser;
    mocks.holdingsLoading = false;
    mocks.holdingsError = true;
    mocks.holdingsData = undefined;
    render(<HoldingsTable />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    mocks.holdingsError = false;
  });

  it("shows empty state when holdings array is empty", () => {
    mocks.selectedUser = mockUser;
    mocks.holdingsData = [];
    render(<HoldingsTable />);
    expect(screen.getByText(/no holdings available/i)).toBeInTheDocument();
  });

  it("renders the holdings table with symbol and quantity columns", () => {
    mocks.selectedUser = mockUser;
    mocks.holdingsData = mockHoldings;
    render(<HoldingsTable />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("MSFT")).toBeInTheDocument();
  });

  it("shows N/A for price and market value when pricing is unavailable", () => {
    mocks.selectedUser = mockUser;
    mocks.holdingsData = [{ symbol: "AAPL", qty: 10, avgCost: 200 }];
    mocks.pricingData = undefined;
    render(<HoldingsTable />);
    const naCells = screen.getAllByText("N/A");
    expect(naCells.length).toBeGreaterThan(0);
  });

  it("shows formatted market value when pricing is available", () => {
    mocks.selectedUser = mockUser;
    mocks.holdingsData = [{ symbol: "AAPL", qty: 10, avgCost: 200 }];
    mocks.pricingData = { symbol: "AAPL", rawPrice: 220, buyPrice: 222, sellPrice: 218, buySpreadBps: 100, sellSpreadBps: 100 };
    render(<HoldingsTable />);
    // Market value = 10 * 218 = $2,180 (appears in row and footer total)
    const values = screen.getAllByText("$2,180.00");
    expect(values.length).toBeGreaterThanOrEqual(1);
  });
});
