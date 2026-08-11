import type { EndUser } from '@/lib/types/user';
import type { PlaceOrderRequest, PlaceRedemptionRequest, TradeFormValues } from '@/lib/types/trade';

export function generateIdemKey(): string {
  return crypto.randomUUID();
}

export function validateTradeForm(values: TradeFormValues): string | null {
  if (!values.symbol) return 'Select a symbol.';
  const hasQty = Boolean(values.qty?.trim());
  const hasNotional = Boolean(values.notional?.trim());
  if (!hasQty && !hasNotional) return 'Enter a quantity or notional amount.';
  if (hasQty && hasNotional) return 'Enter either quantity or notional, not both.';
  const amount = Number(hasQty ? values.qty : values.notional);
  if (!Number.isFinite(amount) || amount <= 0) return 'Order amount must be greater than zero.';
  if (values.type === 'LIMIT') {
    const price = Number(values.limitPrice);
    if (!Number.isFinite(price) || price <= 0) return 'Enter a valid limit price.';
  }
  if (values.type === 'LIMIT' && values.collarPrice && Number(values.collarPrice) <= 0) {
    return 'Collar price must be greater than zero.';
  }
  return null;
}

export function buildPlaceOrderRequest(
  values: TradeFormValues,
  user: EndUser,
): PlaceOrderRequest {
  const error = validateTradeForm(values);
  if (error) throw new Error(error);

  return {
    symbol: values.symbol,
    side: 'BUY',
    type: values.type,
    ...(values.qty ? { qty: values.qty } : {}),
    ...(values.notional ? { notional: values.notional } : {}),
    ...(values.type === 'LIMIT' && values.limitPrice
      ? { limitPrice: values.limitPrice }
      : {}),
    ...(values.type === 'LIMIT' && values.collarPrice
      ? { collarPrice: values.collarPrice }
      : {}),
    tif: values.tif,
    clientId: user.clientId,
    endUserId: user.endUserId,
    clientIdemKey: generateIdemKey(),
    ...(values.extendedHours ? { extendedHours: true } : {}),
  };
}

export function buildPlaceRedemptionRequest(
  values: TradeFormValues,
  user: EndUser,
): PlaceRedemptionRequest {
  if (!values.symbol) throw new Error('Select a symbol.');
  if (!values.qty?.trim()) throw new Error('Enter a quantity to sell.');
  const qty = Number(values.qty);
  if (!Number.isFinite(qty) || qty <= 0) throw new Error('Quantity must be greater than zero.');

  return {
    symbol: values.symbol,
    endUserId: user.endUserId,
    clientId: user.clientId,
    clientIdemKey: generateIdemKey(),
    qty: values.qty,
    type: values.type,
    tif: values.tif,
    ...(values.type === 'LIMIT' && values.limitPrice ? { limitPrice: values.limitPrice } : {}),
    ...(values.extendedHours ? { extendedHours: true } : {}),
  };
}
