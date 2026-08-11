export interface Activity {
  readonly id: string;
  readonly type: 'BUY' | 'SELL';
  readonly symbol: string;
  readonly qty: number;
  readonly amount: number;
  readonly state: string;
  readonly createdAt: string;
}

export interface PaginatedActivities {
  items: Activity[];
  nextCursor: string | null;
}
