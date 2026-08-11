import { baseApi } from "@/lib/api/baseApi";
import { adaptBalances, adaptSystemBalances, adaptTransactionPage } from "@/lib/api/adapters";
import type {
  ClientBalance,
  PaginatedTransactions,
  SystemBalance,
  TransactionQueryParams,
} from "@/lib/types/ledger";
const BACKEND_TRANSACTION_TYPES = new Set([
  "DEPOSIT",
  "WITHDRAWAL",
  "FILL",
  "REDEMPTION_FILL",
  "CONVERSION",
  "DIVIDEND",
  "SETTLEMENT",
  "REGULATORY_FEE",
  "HOLD",
  "HOLD_RELEASE",
  "GAS",
]);

function normalizeBackendParam(key: string, value: unknown) {
  if (key === "sortBy") return "createdAt";
  if (key === "sortDirection" && typeof value === "string") {
    return value.toUpperCase();
  }
  if (key === "type" && !BACKEND_TRANSACTION_TYPES.has(String(value))) {
    return undefined;
  }
  if (key === "fromDate" && typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T00:00:00.000Z`;
  }
  if (key === "toDate" && typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T23:59:59.999Z`;
  }
  return value;
}

export function ledgerCollectionUrl(
  path: string,
  params: TransactionQueryParams,
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    const normalizedValue = normalizeBackendParam(key, value);
    if (
      normalizedValue !== undefined &&
      normalizedValue !== null &&
      normalizedValue !== ""
    ) {
      searchParams.set(key, String(normalizedValue));
    }
  });

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

export const ledgerApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getBalances: build.query<ClientBalance[], void>({
      query: () => "/admin/ledger/balances",
      transformResponse: adaptBalances,
      providesTags: ["Balances"],
    }),
    getSystemBalances: build.query<SystemBalance[], void>({
      query: () => "/admin/ledger/system-balances",
      transformResponse: adaptSystemBalances,
      providesTags: ["Balances"],
    }),
    getTransactions: build.query<
      PaginatedTransactions,
      TransactionQueryParams
    >({
      query: (params) =>
        ledgerCollectionUrl("/admin/ledger/transactions", params),
      transformResponse: adaptTransactionPage,
      providesTags: ["Transactions"],
    }),
  }),
});

export const {
  useGetBalancesQuery,
  useGetSystemBalancesQuery,
  useGetTransactionsQuery,
} = ledgerApi;
