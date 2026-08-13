import { baseApi } from "@/lib/api/baseApi";
import type {
  AlpacaDepositRequest,
  CreateWireWithdrawalRequest,
  ConfigEntry,
  WireWithdrawal,
} from "@/lib/types/treasury";

export const treasuryApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    alpacaDeposit: build.mutation<unknown, AlpacaDepositRequest>({
      query: (body) => ({
        url: "/admin/treasury/deposits/alpaca-wire",
        method: "POST",
        body,
      }),
    }),
    createWireWithdrawal: build.mutation<WireWithdrawal, CreateWireWithdrawalRequest>({
      query: (body) => ({
        url: "/admin/treasury/wire-withdrawals",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Treasury"],
    }),
    getWireWithdrawals: build.query<WireWithdrawal[], void>({
      query: () => "/admin/treasury/wire-withdrawals",
      providesTags: ["Treasury"],
    }),
    getWithdrawalBankConfig: build.query<ConfigEntry, void>({
      query: () => "/admin/configs/group/WIRE_WITHDRAWAL/key/RECIPIENT_BANK",
      providesTags: ["Treasury"],
    }),
  }),
});

export const {
  useAlpacaDepositMutation,
  useCreateWireWithdrawalMutation,
  useGetWireWithdrawalsQuery,
  useGetWithdrawalBankConfigQuery,
} = treasuryApi;
