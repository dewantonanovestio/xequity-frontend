import { afterEach, describe, expect, it, vi } from "vitest";

import { getApiUrl, getEnvLabel, isMockMode } from "@/lib/utils/env";

describe("environment helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("falls back to the local API when the URL is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    expect(getApiUrl()).toBe("http://localhost:3003");
  });

  it("enables mocks only for the exact true flag", () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true");
    expect(isMockMode()).toBe(true);

    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "TRUE");
    expect(isMockMode()).toBe(false);
  });

  it("extracts the host from the configured API URL", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_API_URL",
      "https://staging-api.xequity.internal/v1",
    );

    expect(getEnvLabel()).toBe("staging-api.xequity.internal");
  });

  it("keeps malformed non-empty URLs readable", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "not a url");

    expect(getEnvLabel()).toBe("not a url");
  });
});
