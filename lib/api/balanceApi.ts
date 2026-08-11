import { baseApi } from "@/lib/api/baseApi";
import { adaptBalance } from "@/lib/api/adapters";
import type { UserBalance } from "@/lib/types/balance";

export const balanceApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getBalance: build.query<UserBalance, string>({
      query: (clientId) => `/balance?clientId=${clientId}`,
      transformResponse: adaptBalance,
      providesTags: ["Balances"],
    }),
  }),
});

export const { useGetBalanceQuery } = balanceApi;
