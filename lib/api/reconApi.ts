import { baseApi } from "@/lib/api/baseApi";
import { adaptCashRecon, adaptSupplyRecon } from "@/lib/api/adapters";
import type {
  CashRecon,
  RunCashReconResult,
  SupplyRecon,
} from "@/lib/types/recon";

export const reconApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCashRecon: build.query<CashRecon | null, void>({
      query: () => "/admin/recon/cash/detail",
      transformResponse: adaptCashRecon,
      providesTags: ["Recon"],
    }),
    getSupplyRecon: build.query<SupplyRecon[], void>({
      query: () => "/admin/recon/supply",
      transformResponse: adaptSupplyRecon,
      providesTags: ["Recon"],
    }),
    runCashRecon: build.mutation<RunCashReconResult, void>({
      query: () => ({ url: "/admin/recon/cash", method: "POST" }),
      transformResponse: () => ({ success: true }),
      invalidatesTags: ["Recon"],
    }),
  }),
});

export const {
  useGetCashReconQuery,
  useGetSupplyReconQuery,
  useRunCashReconMutation,
} = reconApi;
