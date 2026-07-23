import type { GasAccountServiceStore } from '@/evm/background/service/gasAccount';
import { EVM_EVENTS } from '@/shared/constant';
import eventBus from '@/shared/eventBus';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';

import type { AppState } from '..';

// Module-level storage for event handlers to enable cleanup
let _gasAccountLogoutHandler: (() => void) | null = null;
let _gasAccountLoginHandler: (() => void) | null = null;

export const gasAccount = createSlice({
  name: 'gasAccount',

  initialState: {
    sig: undefined,
    accountId: undefined,
    account: undefined
  } as Partial<GasAccountServiceStore>,

  reducers: {
    setField(state, action: { payload: Partial<typeof state> }) {
      const { payload } = action;
      Object.assign(state, payload || {});
    }
  }
});

export const { actions: gasAccountActions, reducer: gasAccountReducer } = gasAccount;
export const selectGasAccountState = (state: AppState) => state.gasAccount;
export const selectSig = createSelector([selectGasAccountState], (state) => state.sig);
export const selectAccountId = createSelector([selectGasAccountState], (state) => state.accountId);
export const selectGasAccount = createSelector([selectGasAccountState], (state) => state.account);

export const gasAccountInit = createAsyncThunk('gasAccount/init', async (_, thunkApi) => {
  const dispatch = thunkApi.dispatch;

  // Cleanup previous listeners to prevent memory leaks
  if (_gasAccountLogoutHandler) {
    eventBus.removeEventListener(EVM_EVENTS.GAS_ACCOUNT.LOG_OUT, _gasAccountLogoutHandler);
    _gasAccountLogoutHandler = null;
  }
  if (_gasAccountLoginHandler) {
    eventBus.removeEventListener(EVM_EVENTS.GAS_ACCOUNT.LOG_IN, _gasAccountLoginHandler);
    _gasAccountLoginHandler = null;
  }

  const logout = () => {
    dispatch(setGasAccountSig({}));
  };

  const login = () => {
    dispatch(gasAccountSyncState());
  };

  // Store handler references for cleanup
  _gasAccountLogoutHandler = logout;
  _gasAccountLoginHandler = login;

  eventBus.addEventListener(EVM_EVENTS.GAS_ACCOUNT.LOG_OUT, logout);
  eventBus.addEventListener(EVM_EVENTS.GAS_ACCOUNT.LOG_IN, login);

  return dispatch(gasAccountSyncState());
});

export const gasAccountSyncState = createAsyncThunk(
  'gasAccount/syncState',
  async (key: keyof GasAccountServiceStore | undefined, thunkApi) => {
    const store = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;
    const data = await store.app.wallet.walletEVM.getGasAccountData(key);

    dispatch(
      gasAccountActions.setField(
        key
          ? {
              [key]: data
            }
          : {
              ...(data as GasAccountServiceStore)
            }
      )
    );

    return null;
  }
);
export const setGasAccountSig = createAsyncThunk(
  'gasAccount/setGasAccountSig',
  async (key: keyof GasAccountServiceStore, thunkApi) => {
    const store = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;

    const data = await store.app.wallet.walletEVM.getGasAccountData(key);

    dispatch(
      gasAccountActions.setField(
        key
          ? {
              [key]: data
            }
          : {
              ...(data as GasAccountServiceStore)
            }
      )
    );

    return null;
  }
);
