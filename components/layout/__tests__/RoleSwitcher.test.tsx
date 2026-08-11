import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RoleSwitcher } from "@/components/layout/RoleSwitcher";
import StoreProvider from "@/lib/store/StoreProvider";

const mocks = vi.hoisted(() => ({
  mockPush: vi.fn(),
  isMockMode: vi.fn(),
  dispatchFn: vi.fn(),
  endUsers: [
    { endUserId: "user-001", clientId: "client-1", externalId: "ext-1", walletId: "w-1", displayName: "Alya Putri" },
    { endUserId: "user-002", clientId: "client-2", externalId: "ext-2", walletId: "w-2", displayName: "Bima Santoso" },
  ],
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.mockPush }),
}));

vi.mock("@/lib/utils/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/utils/env")>();
  return { ...actual, isMockMode: mocks.isMockMode };
});

vi.mock("@/lib/api/userApi", () => ({
  useGetEndUsersQuery: () => ({ data: mocks.endUsers, isLoading: false }),
  useLazyGetEndUserQuery: () => [
    vi.fn().mockResolvedValue({
      unwrap: () => Promise.resolve({ endUserId: "user-001", clientId: "client-1", externalId: "ext-1", walletId: "w-1", displayName: "Alya Putri" }),
    }),
  ],
}));

const renderComponent = () =>
  render(
    <StoreProvider>
      <RoleSwitcher />
    </StoreProvider>,
  );

describe("RoleSwitcher – mock mode", () => {
  beforeEach(() => {
    mocks.isMockMode.mockReturnValue(true);
    mocks.mockPush.mockClear();
  });

  it("renders the role select dropdown", () => {
    renderComponent();
    expect(screen.getByRole("combobox", { name: "Dashboard role" })).toBeInTheDocument();
  });

  it("shows end-users from the query in the dropdown options", async () => {
    const user = userEvent.setup();
    renderComponent();
    screen.getByRole("combobox", { name: "Dashboard role" }).focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("option", { name: "Alya Putri" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Bima Santoso" })).toBeInTheDocument();
  });

  it("routes to /orders when Admin is selected", async () => {
    const user = userEvent.setup();
    renderComponent();
    screen.getByRole("combobox", { name: "Dashboard role" }).focus();
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("option", { name: "Admin" }));
    expect(mocks.mockPush).toHaveBeenCalledWith("/orders");
  });

  it("routes to /orders when an end-user is selected", async () => {
    const user = userEvent.setup();
    renderComponent();
    screen.getByRole("combobox", { name: "Dashboard role" }).focus();
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("option", { name: "Alya Putri" }));
    expect(mocks.mockPush).toHaveBeenCalledWith("/orders");
  });
});

describe("RoleSwitcher – real mode", () => {
  beforeEach(() => {
    mocks.isMockMode.mockReturnValue(false);
    mocks.mockPush.mockClear();
  });

  it("renders the Admin button and manual end-user input", () => {
    renderComponent();
    expect(screen.getByRole("button", { name: "Admin" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "End-user ID" })).toBeInTheDocument();
  });

  it("routes to /orders when Admin button is clicked", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole("button", { name: "Admin" }));
    expect(mocks.mockPush).toHaveBeenCalledWith("/orders");
  });

  it("keeps the Use end-user button disabled while input is empty", () => {
    renderComponent();
    expect(screen.getByRole("button", { name: "Use end-user" })).toBeDisabled();
  });

  it("enables Use end-user button once input has a value and routes to /orders", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.type(screen.getByRole("textbox", { name: "End-user ID" }), "some-uuid");
    const button = screen.getByRole("button", { name: "Use end-user" });
    expect(button).not.toBeDisabled();
    await user.click(button);
    expect(mocks.mockPush).toHaveBeenCalledWith("/orders");
  });
});
