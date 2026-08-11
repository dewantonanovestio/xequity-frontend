import { adaptPnl } from '@/lib/api/adapters';
import { baseApi } from '@/lib/api/baseApi';
import type { PnlEntry } from '@/lib/types/user';

interface PnlQueryArgs {
  endUserId: string;
  clientId: string;
}

export const pnlApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPnl: build.query<PnlEntry[], PnlQueryArgs>({
      query: ({ endUserId, clientId }) =>
        `/pnl/${encodeURIComponent(endUserId)}?clientId=${encodeURIComponent(clientId)}`,
      transformResponse: adaptPnl,
      providesTags: ['PnL'],
    }),
  }),
});

export const { useGetPnlQuery } = pnlApi;
