import type { AbstractPortfolioToken } from '@/shared/types/token';
import produce from 'immer';

import type {
  Account,
  AddressSummary,
  AppSummary, // IKRC20LaunchStatus,
  Inscription,
  InscriptionSummary,
  TxHistoryItem
} from '@/shared/types';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';

import type { AppState, TAppDispatch } from '..';
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
  inscriptionsMap: {
    [key: string]: {
      list: Inscription[];
      expired: boolean;
    };
  };
  appSummary: AppSummary;
  inscriptionSummary: InscriptionSummary;
  addressSummary: AddressSummary;
  // kasPrice: number;
  // krc20LaunchStatus: { testnet: boolean; mainnet: boolean };

  /**
   * @description alias name of CURRENT account
   */
  alianName: string;
  tokens: {
    list: AbstractPortfolioToken[];
    customize: AbstractPortfolioToken[];
    blocked: AbstractPortfolioToken[];
  };
  testnetTokens: {
    list: AbstractPortfolioToken[];
    customize: AbstractPortfolioToken[];
    blocked: AbstractPortfolioToken[];
  };

  loadingMatteredChainBalances: boolean;
}

const initialAccount = {
  type: '',
  pubkey: '',
  pubkeyMap: {},
  address: '',
  evmAddress: '',
  addressMap: {},
  brandName: '',
  alianName: '',
  displayBrandName: '',
  index: 0,
  balance: 0,
  balanceMap: {},
  key: '',
  flag: 0,
  currentAccount: null,
  visibleAccounts: [],
  hiddenAccounts: [],
  keyrings: [],
  balanceAboutCache: {
    totalBalance: null,
    curvePoints: []
  },
  balanceAboutCacheMap: {
    balanceMap: {},
    curvePointsMap: {}
  },
  matteredChainBalances: {},
  testnetMatteredChainBalances: {},
  mnemonicAccounts: [],
  tokens: {
    list: [],
    customize: [],
    blocked: []
  },
  testnetTokens: {
    list: [],
    customize: [],
    blocked: []
  },

  loadingMatteredChainBalances: false
};

export const initialState: AccountsState = {
  accounts: [],
  current: initialAccount,
  loading: false,
  balanceMap: {},
  historyMap: {},
  inscriptionsMap: {},
  appSummary: {
    apps: []
  },
  inscriptionSummary: {
    mintedList: []
  },
  addressSummary: {
    totalSompi: 0,
    kasSompi: 0,
    assetSompi: 0,
    loading: true
  },
  // kasPrice: 0,
  // krc20LaunchStatus: { testnet: true, mainnet: false }
  // evm below
  alianName: '',
  tokens: {
    list: [],
    customize: [],
    blocked: []
  },
  testnetTokens: {
    list: [],
    customize: [],
    blocked: []
  },

  loadingMatteredChainBalances: false
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
          expired?: boolean;
        };
      }
    ) {
      const {
        payload: { address, amount, kas_amount, confirm_kas_amount, pending_kas_amount, outgoing, expired }
      } = action;
      state.balanceMap[address] = state.balanceMap[address] || {
        amount: '0',
        kas_amount: '0',
        confirm_kas_amount: '0',
        pending_kas_amount: '0',
        outgoing: '0',
        expired: expired != undefined ? expired : true
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
          outgoing?: string;
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
    setInscriptions(state, action: { payload: { address: string; list: Inscription[] } }) {
      const {
        payload: { address, list }
      } = action;
      state.inscriptionsMap[address] = state.inscriptionsMap[address] || {
        list: [],
        expired: true
      };
      state.inscriptionsMap[address].list = list;
      state.inscriptionsMap[address].expired = false;
    },
    expireInscriptions(state) {
      const inscriptions = state.inscriptionsMap[state.current.address];
      if (inscriptions) {
        inscriptions.expired = true;
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
    setInscriptionSummary(state, action: { payload: InscriptionSummary }) {
      const { payload } = action;
      state.inscriptionSummary = payload;
    },
    setAppSummary(state, action: { payload: AppSummary }) {
      const { payload } = action;
      state.appSummary = payload;
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
    },
    // evm below
    setField(state, action: { payload: Partial<typeof state> }) {
      const { payload } = action;
      Object.assign(state, payload || {});
    },

    setTestnetTokenList(state, action: { payload: AbstractPortfolioToken[] }) {
      const { payload } = action;
      if (state?.testnetTokens?.list) {
        state.testnetTokens.list = payload;
      }
    },

    setTokenList(state, action: { payload: AbstractPortfolioToken[] }) {
      const { payload } = action;
      if (state?.tokens?.list) {
        state.tokens.list = payload;
      }
    },

    setTestnetCustomizeTokenList(state, action: { payload: AbstractPortfolioToken[] }) {
      const { payload } = action;
      if (state?.testnetTokens?.customize) {
        state.testnetTokens.customize = payload;
      }
    },

    setCustomizeTokenList(state, action: { payload: AbstractPortfolioToken[] }) {
      const { payload } = action;
      if (state?.tokens?.customize) {
        state.tokens.customize = payload;
      }
    },

    setBlockedTokenList(state, action: { payload: AbstractPortfolioToken[] }) {
      const { payload } = action;
      if (state?.tokens?.blocked) {
        state.tokens.blocked = payload;
      }
    },

    setTestnetBlockedTokenList(state, action: { payload: AbstractPortfolioToken[] }) {
      const { payload } = action;
      if (state?.testnetTokens?.blocked) {
        state.testnetTokens.blocked = payload;
      }
    },

    setCurrentAccount(state, action: { payload: { current: typeof state.current } }) {
      const { payload } = action;
      if (state?.current && state.current.address !== payload.current.address) {
        state.current = payload.current;
      }
    }
  },
  extraReducers: (builder) => {
    builder.addCase(updateVersion, (state) => {
      // todo
      if (!state.addressSummary) {
        state.addressSummary = {
          totalSompi: 0,
          kasSompi: 0,
          assetSompi: 0
        };
      }
    });
  }
});

export const accountsActions = slice.actions;
export default slice.reducer;

export const selectAccountsState = (s: AppState) => s.accounts;
export const selectCurrentAccount = createSelector([selectAccountsState], (s) => s.current);
export const selectCurrentEvmAddress = createSelector([selectCurrentAccount], (s) => s.evmAddress);
export const selectCurrentKaspaAddress = createSelector([selectCurrentAccount], (s) => s.address);
export const selectAlianName = createSelector([selectCurrentAccount], (s) => s.alianName);
export const selectAccountInscriptions = createSelector(
  [selectAccountsState, selectCurrentAccount],
  (s, c) => s.inscriptionsMap[c.address] || { list: [], expired: true }
);

export const selectBalanceMap = createSelector([selectAccountsState], (s) => s.balanceMap);

export const selectAccountBalance = createSelector(
  [selectBalanceMap, selectCurrentAccount, (_, address) => address],
  (map, c, address) => {
    if (address) {
      return (
        map[address] || {
          amount: '0',
          expired: false,
          confirm_kas_amount: '0',
          pending_kas_amount: '0',
          outgoing: '0'
        }
      );
    }
    return (
      map[c.address] || {
        amount: '0',
        expired: true,
        confirm_kas_amount: '0',
        pending_kas_amount: '0',
        outgoing: '0'
      }
    );
  }
);

export const selectIsLoadingMateeredChainBalances = createSelector(
  [selectAccountsState],
  (state) => state.loadingMatteredChainBalances
);

export const selectTokens = createSelector([selectAccountsState], (s) => s.tokens);
export const selectTestnetTokens = createSelector([selectAccountsState], (s) => s.testnetTokens);
export const selectAppSummary = createSelector([selectAccountsState], (s) => s.appSummary);
export const selectHistoryMap = createSelector([selectAccountsState], (s) => s.historyMap);
export const selectAccounts = createSelector([selectAccountsState], (s) => s.accounts);

/**
 * filter chains with balance:
 * 1. greater than $1 and has percentage 1%
 * 2. or >= $1000
 */
export function isChainMattered(chainUsdValue: number, totalUsdValue: number) {
  return chainUsdValue >= 1000 || (chainUsdValue > 1 && chainUsdValue / totalUsdValue > 0.01);
}

export const changeAccountAsync = createAsyncThunk(
  'accounts/changeAccountAsync',
  async (account: Account, thunkApi) => {
    const store = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;

    // const { address, type, brandName } = account;
    // const nextVal: Account = { address, type, brandName };
    const nextVal: Account = produce(account, (draft) => draft);

    await store.app.wallet.walletEVM.changeAccount(nextVal);
    dispatch(accountsActions.setCurrentAccount({ current: nextVal }));
    return null;
  }
);
export function getCurrentAccountAsync() {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    const account: Account = await store.app.wallet.walletEVM.getCurrentAccount<Account>();
    if (account) {
      dispatch(accountsActions.setCurrentAccount({ current: account }));
    }
    return account;
  };
}

export function resetTokenList() {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    // clear store tokenList when account changed

    dispatch(accountsActions.setTokenList([]));
    dispatch(accountsActions.setBlockedTokenList([]));
    dispatch(accountsActions.setCustomizeTokenList([]));
    dispatch(accountsActions.setTestnetTokenList([]));
    dispatch(accountsActions.setTestnetBlockedTokenList([]));
    dispatch(accountsActions.setTestnetCustomizeTokenList([]));
  };
}

export function fetchCurrentAccountAliasNameAsync() {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    const currentAccount = store.accounts.current;
    if (!currentAccount?.address) return '';

    const alianName = await store.app.wallet.getAlianName(currentAccount?.pubkey);

    dispatch(
      accountsActions.setField({
        alianName,
        current: { ...currentAccount, alianName }
      })
    );

    return alianName;
  };
}