import type { Client } from "@/lib/types/client";
import type {
  ClientBalance,
  PaginatedTransactions,
  SystemBalance,
  Transaction,
} from "@/lib/types/ledger";
import type { Fill, Order, OrderState, PaginatedOrders } from "@/lib/types/order";
import type { CashRecon, SupplyRecon } from "@/lib/types/recon";
import type {
  EndUser,
  Holding,
  PnlEntry,
  SymbolMeta,
  SymbolPricing,
} from "@/lib/types/user";
import type { UserBalance } from "@/lib/types/balance";
import type { Activity, PaginatedActivities } from "@/lib/types/activity";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function asItems(value: unknown): unknown[] {
  return isRecord(value) && Array.isArray(value.items) ? value.items : [];
}

function adaptOrder(value: unknown, defaultSide: "BUY" | "SELL"): Order {
  const row = isRecord(value) ? value : {};
  const side = row.side === "SELL" || defaultSide === "SELL" ? "SELL" : "BUY";
  const lockedQty = asNumber(row.lockedQty);
  const qty = row.qty === null ? 0 : asNumber(row.qty, lockedQty);
  const limitPrice = row.limitPrice == null ? null : asNumber(row.limitPrice);
  const state = asString(row.state, "SUBMITTED") as OrderState;
  const clientId = asString(row.clientId);

  return {
    id: asString(row.id),
    side,
    symbol: asString(row.symbol),
    endUserId: asString(row.endUserId),
    clientId,
    clientName: asString(row.clientName, clientId),
    type:
      row.type === "LIMIT" || row.type === "MARKET"
        ? row.type
        : limitPrice === null
          ? "MARKET"
          : "LIMIT",
    qty,
    notional: row.notional == null ? null : asNumber(row.notional),
    limitPrice,
    state,
    clientIdemKey: asString(row.clientIdemKey),
    alpacaOrderId: asNullableString(row.alpacaOrderId),
    pinnedSpreadBps: asNumber(row.pinnedSpreadBps),
    walletId: asString(row.walletId),
    createdAt: asString(row.createdAt),
    updatedAt: asString(row.updatedAt),
    stateTransitions: Array.isArray(row.stateTransitions)
      ? (row.stateTransitions as Order["stateTransitions"])
      : [],
    ...(side === "SELL"
      ? {
          lockedQty,
          burnedQty: asNumber(row.burnedQty),
          releasedQty: asNumber(row.releasedQty),
        }
      : {}),
  };
}

export function adaptOrderPage(value: unknown, side: "BUY" | "SELL"): PaginatedOrders {
  const page = isRecord(value) ? value : {};
  return {
    items: asItems(value).map((row) => adaptOrder(row, side)),
    nextCursor: asNullableString(page.nextCursor),
    totalCount: asNumber(page.totalCount),
  };
}

export function adaptOrderDetail(value: unknown, side: "BUY" | "SELL"): Order {
  return adaptOrder(value, side);
}

export function adaptFills(value: unknown, side: "BUY" | "SELL"): Fill[] {
  if (!Array.isArray(value)) return [];

  return value.map((item) => {
    const row = isRecord(item) ? item : {};
    if (typeof row.fillId === "string") {
      return {
        ...(row as unknown as Fill),
        qty: asNumber(row.qty),
        price: asNumber(row.price),
        cost: asNumber(row.cost),
      };
    }

    const qty = asNumber(row.filledQty);
    const explicitPrice = asNumber(row.fillPrice);
    const proceeds = asNumber(row.netProceeds);
    const price = explicitPrice || (qty ? proceeds / qty : 0);
    const settlementState = asString(
      side === "BUY" ? row.mintState : row.burnState,
    );
    const onChainStatus =
      settlementState === "CONFIRMED" || settlementState === "FAILED"
        ? settlementState
        : settlementState
          ? "PENDING"
          : undefined;

    return {
      fillId: asString(row.alpacaFillId, asString(row.id)),
      qty,
      price,
      cost: side === "BUY" ? qty * price : proceeds,
      filledAt: asString(row.createdAt),
      onChainStatus,
    };
  });
}

export function adaptClients(value: unknown): Client[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = isRecord(item) ? item : {};
    return {
      id: asString(row.id),
      legalName: asString(row.legalName),
      buySpreadBps: asNumber(row.buySpreadBps),
      sellSpreadBps: asNumber(row.sellSpreadBps),
      depositAddress: asNullableString(row.depositAddress),
      createdAt: asString(row.createdAt),
      updatedAt: asString(row.updatedAt),
    };
  });
}

export function adaptClient(value: unknown): Client {
  return adaptClients([value])[0] ?? {
    id: "",
    legalName: "",
    buySpreadBps: 0,
    sellSpreadBps: 0,
    depositAddress: null,
    createdAt: "",
    updatedAt: "",
  };
}

export function adaptBalances(value: unknown): ClientBalance[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = isRecord(item) ? item : {};
    return {
      clientId: asString(row.clientId),
      clientName: asString(row.clientName, asString(row.clientId)),
      available: asNumber(row.available),
      held: asNumber(row.held),
      total: asNumber(row.total),
    };
  });
}

export function adaptSystemBalances(value: unknown): SystemBalance[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = isRecord(item) ? item : {};
    const normalSide = asString(row.normalSide);
    return {
      accountType: asString(row.accountType),
      normalSide: normalSide === "CREDIT" ? "CREDIT" : "DEBIT",
      balance: asNumber(row.balance),
    };
  });
}

function adaptTransaction(value: unknown): Transaction {
  const row = isRecord(value) ? value : {};
  return {
    id: asString(row.id),
    timestamp: asString(row.timestamp),
    clientId: asNullableString(row.clientId),
    accountType: asString(row.accountType),
    sourceType: asString(row.sourceType),
    debit: asNumber(row.debit),
    credit: asNumber(row.credit),
    referenceId: asNullableString(row.referenceId),
    description: asNullableString(row.description),
  };
}

export function adaptTransactionPage(value: unknown): PaginatedTransactions {
  const page = isRecord(value) ? value : {};
  return {
    items: asItems(value).map(adaptTransaction),
    nextCursor: asNullableString(page.nextCursor),
    totalCount: asNumber(page.totalCount),
  };
}

export function adaptCashRecon(value: unknown): CashRecon | null {
  if (!isRecord(value)) return null;

  if ("usdtLedgerTotal" in value) {
    return {
      usdtLedgerTotal: asNumber(value.usdtLedgerTotal),
      usdtWalletBalance: asNumber(value.usdtWalletBalance),
      usdtDelta: asNumber(value.usdtDelta),
      usdFloatAtAlpaca: asNumber(value.usdFloatAtAlpaca),
      projectedFloatRequirement: asNumber(value.projectedFloatRequirement),
      lastRunAt: asString(value.lastRunAt),
    };
  }

  const settlement = isRecord(value.netSettlement) ? value.netSettlement : {};
  return {
    source: "backend",
    usdtLedgerTotal: asNumber(settlement.internalNetObligation),
    usdtWalletBalance: asNumber(settlement.alpacaDeficit),
    usdtDelta: asNumber(settlement.difference),
    usdFloatAtAlpaca: asNumber(settlement.buyFillsTotal),
    projectedFloatRequirement: asNumber(settlement.sellProceedsTotal),
    lastRunAt: asString(value.timestamp),
  };
}

export function adaptSupplyRecon(value: unknown): SupplyRecon[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = isRecord(item) ? item : {};
    return {
      symbol: asString(row.symbol),
      onChainSupply: asNumber(row.onChainSupply),
      alpacaPositionSum: asNumber(row.alpacaPositionSum),
      residual: asNumber(row.residual),
      symbolStatus: asString(row.symbolStatus, "ACTIVE") as SupplyRecon["symbolStatus"],
    };
  });
}

export function adaptEndUsers(value: unknown): EndUser[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = isRecord(item) ? item : {};
    const externalId = asString(row.externalId);
    const state = asString(row.state);
    return {
      endUserId: asString(row.endUserId, asString(row.id)),
      clientId: asString(row.clientId),
      externalId,
      walletId: asString(row.walletId),
      displayName: asString(row.displayName, externalId),
      subAccountId: asNullableString(row.subAccountId),
      state: (state as EndUser["state"]) || "PROVISIONING",
      createdAt: asString(row.createdAt),
      updatedAt: asString(row.updatedAt),
    };
  });
}

export function adaptSymbols(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item : asString(isRecord(item) ? item.symbol : null)))
    .filter(Boolean);
}

export function adaptSymbolMeta(value: unknown): SymbolMeta[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): SymbolMeta | null => {
      // Old format: plain string ticker
      if (typeof item === "string" && item) {
        return { ticker: item, tradable: true, fractionable: true, tradableOvernight: false };
      }
      // New format: SymbolMetaDto object
      if (isRecord(item) && asString(item.ticker)) {
        return {
          ticker: asString(item.ticker),
          tradable: Boolean(item.tradable),
          fractionable: Boolean(item.fractionable),
          tradableOvernight: Boolean(item.tradableOvernight),
        };
      }
      return null;
    })
    .filter((s): s is SymbolMeta => s !== null);
}

export function adaptBalance(value: unknown): UserBalance {
  const rec = isRecord(value) ? value : {};
  return {
    available: asNumber(rec.available),
    held: asNumber(rec.held),
    total: asNumber(rec.total),
  };
}

export function adaptActivityPage(value: unknown): PaginatedActivities {
  const rec = isRecord(value) ? value : {};
  const items = Array.isArray(rec.items) ? rec.items : [];
  return {
    items: items.filter(isRecord).map((item): Activity => ({
      id: asString(item.id),
      type: asString(item.type) === "SELL" ? "SELL" : "BUY",
      symbol: asString(item.symbol),
      qty: asNumber(item.qty),
      amount: asNumber(item.amount),
      state: asString(item.state),
      createdAt: asString(item.createdAt),
    })),
    nextCursor: asNullableString(rec.nextCursor),
  };
}

export function adaptHoldings(value: unknown): Holding[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = isRecord(item) ? item : {};
    return {
      symbol: asString(row.symbol),
      qty: asNumber(row.qty, asNumber(row.shares)),
      avgCost: asNumber(row.avgCost),
    };
  });
}

export function adaptPricing(value: unknown): SymbolPricing {
  const row = isRecord(value) ? value : {};
  return {
    symbol: asString(row.symbol),
    rawPrice: asNumber(row.rawPrice),
    buyPrice: asNumber(row.buyPrice),
    sellPrice: asNumber(row.sellPrice),
    buySpreadBps: asNumber(row.buySpreadBps),
    sellSpreadBps: asNumber(row.sellSpreadBps),
  };
}

export function adaptPnl(value: unknown): PnlEntry[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = isRecord(item) ? item : {};
    const realizedPnl = asNumber(row.realizedPnl);
    const unrealizedPnl = asNumber(row.unrealizedPnl);
    return {
      symbol: asString(row.symbol),
      realizedPnl,
      unrealizedPnl,
      totalPnl: asNumber(row.totalPnl, realizedPnl + unrealizedPnl),
    };
  });
}
