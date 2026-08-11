import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Sidebar from "@/components/layout/Sidebar";
import StoreProvider from "@/lib/store/StoreProvider";

const mocks = vi.hoisted(() => ({
  mockUsePathname: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: mocks.mockUsePathname,
}));

vi.mock("@/components/layout/RoleSwitcher", () => ({
  RoleSwitcher: () => <div>Role switcher</div>,
}));

const renderSidebar = () => render(<StoreProvider><Sidebar /></StoreProvider>);

describe("Sidebar – admin mode", () => {
  beforeEach(() => {
    mocks.mockUsePathname.mockReturnValue("/admin/ledger");
  });

  it("provides links to every dashboard view", () => {
    renderSidebar();

    expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute(
      "href",
      "/admin/orders",
    );
    expect(screen.getByRole("link", { name: "Ledger" })).toHaveAttribute(
      "href",
      "/admin/ledger",
    );
    expect(screen.getByRole("link", { name: "Recon" })).toHaveAttribute(
      "href",
      "/admin/recon",
    );
  });

  it("identifies the link for the active route", () => {
    renderSidebar();

    expect(screen.getByRole("link", { name: "Ledger" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Orders" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("keeps a parent link active on a nested route", () => {
    mocks.mockUsePathname.mockReturnValue("/admin/orders/ord_123");

    renderSidebar();

    expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

describe("Sidebar – user mode", () => {
  beforeEach(() => {
    mocks.mockUsePathname.mockReturnValue("/client/client-1/orders");
  });

  it("shows user navigation links instead of admin links", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute("href", "/client/client-1/orders");
    expect(screen.getByRole("link", { name: "Portfolio" })).toHaveAttribute("href", "/client/client-1/portfolio");
    expect(screen.getByRole("link", { name: "P&L" })).toHaveAttribute("href", "/client/client-1/pnl");
    expect(screen.getByRole("link", { name: "History" })).toHaveAttribute("href", "/client/client-1/history");
    expect(screen.queryByRole("link", { name: "Trade" })).not.toBeInTheDocument();
  });

  it("does not show admin-only links in user mode", () => {
    renderSidebar();
    expect(screen.queryByRole("link", { name: "Ledger" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Recon" })).not.toBeInTheDocument();
  });

  it("marks the active user route", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Portfolio" })).not.toHaveAttribute("aria-current");
  });
});
