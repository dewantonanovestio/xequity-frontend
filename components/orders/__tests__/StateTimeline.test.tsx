import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StateTimeline } from "@/components/orders/StateTimeline";
import type { StateTransition } from "@/lib/types/order";

describe("StateTimeline", () => {
  it("sorts transitions chronologically and highlights the latest failure", () => {
    const transitions: StateTransition[] = [
      {
        fromState: "MINTING",
        toState: "MINT_FAILED",
        transitionedAt: "2026-08-03T10:30:00.000Z",
      },
      {
        fromState: null,
        toState: "SUBMITTED",
        transitionedAt: "2026-08-03T10:00:00.000Z",
      },
      {
        fromState: "SUBMITTED",
        toState: "MINTING",
        transitionedAt: "2026-08-03T10:20:00.000Z",
      },
    ];

    render(<StateTimeline transitions={transitions} />);

    const items = screen.getAllByRole("listitem");
    expect(within(items[0]).getByText("SUBMITTED")).toBeInTheDocument();
    expect(within(items[1]).getByText("MINTING")).toBeInTheDocument();
    expect(within(items[2]).getByText("MINT_FAILED")).toBeInTheDocument();
    expect(items[2]).toHaveAttribute("data-current", "true");
    expect(items[2]).toHaveAttribute("data-tone", "danger");
    expect(items[0]).not.toHaveAttribute("data-current");
    expect(screen.getByText("Aug 3, 2026, 10:30 AM")).toBeInTheDocument();

    expect(transitions[0].toState).toBe("MINT_FAILED");
  });
});
