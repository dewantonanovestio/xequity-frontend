import { baseApi } from "@/lib/api/baseApi";
import type {
  AlpacaDepositRequest,
  CreateWireWithdrawalRequest,
  ConfigEntry,
  WireWithdrawal,
  CreateDepositRequest,
  Deposit,
  CreateWithdrawalRequest,
  Withdrawal,
  ClientWallet,
  ConfirmWithdrawalRequest,
} from "@/lib/types/treasury";

export const treasuryApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Admin endpoints
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
    getAdminWithdrawals: build.query<Withdrawal[], void>({
      query: () => "/admin/treasury/withdrawals",
      providesTags: ["Treasury"],
    }),
    approveWithdrawal: build.mutation<Withdrawal, string>({
      query: (id) => ({
        url: `/admin/treasury/withdrawals/${id}/approve`,
        method: "POST",
      }),
      invalidatesTags: ["Treasury"],
    }),
    rejectWithdrawal: build.mutation<Withdrawal, string>({
      query: (id) => ({
        url: `/admin/treasury/withdrawals/${id}/reject`,
        method: "POST",
      }),
      invalidatesTags: ["Treasury"],
    }),
    confirmWithdrawal: build.mutation<Withdrawal, { id: string; body: ConfirmWithdrawalRequest }>({
      query: ({ id, body }) => ({
        url: `/admin/treasury/withdrawals/${id}/confirm`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Treasury"],
    }),

    // Client endpoints
    createDeposit: build.mutation<Deposit, CreateDepositRequest>({
      query: (body) => ({
        url: "/deposits",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Treasury"],
    }),
    getDeposits: build.query<Deposit[], string | undefined>({
      query: (clientId) =>
        clientId ? `/deposits?clientId=${clientId}` : "/deposits",
      providesTags: ["Treasury"],
    }),
    createWithdrawal: build.mutation<Withdrawal, CreateWithdrawalRequest>({
      query: (body) => ({
        url: "/withdrawals",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Treasury"],
    }),
    getWithdrawals: build.query<Withdrawal[], string | undefined>({
      query: (clientId) =>
        clientId ? `/withdrawals?clientId=${clientId}` : "/withdrawals",
      providesTags: ["Treasury"],
    }),
    getClientWallets: build.query<ClientWallet[], string>({
      query: (clientId) => `/wallets?clientId=${clientId}`,
    }),
  }),
});

export const {
  useAlpacaDepositMutation,
  useCreateWireWithdrawalMutation,
  useGetWireWithdrawalsQuery,
  useGetWithdrawalBankConfigQuery,
  useGetAdminWithdrawalsQuery,
  useApproveWithdrawalMutation,
  useRejectWithdrawalMutation,
  useConfirmWithdrawalMutation,
  useCreateDepositMutation,
  useGetDepositsQuery,
  useCreateWithdrawalMutation,
  useGetWithdrawalsQuery,
  useGetClientWalletsQuery,
} = treasuryApi;
