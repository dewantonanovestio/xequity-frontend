import { baseApi } from "@/lib/api/baseApi";
import { adaptActivityPage } from "@/lib/api/adapters";
import type { PaginatedActivities } from "@/lib/types/activity";

interface GetActivitiesArgs {
  endUserId: string;
  cursor?: string | null;
}

export const activitiesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getActivities: build.query<PaginatedActivities, GetActivitiesArgs>({
      query: ({ endUserId, cursor }) => {
        const params = new URLSearchParams({ endUserId });
        if (cursor) params.set("cursor", cursor);
        return `/activities?${params.toString()}`;
      },
      transformResponse: adaptActivityPage,
      providesTags: ["Activities"],
      serializeQueryArgs: ({ queryArgs }) => `activities-${queryArgs.endUserId}`,
      merge: (currentCache, newItems) => {
        currentCache.items.push(...newItems.items);
        currentCache.nextCursor = newItems.nextCursor;
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.cursor !== previousArg?.cursor,
    }),
  }),
});

export const { useGetActivitiesQuery } = activitiesApi;
