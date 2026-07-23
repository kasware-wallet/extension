import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';

import type { AppState } from '..';

export const bridge = createSlice({
  name: 'bridge',

  initialState: {
    aggregatorsListInit: false,
    selectedAggregators: [],
    selectedDex: null,
    selectedChain: null,
    unlimitedAllowance: false,
    sortIncludeGasFee: true,
    $$initialSelectedChain: null,
    firstOpen: true,
    selectedKRCL2ToToken: undefined,
    selectedKaspaL2ToToken: undefined,
    selectedKRCL2FromToken: undefined,
    selectedKaspaL2FromToken: undefined
  } ,

  reducers: {
    setField(state, action: { payload: Partial<typeof state> }) {
      const { payload } = action;
      Object.assign(state, payload || {});
    }
  }
});

export const { actions: bridgeActions, reducer: bridgeReducer } = bridge;
export const selectBridgeState = (state: AppState) => state.bridge;
export const selectSelectedAggregators = createSelector([selectBridgeState], (state) => state.selectedAggregators);
export const fetchAggregatorsList = createAsyncThunk('bridge/fetchAggregatorsList', async (_, thunkApi) => {
  const store = thunkApi.getState() as AppState;
  const dispatch = thunkApi.dispatch;

  const aggregatorsList = await store.app.wallet.openapiEVM.getBridgeAggregatorList();
  if (aggregatorsList.length) {
    dispatch(
      bridgeActions.setField({
        aggregatorsListInit: true,
        aggregatorsList
      })
    );
  }

  return null;
});
