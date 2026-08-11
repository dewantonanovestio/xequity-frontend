import { adaptEndUsers, adaptSymbolMeta } from '@/lib/api/adapters';
import { baseApi } from '@/lib/api/baseApi';
import type { CreateEndUserRequest, EndUser, SymbolMeta } from '@/lib/types/user';

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
  }),
});

export const {
  useGetEndUsersQuery,
  useGetEndUserQuery,
  useLazyGetEndUserQuery,
  useCreateEndUserMutation,
  useGetSymbolsQuery,
} = userApi;
