import { AddressType, NetworkType, WalletConfig } from '@/shared/types';
import { createSlice } from '@reduxjs/toolkit';

import { NETWORK_TYPES } from '@/shared/constant';
import { updateVersion } from '../global/actions';

export interface SettingsState {
  locale: string;
  addressType: AddressType;
  networkType: NetworkType;
  rpcLinks:typeof NETWORK_TYPES;
  walletConfig: WalletConfig;
  skippedVersion: string;
}

export const initialState: SettingsState = {
  locale: 'English',
  addressType: AddressType.KASPA_44_111111,
  networkType: NetworkType.Mainnet,
  rpcLinks:NETWORK_TYPES,
  walletConfig: {
    version: '',
    moonPayEnabled: false,
    statusMessage: ''
  },
  skippedVersion: ''
};

const slice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
    reset(state) {
      return initialState;
    },
    updateSettings(
      state,
      action: {
        payload: {
          locale?: string;
          addressType?: AddressType;
          networkType?: NetworkType;
          rpcLinks?:typeof NETWORK_TYPES
          walletConfig?: WalletConfig;
          skippedVersion?: string;
        };
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
      }
    });
  }
});

export const settingsActions = slice.actions;
export default slice.reducer;
