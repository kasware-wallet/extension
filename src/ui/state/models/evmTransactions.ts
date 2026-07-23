import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import type { AppState } from '..';

type IState = {
  pendingTransactionCount: number;
};

export const evmTransactions = createSlice({
  name: 'evmTransactions',
  initialState: <IState>{
    pendingTransactionCount: 0
  },
  reducers: {
    setField(state, action: { payload: Partial<typeof state> }) {
      const { payload } = action;
      Object.assign(state, payload || {});
    }
  }
});

const { actions: evmTransactionsActions, reducer: evmTransactionsReducer } = evmTransactions;

export default evmTransactionsReducer;

export const selectEvmTransactionsState = (state: AppState) => state.evmTransactions;

export const selectPendingTxCount = createSelector(
  selectEvmTransactionsState,
  (state) => state.pendingTransactionCount
);
export const getPendingTxCountAsync = createAsyncThunk(
  'evmTransactions/getPendingTxCountAsync',
  async (address: string, thunkApi) => {
    const state = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;
    const count = await state.app.wallet.walletEVM.getPendingCount<number>(address);
    dispatch(evmTransactionsActions.setField({ pendingTransactionCount: count }));
    return count;
  }
);
