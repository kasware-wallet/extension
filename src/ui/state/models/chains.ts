import type { TestnetChain } from '@/shared/types/chain';
import type { ConnectedSite } from '@/shared/types/permission';
import { createSelector, createSlice } from '@reduxjs/toolkit';

import type { AppState } from '..';

type IState = {
  currentConnection: ConnectedSite | null | undefined;
  gnosisPendingCount: number;
  gnosisNetworkIds: string[];
  testnetList: TestnetChain[];
};
const initialState: IState = {
  currentConnection: null,
  gnosisPendingCount: 0,
  gnosisNetworkIds: [] as string[],
  testnetList: []
};

export const chains = createSlice({
  name: 'chains',
  initialState,
  reducers: {
    setField(
      state,
      action: {
        payload: Partial<IState>;
      }
    ) {
      const { payload } = action;
      return { ...state, ...payload };
    }
  }
});

export const { actions: chainsActions, reducer: chainsReducer } = chains;
export const selectEvmChains = (state: AppState) => state.chains;
export const selectTestnetList = createSelector([selectEvmChains], (state) => state.testnetList);
export const selectCurrentConnection = createSelector([selectEvmChains], (state) => state.currentConnection);
export const selectGnosisNetworkIds = createSelector([selectEvmChains], (state) => state.gnosisNetworkIds);
export const selectCurrentConnectionChain = createSelector([selectCurrentConnection], (state) => state?.chain);
