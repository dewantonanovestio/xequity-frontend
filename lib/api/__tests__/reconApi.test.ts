import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { baseApi } from "@/lib/api/baseApi";
import { reconApi } from "@/lib/api/reconApi";
import { store } from "@/lib/store/store";

describe("reconApi", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true");
  });

  afterEach(() => {
    store.dispatch(baseApi.util.resetApiState());
    vi.unstubAllEnvs();
  });

  it("loads the active cash and all supply reconciliation results", async () => {
    const cash = await store.dispatch(
      reconApi.endpoints.getCashRecon.initiate(),
    );
    const supply = await store.dispatch(
      reconApi.endpoints.getSupplyRecon.initiate(),
    );

    expect(cash.data?.usdtDelta).toBe(0);
    expect(supply.data?.map((row) => row.symbol)).toEqual([
      "AAPL",
      "TSLA",
      "MSFT",
      "GOOGL",
      "SPY",
    ]);
  });

  it("runs a manual cash reconciliation", async () => {
    const result = await store.dispatch(
      reconApi.endpoints.runCashRecon.initiate(),
    );

    expect(result.data).toEqual({ success: true });
  });

  it("refetches subscribed reconciliation queries after a manual run", async () => {
    const subscription = store.dispatch(
      reconApi.endpoints.getCashRecon.initiate(),
    );
    await subscription;
    const selectCash = reconApi.endpoints.getCashRecon.select();
    const firstRequestId = selectCash(store.getState()).requestId;

    await store.dispatch(reconApi.endpoints.runCashRecon.initiate());

    await vi.waitFor(() => {
      expect(selectCash(store.getState()).requestId).toBeDefined();
      expect(selectCash(store.getState()).requestId).not.toBe(firstRequestId);
    });
    subscription.unsubscribe();
  });
});
