import { baseApi } from "@/lib/api/baseApi";
import { adaptClient, adaptClients } from "@/lib/api/adapters";
import type { Client, OnboardClientRequest } from "@/lib/types/client";

export const clientApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getClients: build.query<Client[], void>({
      query: () => "/admin/clients",
      transformResponse: adaptClients,
      providesTags: ["Clients"],
    }),
    onboardClient: build.mutation<Client, OnboardClientRequest>({
      query: (body) => ({ url: "/admin/clients", method: "POST", body }),
      transformResponse: adaptClient,
      invalidatesTags: ["Clients"],
    }),
  }),
});

export const { useGetClientsQuery, useOnboardClientMutation } = clientApi;
