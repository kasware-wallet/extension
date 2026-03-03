import type { WalletController } from '@/ui/utils';
import { createSlice } from '@reduxjs/toolkit';

import type { TAppDispatch } from '..';
import { bridgeInit } from './bridge';
import { gasAccountInit } from './gasAccount';
import { preferenceInit } from './preference';
import { swapInit } from './swap';
import { accountInit } from '../accounts/reducer';

export const app = createSlice({
  name: 'app',
  initialState: {
    /**
     * @description current wallet.
     *
     * @notice same origin with value returned from `useWallet` hooks,
     * we would trigger `initWallet` before this model applied to React Component,
     * so its type could be annotated as `WalletControllerType`
     */
    wallet: null as any as WalletController
  },
  reducers: {
    /**
     * @description only set wallet once
     */
    initWallet(state, action: { payload: { wallet: WalletController } }) {
      const { payload } = action;
      if (state.wallet) {
        console.warn('[app] store.app.wallet had been initialized so that never re-trigger this effect.');
        return state;
      }
      return {
        ...state,
        wallet: payload.wallet as unknown as WalletController
      };
    }
  }
});

const { reducer: appReducer } = app;
export default appReducer;

export const { initWallet } = app.actions;

export function initBizStore() {
  return async (dispatch: TAppDispatch) => {
    dispatch(accountInit());
    dispatch(preferenceInit());
    dispatch(swapInit());
    // dispatch(whitelistInit());
    dispatch(bridgeInit());
    dispatch(gasAccountInit());
  };
}
