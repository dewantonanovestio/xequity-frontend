import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FillsTable } from "@/components/orders/FillsTable";
import type { Fill } from "@/lib/types/order";

const fills: Fill[] = [
  {
    fillId: "fill_001_a",
    qty: 4.25,
    price: 225.5,
    cost: 958.38,
    filledAt: "2026-08-03T10:15:00.000Z",
    mintTxHash: "0xmint123",
    onChainStatus: "CONFIRMED",
    retryCount: 1,
  },
  {
    fillId: "fill_001_b",
    qty: 2,
    price: 224,
    cost: 448,
    filledAt: "2026-08-03T10:20:00.000Z",
  },
];

describe("FillsTable", () => {
  it("renders fill diagnostics with optional fallbacks", () => {
    render(<FillsTable fills={fills} />);

    expect(
      screen.getAllByRole("columnheader").map((header) => header.textContent),
    ).toEqual([
      "Fill ID",
      "Qty",
      "Price",
      "Cost",
      "Timestamp",
      "Transaction Hash",
      "On-chain Status",
      "Retries",
    ]);

    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("fill_001_a")).toBeInTheDocument();
    expect(within(rows[1]).getByText("4.25")).toBeInTheDocument();
    expect(within(rows[1]).getByText("$225.50")).toBeInTheDocument();
    expect(within(rows[1]).getByText("$958.38")).toBeInTheDocument();
    expect(
      within(rows[1]).getByText("Aug 3, 2026, 10:15 AM"),
    ).toBeInTheDocument();
    expect(within(rows[1]).getByText("0xmint123")).toBeInTheDocument();
    expect(within(rows[1]).getByText("CONFIRMED")).toBeInTheDocument();
    expect(within(rows[1]).getByText("1")).toBeInTheDocument();
    expect(within(rows[2]).getAllByText("-")).toHaveLength(3);
  });

  it("renders a clear empty state", () => {
    render(<FillsTable fills={[]} />);
    expect(screen.getByText("No fills recorded")).toBeInTheDocument();
  });
});
