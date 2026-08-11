import { describe, expect, it } from "vitest";

import {
  readTransactionFilters,
  writeTransactionFilters,
} from "@/lib/ledger/filterParams";
import { EMPTY_TRANSACTION_FILTERS } from "@/lib/ledger/ledgerUtils";

describe("transaction filter parameters", () => {
  it("writes non-empty filters in stable order", () => {
    expect(
      writeTransactionFilters({
        clientId: "client_acme",
        type: "BUY_DEBIT",
        fromDate: "2026-07-29",
        toDate: "2026-08-03",
      }),
    ).toBe(
      "clientId=client_acme&type=BUY_DEBIT&fromDate=2026-07-29&toDate=2026-08-03",
    );
  });

  it("omits empty values", () => {
    expect(
      writeTransactionFilters({
        ...EMPTY_TRANSACTION_FILTERS,
        type: "BUY_DEBIT",
      }),
    ).toBe("type=BUY_DEBIT");
    expect(writeTransactionFilters(EMPTY_TRANSACTION_FILTERS)).toBe("");
  });

  it("reads a complete controlled value", () => {
    expect(
      readTransactionFilters(
        new URLSearchParams(
          "clientId=client_nanovest&type=DEPOSIT&fromDate=2026-07-29&toDate=2026-08-03",
        ),
      ),
    ).toEqual({
      clientId: "client_nanovest",
      type: "DEPOSIT",
      fromDate: "2026-07-29",
      toDate: "2026-08-03",
    });
  });

  it("normalizes unknown transaction types to the all-types value", () => {
    expect(
      readTransactionFilters(
        new URLSearchParams("clientId=client_acme&type=NOT_REAL"),
      ),
    ).toEqual({
      clientId: "client_acme",
      type: "",
      fromDate: "",
      toDate: "",
    });
  });
});
