import {
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";

import { mockBaseQuery } from "@/lib/mocks/mockBaseQuery";
import { getApiRequestUrl, isMockMode } from "@/lib/utils/env";

interface StandardApiResponse {
  success: boolean;
  data: unknown;
}

function isStandardApiResponse(value: unknown): value is StandardApiResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    "data" in value
  );
}

const rawBaseQuery = fetchBaseQuery({ baseUrl: getApiRequestUrl() });

const baseQueryWithUnwrap: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = isMockMode()
    ? await mockBaseQuery(args)
    : await rawBaseQuery(args, api, extraOptions);

  if (!("error" in result) && isStandardApiResponse(result.data)) {
    return {
      data: result.data.data,
      ...("meta" in result ? { meta: result.meta } : {}),
    };
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithUnwrap,
  tagTypes: [
    "Orders",
    "Balances",
    "Transactions",
    "Recon",
    "EndUsers",
    "Portfolio",
    "Pricing",
    "PnL",
    "Activities",
    "Clients",
    "Symbols",
  ],
  endpoints: () => ({}),
});
