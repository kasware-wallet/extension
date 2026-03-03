import type { TransactionGroup } from '@kasware-wallet/action';
import { createSlice } from '@reduxjs/toolkit';

interface TransactionHistoryState {
  transactions: {
    [key: string]: Record<string, TransactionGroup>;
  };
}

export const signTxHistory = createSlice({
  name: 'signTxHistory',

  initialState: {
    transactions: {}
  } as TransactionHistoryState,

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

  // effects: (dispatch) => ({
  //   async getTransactions() {
  //     // TODO
  //   }
  // })
});

export const { actions: signTxHistoryActions, reducer: signTxHistoryReducer } = signTxHistory;
