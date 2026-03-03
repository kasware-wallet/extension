import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { AppState } from '..';

interface OpenAPIState {
  host: string;
  testnetHost: string;
}

export const openapi = createSlice({
  name: 'openapi',
  initialState: {
    host: '',
    testnetHost: ''
  } as OpenAPIState,

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

export const { actions: openapiActions, reducer: openapiReducer } = openapi;

export const getHost = createAsyncThunk('openapi/getHost', async (_, thunkApi) => {
  const state = thunkApi.getState() as AppState;
  const dispatch = thunkApi.dispatch;
  const host = await state.app.wallet.openapiEVM.getHost();
  dispatch(openapiActions.setField({ host }));
});

export const setHost = createAsyncThunk('openapi/setHost', async (host: string, thunkApi) => {
  const state = thunkApi.getState() as AppState;
  const dispatch = thunkApi.dispatch;
  await state.app.wallet.openapiEVM.setHost(host);
  dispatch(getHost());
});

export const getTestnetHost = createAsyncThunk('openapi/getTestnetHost', async (_, thunkApi) => {
  const state = thunkApi.getState() as AppState;
  const dispatch = thunkApi.dispatch;
  const testnetHost = await state.app.wallet.testnetOpenapiEVM.getHost();
  dispatch(openapiActions.setField({ testnetHost }));
});

export const setTestnetHost = createAsyncThunk('openapi/setTestnetHost', async (host: string, thunkApi) => {
  const state = thunkApi.getState() as AppState;
  const dispatch = thunkApi.dispatch;
  await state.app.wallet.openapiEVM.setHost(host);
  dispatch(getHost());

  await state.app.wallet.openapiEVM.setTestnetHost(host);
  await state.app.wallet.testnetOpenapiEVM.setHost(host);

  dispatch(openapiActions.setField({ testnetHost: host }));

  dispatch(getHost());
});
