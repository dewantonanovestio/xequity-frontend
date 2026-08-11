import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import TopBar from "@/components/layout/TopBar";

describe("TopBar", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("labels a localhost backend as local", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3000");

    render(<TopBar />);

    expect(screen.getByText("xequity-face")).toBeInTheDocument();
    expect(screen.getByText("localhost:3000")).toHaveAttribute(
      "data-environment",
      "local",
    );
  });

  it("labels a staging backend as staging", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_API_URL",
      "https://staging-api.xequity.internal",
    );

    render(<TopBar />);

    expect(screen.getByText("staging-api.xequity.internal")).toHaveAttribute(
      "data-environment",
      "staging",
    );
  });

  it("labels any other backend as production", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.xequity.internal");

    render(<TopBar />);

    expect(screen.getByText("api.xequity.internal")).toHaveAttribute(
      "data-environment",
      "production",
    );
  });
});
