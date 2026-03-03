import { EVM_CHAINS } from 'consts';

import type { BridgeServiceStore } from '@/evm/background/service/bridge';
import { DEFAULT_BRIDGE_AGGREGATOR, DEFAULT_BRIDGE_SUPPORTED_CHAIN } from '@/constant/bridge';
import { findChainByServerID } from '@/utils/chain';
import type { TokenItem, BridgeAggregator } from '@kasware-wallet/api/dist/types';
import type { EVM_CHAINS_ENUM } from '@/shared/constant';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';

import type { AppState } from '..';
import localforage from 'localforage';

export const bridge = createSlice({
  name: 'bridge',

  initialState: {
    supportedChains: DEFAULT_BRIDGE_SUPPORTED_CHAIN,
    supportedKaspaL2BridgeChains: DEFAULT_BRIDGE_SUPPORTED_CHAIN,
    supportedKRCL2BridgeChains: DEFAULT_BRIDGE_SUPPORTED_CHAIN,
    aggregatorsListInit: false,
    aggregatorsList: DEFAULT_BRIDGE_AGGREGATOR,
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
  } as Partial<BridgeServiceStore> & {
    $$initialSelectedChain: EVM_CHAINS_ENUM | null;
    aggregatorsList: BridgeAggregator[];
    aggregatorsListInit: boolean;
    supportedChains: EVM_CHAINS_ENUM[];
    supportedKaspaL2BridgeChains: EVM_CHAINS_ENUM[];
    supportedKRCL2BridgeChains: EVM_CHAINS_ENUM[];
    selectedKRCL2ToToken: TokenItem | undefined;
    selectedKaspaL2ToToken: TokenItem | undefined;
    selectedKRCL2FromToken: TokenItem | undefined;
    selectedKaspaL2FromToken: TokenItem | undefined;
  },

  reducers: {
    setField(state, action: { payload: Partial<typeof state> }) {
      const { payload } = action;
      return Object.keys(payload).reduce(
        (accu, key) => {
          accu[key] = payload[key];
          return accu;
        },
        { ...state }
      );
    }
  }
});

export const { actions: bridgeActions, reducer: bridgeReducer } = bridge;
export const selectBridgeState = (state: AppState) => state.bridge;
export const selectSupportedChains = createSelector([selectBridgeState], (state) => state.supportedChains);
export const selectSupportedKaspaL2BridgeChains = createSelector(
  [selectBridgeState],
  (state) => state.supportedKaspaL2BridgeChains
);
export const selectSupportedKRCL2BridgeChains = createSelector(
  [selectBridgeState],
  (state) => state.supportedKRCL2BridgeChains
);
export const selectAggregatorsList = createSelector([selectBridgeState], (state) => state.aggregatorsList);
export const selectSelectedAggregators = createSelector([selectBridgeState], (state) => state.selectedAggregators);
export const bridgeInit = createAsyncThunk('bridge/bridgeInit', async (_, thunkApi) => {
  const dispatch = thunkApi.dispatch;
  await dispatch(syncState());

  return null;
});

export const syncState = createAsyncThunk(
  'bridge/syncState',
  async (key: keyof BridgeServiceStore | undefined, thunkApi) => {
    const store = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;

    const data = await store.app.wallet.walletEVM.getBridgeData(key);
    dispatch(fetchAggregatorsList());
    dispatch(fetchSupportedChains());

    dispatch(
      bridgeActions.setField(
        key
          ? {
              [key]: data
            }
          : {
              ...(data as BridgeServiceStore)
            }
      )
    );

    if (!key) {
      dispatch(
        bridgeActions.setField({
          $$initialSelectedChain: (data as BridgeServiceStore).selectedChain || null
        })
      );
    }

    const selectedKRCL2FromToken: TokenItem | null = await localforage.getItem('selectedKRCL2FromToken');
    if (selectedKRCL2FromToken) {
      dispatch(bridgeActions.setField({ selectedKRCL2FromToken: selectedKRCL2FromToken }));
    }
    const selectedKaspaL2FromToken: TokenItem | null = await localforage.getItem('selectedKaspaL2FromToken');
    if (selectedKaspaL2FromToken) {
      dispatch(bridgeActions.setField({ selectedKaspaL2FromToken: selectedKaspaL2FromToken }));
    }
    const selectedKRCL2ToToken: TokenItem | null = await localforage.getItem('selectedKRCL2ToToken');
    if (selectedKRCL2ToToken) {
      dispatch(bridgeActions.setField({ selectedKRCL2ToToken: selectedKRCL2ToToken }));
    }
    const selectedKaspaL2ToToken: TokenItem | null = await localforage.getItem('selectedKaspaL2ToToken');
    if (selectedKaspaL2ToToken) {
      dispatch(bridgeActions.setField({ selectedKaspaL2ToToken: selectedKaspaL2ToToken }));
    }

    return null;
  }
);

export const setSelectedAggregators = createAsyncThunk(
  'bridge/setSelectedAggregators',
  async (selectedAggregators: string[], thunkApi) => {
    const state = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;

    await state.app.wallet.walletEVM.setBridgeAggregators(selectedAggregators);

    dispatch(bridgeActions.setField({ selectedAggregators }));

    return null;
  }
);

export const setSelectedChain = createAsyncThunk(
  'bridge/setSelectedChain',
  async (selectedChain: EVM_CHAINS_ENUM, thunkApi) => {
    const state = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;

    await state.app.wallet.walletEVM.setBridgeSelectedChain(selectedChain);

    dispatch(bridgeActions.setField({ selectedChain }));

    return null;
  }
);

export const setSelectedKRCL2ToToken = createAsyncThunk(
  'bridge/setSelectedKRCL2ToToken',
  async (selectedKRCL2ToToken: TokenItem | undefined, thunkApi) => {
    const dispatch = thunkApi.dispatch;
    localforage.setItem('selectedKRCL2ToToken', selectedKRCL2ToToken);
    dispatch(bridgeActions.setField({ selectedKRCL2ToToken }));
    return null;
  }
);
export const setSelectedKaspaL2ToToken = createAsyncThunk(
  'bridge/setSelectedKaspaL2ToToken',
  async (selectedKaspaL2ToToken: TokenItem | undefined, thunkApi) => {
    const dispatch = thunkApi.dispatch;
    localforage.setItem('selectedKaspaL2ToToken', selectedKaspaL2ToToken);
    dispatch(bridgeActions.setField({ selectedKaspaL2ToToken }));
    return null;
  }
);
export const setSelectedKRCL2FromToken = createAsyncThunk(
  'bridge/setSelectedKRCL2FromToken',
  async (selectedKRCL2FromToken: TokenItem | undefined, thunkApi) => {
    const dispatch = thunkApi.dispatch;
    localforage.setItem('selectedKRCL2FromToken', selectedKRCL2FromToken);
    dispatch(bridgeActions.setField({ selectedKRCL2FromToken }));
    return null;
  }
);
export const setSelectedKaspaL2FromToken = createAsyncThunk(
  'bridge/setSelectedKaspaL2FromToken',
  async (selectedKaspaL2FromToken: TokenItem | undefined, thunkApi) => {
    const dispatch = thunkApi.dispatch;
    localforage.setItem('selectedKaspaL2FromToken', selectedKaspaL2FromToken);
    dispatch(bridgeActions.setField({ selectedKaspaL2FromToken }));
    return null;
  }
);
export const setSelectedFromToken = createAsyncThunk(
  'bridge/setSelectedFromToken',
  async (selectedFromToken: TokenItem | undefined, thunkApi) => {
    const state = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;

    await state.app.wallet.walletEVM.setBridgeSelectedFromToken(selectedFromToken);

    dispatch(bridgeActions.setField({ selectedFromToken }));

    return null;
  }
);

export const setSelectedToToken = createAsyncThunk(
  'bridge/setSelectedToToken',
  async (selectedToToken: TokenItem | undefined, thunkApi) => {
    const state = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;

    await state.app.wallet.walletEVM.setBridgeSelectedToToken(selectedToToken);

    dispatch(bridgeActions.setField({ selectedToToken }));

    return null;
  }
);

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

export const fetchSupportedChains = createAsyncThunk('bridge/fetchSupportedChains', async (_, thunkApi) => {
  const store = thunkApi.getState() as AppState;
  const dispatch = thunkApi.dispatch;

  const chains = await store.app.wallet.openapiEVM.getBridgeSupportChainV2();
  if (chains.length) {
    const mappings = Object.values(EVM_CHAINS).reduce((acc, chain) => {
      acc[chain.id] = chain.enum;
      return acc;
    }, {} as Record<string, EVM_CHAINS_ENUM>);
    const supportedChains = chains?.map((item) => findChainByServerID(item)?.enum || mappings[item] || item);
    dispatch(
      bridgeActions.setField({
        supportedChains
      })
    );
  }
  const kaspaL2BridgeChains = await store.app.wallet.openapiEVM.getKaspaL2BridgeSupportChainV2();
  // const kaspaL2BridgeChains = [167012, 202555, 38836];
  if (kaspaL2BridgeChains.length) {
    const mappings = Object.values(EVM_CHAINS).reduce((acc, chain) => {
      acc[chain.id] = chain.enum;
      return acc;
    }, {} as Record<string, EVM_CHAINS_ENUM>);
    const supportedKaspaL2BridgeChains = kaspaL2BridgeChains?.map(
      (item) => findChainByServerID(item)?.enum || mappings[item] || item
    );
    dispatch(
      bridgeActions.setField({
        supportedKaspaL2BridgeChains
      })
    );
  }
  const krcL2BridgeChains = [202555, 167012]; //await store.app.wallet.openapiEVM.getKRCL2BridgeSupportChainV2();
  if (krcL2BridgeChains.length) {
    const mappings = Object.values(EVM_CHAINS).reduce((acc, chain) => {
      acc[chain.id] = chain.enum;
      return acc;
    }, {} as Record<string, EVM_CHAINS_ENUM>);
    const supportedKRCL2BridgeChains = krcL2BridgeChains?.map(
      (item) => findChainByServerID(item)?.enum || mappings[item] || item
    );
    dispatch(
      bridgeActions.setField({
        supportedKRCL2BridgeChains
      })
    );
  }
  return null;
});
