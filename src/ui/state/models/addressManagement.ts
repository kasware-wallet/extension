import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { AppState } from '..';
import { getAllAccountsToDisplay } from './accountToDisplay';
import type { Account } from '@/shared/types';
import type { IHighlightedAddress } from '@/shared/types/preference';

type IState = {
  highlightedAddresses: IHighlightedAddress[];
};

export const addressManagement = createSlice({
  name: 'addressManagement',
  initialState: {
    highlightedAddresses: []
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

export const { actions: addressManagementActions, reducer: addressManagementReducer } = addressManagement;

export const getHilightedAddressesAsync = createAsyncThunk(
  'addressManagement/getHilightedAddressesAsync',
  async (_, thunkApi) => {
    const store = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;

    const addrs = await store.app.wallet.walletEVM.getHighlightedAddresses();

    dispatch(
      addressManagementActions.setField({
        highlightedAddresses: addrs
      })
    );
    return null;
  }
);

export const toggleHighlightedAddressAsync = createAsyncThunk(
  'addressManagement/toggleHighlightedAddressAsync',
  async (
    payload: {
      brandName: Account['brandName'];
      address: Account['address'];
      nextPinned?: boolean;
    },
    thunkApi
  ) => {
    const store = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;

    const { highlightedAddresses } = store.addressManagement;
    const {
      nextPinned = !highlightedAddresses.some(
        (highlighted) => highlighted.address === payload.address && highlighted.brandName === payload.brandName
      )
    } = payload;

    const addrs = [...highlightedAddresses];
    const newItem = {
      brandName: payload.brandName,
      address: payload.address
    };
    if (nextPinned) {
      addrs.unshift(newItem);
      await store.app.wallet.walletEVM.updateHighlightedAddresses(addrs);
    } else {
      const toggleIdx = addrs.findIndex(
        (addr) => addr.brandName === payload.brandName && addr.address === payload.address
      );
      if (toggleIdx > -1) {
        addrs.splice(toggleIdx, 1);
      }
      await store.app.wallet.walletEVM.updateHighlightedAddresses(addrs);
    }

    dispatch(
      addressManagementActions.setField({
        highlightedAddresses: addrs
      })
    );
    dispatch(getHilightedAddressesAsync());

    return null;
  }
);
// payload: Parameters<typeof store.app.wallet.removeAddress>
export const removeAddress = createAsyncThunk(
  'addressManagement/removeAddress',
  async (
    payload: [address: string, type: string, brand?: string | undefined, removeEmptyKeyrings?: boolean | undefined],
    thunkApi
  ) => {
    const store = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;
    await store.app.wallet.walletEVM.removeAddress(...payload);
    await dispatch(getAllAccountsToDisplay());
  }
);
