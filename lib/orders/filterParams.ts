import type { OrderFilters } from "@/lib/types/order";

const FILTER_KEYS = [
  "clientId",
  "endUserId",
  "symbol",
  "status",
  "fromDate",
  "toDate",
] as const satisfies readonly (keyof OrderFilters)[];

export function readOrderFilters(searchParams: URLSearchParams): OrderFilters {
  return Object.fromEntries(
    FILTER_KEYS.map((key) => [key, searchParams.get(key) ?? ""]),
  ) as unknown as OrderFilters;
}

export function writeOrderFilters(filters: OrderFilters): string {
  const searchParams = new URLSearchParams();

  FILTER_KEYS.forEach((key) => {
    if (filters[key]) searchParams.set(key, filters[key]);
  });

  return searchParams.toString();
}
