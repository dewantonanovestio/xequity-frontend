import { adaptEndUsers, adaptSymbolMeta, adaptAdminSymbols, adaptAdminSymbol } from '@/lib/api/adapters';
import { baseApi } from '@/lib/api/baseApi';
import type { AdminSymbol, CreateEndUserRequest, EndUser, OnboardSymbolRequest, SymbolMeta, UpdateSymbolStatusRequest } from '@/lib/types/user';

function adaptSingleEndUser(value: unknown): EndUser {
  return adaptEndUsers([value])[0] ?? {
    endUserId: '',
    clientId: '',
    externalId: '',
    walletId: '',
    displayName: '',
    subAccountId: null,
    state: 'PROVISIONING',
    createdAt: '',
    updatedAt: '',
  };
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getEndUsers: build.query<EndUser[], { clientId?: string } | void>({
      query: (params) => {
        const clientId = params && 'clientId' in params ? params.clientId : undefined;
        return clientId ? `/end-users?clientId=${clientId}` : '/end-users';
      },
      transformResponse: adaptEndUsers,
      providesTags: ['EndUsers'],
    }),
    getEndUser: build.query<EndUser, string>({
      query: (id) => `/end-users/${id}`,
      transformResponse: adaptSingleEndUser,
    }),
    createEndUser: build.mutation<EndUser, CreateEndUserRequest>({
      query: (body) => ({ url: '/end-users', method: 'POST', body }),
      transformResponse: adaptSingleEndUser,
      invalidatesTags: ['EndUsers'],
    }),
    getSymbols: build.query<SymbolMeta[], void>({
      query: () => '/symbols',
      transformResponse: adaptSymbolMeta,
    }),
    getAdminSymbols: build.query<AdminSymbol[], void>({
      query: () => '/admin/symbols',
      transformResponse: adaptAdminSymbols,
      providesTags: ['Symbols'],
    }),
    onboardSymbol: build.mutation<AdminSymbol, OnboardSymbolRequest>({
      query: (body) => ({ url: '/admin/symbols', method: 'POST', body }),
      transformResponse: adaptAdminSymbol,
      invalidatesTags: ['Symbols'],
    }),
    updateSymbolStatus: build.mutation<AdminSymbol, UpdateSymbolStatusRequest>({
      query: ({ ticker, status }) => ({
        url: `/admin/symbols/${ticker}/status`,
        method: 'PATCH',
        body: { status },
      }),
      transformResponse: adaptAdminSymbol,
      invalidatesTags: ['Symbols'],
    }),
  }),
});

export const {
  useGetEndUsersQuery,
  useGetEndUserQuery,
  useLazyGetEndUserQuery,
  useCreateEndUserMutation,
  useGetSymbolsQuery,
  useGetAdminSymbolsQuery,
  useOnboardSymbolMutation,
  useUpdateSymbolStatusMutation,
} = userApi;
