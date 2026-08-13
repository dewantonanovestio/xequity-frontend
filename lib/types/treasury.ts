export interface AlpacaDepositRequest {
  amount: number;
}

export interface CreateWireWithdrawalRequest {
  amount: string;
  idempotencyKey: string;
  notes?: string;
}

export interface ConfigEntry {
  id: string;
  group: string;
  key: string;
  value: string;
  status: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WireWithdrawal {
  id: string;
  amount: string;
  state: string;
  alpacaTransferId: string | null;
  bankId: string;
  idempotencyKey: string;
  notes: string | null;
  failureReason: string | null;
  submittedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Client-side deposit/withdrawal types

export interface CreateDepositRequest {
  clientId: string;
  txHash: string;
  amountUsdt: string;
}

export interface Deposit {
  id: string;
  clientId: string;
  txHash: string;
  amountUsdt: string;
  state: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientWallet {
  id: string;
  clientId: string;
  address: string;
  allowlistState: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWithdrawalRequest {
  clientId: string;
  addressId: string;
  amountUsdt: string;
  clientIdemKey: string;
}

export interface Withdrawal {
  id: string;
  clientId: string;
  clientName?: string;
  addressId: string;
  amountUsdt: string;
  clientIdemKey: string;
  txHash: string | null;
  state: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConfirmWithdrawalRequest {
  txHash: string;
}
