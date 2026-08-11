import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { baseApi } from "@/lib/api/baseApi";
import {
  ledgerApi,
  ledgerCollectionUrl,
} from "@/lib/api/ledgerApi";
import { store } from "@/lib/store/store";

describe("ledgerApi", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true");
  });

  afterEach(() => {
    store.dispatch(baseApi.util.resetApiState());
    vi.unstubAllEnvs();
  });

  it("serializes every supported transaction parameter and omits empty values", () => {
    expect(
      ledgerCollectionUrl("/admin/ledger/transactions", {
        clientId: "client_acme",
        type: "FILL",
        fromDate: "2026-07-28",
        toDate: "2026-08-03",
        cursor: "10",
        limit: 20,
        sortBy: "debit",
        sortDirection: "asc",
      }),
    ).toBe(
      "/admin/ledger/transactions?clientId=client_acme&type=FILL&fromDate=2026-07-28&toDate=2026-08-03&cursor=10&limit=20&sortBy=debit&sortDirection=asc",
    );

    expect(
      ledgerCollectionUrl("/admin/ledger/transactions", {
        clientId: "",
        limit: 10,
      }),
    ).toBe("/admin/ledger/transactions?limit=10");
  });

  it("loads all client balances", async () => {
    const result = await store.dispatch(
      ledgerApi.endpoints.getBalances.initiate(),
    );

    expect(result.data).toHaveLength(3);
    expect(result.data?.map((balance) => balance.total)).toEqual([
      62000, 12700, 6000,
    ]);
  });

  it("serializes the backend-supported sort and enum contract in real mode", () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "false");

    expect(
      ledgerCollectionUrl("/admin/ledger/transactions", {
        type: "HOLD",
        fromDate: "2026-08-03",
        toDate: "2026-08-04",
        sortBy: "debit",
        sortDirection: "asc",
      }),
    ).toBe(
      "/admin/ledger/transactions?type=HOLD&fromDate=2026-08-03T00%3A00%3A00.000Z&toDate=2026-08-04T23%3A59%3A59.999Z&sortBy=createdAt&sortDirection=ASC",
    );
  });

  it("loads a filtered and globally sorted transaction page", async () => {
    const result = await store.dispatch(
      ledgerApi.endpoints.getTransactions.initiate({
        clientId: "client_nanovest",
        type: "FILL",
        fromDate: "2026-07-28",
        toDate: "2026-08-03",
        limit: 10,
        sortBy: "debit",
        sortDirection: "asc",
      }),
    );
    const debits = result.data?.items.map((item) => item.debit) ?? [];

    expect(result.data?.totalCount).toBe(2);
    expect(result.data?.items.every((item) => item.clientId === "client_nanovest"))
      .toBe(true);
    expect(debits).toEqual([3400, 4800]);
    expect(result.data?.nextCursor).toBeNull();
  });
});
