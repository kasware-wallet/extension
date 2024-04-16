/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Account, AddressType, WalletKeyring } from '@/shared/types';
import { createSlice } from '@reduxjs/toolkit';

import { updateVersion } from '../global/actions';

export interface KeyringsState {
  keyrings: WalletKeyring[];
  current: WalletKeyring;
}

const initialKeyring: WalletKeyring = {
  key: '',
  index: 0,
  type: '',
  addressType: AddressType.KASPA_44_111111,
  accounts: [],
  alianName: '',
  hdPath: '',
  // kaspa amount
  balanceKas: 0
};

export const initialState: KeyringsState = {
  keyrings: [],
  current: initialKeyring
};

const slice = createSlice({
  name: 'keyrings',
  initialState,
  reducers: {
    setCurrent(state, action: { payload: WalletKeyring }) {
      const { payload } = action;
      state.current = payload || initialKeyring;
    },
    setKeyrings(state, action: { payload: WalletKeyring[] }) {
      const { payload } = action;
      state.keyrings = payload;
    },
    setKeyringBalanceKas(state, action: { payload: { key: string; balanceKas: number } }) {
      const { payload } = action;
      for (let i = 0; i < state.keyrings.length; i++) {
        if (state.keyrings[i].key === payload.key) {
          state.keyrings[i].balanceKas = payload.balanceKas;
        }
      }
      if (state.current.key === payload.key) {
        state.current.balanceKas = payload.balanceKas;
      }
    },

    reset(state) {
      return initialState;
    },

    updateKeyringName(state, action: { payload: WalletKeyring }) {
      const keyring = action.payload;
      if (state.current.key === keyring.key) {
        state.current.alianName = keyring.alianName;
      }
      state.keyrings.forEach((v) => {
        if (v.key === keyring.key) {
          v.alianName = keyring.alianName;
        }
      });
    },

    updateAccountName(state, action: { payload: Account }) {
      const account = action.payload;

      state.current.accounts.forEach((v) => {
        if (v.key === account.key) {
          v.alianName = account.alianName;
        }
      });

      state.keyrings.forEach((v) => {
        v.accounts.forEach((w) => {
          if (w.key === account.key) {
            w.alianName = account.alianName;
          }
        });
      });
    }
  },
  extraReducers: (builder) => {
    builder.addCase(updateVersion, (state) => {
      // todo
    });
  }
});

export const keyringsActions = slice.actions;
export default slice.reducer;
