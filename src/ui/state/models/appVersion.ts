import { getUpdateContent } from 'changeLogs';

import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';

import log from 'loglevel';
import type { AppState } from '..';

// import { RootModel } from '.';

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

export const appVersionActions = appVersion.actions;
export const appVersionReducer = appVersion.reducer;
export const selectAppVersionState = (state: AppState) => state.appVersion;
export const selectFirstNotice = createSelector([selectAppVersionState], (s) => s.firstNotice);
export const selectUpdateContent = createSelector([selectAppVersionState], (s) => s.updateContent);
export const selectVersion = createSelector([selectAppVersionState], (s) => s.version);

export const checkIfFirstLoginAsync = createAsyncThunk('appVersion/checkIfFirstLoginAsync', async (_, thunkApi) => {
  const state = thunkApi.getState() as AppState;
  const dispatch = thunkApi.dispatch;

  const firstOpen = await state.app.wallet.walletEVM.getIsFirstOpen();
  const updateContent = await getUpdateContent();

  const locale = state.preference?.locale || 'en';
  const version = process.env.release || '0';
  log.debug('version', version);
  const versionMd = `${version.replace(/\./g, '')}.md`;

  const path = locale !== 'en' ? `${locale}/${versionMd}` : versionMd;

  // try {
  //   // https://webpack.js.org/api/module-methods/#magic-comments
  //   const data = await import(
  //     /* webpackInclude: /\.md$/ */
  //     /* webpackMode: "lazy" */
  //     /* webpackPrefetch: true */
  //     /* webpackPreload: true */
  //     `changeLogs/${path}`
  //   );
  //   if (data.default && typeof data.default === 'string') {
  //     updateContent = data.default;
  //   }
  // } catch (error) {
  //   console.error('Changelog loading error', error);
  // }

  dispatch(
    appVersionActions.setField({
      version,
      updateContent,
      ...(firstOpen &&
        updateContent && {
          firstNotice: firstOpen
        })
    })
  );

  return null;
});

export const afterFirstLogin = createAsyncThunk('appVersion/afterFirstLogin', async (_, thunkApi) => {
  const store = thunkApi.getState() as AppState;
  const dispatch = thunkApi.dispatch;

  store.app.wallet.walletEVM.updateIsFirstOpen();
  dispatch(appVersionActions.setField({ firstNotice: false }));

  return null;
});
