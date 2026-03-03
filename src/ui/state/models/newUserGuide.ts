import type { Chain } from '@kasware-wallet/common';
import { createSlice } from '@reduxjs/toolkit';
import type { AppState } from '..';

interface State {
  password?: string;
  seedPhrase?: string;
  privateKey?: string;
  gnosis?: {
    address: string;
    chainList: Chain[];
  };
  passphrase?: string;
  clearKeyringId?: number;
}

export const newUserGuide = createSlice({
  name: 'newUserGuide',

  initialState: {
    password: '',
    seedPhrase: '',
    privateKey: '',
    gnosis: undefined,
    passphrase: ''
  } as State,

  reducers: {
    setState(state, action: { payload: Partial<State> }) {
      const { payload } = action;
      return {
        ...state,
        ...payload
      };
    }
  }
});

export const { actions: newUserGuideActions, reducer: newUserGuideReducer } = newUserGuide;
export const selectNewUserGuide = (s: AppState) => s.newUserGuide;
