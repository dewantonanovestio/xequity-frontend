# Task 05: Frontend — activitiesApi.ts + Activity Types

**Status:** pending
**HLD Reference:** Technical Implementation — ActivityTable + Activities Page

## Description

Create the RTK Query API slice for the account activities endpoint. `GET /activities` is already fully implemented in the backend (`ActivitiesController`) with cursor pagination, `endUserId` filtering, and `CursorPaginatedResult<ActivityDto>` response shape. The frontend only needs the RTK slice and an `adaptActivityPage` adapter.

## Acceptance Criteria

- [ ] `useGetActivitiesQuery` hook is exported and callable
- [ ] First call fetches `GET /activities?endUserId=x&limit=20`
- [ ] Second call with `cursor` appends to the cached `items` array (RTK `merge` works)
- [ ] Changing `endUserId` resets the cache (`serializeQueryArgs` keys on `endUserId`)
- [ ] `adaptActivityPage` correctly parses `qty` and `amount` as numbers (from decimal strings)
- [ ] `"Activities"` tag added to `baseApi.ts` `tagTypes` array

## Dependencies

- **Depends on:** Task 03 (`Activity`, `PaginatedActivities` types)
- **Blocks:** Task 10 (Activities page)

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `lib/api/baseApi.ts` | Modify | Add `"Activities"` to `tagTypes` array |
| `lib/api/adapters.ts` | Modify | Add `adaptActivity()` and `adaptActivityPage()` |
| `lib/api/activitiesApi.ts` | Create | RTK Query slice with cursor pagination |
| `lib/mocks/activities.json` | Create | Sample mock data for development |

## Unit Tests

| Test Class | Purpose |
|------------|---------|
| `lib/api/__tests__/adapters.test.ts` | Test `adaptActivityPage` parsing |

- **Positive scenarios:** Valid response with BUY and SELL items → correct `Activity[]`. `price` field absent on SELL item → `price` is `undefined`.
- **Negative scenarios:** `qty: "abc"` → `qty: NaN` (acceptable — backend guarantees valid decimals). Missing `nextCursor` → `null`.
- **Mocking strategy:** Pure function adapter tests. RTK mock tests use `setupServer` + `msw` if available; otherwise test adapter in isolation.

## Implementation Hints

**`adaptActivityPage` in `adapters.ts`:**
```typescript
export function adaptActivityPage(value: unknown): PaginatedActivities {
  if (!isRecord(value)) return { items: [], nextCursor: null, totalCount: 0 };
  const items = Array.isArray(value.items)
    ? value.items.map((item: unknown) => {
        if (!isRecord(item)) return null;
        return {
          id: asString(item.id),
          type: item.type === 'SELL' ? 'SELL' : 'BUY',
          symbol: asString(item.symbol),
          qty: asNumber(item.qty),
          amount: asNumber(item.amount),
          price: item.price !== undefined ? asNumber(item.price) : undefined,
          state: asString(item.state),
          alpacaFillId: asString(item.alpacaFillId),
          referenceId: asString(item.referenceId),
          createdAt: asString(item.createdAt),
        } satisfies Activity;
      }).filter(Boolean)
    : [];
  return {
    items: items as Activity[],
    nextCursor: typeof value.nextCursor === 'string' ? value.nextCursor : null,
    totalCount: asNumber(value.totalCount),
  };
}
```

**`activitiesApi.ts` — cursor pagination pattern:**
```typescript
export const activitiesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getActivities: build.query<PaginatedActivities, { endUserId?: string; cursor?: string; limit?: number }>({
      query: ({ endUserId, cursor, limit = 20 }) => {
        const params = new URLSearchParams({ limit: String(limit) });
        if (endUserId) params.set('endUserId', endUserId);
        if (cursor) params.set('cursor', cursor);
        return `/activities?${params.toString()}`;
      },
      transformResponse: adaptActivityPage,
      providesTags: ['Activities'],
      serializeQueryArgs: ({ queryArgs }) => queryArgs.endUserId ?? 'anon',
      merge: (cache, incoming) => {
        cache.items.push(...incoming.items);
        cache.nextCursor = incoming.nextCursor;
        cache.totalCount = incoming.totalCount;
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.cursor !== previousArg?.cursor,
    }),
  }),
});
export const { useGetActivitiesQuery } = activitiesApi;
```

**`lib/mocks/activities.json`:** Create 5-10 sample entries following the `ActivityDto` shape with mixed BUY/SELL types.

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-08-05 | Initial task created |
