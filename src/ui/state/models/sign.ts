import type { TokenItem } from '@kasware-wallet/api';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { AppState, TAppDispatch } from '..';

interface SignState {
  tokenDetail: {
    selectToken: TokenItem | null;
    popupVisible: boolean;
  };
}

export const sign = createSlice({
  name: 'sign',

  initialState: {
    tokenDetail: {
      selectToken: null,
      popupVisible: false
    }
  } as SignState,

  reducers: {
    setField(state, action: { payload: Partial<typeof state> }) {
      const { payload } = action;
      Object.assign(state, payload || {});
    },
    setTokenDetail(state, action: { payload: SignState['tokenDetail'] }) {
      const { payload } = action;
      return {
        ...state,
        tokenDetail: payload
      };
    }
  }
});

export const { actions: signActions, reducer: signReducer } = sign;

export const selectSignState = (state: AppState) => state.sign;
export const selectTokenDetail = createSelector([selectSignState], (state) => state.tokenDetail);

export const openTokenDetailPopup = (token: TokenItem) => {
  return (dispatch: TAppDispatch) => {
    return dispatch(
      signActions.setTokenDetail({
        selectToken: {
          ...token,
          amount: undefined
        } as unknown as TokenItem,
        popupVisible: true
      })
    );
  };
};

export const closeTokenDetailPopup = () => {
  return async (dispatch: TAppDispatch) => {
    return dispatch(
      signActions.setTokenDetail({
        selectToken: null,
        popupVisible: false
      })
    );
  };
};
