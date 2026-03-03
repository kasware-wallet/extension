import type { TotalBalanceResponse } from '@kasware-wallet/api/dist/types';
import produce from 'immer';
import type { AbstractPortfolioToken } from '@/shared/types/token';

import type { DisplayedKeyring } from '@/evm/background/service/keyring';
import type { CurvePointCollection } from '@/evm/background/service/preference';
import { KEYRING_CLASS } from '@/constant';
import { coerceFloat, sleep } from '@/evm/ui/utils';
import { requestOpenApiMultipleNets } from '@/evm/ui/utils/openapi';
import type { DisplayChainWithWhiteLogo } from '@/utils/chain';
import { isTestnet as checkIsTestnet, findChain, findChainByEnum, formatChainToDisplay } from '@/utils/chain';
import type { Chain } from '@kasware-wallet/common';
import type { EVM_CHAINS_ENUM } from '@/shared/constant';
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
import { selectIsShowTestnet, selectPinnedChainEnum } from '../models/preference';

type MatteredChainBalancesResult = {
  mainnet: TotalBalanceResponse | null;
  testnet: TotalBalanceResponse | null;
};
const symLoaderMatteredBalance = Symbol('uiHelperMateeredChainBalancesPromise');

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
  blueScore: number;
  // kasPrice: number;
  // krc20LaunchStatus: { testnet: boolean; mainnet: boolean };

  /**
   * @description alias name of CURRENT account
   */
  alianName: string;
  visibleAccounts: DisplayedKeyring[];
  hiddenAccounts: Account[];
  keyrings: DisplayedKeyring[];
  balanceAboutCache: {
    totalBalance: TotalBalanceResponse | null;
    curvePoints: CurvePointCollection;
  };
  balanceAboutCacheMap: {
    balanceMap: Record<string, TotalBalanceResponse>;
    curvePointsMap: Record<string, CurvePointCollection>;
  };
  matteredChainBalances: {
    [P in Chain['id']]?: DisplayChainWithWhiteLogo;
  };
  testnetMatteredChainBalances: {
    [P in Chain['id']]?: DisplayChainWithWhiteLogo;
  };
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

  mnemonicAccounts: DisplayedKeyring[];

  [symLoaderMatteredBalance]: Promise<MatteredChainBalancesResult> | null;
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

  [symLoaderMatteredBalance]: null
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
  blueScore: 0,
  // kasPrice: 0,
  // krc20LaunchStatus: { testnet: true, mainnet: false }
  // evm below
  alianName: '',
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

  [symLoaderMatteredBalance]: null
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
    // setKRC20LaunchStatus(state, action: { payload: IKRC20LaunchStatus }) {
    //   const { payload } = action;
    //   state.krc20LaunchStatus = payload;
    // },
    setBlueScore(state, action: { payload: number }) {
      const { payload } = action;
      state.blueScore = payload;
    },
    // setKasPrice(state, action: { payload: number }) {
    //   const { payload } = action;
    //   state.kasPrice = payload;
    // },
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
      return Reflect.ownKeys(payload).reduce(
        (accu, key) => {
          accu[key] = payload[key];
          return accu;
        },
        { ...state }
      );
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
export const selectMnemonicAccounts = createSelector([selectAccountsState], (s) => s.mnemonicAccounts);
export const selectIsShowMnemonic = createSelector([selectMnemonicAccounts], (s) => s.length <= 0);
export const selectAlianName = createSelector([selectCurrentAccount], (s) => s.alianName);
export const selectMatteredChainBalances = createSelector([selectAccountsState], (s) => s.matteredChainBalances);
export const selectTestnetMatteredChainBalances = createSelector(
  [selectAccountsState],
  (s) => s.testnetMatteredChainBalances
);
export const selectCachedChainBalances = createSelector(
  [selectMatteredChainBalances, selectTestnetMatteredChainBalances],
  (matteredChainBalances, testnetMatteredChainBalances) => {
    return {
      mainnet: matteredChainBalances,
      testnet: testnetMatteredChainBalances
    };
  }
);

export const selectPinnedAndChainBalances = createSelector(
  [selectPinnedChainEnum, selectMatteredChainBalances, selectIsShowTestnet, (_, netTabKey) => netTabKey],
  (pinnedChain, matteredChainBalances, isShowTestnet, netTabKey) => {
    return {
      pinned: (pinnedChain?.filter((item) => findChain({ enum: item })) || []) as EVM_CHAINS_ENUM[],
      chainBalances: netTabKey === 'testnet' ? {} : matteredChainBalances,
      isShowTestnet
    };
  }
);
export const selectPinAndChainBalances = createSelector(
  [
    selectMatteredChainBalances,
    selectTestnetMatteredChainBalances,
    selectPinnedChainEnum,
    selectIsShowTestnet,
    (_, netTabKey) => netTabKey
  ],
  (matteredChainBalances, testnetMatteredChainBalances, pinnedChain, isShowTestnet, netTabKey) => {
    return {
      pinned: (pinnedChain?.filter((item) => findChainByEnum(item)) || []) as EVM_CHAINS_ENUM[],
      chainBalances: netTabKey === 'testnet' ? testnetMatteredChainBalances : matteredChainBalances,
      isShowTestnet: isShowTestnet
    };
  }
);

export const selectAccountInscriptions = createSelector(
  [selectAccountsState, selectCurrentAccount],
  (s, c) => s.inscriptionsMap[c.address] || { list: [], expired: true }
);

export const selectBalanceMap = createSelector([selectAccountsState], (s) => s.balanceMap);
export const selectBalanceAboutCacheMap = createSelector([selectAccountsState], (s) => s.balanceAboutCacheMap);

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
  (state) => !!state[symLoaderMatteredBalance]
);

/**
 * filter chains with balance:
 * 1. greater than $1 and has percentage 1%
 * 2. or >= $1000
 */
export function isChainMattered(chainUsdValue: number, totalUsdValue: number) {
  return chainUsdValue >= 1000 || (chainUsdValue > 1 && chainUsdValue / totalUsdValue > 0.01);
}

// export function isShowMnemonic() {
//   return useAppSelector((s) => s.accounts.mnemonicAccounts.length <= 0);
// }

// export function currentAccountAddr() {
//   return useAppSelector((s) => s.accounts.current?.evmAddress);
// }

// export function currentBalanceAboutMap() {
//   return useAppSelector((s) => s.accounts.balanceAboutCacheMap);
// }

// export function allMatteredChainBalances() {
//   return useAppSelector((s) => {
//     return {
//       ...s.accounts.testnetMatteredChainBalances,
//       ...s.accounts.matteredChainBalances
//     };
//   });
// }

// export function isLoadingMateeredChainBalances() {
//   return useAppSelector((s) => !!s.accounts[symLoaderMatteredBalance]);
// }

export function accountInit() {
  return async (dispatch: TAppDispatch) => {
    const account: Account = (await dispatch(getCurrentAccountAsync())) as Account;
    dispatch(onAccountChanged(account?.address));
    return account;
  };
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
export function onAccountChanged(currentAccountAddress: string | undefined) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;

    try {
      currentAccountAddress = currentAccountAddress || store?.accounts.current?.evmAddress;
      // trigger once when account fetched;
      await dispatch(
        getMatteredChainBalance({
          currentAccountAddress,
          leastLoadingTime: true
        })
      );
    } catch (error) {
      console.debug('error on getMatteredChainBalance');
      console.error(error);
    }
    return null;
  };
}

// export const onAccountChanged = createAsyncThunk(
//   'accounts/onAccountChanged',
//   async (currentAccountAddress: string | undefined, thunkApi) => {
//     const store = thunkApi.getState() as AppState;
//     const dispatch = thunkApi.dispatch;

//     try {
//       currentAccountAddress = currentAccountAddress || store?.accounts.current?.evmAddress;
//       // trigger once when account fetched;
//       await dispatch(
//         getMatteredChainBalance({
//           currentAccountAddress,
//           leastLoadingTime: true
//         })
//       );
//     } catch (error) {
//       console.debug('error on getMatteredChainBalance');
//       console.error(error);
//     }
//     return null;
//   }
// );

// export const getCurrentAccountAsync = createAsyncThunk(
//   'accounts/getCurrentAccountAsync',
//   async (_: string | undefined, thunkApi) => {
//     const store = thunkApi.getState() as AppState;
//     const dispatch = thunkApi.dispatch;
//     const account: Account = await store.app.wallet.walletEVM.getCurrentAccount();
//     if (account) {
//       dispatch(accountsActions.setCurrentAccount({ current: account }));
//     }

//     return account;
//   }
// );

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

export const getPersistedBalanceAboutCacheAsync = createAsyncThunk(
  'accounts/getPersistedBalanceAboutCacheAsync',
  async (_, thunkApi) => {
    const store = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;

    const result = await store.app.wallet.walletEVM.getPersistedBalanceAboutCacheMap();

    if (result) {
      dispatch(
        accountsActions.setField({
          balanceAboutCacheMap: result
            ? {
                balanceMap: result.balanceMap || {},
                curvePointsMap: result.curvePointsMap || {}
              }
            : {
                balanceMap: {},
                curvePointsMap: {}
              }
        })
      );
    }

    return result;
  }
);

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
    currentAccount.alianName = alianName;

    dispatch(
      accountsActions.setField({
        alianName,
        current: { ...currentAccount }
      })
    );

    return alianName;
  };
}

export function getAllClassAccountsAsync() {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    const keyrings: DisplayedKeyring[] = await store.app.wallet.walletEVM.getAllClassAccounts();
    dispatch(accountsActions.setField({ keyrings }));
    return keyrings;
  };
}

export function getAllVisibleAccountsAsync() {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    const visibleAccounts = await store.app.wallet.walletEVM.getAllVisibleAccounts();
    dispatch(accountsActions.setField({ visibleAccounts }));
    return visibleAccounts;
  };
}

// export function getAllHiddenAccountsAsync() {
//   return async (dispatch: TAppDispatch, getState) => {
//     const store = getState() as AppState;
//     const hiddenAccounts: Account[] = await store.app.wallet.walletEVM.getHiddenAddresses();
//     dispatch(accountsActions.setField({ hiddenAccounts }));
//     return hiddenAccounts;
//   };
// }

export function getTypedMnemonicAccountsAsync() {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    const mnemonicAccounts = await store.app.wallet.walletEVM.getTypedAccounts(KEYRING_CLASS.MNEMONIC);
    dispatch(accountsActions.setField({ mnemonicAccounts }));
  };
}

export function addCustomizeToken(token: AbstractPortfolioToken) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.addCustomTestnetToken({
      id: token._tokenId,
      chainId: token.chain,
      symbol: token.symbol,
      decimals: token.decimals
    });
    const isTestnetToken = checkIsTestnet(token.chain);
    const currentList = isTestnetToken ? store.accounts.testnetTokens.customize : store.accounts.tokens.customize;
    const setCustomizeTokenList = isTestnetToken
      ? dispatch(accountsActions.setTestnetCustomizeTokenList)
      : dispatch(accountsActions.setCustomizeTokenList);
    const setTokenList = isTestnetToken
      ? dispatch(accountsActions.setTestnetTokenList)
      : dispatch(accountsActions.setTokenList);
    setCustomizeTokenList([...currentList, token]);
    if (token.amount > 0) {
      const tokenList = isTestnetToken ? store.accounts.testnetTokens.list : store.accounts.tokens.list;
      setTokenList([...tokenList, token]);
    }
  };
}

export function removeCustomizeToken(token: AbstractPortfolioToken) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.removeCustomTestnetToken({
      id: token._tokenId,
      chainId: token.chain
    });
    const isTestnetToken = checkIsTestnet(token.chain);
    const currentList = isTestnetToken ? store.accounts.testnetTokens.customize : store.accounts.tokens.customize;
    const setCustomizeTokenList = isTestnetToken
      ? dispatch(accountsActions.setTestnetCustomizeTokenList)
      : dispatch(accountsActions.setCustomizeTokenList);
    const setTokenList = isTestnetToken
      ? dispatch(accountsActions.setTestnetTokenList)
      : dispatch(accountsActions.setTokenList);
    setCustomizeTokenList(
      currentList.filter((item) => {
        return item.id !== token.id;
      })
    );
    const tokenList = isTestnetToken ? store.accounts.testnetTokens.list : store.accounts.tokens.list;
    setTokenList(tokenList.filter((item) => item.id !== token.id));
  };
}

export function addBlockedToken(token: AbstractPortfolioToken) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.addBlockedToken({
      address: token._tokenId,
      chain: token.chain
    });
    const isTestnetToken = checkIsTestnet(token.chain);
    const currentList = isTestnetToken ? store.accounts.testnetTokens.blocked : store.accounts.tokens.blocked;
    const setBlockedTokenList = isTestnetToken
      ? dispatch(accountsActions.setTestnetBlockedTokenList)
      : dispatch(accountsActions.setBlockedTokenList);
    const setTokenList = isTestnetToken
      ? dispatch(accountsActions.setTestnetTokenList)
      : dispatch(accountsActions.setTokenList);
    setBlockedTokenList([...currentList, token]);
    const tokenList = isTestnetToken ? store.accounts.testnetTokens.list : store.accounts.tokens.list;
    setTokenList(tokenList.filter((item) => item.id !== token.id));

    return token;
  };
}

export function removeBlockedToken(token: AbstractPortfolioToken) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.removeBlockedToken({
      address: token._tokenId,
      chain: token.chain
    });
    const isTestnetToken = checkIsTestnet(token.chain);
    const currentList = isTestnetToken ? store.accounts.testnetTokens.blocked : store.accounts.tokens.blocked;
    const setBlockedTokenList = isTestnetToken
      ? dispatch(accountsActions.setTestnetBlockedTokenList)
      : dispatch(accountsActions.setBlockedTokenList);
    const setTokenList = isTestnetToken
      ? dispatch(accountsActions.setTestnetTokenList)
      : dispatch(accountsActions.setTokenList);
    setBlockedTokenList(
      currentList.filter((item) => {
        return item.id !== token.id;
      })
    );
    if (token.amount > 0) {
      const tokenList = isTestnetToken ? store.accounts.testnetTokens.list : store.accounts.tokens.list;
      setTokenList([...tokenList, token]);
    }

    return token;
  };
}

export function triggerFetchBalanceOnBackground(
  options: {
    forceUpdate?: boolean;
  } | void
) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    const currentAccount = store.accounts.current;

    if (!currentAccount?.address) return;
    const wallet = store.app.wallet;

    const isShowTestnet = store.preference.isShowTestnet;

    await requestOpenApiMultipleNets<TotalBalanceResponse | null, void>(
      (ctx) => {
        return wallet.walletEVM.getInMemoryAddressBalance(currentAccount.address, true /* force */, ctx.isTestnetTask);
      },
      {
        wallet,
        needTestnetResult: isShowTestnet,
        processResults: () => null,
        fallbackValues: {
          mainnet: null,
          testnet: null
        }
      }
    );
  };
}

export function getMatteredChainBalance(
  options: {
    currentAccountAddress?: string;
    leastLoadingTime?: boolean;
  } | void
) {
  return async (
    dispatch: TAppDispatch,
    getState
  ): Promise<{
    matteredChainBalances: AccountsState['matteredChainBalances'];
    testnetMatteredChainBalances: AccountsState['testnetMatteredChainBalances'];
  }> => {
    const store = getState() as AppState;
    const wallet = store.app.wallet;
    const isShowTestnet = store.preference.isShowTestnet;

    const { currentAccountAddress = '', leastLoadingTime } = options || {};
    const currentAccountAddr = currentAccountAddress || store.accounts.current?.address;

    const pendingPromise = store.accounts[symLoaderMatteredBalance];
    let result: MatteredChainBalancesResult = {
      mainnet: null,
      testnet: null
    };
    try {
      const promise =
        pendingPromise ||
        Promise.all([
          leastLoadingTime ? sleep(500) : null,
          requestOpenApiMultipleNets<TotalBalanceResponse | null, MatteredChainBalancesResult>(
            (ctx) => {
              if (ctx.isTestnetTask) {
                return null;
              }

              return wallet.walletEVM.getAddressCacheBalance(currentAccountAddr, ctx.isTestnetTask);
            },
            {
              wallet,
              needTestnetResult: isShowTestnet,
              processResults: ({ mainnet, testnet }) => {
                return {
                  mainnet: mainnet,
                  testnet: testnet
                };
              },
              fallbackValues: {
                mainnet: null,
                testnet: null
              }
            }
          )
        ]).then(([_, r]) => r);

      dispatch(
        accountsActions.setField({
          [symLoaderMatteredBalance]: promise
        })
      );
      result = await promise;
    } catch (error) {
      console.error(error);
    } finally {
      dispatch(
        accountsActions.setField({
          [symLoaderMatteredBalance]: null
        })
      );
    }

    const mainnetTotalUsdValue = (result.mainnet?.chain_list || []).reduce(
      (accu, cur) => accu + coerceFloat(cur.usd_value),
      0
    );
    const matteredChainBalances = (result.mainnet?.chain_list || []).reduce((accu, cur) => {
      const curUsdValue = coerceFloat(cur.usd_value);
      if (isChainMattered(curUsdValue, mainnetTotalUsdValue)) {
        accu[cur.id] = formatChainToDisplay(cur);
      }
      return accu;
    }, {} as AccountsState['matteredChainBalances']);

    const testnetTotalUsdValue = (result.testnet?.chain_list || []).reduce(
      (accu, cur) => accu + coerceFloat(cur.usd_value),
      0
    );
    const testnetMatteredChainBalances = (result.testnet?.chain_list || []).reduce((accu, cur) => {
      const curUsdValue = coerceFloat(cur.usd_value);

      if (isChainMattered(curUsdValue, testnetTotalUsdValue)) {
        accu[cur.id] = formatChainToDisplay(cur);
      }
      return accu;
    }, {} as AccountsState['testnetMatteredChainBalances']);

    dispatch(
      accountsActions.setField({
        matteredChainBalances,
        testnetMatteredChainBalances
      })
    );

    return {
      matteredChainBalances,
      testnetMatteredChainBalances
    };
  };
}
