export interface Client {
  id: string;
  legalName: string;
  buySpreadBps: number;
  sellSpreadBps: number;
  depositAddress: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardClientRequest {
  legalName: string;
  buySpreadBps: number;
  sellSpreadBps: number;
  depositAddress: string;
}
