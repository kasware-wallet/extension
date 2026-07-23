// import { KEYRING_CLASS } from '@/constant';
import { createSlice } from '@reduxjs/toolkit';

import type { TAppDispatch } from '..';

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
      Object.assign(state, payload || {});
    }
  }
});

export const { actions: createMnemonicsActions, reducer: createMnemonicsReducer } = createMnemonics;

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
