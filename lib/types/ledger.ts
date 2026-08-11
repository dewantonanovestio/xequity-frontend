export interface ClientBalance {
  clientId: string;
  clientName: string;
  available: number;
  held: number;
  total: number;
}

export interface SystemBalance {
  accountType: string;
  normalSide: "DEBIT" | "CREDIT";
  balance: number;
}

export type SourceType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "FILL"
  | "REDEMPTION_FILL"
  | "CONVERSION"
  | "DIVIDEND"
  | "SETTLEMENT"
  | "REGULATORY_FEE"
  | "HOLD"
  | "HOLD_RELEASE"
  | "GAS";

// Keep TransactionType as alias for backwards compat with filter utils
export type TransactionType = SourceType;

export interface Transaction {
  id: string;
  timestamp: string;
  clientId: string | null;
  accountType: string;
  sourceType: string;
  debit: number;
  credit: number;
  referenceId: string | null;
  description: string | null;
}

export type SortDirection = "asc" | "desc";

export type TransactionSortField =
  | "timestamp"
  | "clientId"
  | "accountType"
  | "sourceType"
  | "debit"
  | "credit"
  | "referenceId"
  | "description";

export interface TransactionFilters {
  clientId: string;
  type: string;
  fromDate: string;
  toDate: string;
}

export interface TransactionQueryParams {
  clientId?: string;
  type?: SourceType;
  fromDate?: string;
  toDate?: string;
  cursor?: string;
  limit?: number;
  sortBy?: TransactionSortField;
  sortDirection?: SortDirection;
}

export interface PaginatedTransactions {
  items: Transaction[];
  nextCursor: string | null;
  totalCount: number;
}
