import { createSelector, createSlice } from '@reduxjs/toolkit';

import type { AppState } from '..';

export interface HistoryState {
  mostRecentOverviewPage: string;
}

export const initialState: HistoryState = {
  mostRecentOverviewPage: '/main'
};

const slice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    updateMostRecentOverviewPage(
      state,
      action: {
        payload: string;
      }
    ) {
      state.mostRecentOverviewPage = action.payload;
    }
  }
});

export const historyActions = slice.actions;
const historyReducer = slice.reducer;
export default historyReducer;

export const selectHistoryState = (state: AppState) => state.history;
export const selectMostRecentOverviewPage = createSelector(
  [selectHistoryState],
  (history) => history.mostRecentOverviewPage
);
