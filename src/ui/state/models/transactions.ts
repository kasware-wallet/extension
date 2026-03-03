import { createSlice } from '@reduxjs/toolkit';

import type { AppState, TAppDispatch } from '..';

type IState = {
  pendingTransactionCount: number;
};

export const transactions = createSlice({
  name: 'transactions',
  initialState: {
    pendingTransactionCount: 0
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

export const { actions: transactionsActions, reducer: transactionsReducer } = transactions;
export function getPendingTxCountAsync(address: string, store) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    const count = await store.app.wallet.walletEVM.getPendingCount<number>(address);
    dispatch(transactionsActions.setField({ pendingTransactionCount: count }));
    return count;
  };
}
