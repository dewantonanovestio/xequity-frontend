import { describe, expect, it } from 'vitest';

import {
  clearEndUser,
  selectEndUser,
  setAdminMode,
  viewModeSlice,
} from '@/lib/store/viewModeSlice';
import type { EndUser } from '@/lib/types/user';

const user: EndUser = {
  endUserId: 'user-1',
  clientId: 'client-1',
  externalId: 'external-1',
  walletId: 'wallet-1',
  displayName: 'Test User',
  subAccountId: null,
  state: 'ACTIVE',
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

describe('viewModeSlice', () => {
  it('starts in admin mode', () => {
    expect(viewModeSlice.reducer(undefined, { type: 'init' })).toEqual({
      mode: 'admin',
      selectedEndUser: null,
    });
  });

  it('selects and clears an end-user', () => {
    const selected = viewModeSlice.reducer(undefined, selectEndUser(user));
    expect(selected).toEqual({ mode: 'user', selectedEndUser: user });
    expect(viewModeSlice.reducer(selected, clearEndUser())).toEqual({
      mode: 'user',
      selectedEndUser: null,
    });
  });

  it('returns to admin mode and clears user context', () => {
    const selected = viewModeSlice.reducer(undefined, selectEndUser(user));
    expect(viewModeSlice.reducer(selected, setAdminMode())).toEqual({
      mode: 'admin',
      selectedEndUser: null,
    });
  });
});
