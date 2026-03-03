import type { ConnectedSite } from '@/shared/types/permission';
import { createSelector, createSlice } from '@reduxjs/toolkit';

import type { AppState, TAppDispatch } from '..';

interface PermissionState {
  websites: ConnectedSite[];
}

export const permission = createSlice({
  name: 'permission',

  initialState: {
    websites: []
  } as PermissionState,

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
export const { actions: permissionActions, reducer: permissionReducer } = permission;

export const selectPermissionState = (state: AppState) => state.permission;
export const selectWebsites = createSelector([selectPermissionState], (state) => state.websites);

export function getWebsites() {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    const sites = await store.app.wallet.walletEVM.getConnectedSites();
    dispatch(
      permissionActions.setField({
        websites: sites
      })
    );
  };
}

export function removeWebsite(origin: string) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.removeConnectedSite(origin);
    await dispatch(getWebsites());
  };
}

export function favoriteWebsite(origin: string) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.favoriteWebsite(origin);
    await dispatch(getWebsites());
  };
}

export function unFavoriteWebsite(origin: string) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.unFavoriteWebsite(origin);
    await dispatch(getWebsites());
  };
}

export function pinWebsite(origin: string) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.topConnectedSite(origin);
    await dispatch(getWebsites());
  };
}

export function unpinWebsite(origin: string) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.unpinConnectedSite(origin);
    await dispatch(getWebsites());
  };
}

export function clearAll() {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.removeAllRecentConnectedSites();
    await dispatch(getWebsites());
  };
}

export function reorderWebsites(websites: ConnectedSite[]) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    dispatch(
      permissionActions.setField({
        websites
      })
    );
    await store.app.wallet.walletEVM.setRecentConnectedSites(websites);
    await dispatch(getWebsites());
  };
}
