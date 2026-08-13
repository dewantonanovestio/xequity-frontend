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
