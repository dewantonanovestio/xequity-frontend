import { describe, expect, it } from "vitest";

import { readOrderFilters, writeOrderFilters } from "@/lib/orders/filterParams";
import { EMPTY_ORDER_FILTERS } from "@/lib/orders/orderUtils";

describe("order filter URL parameters", () => {
  it("reads only the six supported filter keys", () => {
    const result = readOrderFilters(
      new URLSearchParams(
        "clientId=client_acme&endUserId=user-12&symbol=AAPL&status=SETTLED&fromDate=2026-08-01&toDate=2026-08-03&ignored=value",
      ),
    );

    expect(result).toEqual({
      clientId: "client_acme",
      endUserId: "user-12",
      symbol: "AAPL",
      status: "SETTLED",
      fromDate: "2026-08-01",
      toDate: "2026-08-03",
    });
  });

  it("serializes stable keys while omitting empty values", () => {
    expect(
      writeOrderFilters({
        ...EMPTY_ORDER_FILTERS,
        clientId: "client_nanovest",
        symbol: "AAPL",
        toDate: "2026-08-03",
      }),
    ).toBe("clientId=client_nanovest&symbol=AAPL&toDate=2026-08-03");
  });

  it("round-trips empty filters without query text", () => {
    expect(readOrderFilters(new URLSearchParams())).toEqual(
      EMPTY_ORDER_FILTERS,
    );
    expect(writeOrderFilters(EMPTY_ORDER_FILTERS)).toBe("");
  });
});
