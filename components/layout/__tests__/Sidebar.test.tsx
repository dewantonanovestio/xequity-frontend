import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Sidebar from "@/components/layout/Sidebar";
import StoreProvider from "@/lib/store/StoreProvider";

const mocks = vi.hoisted(() => ({
  mockUsePathname: vi.fn(),
  isUserMode: false,
}));

vi.mock("next/navigation", () => ({
  usePathname: mocks.mockUsePathname,
}));

vi.mock("@/components/layout/RoleSwitcher", () => ({
  RoleSwitcher: () => <div>Role switcher</div>,
}));

vi.mock("@/lib/store/hooks", () => ({
  useAppSelector: () => mocks.isUserMode,
  useAppDispatch: () => vi.fn(),
}));

const renderSidebar = () => render(<StoreProvider><Sidebar /></StoreProvider>);

describe("Sidebar – admin mode", () => {
  beforeEach(() => {
    mocks.isUserMode = false;
    mocks.mockUsePathname.mockReturnValue("/ledger");
  });

  it("provides links to every dashboard view", () => {
    renderSidebar();

    expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute(
      "href",
      "/orders",
    );
    expect(screen.getByRole("link", { name: "Ledger" })).toHaveAttribute(
      "href",
      "/ledger",
    );
    expect(screen.getByRole("link", { name: "Recon" })).toHaveAttribute(
      "href",
      "/recon",
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
    mocks.mockUsePathname.mockReturnValue("/orders/ord_123");

    renderSidebar();

    expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

describe("Sidebar – user mode", () => {
  beforeEach(() => {
    mocks.isUserMode = true;
    mocks.mockUsePathname.mockReturnValue("/orders");
  });

  it("shows user navigation links instead of admin links", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute("href", "/orders");
    expect(screen.getByRole("link", { name: "Portfolio" })).toHaveAttribute("href", "/portfolio");
    expect(screen.getByRole("link", { name: "P&L" })).toHaveAttribute("href", "/pnl");
    expect(screen.getByRole("link", { name: "History" })).toHaveAttribute("href", "/history");
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
