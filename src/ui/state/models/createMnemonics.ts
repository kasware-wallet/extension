// import { KEYRING_CLASS } from '@/constant';
import { createSlice } from '@reduxjs/toolkit';

import type { AppState, TAppDispatch } from '..';
import { getAllClassAccountsAsync } from '../accounts/reducer';

interface IState {
  mnemonics: string;

  step: 'risk-check' | 'display';
}

export const createMnemonics = createSlice({
  name: 'createMnemonics',

  initialState: {
    mnemonics: '',

    step: 'risk-check'
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

export const { actions: createMnemonicsActions, reducer: createMnemonicsReducer } = createMnemonics;

// /**
//  * @description it would be only "selected" on referenced due to selectors' feature
//  * @returns
//  */
// export function randomMnemonics() {
//   return useAppSelector((s) => s.createMnemonics.mnemonics.split(' ').sort(() => Math.random() - 0.5));
// }

// export function allHDKeyrings() {
//   return useAppSelector((rootState) => rootState.accounts.keyrings.filter((x) => x.type === KEYRING_CLASS.MNEMONIC));
// }

export function getAllHDKeyrings() {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await dispatch(getAllClassAccountsAsync());

    store.accounts.mnemonicAccounts;
  };
}

export function prepareMnemonicsAsync() {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    const mnemonics =
      (await store.app.wallet.walletEVM.getPreMnemonics()) || (await store.app.wallet.walletEVM.generatePreMnemonic());

    dispatch(createMnemonicsActions.setField({ mnemonics }));
  };
}

export function cleanCreateAsync() {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.removePreMnemonics();
  };
}

export function createMnemonicsStepTo(step: IState['step']) {
  return async (dispatch: TAppDispatch) => {
    dispatch(createMnemonicsActions.setField({ step }));
  };
}

export function createMnemonicsReset() {
  return async (dispatch: TAppDispatch) => {
    dispatch(createMnemonicsStepTo('risk-check'));
  };
}
