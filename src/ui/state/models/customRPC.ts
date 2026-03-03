import type { EVM_CHAINS_ENUM } from '@/shared/constant';
import { createSelector, createSlice } from '@reduxjs/toolkit';

import type { AppState, TAppDispatch } from '..';
import type { RPCItem } from '@/shared/types/rpc';

type IState = {
  customRPC: Record<EVM_CHAINS_ENUM, RPCItem>;
};

export const customRPC = createSlice({
  name: 'customRPC',
  initialState: {
    customRPC: {}
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

export const { actions: customRPCActions, reducer: customRPCReducer } = customRPC;
export const selectCustomRPCState = (state: AppState) => state.customRPC;
export const selectCustomRPC = createSelector([selectCustomRPCState], (state) => state.customRPC);
export function getAllRPC() {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    const rpcMap = await store.app.wallet.walletEVM.getAllCustomRPC();
    dispatch(customRPCActions.setField({ customRPC: rpcMap }));
    return rpcMap;
  };
}

export function setCustomRPC(payload: { chain: EVM_CHAINS_ENUM; url: string }) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.setCustomRPC(payload.chain, payload.url);
    return dispatch(getAllRPC());
  };
}

export function setRPCEnable(payload: { chain: EVM_CHAINS_ENUM; enable: boolean }) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.setRPCEnable(payload.chain, payload.enable);
    return dispatch(getAllRPC());
  };
}

export function deleteCustomRPC(chain: EVM_CHAINS_ENUM) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.removeCustomRPC(chain);
    return dispatch(getAllRPC());
  };
}
