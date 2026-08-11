import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RoleSwitcher } from "@/components/layout/RoleSwitcher";
import StoreProvider from "@/lib/store/StoreProvider";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  pathname: "/admin/orders",
  clients: [
    { id: "client-1", legalName: "Nanovest" },
    { id: "client-2", legalName: "Acme Capital" },
  ],
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
  usePathname: () => mocks.pathname,
}));

vi.mock("@/lib/api/clientApi", () => ({
  useGetClientsQuery: () => ({ data: mocks.clients, isLoading: false }),
}));

const renderComponent = () =>
  render(
    <StoreProvider>
      <RoleSwitcher />
    </StoreProvider>,
  );

describe("RoleSwitcher", () => {
  beforeEach(() => {
    mocks.pathname = "/admin/orders";
    mocks.push.mockClear();
  });

  it("shows clients in the role dropdown", async () => {
    const user = userEvent.setup();
    renderComponent();

    screen.getByRole("combobox", { name: "Dashboard role" }).focus();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("option", { name: "Admin" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Nanovest" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Acme Capital" })).toBeInTheDocument();
  });

  it("routes a selected client to its orders page", async () => {
    const user = userEvent.setup();
    renderComponent();

    screen.getByRole("combobox", { name: "Dashboard role" }).focus();
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("option", { name: "Nanovest" }));

    expect(mocks.push).toHaveBeenCalledWith("/client/client-1/orders");
  });

  it("shows the active client and routes back to admin", async () => {
    const user = userEvent.setup();
    mocks.pathname = "/client/client-2/portfolio";
    renderComponent();

    expect(screen.getByRole("combobox", { name: "Dashboard role" })).toHaveTextContent("Acme Capital");
    screen.getByRole("combobox", { name: "Dashboard role" }).focus();
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("option", { name: "Admin" }));

    expect(mocks.push).toHaveBeenCalledWith("/admin/orders");
  });
});
