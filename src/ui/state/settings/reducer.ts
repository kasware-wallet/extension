import { KASPA_CHAINS_ENUM, NETWORK_TYPES } from '@/shared/constant';
import { NetworkType } from '@/shared/types';
import type { CURRENCIES } from '@/shared/types';
import type { AddressType, INetworkType, TNetworkId, WalletConfig } from '@/shared/types';
import { createSelector, createSlice } from '@reduxjs/toolkit';

import type { AppState } from '..';
import { updateVersion } from '../global/actions';
import { getKaspaExplorerUrl } from '@/shared/utils/chain';

export interface SettingsState {
  locale: string;
  currency: keyof typeof CURRENCIES;
  // addressTypeMap: Map<KASPA_CHAINS_ENUM, AddressType>;
  networkType: NetworkType;
  networkId: TNetworkId;
  // activeChains: KASPA_CHAINS_ENUM[];
  autoLockMinutes: number;
  rpcLinks: { [key: string]: INetworkType };
  walletConfig: WalletConfig;
  skippedVersion: string;
  // chainLinks: Partial<Record<KASPA_CHAINS_ENUM, { rpc: string; explorer: string }>>;
}

export const initialState: SettingsState = {
  locale: 'English',
  currency: 'USD',
  networkId: 'mainnet',
  // addressTypeMap: new Map([[KASPA_CHAINS_ENUM.KASPA_MAINNET, AddressType.KASPA_44_111111]]),
  networkType: NetworkType.Mainnet, //mode
  // activeChains: [KASPA_CHAINS_ENUM.KASPA_MAINNET],
  autoLockMinutes: 5,
  rpcLinks: NETWORK_TYPES,
  // chainLinks: {
  // [KASPA_CHAINS_ENUM.KASPLEX_TN10]: { rpc: 'https://rpc.kasplextest.xyz', explorer: 'https://explorer.kasplex.org' },
  // [KASPA_CHAINS_ENUM.ETH_MAINNET]: { rpc: 'https://1rpc.io/eth', explorer: 'https://explorer.kaspa.org' }
  // },
  walletConfig: {
    version: '',
    moonPayEnabled: false,
    // swapEnabled: true,
    // swapEnabledV2: true,
    hibitSwapEnabled: true,
    chaingeSwapEnabled: true,
    statusMessage: '',
    forceUpdate: false,
    evmBridgeEnabled: false,
    kaspaL2BridgeEnabled: false,
    krcL2BridgeEnabled: false,
    shouldPopVersion: false
  },
  skippedVersion: ''
};

const slice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    reset(_state) {
      return initialState;
    },
    updateSettings(
      state,
      action: {
        payload: Partial<SettingsState>;
      }
    ) {
      const { payload } = action;
      state = Object.assign({}, state, payload);
      return state;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(updateVersion, (state) => {
      // todo
      if (!state.networkType) {
        state.networkType = NetworkType.Mainnet;
        state.networkId = 'mainnet';
      }
      if (!state.autoLockMinutes || state.autoLockMinutes < 0) {
        state.autoLockMinutes = 5;
      }
      if (!state.rpcLinks || Array.isArray(state.rpcLinks)) {
        state.rpcLinks = NETWORK_TYPES;
      }
    });
  }
});

export const settingsActions = slice.actions;
export default slice.reducer;
export const selectSettings = (s: AppState) => s.settings;
export const selectNetworkType = createSelector([selectSettings], (settings) => settings.networkType);
export const selectNetworkId = createSelector([selectSettings], (settings) => settings.networkId);
export const selectKasTick = createSelector([selectNetworkType], (networkType) => {
  if (networkType === NetworkType.Mainnet) {
    return 'KAS';
  } else {
    return 'TKAS';
  }
});
export const selectBlockstreamUrl = createSelector([selectNetworkId], (networkId) => {
  return getKaspaExplorerUrl(networkId);
});
