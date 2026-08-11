import {
  BACKEND_TRANSACTION_TYPES,
  EMPTY_TRANSACTION_FILTERS,
} from "@/lib/ledger/ledgerUtils";
import type { TransactionFilters } from "@/lib/types/ledger";

const filterKeys = ["clientId", "type", "fromDate", "toDate"] as const;

export function readTransactionFilters(
  searchParams: URLSearchParams,
): TransactionFilters {
  const type = searchParams.get("type") ?? "";

  return {
    ...EMPTY_TRANSACTION_FILTERS,
    clientId: searchParams.get("clientId") ?? "",
    type: BACKEND_TRANSACTION_TYPES.some((candidate) => candidate === type) ? type : "",
    fromDate: searchParams.get("fromDate") ?? "",
    toDate: searchParams.get("toDate") ?? "",
  };
}

export function writeTransactionFilters(filters: TransactionFilters): string {
  const searchParams = new URLSearchParams();

  filterKeys.forEach((key) => {
    if (filters[key]) searchParams.set(key, filters[key]);
  });

  return searchParams.toString();
}
