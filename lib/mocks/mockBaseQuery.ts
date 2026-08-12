import type {
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";

import ledgerFixtures from "@/lib/mocks/ledger.json";
import endUserFixtures from "@/lib/mocks/endUsers.json";
import orderFixtures from "@/lib/mocks/orders.json";
import pnlFixtures from "@/lib/mocks/pnl.json";
import portfolioFixtures from "@/lib/mocks/portfolio.json";
import reconFixtures from "@/lib/mocks/recon.json";
import symbolFixtures from "@/lib/mocks/symbols.json";
import activityFixtures from "@/lib/mocks/activities.json";
import balanceFixtures from "@/lib/mocks/balance.json";
import { BACKEND_TRANSACTION_TYPES } from "@/lib/ledger/ledgerUtils";
import type {
  PaginatedTransactions,
  SortDirection,
  Transaction,
  TransactionQueryParams,
  TransactionSortField,
} from "@/lib/types/ledger";
import type {
  Fill,
  Order,
  OrderQueryParams,
  OrderState,
  PaginatedOrders,
  StateTransition,
} from "@/lib/types/order";
import type { CashRecon } from "@/lib/types/recon";
import type { AdminSymbol, SymbolStatus } from "@/lib/types/user";

type MockQueryResult =
  | { data: unknown }
  | { error: FetchBaseQueryError };

type CollectionKind = "orders" | "redemptions";

const orders = orderFixtures.orders as Order[];
const redemptions = orderFixtures.redemptions as Order[];
const fills = orderFixtures.fills as Record<string, Fill[]>;
const transactions = ledgerFixtures.transactions as Transaction[];
const sessionOverrides = new Map<string, Order>();
const sessionOrders: Order[] = [];

const adminSymbols: AdminSymbol[] = [
  { ticker: "AAPL", tokenProxyAddr: "0x1234567890abcdef1234567890abcdef12345678", status: "ACTIVE", tradable: true, fractionable: true, tradableOvernight: true, fractionableOvernight: true, alpacaStatus: "active", lastSyncedAt: "2026-08-11T12:45:00.020Z", createdAt: "2024-01-10T00:00:00Z", updatedAt: "2024-01-10T00:00:00Z" },
  { ticker: "MSFT", tokenProxyAddr: "0xabcdef1234567890abcdef1234567890abcdef12", status: "ACTIVE", tradable: true, fractionable: true, tradableOvernight: false, fractionableOvernight: false, alpacaStatus: "active", lastSyncedAt: "2026-08-11T12:45:00.020Z", createdAt: "2024-01-10T00:00:00Z", updatedAt: "2024-01-10T00:00:00Z" },
  { ticker: "GOOGL", tokenProxyAddr: "0x7890abcdef1234567890abcdef1234567890abcd", status: "ACTIVE", tradable: true, fractionable: true, tradableOvernight: false, fractionableOvernight: false, alpacaStatus: "active", lastSyncedAt: "2026-08-11T12:45:00.020Z", createdAt: "2024-01-10T00:00:00Z", updatedAt: "2024-01-10T00:00:00Z" },
  { ticker: "TSLA", tokenProxyAddr: null, status: "MINT_HALTED", tradable: false, fractionable: true, tradableOvernight: false, fractionableOvernight: false, alpacaStatus: "inactive", lastSyncedAt: "2026-08-10T08:00:00.000Z", createdAt: "2024-02-01T00:00:00Z", updatedAt: "2024-03-01T00:00:00Z" },
  { ticker: "NVDA", tokenProxyAddr: "0xef1234567890abcdef1234567890abcdef123456", status: "ACTIVE", tradable: true, fractionable: true, tradableOvernight: false, fractionableOvernight: false, alpacaStatus: "active", lastSyncedAt: "2026-08-11T12:45:00.020Z", createdAt: "2024-02-15T00:00:00Z", updatedAt: "2024-02-15T00:00:00Z" },
  { ticker: "SPY", tokenProxyAddr: "0x567890abcdef1234567890abcdef1234567890ab", status: "ACTIVE", tradable: true, fractionable: false, tradableOvernight: false, fractionableOvernight: false, alpacaStatus: "active", lastSyncedAt: "2026-08-11T12:45:00.020Z", createdAt: "2024-03-01T00:00:00Z", updatedAt: "2024-03-01T00:00:00Z" },
];

export function resetMockState(): void {
  sessionOverrides.clear();
  sessionOrders.length = 0;
}

const VALID_SYMBOL_STATUSES: SymbolStatus[] = [
  "ACTIVE", "MINT_HALTED", "REDEEM_HALTED", "HALTED", "DELISTING", "RETIRED",
];

const referencePrices: Record<string, number> = {
  AAPL: 226.4,
  MSFT: 419.75,
  GOOGL: 195.2,
  TSLA: 307.6,
  AMZN: 221.3,
  NVDA: 181.4,
  SPY: 639.25,
};

function activeCashRecon(): CashRecon {
  const scenarios = reconFixtures.cashScenarios as Record<string, CashRecon>;
  return scenarios[reconFixtures.activeCashScenario] ?? scenarios.balanced;
}

const staticRoutes: Record<string, () => unknown> = {
  "GET /admin/ledger/balances": () => ledgerFixtures.balances,
  "GET /admin/recon/cash/detail": activeCashRecon,
  "GET /admin/recon/supply": () => reconFixtures.supply,
  "POST /admin/recon/cash": () => ({ success: true }),
  "GET /end-users": () => endUserFixtures,
  "GET /symbols": () => symbolFixtures,
  "GET /admin/symbols": () => [...adminSymbols],
};

const transactionSortFields: TransactionSortField[] = [
  "timestamp",
  "clientId",
  "accountType",
  "sourceType",
  "debit",
  "credit",
  "referenceId",
  "description",
];

function parseRequest(args: string | FetchArgs) {
  const rawUrl = typeof args === "string" ? args : args.url;
  const method =
    typeof args === "string" ? "GET" : (args.method ?? "GET").toUpperCase();
  const url = new URL(rawUrl, "http://mock.local");

  const body = typeof args === "string" ? undefined : args.body;
  return { method, path: url.pathname, searchParams: url.searchParams, body };
}

function collectionFor(kind: CollectionKind) {
  const fixtures = kind === "orders" ? orders : redemptions;

  const base = fixtures.map((order) => sessionOverrides.get(order.id) ?? order);
  return kind === "orders" ? [...sessionOrders, ...base] : base;
}

function findOrder(kind: CollectionKind, id: string) {
  return collectionFor(kind).find((order) => order.id === id);
}

function entityName(kind: CollectionKind) {
  return kind === "orders" ? "Order" : "Redemption";
}

function notFound(kind: CollectionKind, id: string): MockQueryResult {
  return {
    error: {
      status: 404,
      data: { message: `${entityName(kind)} ${id} was not found` },
    },
  };
}

function readQueryParams(searchParams: URLSearchParams): OrderQueryParams {
  const value = (key: string) => searchParams.get(key) || undefined;
  const limit = Number(searchParams.get("limit"));

  return {
    clientId: value("clientId"),
    endUserId: value("endUserId"),
    symbol: value("symbol"),
    status: value("status") as OrderState | undefined,
    fromDate: value("fromDate"),
    toDate: value("toDate"),
    cursor: value("cursor"),
    limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
  };
}

function listOrders(
  kind: CollectionKind,
  searchParams: URLSearchParams,
): PaginatedOrders {
  const query = readQueryParams(searchParams);
  const endUserQuery = query.endUserId?.toLocaleLowerCase();
  const filtered = collectionFor(kind).filter((order) => {
    const createdDay = order.createdAt.slice(0, 10);

    return (
      (!query.clientId || order.clientId === query.clientId) &&
      (!endUserQuery ||
        order.endUserId.toLocaleLowerCase().includes(endUserQuery)) &&
      (!query.symbol || order.symbol === query.symbol) &&
      (!query.status || order.state === query.status) &&
      (!query.fromDate || createdDay >= query.fromDate) &&
      (!query.toDate || createdDay <= query.toDate)
    );
  });
  const parsedCursor = Number.parseInt(query.cursor ?? "0", 10);
  const offset = Number.isFinite(parsedCursor) && parsedCursor >= 0
    ? parsedCursor
    : 0;
  const limit = Math.min(Math.max(Math.floor(query.limit ?? 20), 1), 100);
  const end = offset + limit;

  return {
    items: filtered.slice(offset, end),
    nextCursor: end < filtered.length ? String(end) : null,
    totalCount: filtered.length,
  };
}

function readTransactionQuery(
  searchParams: URLSearchParams,
): Required<Pick<TransactionQueryParams, "limit" | "sortBy" | "sortDirection">> &
  Omit<TransactionQueryParams, "limit" | "sortBy" | "sortDirection"> {
  const value = (key: string) => searchParams.get(key) || undefined;
  const rawType = value("type");
  const rawSortBy = value("sortBy");
  const rawSortDirection = value("sortDirection");
  const rawLimit = Number(searchParams.get("limit"));

  return {
    clientId: value("clientId"),
    type: BACKEND_TRANSACTION_TYPES.find((type) => type === rawType),
    fromDate: value("fromDate"),
    toDate: value("toDate"),
    cursor: value("cursor"),
    limit:
      Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(Math.floor(rawLimit), 100)
        : 10,
    sortBy:
      transactionSortFields.find((field) => field === rawSortBy) ?? "timestamp",
    sortDirection:
      rawSortDirection === "asc" || rawSortDirection === "desc"
        ? (rawSortDirection as SortDirection)
        : "desc",
  };
}

function compareTransactionValues(
  left: Transaction,
  right: Transaction,
  field: TransactionSortField,
) {
  const leftValue = left[field];
  const rightValue = right[field];

  if (typeof leftValue === "number" && typeof rightValue === "number") {
    return leftValue - rightValue;
  }

  return String(leftValue ?? "").localeCompare(String(rightValue ?? ""));
}

function listTransactions(
  searchParams: URLSearchParams,
): PaginatedTransactions {
  const query = readTransactionQuery(searchParams);
  const filtered = transactions.filter((transaction) => {
    const transactionDay = transaction.timestamp.slice(0, 10);

    return (
      (!query.clientId || transaction.clientId === query.clientId) &&
      (!query.type || transaction.sourceType === query.type) &&
      (!query.fromDate || transactionDay >= query.fromDate) &&
      (!query.toDate || transactionDay <= query.toDate)
    );
  });
  const direction = query.sortDirection === "asc" ? 1 : -1;
  const sorted = filtered.toSorted((left, right) => {
    const result = compareTransactionValues(left, right, query.sortBy);
    return result === 0 ? left.id.localeCompare(right.id) : result * direction;
  });
  const parsedCursor = Number.parseInt(query.cursor ?? "0", 10);
  const offset =
    Number.isFinite(parsedCursor) && parsedCursor >= 0 ? parsedCursor : 0;
  const end = offset + query.limit;

  return {
    items: sorted.slice(offset, end),
    nextCursor: end < sorted.length ? String(end) : null,
    totalCount: sorted.length,
  };
}

function transitionOrder(
  kind: CollectionKind,
  id: string,
  expectedStates: OrderState[],
  nextState: OrderState,
  invalidMessage: string,
): MockQueryResult {
  const order = findOrder(kind, id);
  if (!order) return notFound(kind, id);

  if (!expectedStates.includes(order.state)) {
    return {
      error: {
        status: 409,
        data: { message: invalidMessage },
      },
    };
  }

  const transitionedAt = new Date().toISOString();
  const transition: StateTransition = {
    fromState: order.state,
    toState: nextState,
    transitionedAt,
  };
  const updated = {
    ...order,
    state: nextState,
    updatedAt: transitionedAt,
    stateTransitions: [...order.stateTransitions, transition],
  };

  sessionOverrides.set(id, updated);
  return { data: updated };
}

function handleDynamicRoute(
  method: string,
  path: string,
  body: unknown,
): MockQueryResult | null {
  const portfolioMatch = path.match(/^\/portfolio\/([^/]+)$/);
  if (method === "GET" && portfolioMatch) {
    const rows = portfolioFixtures as Record<string, unknown[]>;
    return { data: rows[decodeURIComponent(portfolioMatch[1])] ?? [] };
  }

  const pnlMatch = path.match(/^\/pnl\/([^/]+)$/);
  if (method === "GET" && pnlMatch) {
    const rows = pnlFixtures as Record<string, unknown[]>;
    return { data: rows[decodeURIComponent(pnlMatch[1])] ?? [] };
  }

  const pricingMatch = path.match(/^\/pricing\/([^/]+)$/);
  if (method === "GET" && pricingMatch) {
    const symbol = decodeURIComponent(pricingMatch[1]).toUpperCase();
    const reference = referencePrices[symbol];
    if (!reference) {
      return { error: { status: 404, data: { message: `Symbol ${symbol} was not found` } } };
    }
    const variation = 1 + (Math.random() - 0.5) * 0.002;
    const rawPrice = reference * variation;
    return {
      data: {
        symbol,
        rawPrice: rawPrice.toFixed(6),
        buyPrice: (rawPrice * 1.01).toFixed(6),
        sellPrice: (rawPrice * 0.99).toFixed(6),
        buySpreadBps: "100",
        sellSpreadBps: "100",
      },
    };
  }

  if (method === "POST" && path === "/orders") {
    const request = typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};
    const now = new Date().toISOString();
    const order: Order = {
      id: crypto.randomUUID(),
      side: "BUY",
      symbol: String(request.symbol ?? ""),
      endUserId: String(request.endUserId ?? ""),
      clientId: String(request.clientId ?? ""),
      clientName: String(request.clientId ?? ""),
      type: request.type === "LIMIT" ? "LIMIT" : "MARKET",
      qty: Number(request.qty ?? 0),
      notional: request.notional == null ? null : Number(request.notional),
      limitPrice: request.limitPrice == null ? null : Number(request.limitPrice),
      state: "SUBMITTED",
      clientIdemKey: String(request.clientIdemKey ?? ""),
      alpacaOrderId: null,
      pinnedSpreadBps: 0,
      walletId: String(request.walletId ?? ""),
      createdAt: now,
      updatedAt: now,
      stateTransitions: [{ fromState: null, toState: "SUBMITTED", transitionedAt: now }],
    };
    sessionOrders.unshift(order);
    return { data: order };
  }

  if (method === "POST" && path === "/redemptions") {
    const request = typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};
    const now = new Date().toISOString();
    const order: Order = {
      id: crypto.randomUUID(),
      side: "SELL",
      symbol: String(request.symbol ?? ""),
      endUserId: String(request.endUserId ?? ""),
      clientId: String(request.clientId ?? ""),
      clientName: String(request.clientId ?? ""),
      type: request.type === "LIMIT" ? "LIMIT" : "MARKET",
      qty: Number(request.qty ?? 0),
      notional: null,
      limitPrice: request.limitPrice == null ? null : Number(request.limitPrice),
      state: "SUBMITTED",
      clientIdemKey: String(request.clientIdemKey ?? ""),
      alpacaOrderId: null,
      pinnedSpreadBps: 0,
      walletId: String(request.walletId ?? ""),
      createdAt: now,
      updatedAt: now,
      stateTransitions: [{ fromState: null, toState: "SUBMITTED", transitionedAt: now }],
      lockedQty: Number(request.qty ?? 0),
      burnedQty: 0,
      releasedQty: 0,
    };
    sessionOrders.unshift(order);
    return { data: order };
  }

  const fillMatch = path.match(/^\/(orders|redemptions)\/([^/]+)\/fills$/);
  if (method === "GET" && fillMatch) {
    const kind = fillMatch[1] as CollectionKind;
    const id = fillMatch[2];
    if (!findOrder(kind, id)) return notFound(kind, id);
    return { data: fills[id] ?? [] };
  }

  const detailMatch = path.match(/^\/(orders|redemptions)\/([^/]+)$/);
  if (method === "GET" && detailMatch) {
    const kind = detailMatch[1] as CollectionKind;
    const id = detailMatch[2];
    const order = findOrder(kind, id);
    return order ? { data: order } : notFound(kind, id);
  }

  const retryMintMatch = path.match(/^\/orders\/([^/]+)\/retry-mint$/);
  if (method === "POST" && retryMintMatch) {
    const id = retryMintMatch[1];
    return transitionOrder(
      "orders",
      id,
      ["MINT_FAILED"],
      "MINTING",
      `Order ${id} is not in MINT_FAILED`,
    );
  }

  const retryBurnMatch = path.match(/^\/redemptions\/([^/]+)\/retry-burn$/);
  if (method === "POST" && retryBurnMatch) {
    const id = retryBurnMatch[1];
    return transitionOrder(
      "redemptions",
      id,
      ["BURN_FAILED"],
      "FILLED",
      `Redemption ${id} is not in BURN_FAILED`,
    );
  }

  const deleteMatch = path.match(/^\/(orders|redemptions)\/([^/]+)$/);
  if (method === "DELETE" && deleteMatch) {
    const kind = deleteMatch[1] as CollectionKind;
    const id = deleteMatch[2];
    return transitionOrder(
      kind,
      id,
      ["SUBMITTED", "VALIDATED", "QUEUED", "OPEN_EXECUTING", "PARTIALLY_FILLED", "LOCKING", "LOCKED", "SELLING"],
      "CANCELLED",
      `${entityName(kind)} ${id} cannot be cancelled from its current state`,
    );
  }

  const cancelMatch = path.match(/^\/orders\/([^/]+)\/cancel$/);
  if (method === "POST" && cancelMatch) {
    const id = cancelMatch[1];
    return transitionOrder(
      "orders",
      id,
      ["QUEUED", "OPEN_EXECUTING", "PARTIALLY_FILLED"],
      "CANCELLED",
      `Order ${id} cannot be cancelled from its current state`,
    );
  }

  if (method === "POST" && path === "/admin/symbols") {
    const request = typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};
    const ticker = String(request.ticker ?? "").toUpperCase().trim();
    const tokenProxyAddr = typeof request.tokenProxyAddr === "string" ? request.tokenProxyAddr.trim() : null;
    if (!ticker) {
      return { error: { status: 400, data: { message: "Ticker is required" } } };
    }
    if (adminSymbols.some((s) => s.ticker === ticker)) {
      return { error: { status: 409, data: { message: `Symbol ${ticker} already exists` } } };
    }
    const now = new Date().toISOString();
    const newSymbol: AdminSymbol = {
      ticker, tokenProxyAddr, status: "ACTIVE",
      tradable: false, fractionable: false, tradableOvernight: false, fractionableOvernight: false,
      alpacaStatus: "", lastSyncedAt: "",
      createdAt: now, updatedAt: now,
    };
    adminSymbols.push(newSymbol);
    return { data: newSymbol };
  }

  const symbolStatusMatch = path.match(/^\/admin\/symbols\/([^/]+)\/status$/);
  if (method === "PATCH" && symbolStatusMatch) {
    const ticker = decodeURIComponent(symbolStatusMatch[1]).toUpperCase();
    const request = typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};
    const status = String(request.status ?? "") as SymbolStatus;
    if (!VALID_SYMBOL_STATUSES.includes(status)) {
      return { error: { status: 400, data: { message: `Invalid status: ${status}` } } };
    }
    const idx = adminSymbols.findIndex((s) => s.ticker === ticker);
    if (idx === -1) {
      return { error: { status: 404, data: { message: `Symbol ${ticker} not found` } } };
    }
    const updated: AdminSymbol = { ...adminSymbols[idx], status, updatedAt: new Date().toISOString() };
    adminSymbols[idx] = updated;
    return { data: updated };
  }

  return null;
}

export async function mockBaseQuery(
  args: string | FetchArgs,
): Promise<MockQueryResult> {
  const { method, path, searchParams, body } = parseRequest(args);
  const staticHandler = staticRoutes[`${method} ${path}`];

  if (staticHandler) return { data: staticHandler() };
  if (method === "GET" && path === "/orders") {
    return { data: listOrders("orders", searchParams) };
  }
  if (method === "GET" && path === "/redemptions") {
    return { data: listOrders("redemptions", searchParams) };
  }
  if (method === "GET" && path === "/admin/ledger/transactions") {
    return { data: listTransactions(searchParams) };
  }

  if (method === "GET" && path === "/balance") {
    return { data: balanceFixtures };
  }

  if (method === "GET" && path === "/activities") {
    const endUserId = searchParams.get("endUserId");
    const cursor = searchParams.get("cursor");
    const limit = 10;
    const allItems = endUserId ? activityFixtures : [];
    const offset = cursor ? parseInt(cursor, 10) || 0 : 0;
    const page = allItems.slice(offset, offset + limit);
    const nextCursor = offset + limit < allItems.length ? String(offset + limit) : null;
    return { data: { items: page, nextCursor, totalCount: allItems.length } };
  }

  const dynamicResult = handleDynamicRoute(method, path, body);
  if (dynamicResult) return dynamicResult;

  return {
    error: {
      status: 404,
      data: { message: `No mock handler for ${method} ${path}` },
    },
  };
}
