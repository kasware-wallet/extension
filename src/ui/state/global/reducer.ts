import { createSelector, createSlice } from '@reduxjs/toolkit';

import type { AppState } from '..';
import { updateVersion } from '../global/actions';

export type TabOption = 'home' | 'mint' | 'app' | 'settings';

export interface GlobalState {
  tab: TabOption;
  isUnlocked: boolean;
  isReady: boolean;
  isBooted: boolean;
  rpcStatus: boolean;
  // rpcStatusMap: BooleanByChain;
}

export const initialState: GlobalState = {
  tab: 'home',
  isUnlocked: false,
  isReady: false,
  isBooted: false,
  rpcStatus: false
  // rpcStatusMap: { [KASPA_CHAINS_ENUM.KASPA_MAINNET]: false, [KASPA_CHAINS_ENUM.KASPLEX_TN10]: false }
};

const slice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    reset() {
      return initialState;
    },
    update(
      state,
      action: {
        payload: Partial<GlobalState>;
      }
    ) {
      const { payload } = action;
      state = Object.assign({}, state, payload);
      return state;
    },
    updateRpcStatus(
      state,
      action: {
        payload: {
          rpcStatus?: boolean;
        };
      }
    ) {
      if (action.payload.rpcStatus !== undefined) {
        state.rpcStatus = action.payload.rpcStatus;
      }
    }
  },
  extraReducers: (builder) => {
    builder.addCase(updateVersion, (state) => {
      // todo
    });
  }
});

export const globalActions = slice.actions;
export default slice.reducer;

export const selectGlobalState = (state: AppState) => state.global;
export const selectTab = createSelector([selectGlobalState], (s) => s.tab);
export const selectIsUnlocked = createSelector([selectGlobalState], (s) => s.isUnlocked);
export const selectIsReady = createSelector([selectGlobalState], (s) => s.isReady);
export const selectIsBooted = createSelector([selectGlobalState], (s) => s.isBooted);
export const selectRpcStatus = createSelector([selectGlobalState], (s) => s.rpcStatus);
