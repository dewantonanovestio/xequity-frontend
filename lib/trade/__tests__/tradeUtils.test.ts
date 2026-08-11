import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildPlaceOrderRequest,
  generateIdemKey,
  validateTradeForm,
} from '@/lib/trade/tradeUtils';
import type { EndUser } from '@/lib/types/user';

const user: EndUser = {
  endUserId: 'user-1', clientId: 'client-1', externalId: 'external-1',
  walletId: 'wallet-1', displayName: 'User One',
};

describe('tradeUtils', () => {
  beforeEach(() => vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001'));

  it('generates an idempotency key at submission time', () => {
    expect(generateIdemKey()).toBe('00000000-0000-4000-8000-000000000001');
  });

  it('builds a market quantity request using user context', () => {
    expect(buildPlaceOrderRequest({ symbol: 'AAPL', side: 'BUY', type: 'MARKET', qty: '10', tif: 'DAY' }, user)).toEqual({
      symbol: 'AAPL', side: 'BUY', type: 'MARKET', qty: '10', tif: 'DAY',
      clientId: 'client-1', endUserId: 'user-1', walletId: 'wallet-1',
      clientIdemKey: '00000000-0000-4000-8000-000000000001',
    });
  });

  it('rejects invalid amount combinations and limit orders without a price', () => {
    expect(validateTradeForm({ symbol: '', side: 'BUY', type: 'MARKET', tif: 'DAY' })).toBe('Select a symbol.');
    expect(validateTradeForm({ symbol: 'AAPL', side: 'BUY', type: 'MARKET', qty: '1', notional: '10', tif: 'DAY' })).toBe('Enter either quantity or notional, not both.');
    expect(validateTradeForm({ symbol: 'AAPL', side: 'BUY', type: 'MARKET', tif: 'DAY' })).toBe('Enter a quantity or notional amount.');
    expect(validateTradeForm({ symbol: 'AAPL', side: 'BUY', type: 'LIMIT', qty: '1', tif: 'DAY' })).toBe('Enter a valid limit price.');
  });
});
