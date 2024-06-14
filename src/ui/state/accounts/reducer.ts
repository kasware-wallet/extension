/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Account, AddressSummary, AppSummary, TxHistoryItem } from '@/shared/types';
import { createSlice } from '@reduxjs/toolkit';

import { updateVersion } from '../global/actions';

export interface AccountsState {
  accounts: Account[];
  current: Account;
  loading: boolean;
  balanceMap: {
    [key: string]: {
      amount: string;
      kas_amount: string;
      confirm_kas_amount: string;
      pending_kas_amount: string;
      outgoing?: string;
      expired: boolean;
    };
  };
  historyMap: {
    [key: string]: {
      list: TxHistoryItem[];
      expired: boolean;
    };
  };
  appSummary: AppSummary;
  addressSummary: AddressSummary;
  blueScore:number;
  kasPrice:number;
}

const initialAccount = {
  type: '',
  address: '',
  brandName: '',
  alianName: '',
  displayBrandName: '',
  index: 0,
  balance: 0,
  pubkey: '',
  key: '',
  flag: 0
};

export const initialState: AccountsState = {
  accounts: [],
  current: initialAccount,
  loading: false,
  balanceMap: {},
  historyMap: {},
  appSummary: {
    apps: []
  },
  addressSummary: {
    totalSompi: 0,
    kasSompi: 0,
    assetSompi: 0,
    loading: true
  },
  blueScore:0,
  kasPrice:0
};

const slice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {
    pendingLogin(state) {
      state.loading = true;
    },
    setCurrent(state, action: { payload: Account }) {
      const { payload } = action;
      state.current = payload || initialAccount;
    },
    setAccounts(state, action: { payload: Account[] }) {
      const { payload } = action;
      state.accounts = payload;
    },
    setBalance(
      state,
      action: {
        payload: {
          address: string;
          amount: string;
          kas_amount: string;
          confirm_kas_amount: string;
          pending_kas_amount: string;
          outgoing?: string;
        };
      }
    ) {
      const {
        payload: { address, amount, kas_amount, confirm_kas_amount, pending_kas_amount, outgoing }
      } = action;
      state.balanceMap[address] = state.balanceMap[address] || {
        amount: '0',
        kas_amount: '0',
        confirm_kas_amount: '0',
        pending_kas_amount: '0',
        outgoing: '0',
        expired: true
      };
      state.balanceMap[address].amount = amount;
      state.balanceMap[address].kas_amount = kas_amount;
      state.balanceMap[address].confirm_kas_amount = confirm_kas_amount;
      state.balanceMap[address].pending_kas_amount = pending_kas_amount;
      state.balanceMap[address].outgoing = outgoing ? outgoing : '0';
      state.balanceMap[address].expired = false;
    },
    setBalances(
      state,
      action: {
        payload: {
          address: string;
          amount: string;
          kas_amount: string;
          confirm_kas_amount: string;
          pending_kas_amount: string;
          outgoing?:string;
        }[];
      }
    ) {
      const { payload } = action;
      for (let i = 0; i < payload.length; i++) {
        const address = payload[i].address;
        const amount = payload[i].amount;
        state.balanceMap[address] = state.balanceMap[address] || {
          amount: '0',
          kas_amount: '0',
          confirm_kas_amount: '0',
          pending_kas_amount: '0',
          outgoing: '0',
          expired: true
        };
        state.balanceMap[address].amount = amount;
        state.balanceMap[address].kas_amount = '0';
        state.balanceMap[address].confirm_kas_amount = '0';
        state.balanceMap[address].pending_kas_amount = '0';
        state.balanceMap[address].outgoing = '0';
        state.balanceMap[address].expired = false;
      }
    },
    setAddressSummary(state, action: { payload: any }) {
      state.addressSummary = action.payload;
    },
    expireBalance(state) {
      const balance = state.balanceMap[state.current.address];
      if (balance) {
        balance.expired = true;
      }
    },
    setHistory(state, action: { payload: { address: string; list: TxHistoryItem[] } }) {
      const {
        payload: { address, list }
      } = action;
      state.historyMap[address] = state.historyMap[address] || {
        list: [],
        expired: true
      };
      state.historyMap[address].list = list;
      state.historyMap[address].expired = false;
    },
    expireHistory(state) {
      const history = state.historyMap[state.current.address];
      if (history) {
        history.expired = true;
      }
    },
    setCurrentAccountName(state, action: { payload: string }) {
      const { payload } = action;
      state.current.alianName = payload;
      const account = state.accounts.find((v) => v.address === state.current.address);
      if (account) {
        account.alianName = payload;
      }
    },
    setCurrentAddressFlag(state, action: { payload: number }) {
      const { payload } = action;
      state.current.flag = payload;
      const account = state.accounts.find((v) => v.address === state.current.address);
      if (account) {
        account.flag = payload;
      }
    },
    setAppSummary(state, action: { payload: AppSummary }) {
      const { payload } = action;
      state.appSummary = payload;
    },
    setBlueScore(state, action: { payload: number }) {
      const { payload } = action;
      state.blueScore = payload;
    },
    setKasPrice(state, action: { payload: number }) {
      const { payload } = action;
      state.kasPrice = payload;
    },
    rejectLogin(state) {
      state.loading = false;
    },
    reset(state) {
      return initialState;
    },
    updateAccountName(
      state,
      action: {
        payload: Account;
      }
    ) {
      const account = action.payload;
      if (state.current.key === account.key) {
        state.current.alianName = account.alianName;
      }
      state.accounts.forEach((v) => {
        if (v.key === account.key) {
          v.alianName = account.alianName;
        }
      });
    }
  },
  extraReducers: (builder) => {
    builder.addCase(updateVersion, (state) => {
      // todo
      if (!state.addressSummary) {
        state.addressSummary = {
          totalSompi: 0,
          kasSompi: 0,
          assetSompi: 0,
        };
      }
    });
  }
});

export const accountActions = slice.actions;
export default slice.reducer;
