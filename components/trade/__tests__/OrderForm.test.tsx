import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrderForm } from "@/components/trade/OrderForm";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

const mocks = vi.hoisted(() => ({
  selectedUser: null as null | { endUserId: string; clientId: string; externalId: string; walletId: string; displayName: string },
  symbolsData: undefined as undefined | { ticker: string; tradable: boolean; fractionable: boolean; tradableOvernight: boolean }[],
  placeOrderFn: vi.fn(),
  placeRedemptionFn: vi.fn(),
  placeOrderState: { isLoading: false },
  placeRedemptionState: { isLoading: false },
}));

vi.mock("@/lib/store/hooks", () => ({
  useAppSelector: () => mocks.selectedUser,
  useAppDispatch: () => vi.fn(),
}));

vi.mock("@/lib/api/userApi", () => ({
  useGetSymbolsQuery: () => ({
    data: mocks.symbolsData,
    isLoading: false,
  }),
}));

vi.mock("@/lib/api/ordersApi", () => ({
  usePlaceOrderMutation: () => [mocks.placeOrderFn, mocks.placeOrderState],
  usePlaceRedemptionMutation: () => [mocks.placeRedemptionFn, mocks.placeRedemptionState],
}));

const mockUser = {
  endUserId: "user-001",
  clientId: "client-1",
  externalId: "ext-1",
  walletId: "wallet-1",
  displayName: "Alya Putri",
};

describe("OrderForm", () => {
  beforeEach(() => {
    mocks.selectedUser = null;
    mocks.symbolsData = [
      { ticker: "AAPL", tradable: true, fractionable: true, tradableOvernight: false },
      { ticker: "MSFT", tradable: true, fractionable: true, tradableOvernight: false },
      { ticker: "GOOGL", tradable: true, fractionable: true, tradableOvernight: false },
    ];
    mocks.placeOrderFn.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({}) });
    mocks.placeRedemptionFn.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({}) });
    mocks.placeOrderState = { isLoading: false };
    mocks.placeRedemptionState = { isLoading: false };
  });

  it("shows a prompt when no user is selected", () => {
    render(<OrderForm />);
    expect(screen.getByText(/select an end-user/i)).toBeInTheDocument();
  });

  it("renders the order form when a user is selected", () => {
    mocks.selectedUser = mockUser;
    render(<OrderForm />);
    expect(screen.getByText(/trading as alya putri/i)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Buy" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Sell" })).toBeInTheDocument();
  });

  it("has the submit button disabled with empty form", () => {
    mocks.selectedUser = mockUser;
    render(<OrderForm />);
    expect(screen.getByRole("button", { name: /place buy order/i })).toBeDisabled();
  });

  it("switches to Sell mode when Sell tab is clicked", async () => {
    const user = userEvent.setup();
    mocks.selectedUser = mockUser;
    render(<OrderForm />);
    await user.click(screen.getByRole("tab", { name: "Sell" }));
    expect(screen.getByRole("button", { name: /place sell order/i })).toBeInTheDocument();
  });

  it("LIMIT fields are hidden for MARKET orders", () => {
    mocks.selectedUser = mockUser;
    render(<OrderForm />);
    expect(screen.queryByLabelText(/limit price/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/collar price/i)).not.toBeInTheDocument();
  });

  it("calls placeOrder when a buy order form is submitted", async () => {
    const user = userEvent.setup();
    mocks.selectedUser = mockUser;
    const unwrapMock = vi.fn().mockResolvedValue({});
    mocks.placeOrderFn.mockReturnValue({ unwrap: unwrapMock });
    render(<OrderForm />);

    // Select a symbol via focus + keyboard (Radix Select pattern used in tests)
    screen.getByRole("combobox", { name: "Symbol" }).focus();
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("option", { name: "AAPL" }));

    // Enter quantity
    await user.type(screen.getByRole("spinbutton"), "10");

    await user.click(screen.getByRole("button", { name: /place buy order/i }));

    await waitFor(() => {
      expect(mocks.placeOrderFn).toHaveBeenCalled();
    });
  });

  it("shows a success message after a successful buy order", async () => {
    const user = userEvent.setup();
    mocks.selectedUser = mockUser;
    const unwrapMock = vi.fn().mockResolvedValue({});
    mocks.placeOrderFn.mockReturnValue({ unwrap: unwrapMock });
    render(<OrderForm />);

    screen.getByRole("combobox", { name: "Symbol" }).focus();
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("option", { name: "AAPL" }));
    await user.type(screen.getByRole("spinbutton"), "10");
    await user.click(screen.getByRole("button", { name: /place buy order/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/submitted successfully/i);
    });
  });

  it("shows an error message when the API rejects", async () => {
    const user = userEvent.setup();
    mocks.selectedUser = mockUser;
    const unwrapMock = vi.fn().mockRejectedValue({ data: { message: "Insufficient balance" } });
    mocks.placeOrderFn.mockReturnValue({ unwrap: unwrapMock });
    render(<OrderForm />);

    screen.getByRole("combobox", { name: "Symbol" }).focus();
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("option", { name: "AAPL" }));
    await user.type(screen.getByRole("spinbutton"), "10");
    await user.click(screen.getByRole("button", { name: /place buy order/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Insufficient balance");
    });
  });

  it("calls placeRedemption when a sell order is submitted", async () => {
    const user = userEvent.setup();
    mocks.selectedUser = mockUser;
    const unwrapMock = vi.fn().mockResolvedValue({});
    mocks.placeRedemptionFn.mockReturnValue({ unwrap: unwrapMock });
    render(<OrderForm />);

    await user.click(screen.getByRole("tab", { name: "Sell" }));
    screen.getByRole("combobox", { name: "Symbol" }).focus();
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("option", { name: "AAPL" }));
    await user.type(screen.getByRole("spinbutton"), "5");
    await user.click(screen.getByRole("button", { name: /place sell order/i }));

    await waitFor(() => {
      expect(mocks.placeRedemptionFn).toHaveBeenCalled();
      expect(mocks.placeOrderFn).not.toHaveBeenCalled();
    });
  });
});
