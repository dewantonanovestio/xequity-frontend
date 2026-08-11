import { baseApi } from "@/lib/api/baseApi";
import {
  adaptFills,
  adaptOrderDetail,
  adaptOrderPage,
} from "@/lib/api/adapters";
import type {
  Fill,
  Order,
  OrderQueryParams,
  PaginatedOrders,
} from "@/lib/types/order";
import type { PlaceOrderRequest, PlaceRedemptionRequest, ReplaceOrderRequest } from "@/lib/types/trade";
function normalizeDate(key: string, value: unknown) {
  if (typeof value !== "string") return value;
  if (key === "fromDate" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T00:00:00.000Z`;
  }
  if (key === "toDate" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T23:59:59.999Z`;
  }
  return value;
}

export function orderCollectionUrl(path: string, params: OrderQueryParams) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(normalizeDate(key, value)));
    }
  });

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getOrders: build.query<PaginatedOrders, OrderQueryParams>({
      query: (params) => orderCollectionUrl("/orders", params),
      transformResponse: (response: unknown) => adaptOrderPage(response, "BUY"),
      providesTags: ["Orders"],
    }),
    getOrder: build.query<Order, string>({
      query: (id) => `/orders/${id}`,
      transformResponse: (response: unknown) => adaptOrderDetail(response, "BUY"),
      providesTags: ["Orders"],
    }),
    getOrderFills: build.query<Fill[], string>({
      query: (id) => `/orders/${id}/fills`,
      transformResponse: (response: unknown) => adaptFills(response, "BUY"),
      providesTags: ["Orders"],
    }),
    getRedemptions: build.query<PaginatedOrders, OrderQueryParams>({
      query: (params) => orderCollectionUrl("/redemptions", params),
      transformResponse: (response: unknown) => adaptOrderPage(response, "SELL"),
      providesTags: ["Orders"],
    }),
    getRedemption: build.query<Order, string>({
      query: (id) => `/redemptions/${id}`,
      transformResponse: (response: unknown) => adaptOrderDetail(response, "SELL"),
      providesTags: ["Orders"],
    }),
    getRedemptionFills: build.query<Fill[], string>({
      query: (id) => `/redemptions/${id}/fills`,
      transformResponse: (response: unknown) => adaptFills(response, "SELL"),
      providesTags: ["Orders"],
    }),
    retryMint: build.mutation<Order, string>({
      query: (id) => ({ url: `/orders/${id}/retry-mint`, method: "POST" }),
      invalidatesTags: ["Orders"],
    }),
    retryBurn: build.mutation<Order, string>({
      query: (id) => ({
        url: `/redemptions/${id}/retry-burn`,
        method: "POST",
      }),
      invalidatesTags: ["Orders"],
    }),
    cancelOrder: build.mutation<Order, string>({
      query: (id) => ({ url: `/orders/${id}`, method: "DELETE" }),
      invalidatesTags: ["Orders"],
    }),
    cancelRedemption: build.mutation<Order, string>({
      query: (id) => ({ url: `/redemptions/${id}`, method: "DELETE" }),
      invalidatesTags: ["Orders"],
    }),
    replaceOrder: build.mutation<void, ReplaceOrderRequest>({
      query: ({ id, ...body }) => ({ url: `/orders/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Orders"],
    }),
    replaceRedemption: build.mutation<void, ReplaceOrderRequest>({
      query: ({ id, ...body }) => ({ url: `/redemptions/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Orders"],
    }),
    placeOrder: build.mutation<Order, PlaceOrderRequest>({
      query: (body) => ({ url: "/orders", method: "POST", body }),
      transformResponse: (response: unknown) => adaptOrderDetail(response, "BUY"),
      invalidatesTags: ["Orders"],
    }),
    placeRedemption: build.mutation<Order, PlaceRedemptionRequest>({
      query: (body) => ({ url: '/redemptions', method: 'POST', body }),
      transformResponse: (response: unknown) => adaptOrderDetail(response, 'SELL'),
      invalidatesTags: ['Orders'],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderQuery,
  useGetOrderFillsQuery,
  useGetRedemptionsQuery,
  useGetRedemptionQuery,
  useGetRedemptionFillsQuery,
  useRetryMintMutation,
  useRetryBurnMutation,
  useCancelOrderMutation,
  useCancelRedemptionMutation,
  usePlaceOrderMutation,
  usePlaceRedemptionMutation,
  useReplaceOrderMutation,
  useReplaceRedemptionMutation,
} = ordersApi;
