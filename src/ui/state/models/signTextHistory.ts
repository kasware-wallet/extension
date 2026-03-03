import type { SignTextHistoryItem } from '@/shared/types/tx';
import { createSlice } from '@reduxjs/toolkit';

interface SignTextHistoryState {
  history: {
    [key: string]: Record<string, SignTextHistoryItem[]>;
  };
}

export const signTxHistory = createSlice({
  name: 'signTxHistory',

  initialState: {
    history: {}
  } as SignTextHistoryState,

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

export const { actions: signTextHistoryActions, reducer: signTextHistoryReducer } = signTxHistory;
