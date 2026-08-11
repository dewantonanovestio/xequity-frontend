import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { baseApi } from "@/lib/api/baseApi";
import { orderCollectionUrl, ordersApi } from "@/lib/api/ordersApi";
import { store } from "@/lib/store/store";

describe("ordersApi", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true");
  });

  afterEach(() => {
    store.dispatch(baseApi.util.resetApiState());
    vi.unstubAllEnvs();
  });

  it("loads filtered order and redemption collections", async () => {
    const orderResult = await store.dispatch(
      ordersApi.endpoints.getOrders.initiate({
        clientId: "client_nanovest",
        limit: 100,
      }),
    );
    const redemptionResult = await store.dispatch(
      ordersApi.endpoints.getRedemptions.initiate({ limit: 100 }),
    );

    expect(orderResult.data?.totalCount).toBe(7);
    expect(
      orderResult.data?.items.every(
        (order) => order.clientId === "client_nanovest",
      ),
    ).toBe(true);
    expect(redemptionResult.data?.totalCount).toBe(5);
  });

  it("expands real API date filters to inclusive UTC boundaries", () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "false");

    expect(
      orderCollectionUrl("/orders", {
        fromDate: "2026-08-03",
        toDate: "2026-08-04",
        limit: 20,
      }),
    ).toBe(
      "/orders?fromDate=2026-08-03T00%3A00%3A00.000Z&toDate=2026-08-04T23%3A59%3A59.999Z&limit=20",
    );
  });

  it("loads order and redemption diagnostics", async () => {
    const order = await store.dispatch(
      ordersApi.endpoints.getOrder.initiate("ord_001"),
    );
    const orderFills = await store.dispatch(
      ordersApi.endpoints.getOrderFills.initiate("ord_004"),
    );
    const redemption = await store.dispatch(
      ordersApi.endpoints.getRedemption.initiate("red_002"),
    );
    const redemptionFills = await store.dispatch(
      ordersApi.endpoints.getRedemptionFills.initiate("red_002"),
    );

    expect(order.data?.id).toBe("ord_001");
    expect(orderFills.data).toHaveLength(2);
    expect(redemption.data?.id).toBe("red_002");
    expect(redemptionFills.data).toHaveLength(1);
  });

  it("runs retry and cancellation mutations", async () => {
    const mint = await store.dispatch(
      ordersApi.endpoints.retryMint.initiate("ord_001"),
    );
    const burn = await store.dispatch(
      ordersApi.endpoints.retryBurn.initiate("red_001"),
    );
    const cancel = await store.dispatch(
      ordersApi.endpoints.cancelOrder.initiate("ord_017"),
    );

    expect(mint.data?.state).toBe("MINTING");
    expect(burn.data?.state).toBe("FILLED");
    expect(cancel.data?.state).toBe("CANCELLED");
  });
});
