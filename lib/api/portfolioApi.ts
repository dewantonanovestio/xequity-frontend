import { adaptHoldings, adaptPricing } from '@/lib/api/adapters';
import { baseApi } from '@/lib/api/baseApi';
import type { Holding, SymbolPricing } from '@/lib/types/user';

export interface PricingQuery {
  readonly symbol: string;
  readonly clientId: string;
}

export const portfolioApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getHoldings: build.query<Holding[], string>({
      query: (endUserId) => `/portfolio/${encodeURIComponent(endUserId)}`,
      transformResponse: adaptHoldings,
      providesTags: ['Portfolio'],
    }),
    getPricing: build.query<SymbolPricing, PricingQuery>({
      query: ({ symbol, clientId }) =>
        `/pricing/${encodeURIComponent(symbol)}?clientId=${encodeURIComponent(clientId)}`,
      transformResponse: adaptPricing,
      providesTags: ['Pricing'],
    }),
  }),
});

export const { useGetHoldingsQuery, useGetPricingQuery } = portfolioApi;
