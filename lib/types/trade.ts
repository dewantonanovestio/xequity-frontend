import type { OrderType } from '@/lib/types/order';

export type TimeInForce = 'DAY' | 'GTC' | 'IOC' | 'FOK';
export type InputMode = 'qty' | 'notional';
export type TradableSymbol = string;

export interface PlaceOrderRequest {
  readonly symbol: string;
  readonly side: 'BUY';
  readonly type: OrderType;
  readonly qty?: string;
  readonly notional?: string;
  readonly limitPrice?: string;
  readonly collarPrice?: string;
  readonly tif: TimeInForce;
  readonly clientId: string;
  readonly endUserId: string;
  readonly clientIdemKey: string;
  readonly extendedHours?: boolean;
}

export interface PlaceRedemptionRequest {
  readonly symbol: string;
  readonly endUserId: string;
  readonly clientId: string;
  readonly clientIdemKey: string;
  readonly qty: string;
  readonly type?: OrderType;
  readonly tif?: TimeInForce;
  readonly limitPrice?: string;
  readonly extendedHours?: boolean;
}

export interface TradeFormValues {
  readonly symbol: string;
  readonly side: 'BUY' | 'SELL';
  readonly type: OrderType;
  readonly qty?: string;
  readonly notional?: string;
  readonly limitPrice?: string;
  readonly collarPrice?: string;
  readonly tif: TimeInForce;
  readonly extendedHours?: boolean;
}

export interface ReplaceOrderRequest {
  readonly id: string;
  readonly qty?: string;
  readonly limitPrice?: string;
  readonly tif?: TimeInForce;
}
