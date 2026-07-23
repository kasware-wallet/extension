import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';

import type { AppState } from '..';

type IState = {
  firstNotice: boolean;
  updateContent: string;
  version: string;
};

/**
 * @description state about user installtion, app version
 */
export const appVersion = createSlice({
  name: 'appVersion',
  initialState: {
    firstNotice: false,
    updateContent: '',
    version: ''
  } as IState,
  reducers: {
    setField(state, action: { payload: Partial<typeof state> }) {
      const { payload } = action;
      Object.assign(state, payload || {});
    }
  }
});

export const appVersionActions = appVersion.actions;
export const appVersionReducer = appVersion.reducer;
export const selectAppVersionState = (state: AppState) => state.appVersion;
export const selectFirstNotice = createSelector([selectAppVersionState], (s) => s.firstNotice);
export const selectUpdateContent = createSelector([selectAppVersionState], (s) => s.updateContent);
export const selectVersion = createSelector([selectAppVersionState], (s) => s.version);

export const afterFirstLogin = createAsyncThunk('appVersion/afterFirstLogin', async (_, thunkApi) => {
  const store = thunkApi.getState() as AppState;
  const dispatch = thunkApi.dispatch;

  store.app.wallet.walletEVM.updateIsFirstOpen();
  dispatch(appVersionActions.setField({ firstNotice: false }));

  return null;
});
