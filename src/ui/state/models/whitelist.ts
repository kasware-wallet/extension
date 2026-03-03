import { createSelector, createSlice } from '@reduxjs/toolkit';

import type { AppState, TAppDispatch } from '..';

type IState = {
  enabled: boolean;
  whitelist: string[];
};

export const whitelist = createSlice({
  name: 'whitelist',
  initialState: {
    enabled: false,
    whitelist: []
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

export const { actions: whitelistActions, reducer: whitelistReducer } = whitelist;
export const selectWhitelistState = (state: AppState) => state.whitelist;
export const selectWhitelistEnable = createSelector([selectWhitelistState], (state) => state.enabled);
export const selectWhitelist = createSelector([selectWhitelistState], (state) => state.whitelist);

export function whitelistInit() {
  return async (dispatch: TAppDispatch) => {
    await dispatch(getWhitelist());
    await dispatch(getWhitelistEnabled());
  };
}

export function getWhitelist() {
  return async (dispatch: TAppDispatch, getState) => {
    const state = getState() as AppState;
    const whitelist = await state.app.wallet.walletEVM.getWhitelist();
    return dispatch(whitelistActions.setField({ whitelist }));
  };
}

export function getWhitelistEnabled() {
  return async (dispatch: TAppDispatch, getState) => {
    const state = getState() as AppState;
    const enabled = await state.app.wallet.walletEVM.isWhitelistEnabled();
    return dispatch(whitelistActions.setField({ enabled }));
  };
}
