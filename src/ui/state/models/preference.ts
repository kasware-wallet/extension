import type { TokenItem } from '@kasware-wallet/api/dist/types';
import type { AddressSortStore, addedToken } from '@/shared/types/preference';
import type { GasCache } from '@/shared/types/gas';
import { DARK_MODE_TYPE } from 'consts';

import type { EVM_CHAINS_ENUM } from '@/shared/constant';
import i18n from '@/ui/utils/i18n';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';

import type { AppState } from '..';
import { useAppSelector } from '../hooks';

interface PreferenceState {
  externalLinkAck: boolean;
  useLedgerLive: boolean;
  locale: string;
  isDefaultWallet: boolean;
  lastTimeSendToken: Record<string, TokenItem>;
  walletSavedList: [];
  gasCache: GasCache;
  currentVersion: string;
  firstOpen: boolean;
  pinnedChain: string[];
  addedToken: addedToken;
  tokenApprovalChain: Record<string, EVM_CHAINS_ENUM>;
  nftApprovalChain: Record<string, EVM_CHAINS_ENUM>;
  autoLockTime: number;
  hiddenBalance: boolean;
  isShowTestnet: boolean;
  addressSortStore: AddressSortStore;
  themeMode: DARK_MODE_TYPE;
  reserveGasOnSendToken: boolean;
  isHideEcologyNoticeDict: Record<string | number, boolean>;
  sendTxToKaspa: boolean;
}

export const preference = createSlice({
  name: 'preference',

  initialState: {
    externalLinkAck: false,
    useLedgerLive: false,
    locale: 'en',
    isDefaultWallet: true,
    lastTimeSendToken: {},
    walletSavedList: [],
    gasCache: {},
    currentVersion: '0',
    firstOpen: false,
    pinnedChain: [],
    addedToken: {},
    tokenApprovalChain: {},
    nftApprovalChain: {},
    autoLockTime: 0,
    hiddenBalance: false,
    isShowTestnet: false,
    addressSortStore: {} as AddressSortStore,
    themeMode: DARK_MODE_TYPE.dark,
    reserveGasOnSendToken: false,
    isHideEcologyNoticeDict: {},
    sendTxToKaspa: true
  } as PreferenceState,

  reducers: {
    setField(state, action: { payload: Partial<typeof state> }) {
      const { payload } = action;
      return Object.keys(payload || {}).reduce(
        (accu, key) => {
          accu[key] = payload[key];
          return accu;
        },
        { ...state }
      );
    }
  }
});

export const { actions: preferenceActions, reducer: preferenceReducer } = preference;
export const selectPreferenceState = (state: AppState) => state.preference;
export const selectPinnedChainEnum = createSelector([selectPreferenceState], (state) => state.pinnedChain);
export const selectIsShowTestnet = createSelector([selectPreferenceState], (state) => state.isShowTestnet);
export const selectTokenApprovalChain = createSelector([selectPreferenceState], (state) => state.tokenApprovalChain);
export const selectThemeMode = createSelector([selectPreferenceState], (state) => state.themeMode);
export const selectHiddenBalance = createSelector([selectPreferenceState], (state) => state.hiddenBalance);
export const selectAddressSortStore = createSelector([selectPreferenceState], (state) => state.addressSortStore);
export const selectIsReserveGasOnSendToken = createSelector(
  [selectPreferenceState],
  (state) => state.reserveGasOnSendToken
);

// export function isReserveGasOnSendToken() {
//   return useAppSelector((s) => s.preference.reserveGasOnSendToken);
// }

export const preferenceInit = createAsyncThunk('preference/preferenceInit', async (_, thunkApi) => {
  const dispatch = thunkApi.dispatch;
  return dispatch(getPreference());
});
export const getPreference = createAsyncThunk(
  'preference/getPreference',
  async (key: keyof PreferenceState | undefined, thunkApi) => {
    const store = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;

    const value = await store.app.wallet.walletEVM.getPreference(key);
    if (key) {
      dispatch(
        preferenceActions.setField({
          [key]: value
        })
      );

      return value as PreferenceState[typeof key];
    } else {
      dispatch(preferenceActions.setField(value));
    }

    return value as PreferenceState;
  }
);

export const getIsDefaultWallet = createAsyncThunk(
  'preference/getIsDefaultWallet',
  async (key: keyof PreferenceState | undefined, thunkApi) => {
    const store = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;

    const isDefaultWallet = await store.app.wallet.walletEVM.isDefaultWallet();

    dispatch(preferenceActions.setField({ isDefaultWallet }));
    return isDefaultWallet;
  }
);

export const setIsDefaultWallet = createAsyncThunk(
  'preference/setIsDefaultWallet',
  async (isDefault: boolean, thunkApi) => {
    const store = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;

    await store.app.wallet.walletEVM.setIsDefaultWallet(isDefault);
    dispatch(getIsDefaultWallet());
    return null;
  }
);

export const getTokenApprovalChain = createAsyncThunk(
  'preference/getTokenApprovalChain',
  async (address: string, thunkApi) => {
    const store = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;

    address = address.toLowerCase();
    const chain = await store.app.wallet.walletEVM.getTokenApprovalChain(address);

    dispatch(
      preferenceActions.setField({
        tokenApprovalChain: {
          ...store.preference.tokenApprovalChain,
          [address]: chain
        }
      })
    );

    return chain;
  }
);

export const setTokenApprovalChain = createAsyncThunk(
  'preference/setTokenApprovalChain',
  async (
    {
      address,
      chain
    }: {
      address: string;
      chain: EVM_CHAINS_ENUM;
    },
    thunkApi
  ) => {
    const store = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;

    await store.app.wallet.walletEVM.setTokenApprovalChain(address, chain);

    dispatch(getTokenApprovalChain(address));

    return chain;
  }
);

export const setNFTApprovalChain = createAsyncThunk(
  'preference/setNFTApprovalChain',
  async (
    {
      address,
      chain
    }: {
      address: string;
      chain: EVM_CHAINS_ENUM;
    },
    thunkApi
  ) => {
    const store = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;

    await store.app.wallet.walletEVM.setNFTApprovalChain(address, chain);

    dispatch(getPreference('nftApprovalChain'));

    return null;
  }
);

export const addPinnedChain = createAsyncThunk(
  'preference/addPinnedChain',
  async (chain: EVM_CHAINS_ENUM, thunkApi) => {
    const store = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;

    if (store.preference.pinnedChain.includes(chain)) {
      return;
    }
    await store.app.wallet.walletEVM.saveChain(chain);
    dispatch(getPreference('pinnedChain'));

    return null;
  }
);

export const removePinnedChain = createAsyncThunk(
  'preference/removePinnedChain',
  async (chain: EVM_CHAINS_ENUM, thunkApi) => {
    const store = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;

    const list = store.preference.pinnedChain.filter((item) => item !== chain);
    await store.app.wallet.walletEVM.updateChain(list);
    dispatch(getPreference('pinnedChain'));

    return null;
  }
);

export const updatePinnedChainList = createAsyncThunk(
  'preference/updatePinnedChainList',
  async (chains: EVM_CHAINS_ENUM[], thunkApi) => {
    const store = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;

    dispatch(
      preferenceActions.setField({
        pinnedChain: chains
      })
    );
    await store.app.wallet.walletEVM.updateChain(chains);
    dispatch(getPreference('pinnedChain'));

    return null;
  }
);

export const setAutoLockTime = createAsyncThunk('preference/setAutoLockTime', async (time: number, thunkApi) => {
  const store = thunkApi.getState() as AppState;
  const dispatch = thunkApi.dispatch;

  dispatch(
    preferenceActions.setField({
      autoLockTime: time
    })
  );
  await store.app.wallet.walletEVM.setAutoLockTime(time);
  dispatch(getPreference('autoLockTime'));

  return null;
});

export const setIsHideEcologyNoticeDict = createAsyncThunk(
  'preference/setIsHideEcologyNoticeDict',
  async (patch: Record<string | number, boolean>, thunkApi) => {
    const store = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;

    const v = {
      ...store.preference.isHideEcologyNoticeDict,
      ...patch
    };
    dispatch(
      preferenceActions.setField({
        isHideEcologyNoticeDict: v
      })
    );
    await store.app.wallet.walletEVM.setIsHideEcologyNoticeDict(v);
    dispatch(getPreference('isHideEcologyNoticeDict'));

    return null;
  }
);

export const setHiddenBalance = createAsyncThunk('preference/setHiddenBalance', async (hidden: boolean, thunkApi) => {
  const store = thunkApi.getState() as AppState;
  const dispatch = thunkApi.dispatch;

  dispatch(
    preferenceActions.setField({
      hiddenBalance: hidden
    })
  );
  await store.app.wallet.walletEVM.setHiddenBalance(hidden);
  dispatch(getPreference('hiddenBalance'));

  return null;
});

export const setIsShowTestnet = createAsyncThunk('preference/setIsShowTestnet', async (value: boolean, thunkApi) => {
  const store = thunkApi.getState() as AppState;
  const dispatch = thunkApi.dispatch;

  dispatch(
    preferenceActions.setField({
      isShowTestnet: value
    })
  );
  await store.app.wallet.walletEVM.setIsShowTestnet(value);
  dispatch(getPreference('isShowTestnet'));

  return null;
});

export const switchLocale = createAsyncThunk('preference/switchLocale', async (locale: string, thunkApi) => {
  const store = thunkApi.getState() as AppState;
  const dispatch = thunkApi.dispatch;

  dispatch(
    preferenceActions.setField({
      locale
    })
  );
  i18n.changeLanguage(locale);
  await store.app.wallet.walletEVM.setLocale(locale);
  dispatch(getPreference('locale'));

  return null;
});

export const switchThemeMode = createAsyncThunk(
  'preference/switchThemeMode',
  async (themeMode: DARK_MODE_TYPE, thunkApi) => {
    const store = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;

    dispatch(
      preferenceActions.setField({
        themeMode
      })
    );
    await store.app.wallet.walletEVM.setThemeMode(themeMode);
    dispatch(getPreference('themeMode'));

    return null;
  }
);

export const setIsReserveGasOnSendToken = createAsyncThunk(
  'preference/setIsReserveGasOnSendToken',
  async (value: boolean, thunkApi) => {
    const store = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;

    dispatch(
      preferenceActions.setField({
        reserveGasOnSendToken: value
      })
    );
    await store.app.wallet.walletEVM.setReserveGasOnSendToken(value);
    dispatch(getPreference('reserveGasOnSendToken'));

    return null;
  }
);

export const getAddressSortStoreValue = createAsyncThunk(
  'preference/getAddressSortStoreValue',
  async (key: keyof AddressSortStore, thunkApi) => {
    const store = thunkApi.getState() as AppState;
    const value = await store.app.wallet.walletEVM.getAddressSortStoreValue(key);
    return value;
  }
);

export const setAddressSortStoreValue = createAsyncThunk(
  'preference/setAddressSortStoreValue',
  async (
    { key, value }: { key: keyof AddressSortStore; value: AddressSortStore[keyof AddressSortStore] },
    thunkApi
  ) => {
    const store = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;
    await store.app.wallet.walletEVM.setAddressSortStoreValue(key, value);
    return dispatch(getPreference('addressSortStore'));
  }
);

export const setSendTxToKaspa = createAsyncThunk('preference/setSendTxToKaspa', async (v: boolean, thunkApi) => {
  const store = thunkApi.getState() as AppState;
  const dispatch = thunkApi.dispatch;
  await store.app.wallet.setSendTxToKaspa(v);
  dispatch(getSendTxToKaspa());
  return null;
});

export const getSendTxToKaspa = createAsyncThunk('preference/getSendTxToKaspa', async (_, thunkApi) => {
  const store = thunkApi.getState() as AppState;
  const dispatch = thunkApi.dispatch;
  const v = await store.app.wallet.getSendTxToKaspa();
  dispatch(
    preferenceActions.setField({
      sendTxToKaspa: v
    })
  );

  return v;
});
