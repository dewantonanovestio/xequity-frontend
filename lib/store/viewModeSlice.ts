import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '@/lib/store/store';
import type { EndUser } from '@/lib/types/user';

export interface ViewModeState {
  readonly mode: 'admin' | 'user';
  readonly selectedEndUser: EndUser | null;
}

const initialState: ViewModeState = {
  mode: 'admin',
  selectedEndUser: null,
};

export const viewModeSlice = createSlice({
  name: 'viewMode',
  initialState,
  reducers: {
    setAdminMode: () => initialState,
    selectEndUser: (_state, action: PayloadAction<EndUser>) => ({
      mode: 'user' as const,
      selectedEndUser: action.payload,
    }),
    clearEndUser: (state) => {
      state.selectedEndUser = null;
    },
  },
});

export const { setAdminMode, selectEndUser, clearEndUser } = viewModeSlice.actions;
export const selectViewMode = (state: RootState) => state.viewMode.mode;
export const selectSelectedEndUser = (state: RootState) => state.viewMode.selectedEndUser;
export const selectIsUserMode = (state: RootState) => state.viewMode.mode === 'user';
