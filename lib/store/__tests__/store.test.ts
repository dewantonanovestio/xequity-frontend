import { afterEach, describe, expect, it, vi } from "vitest";

import { baseApi } from "@/lib/api/baseApi";
import { store } from "@/lib/store/store";

const testApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getFoundationOrders: build.query<unknown, void>({
      query: () => "/orders",
    }),
  }),
  overrideExisting: true,
});

describe("Redux store", () => {
  afterEach(() => {
    store.dispatch(baseApi.util.resetApiState());
    vi.unstubAllEnvs();
  });

  it("mounts the shared API reducer", () => {
    expect(Object.keys(store.getState())).toEqual(["api", "viewMode"]);

    expect(() => store.dispatch(baseApi.util.resetApiState())).not.toThrow();
  });

  it("uses fixture data when mock mode is enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true");

    const result = await store.dispatch(
      testApi.endpoints.getFoundationOrders.initiate(),
    );

    expect(result.data).toMatchObject({
      totalCount: 20,
      nextCursor: null,
      items: expect.arrayContaining([
        expect.objectContaining({ id: "ord_001" }),
      ]),
    });
    expect(result.isSuccess).toBe(true);
  });
});
