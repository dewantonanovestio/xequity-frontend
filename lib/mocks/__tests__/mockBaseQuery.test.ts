import { describe, expect, it } from "vitest";

import { TRANSACTION_TYPES } from "@/lib/ledger/ledgerUtils";
import { mockBaseQuery } from "@/lib/mocks/mockBaseQuery";
import orderFixtures from "@/lib/mocks/orders.json";
import reconFixtures from "@/lib/mocks/recon.json";
import type {
  ClientBalance,
  PaginatedTransactions,
} from "@/lib/types/ledger";
import type { Order, PaginatedOrders } from "@/lib/types/order";
import type {
  CashRecon,
  ReconScenario,
  SupplyRecon,
} from "@/lib/types/recon";

async function readData<T>(request: Parameters<typeof mockBaseQuery>[0]) {
  const result = await mockBaseQuery(request);
  if ("error" in result) throw new Error(JSON.stringify(result.error));
  return result.data as T;
}

describe("mockBaseQuery", () => {
  it("returns the active balanced cash reconciliation scenario", async () => {
    const cash = await readData<CashRecon>("/admin/recon/cash/detail");

    expect(cash).toEqual({
      usdtLedgerTotal: 80700,
      usdtWalletBalance: 80700,
      usdtDelta: 0,
      usdFloatAtAlpaca: 45000,
      projectedFloatRequirement: 42000,
      lastRunAt: "2026-08-03T14:30:00Z",
    });
  });

  it("includes a selectable unbalanced cash fixture", () => {
    const fixtures = reconFixtures as unknown as {
      activeCashScenario: ReconScenario;
      cashScenarios: Record<ReconScenario, CashRecon>;
    };

    expect(fixtures.activeCashScenario).toBe("balanced");
    expect(fixtures.cashScenarios.unbalanced).toMatchObject({
      usdtLedgerTotal: 80700,
      usdtWalletBalance: 80650,
      usdtDelta: -50,
    });
  });

  it("falls back to the balanced cash scenario for an unknown selector", async () => {
    const fixtures = reconFixtures as unknown as {
      activeCashScenario: string;
    };
    const originalScenario = fixtures.activeCashScenario;

    try {
      fixtures.activeCashScenario = "not-a-scenario";
      const cash = await readData<CashRecon>("/admin/recon/cash/detail");
      expect(cash.usdtDelta).toBe(0);
      expect(cash.usdtWalletBalance).toBe(80700);
    } finally {
      fixtures.activeCashScenario = originalScenario;
    }
  });

  it("returns all required supply reconciliation rows", async () => {
    const supply = await readData<SupplyRecon[]>("/admin/recon/supply");

    expect(supply.map((row) => row.symbol)).toEqual([
      "AAPL",
      "TSLA",
      "MSFT",
      "GOOGL",
      "SPY",
    ]);
    expect(supply.find((row) => row.symbol === "TSLA")).toMatchObject({
      onChainSupply: 567.123456,
      alpacaPositionSum: 567.1234,
      residual: 0.000056,
      symbolStatus: "MINT_HALTED",
    });
    expect(
      supply
        .filter((row) => row.symbol !== "TSLA")
        .every(
          (row) => row.residual === 0 && row.symbolStatus === "ACTIVE",
        ),
    ).toBe(true);
  });

  it("runs a side-effect-free cash reconciliation mutation", async () => {
    await expect(
      mockBaseQuery({ url: "/admin/recon/cash", method: "POST" }),
    ).resolves.toEqual({ data: { success: true } });

    const cash = await readData<CashRecon>("/admin/recon/cash/detail");
    expect(cash.lastRunAt).toBe("2026-08-03T14:30:00Z");
  });

  it("returns the three required client balances", async () => {
    const balances = await readData<ClientBalance[]>(
      "/admin/ledger/balances",
    );

    expect(balances).toEqual([
      {
        clientId: "client_nanovest",
        clientName: "Nanovest",
        available: 50000,
        held: 12000,
        total: 62000,
      },
      {
        clientId: "client_acme",
        clientName: "Acme Capital",
        available: 8500,
        held: 4200,
        total: 12700,
      },
      {
        clientId: "client_blockprime",
        clientName: "BlockPrime",
        available: 4000,
        held: 2000,
        total: 6000,
      },
    ]);
  });

  it("covers every ledger type, client, date, optional field, and valid order reference", async () => {
    const page = await readData<PaginatedTransactions>(
      "/admin/ledger/transactions?limit=100",
    );
    const orderIds = new Set([
      ...orderFixtures.orders.map((order) => order.id),
      ...orderFixtures.redemptions.map((order) => order.id),
    ]);
    const references = page.items
      .map((item) => item.referenceId)
      .filter((id): id is string => id !== null);

    expect(page.items.length).toBeGreaterThanOrEqual(30);
    expect(new Set(page.items.map((item) => item.type))).toEqual(
      new Set(TRANSACTION_TYPES),
    );
    expect(new Set(page.items.map((item) => item.clientId))).toEqual(
      new Set(["client_nanovest", "client_acme", "client_blockprime"]),
    );
    expect(
      [...new Set(page.items.map((item) => item.timestamp.slice(0, 10)))].sort(),
    ).toEqual([
      "2026-07-28",
      "2026-07-29",
      "2026-07-30",
      "2026-07-31",
      "2026-08-01",
      "2026-08-02",
      "2026-08-03",
    ]);
    expect(page.items.some((item) => item.endUserId === null)).toBe(true);
    expect(page.items.some((item) => item.endUserId !== null)).toBe(true);
    expect(page.items.some((item) => item.referenceId === null)).toBe(true);
    expect(references.length).toBeGreaterThan(0);
    expect(references.every((id) => orderIds.has(id))).toBe(true);
  });

  it("combines exact ledger filters with inclusive date boundaries", async () => {
    const result = await readData<PaginatedTransactions>(
      "/admin/ledger/transactions?clientId=client_nanovest&type=BUY_DEBIT&fromDate=2026-07-28&toDate=2026-08-03&limit=100",
    );
    const exactDay = await readData<PaginatedTransactions>(
      "/admin/ledger/transactions?fromDate=2026-07-28&toDate=2026-07-28&limit=100",
    );

    expect(result.items.length).toBeGreaterThan(0);
    expect(
      result.items.every(
        (item) =>
          item.clientId === "client_nanovest" && item.type === "BUY_DEBIT",
      ),
    ).toBe(true);
    expect(exactDay.items.length).toBeGreaterThan(0);
    expect(
      exactDay.items.every((item) => item.timestamp.startsWith("2026-07-28")),
    ).toBe(true);
  });

  it("sorts the full ledger result before applying the cursor", async () => {
    const first = await readData<PaginatedTransactions>(
      "/admin/ledger/transactions?sortBy=amount&sortDirection=asc&limit=5",
    );
    const second = await readData<PaginatedTransactions>(
      `/admin/ledger/transactions?sortBy=amount&sortDirection=asc&limit=5&cursor=${first.nextCursor}`,
    );
    const firstAmounts = first.items.map((item) => item.amount);
    const secondAmounts = second.items.map((item) => item.amount);

    expect(firstAmounts).toEqual([...firstAmounts].sort((a, b) => a - b));
    expect(secondAmounts).toEqual([...secondAmounts].sort((a, b) => a - b));
    expect(Math.min(...secondAmounts)).toBeGreaterThanOrEqual(
      Math.max(...firstAmounts),
    );
    expect(first.nextCursor).toBe("5");
    expect(first.totalCount).toBeGreaterThanOrEqual(30);
  });

  it("defaults invalid ledger pagination and sorting safely", async () => {
    const result = await readData<PaginatedTransactions>(
      "/admin/ledger/transactions?sortBy=notReal&sortDirection=sideways&limit=0&cursor=-4",
    );
    const timestamps = result.items.map((item) => item.timestamp);

    expect(result.items).toHaveLength(10);
    expect(timestamps).toEqual([...timestamps].sort().reverse());
    expect(result.nextCursor).toBe("10");
  });

  it("returns complete paginated order and redemption lists", async () => {
    const orders = await readData<PaginatedOrders>("/orders?limit=100");
    const redemptions = await readData<PaginatedOrders>(
      "/redemptions?limit=100",
    );

    expect(orders.items).toHaveLength(20);
    expect(orders.totalCount).toBe(20);
    expect(orders.nextCursor).toBeNull();
    expect(redemptions.items).toHaveLength(5);
    expect(redemptions.totalCount).toBe(5);
  });

  it("combines client, symbol, state, and inclusive date filters", async () => {
    const result = await readData<PaginatedOrders>(
      "/orders?clientId=client_nanovest&symbol=AAPL&status=MINT_FAILED&fromDate=2026-07-28&toDate=2026-08-03",
    );

    expect(result.items.map((order) => order.id)).toEqual(["ord_001"]);
    expect(result.totalCount).toBe(1);
  });

  it("matches end-user text case-insensitively", async () => {
    const result = await readData<PaginatedOrders>(
      "/orders?endUserId=USER-NANO-001",
    );

    expect(result.items.map((order) => order.id)).toEqual(["ord_001"]);
  });

  it("uses an offset cursor and bounded page size", async () => {
    const result = await readData<PaginatedOrders>(
      "/orders?limit=2&cursor=2",
    );

    expect(result.items).toHaveLength(2);
    expect(result.nextCursor).toBe("4");
    expect(result.totalCount).toBe(20);
  });

  it("returns dynamic details and fills", async () => {
    const order = await readData<Order>("/orders/ord_001");
    const fills = await readData<Array<{ fillId: string }>>(
      "/orders/ord_004/fills",
    );

    expect(order).toMatchObject({ id: "ord_001", state: "MINT_FAILED" });
    expect(fills.map((fill) => fill.fillId)).toEqual([
      "fill_004_a",
      "fill_004_b",
    ]);
  });

  it("returns 404 for an unknown detail ID", async () => {
    await expect(mockBaseQuery("/orders/ord_missing")).resolves.toEqual({
      error: {
        status: 404,
        data: { message: "Order ord_missing was not found" },
      },
    });
  });

  it("retries failed mint and burn states in memory", async () => {
    const mint = await readData<Order>({
      url: "/orders/ord_013/retry-mint",
      method: "POST",
    });
    const burn = await readData<Order>({
      url: "/redemptions/red_001/retry-burn",
      method: "POST",
    });

    expect(mint.state).toBe("MINTING");
    expect(burn.state).toBe("FILLED");
  });

  it("cancels a cancellable order", async () => {
    const cancelled = await readData<Order>({
      url: "/orders/ord_003/cancel",
      method: "POST",
    });

    expect(cancelled.state).toBe("CANCELLED");
  });

  it("rejects a mutation that conflicts with current state", async () => {
    const result = await mockBaseQuery({
      url: "/orders/ord_002/retry-mint",
      method: "POST",
    });

    expect(result).toEqual({
      error: {
        status: 409,
        data: { message: "Order ord_002 is not in MINT_FAILED" },
      },
    });
  });

  it("returns a typed 404 result for an unknown method and path", async () => {
    await expect(
      mockBaseQuery({ url: "/unknown", method: "POST" }),
    ).resolves.toEqual({
      error: {
        status: 404,
        data: { message: "No mock handler for POST /unknown" },
      },
    });
  });
});
