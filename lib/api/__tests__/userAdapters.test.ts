import { describe, expect, it } from 'vitest';

import { adaptEndUsers, adaptHoldings, adaptPnl, adaptPricing, adaptSymbols } from '@/lib/api/adapters';

describe('user dashboard adapters', () => {
  it('normalizes user, symbol, holding, pricing, and P&L responses', () => {
    expect(adaptEndUsers([{ id: 'u1', clientId: 'c1', externalId: 'ext', walletId: 'w1' }])[0]).toMatchObject({ endUserId: 'u1', displayName: 'ext' });
    expect(adaptSymbols(['AAPL', { symbol: 'MSFT' }, null])).toEqual(['AAPL', 'MSFT']);
    expect(adaptHoldings([{ symbol: 'AAPL', qty: '2.5', avgCost: '100.25' }])[0]).toEqual({ symbol: 'AAPL', qty: 2.5, avgCost: 100.25 });
    expect(adaptPricing({ symbol: 'AAPL', rawPrice: '110', buyPrice: '111', sellPrice: '109', buySpreadBps: '100', sellSpreadBps: '100' })).toEqual({ symbol: 'AAPL', rawPrice: 110, buyPrice: 111, sellPrice: 109, buySpreadBps: 100, sellSpreadBps: 100 });
    expect(adaptPnl([{ symbol: 'AAPL', realizedPnl: '10', unrealizedPnl: '-2' }])[0]).toEqual({ symbol: 'AAPL', realizedPnl: 10, unrealizedPnl: -2, totalPnl: 8 });
  });

  it('returns safe defaults for malformed responses', () => {
    expect(adaptEndUsers(null)).toEqual([]);
    expect(adaptHoldings(undefined)).toEqual([]);
    expect(adaptPnl({})).toEqual([]);
    expect(adaptPricing(null)).toEqual({ symbol: '', rawPrice: 0, buyPrice: 0, sellPrice: 0, buySpreadBps: 0, sellSpreadBps: 0 });
  });
});
