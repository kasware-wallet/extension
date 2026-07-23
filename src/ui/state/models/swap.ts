import { createSelector, createSlice } from '@reduxjs/toolkit';

import type { AppState, TAppDispatch } from '..';

export const swap = createSlice({
  name: 'swap',

  initialState: {
    slippage: '0.1',
    autoSlippage: true,
    supportedDEXList: [],
    selectedDex: null,
    selectedChain: null,
    gasPriceCache: {},
    unlimitedAllowance: false,
    viewList: {},
    tradeList: {},
    sortIncludeGasFee: false,
    preferMEVGuarded: false,
    $$initialSelectedChain: null,
  }  ,

  reducers: {
    setField(state, action: { payload: Partial<typeof state> }) {
      const { payload } = action;
      Object.assign(state, payload || {});
    }
  }
});

export const { actions: swapActions, reducer: swapReducer } = swap;
export const selectSwapState = (state: AppState) => state.swap;
export const selectSelectedChain = createSelector([selectSwapState], (state) => state.selectedChain);
export const selectSupportedDEXList = createSelector([selectSwapState], (state) => state.supportedDEXList);
export const selectSlippage = createSelector([selectSwapState], (state) => state.slippage);
export const selectInitialSelectedChain = createSelector([selectSwapState], (state) => state.$$initialSelectedChain);
export const selectAutoSlippage = createSelector([selectSwapState], (state) => state.autoSlippage);
export const selectPreferMEVGuarded = createSelector([selectSwapState], (state) => state.preferMEVGuarded);

export function setUnlimitedAllowance(unlimitedAllowance: boolean) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.setUnlimitedAllowance(unlimitedAllowance);

    dispatch(
      swapActions.setField({
        unlimitedAllowance
      })
    );
  };
}

export function getSwapViewList() {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    const viewList = await store.app.wallet.walletEVM.getSwapViewList();
    dispatch(
      swapActions.setField({
        viewList
      })
    );
    return viewList;
  };
}

export function setSwapView(unlimitedAllowance: Parameters<any>) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.setSwapView(unlimitedAllowance[0], unlimitedAllowance[1]);
    dispatch(getSwapViewList());
  };
}

export function getSwapSortIncludeGasFee() {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    const sortIncludeGasFee = await store.app.wallet.walletEVM.getSwapSortIncludeGasFee();
    dispatch(
      swapActions.setField({
        sortIncludeGasFee
      })
    );
  };
}

export function setSwapSortIncludeGasFee(bool: boolean) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.setSwapSortIncludeGasFee(bool);
    dispatch(getSwapSortIncludeGasFee());
  };
}

export function getSwapPreferMEV() {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    const preferMEVGuarded = await store.app.wallet.walletEVM.getSwapPreferMEVGuarded();
    dispatch(
      swapActions.setField({
        preferMEVGuarded
      })
    );
  };
}

export function setSwapPreferMEV(bool: boolean) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.setSwapPreferMEVGuarded(bool);
    dispatch(getSwapPreferMEV());
  };
}

export function setAutoSlippage(autoSlippage: boolean) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.setAutoSlippage(autoSlippage);
    dispatch(swapActions.setField({ autoSlippage }));
  };
}

export function setSlippage(slippage: string) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.setSlippage(slippage);
    dispatch(swapActions.setField({ slippage }));
  };
}
