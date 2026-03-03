import type { ContactBookItem } from '@/shared/types/contact-book';

import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';

import type { AppState } from '..';

interface ContactBookState {
  contactsByAddr: Record<string, ContactBookItem>;
}

export const contactBook = createSlice({
  name: 'contactBookEVM',

  initialState: {
    contactsByAddr: {},
    aliasNames: {}
  } as ContactBookState,

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

const { actions: contactBookActions, reducer: contactBookReducer } = contactBook;
export default contactBookReducer;
export const selectContactBookState = (s: AppState) => s.contactBook;
export const selectContactsByAddr = createSelector([selectContactBookState], (s) => s.contactsByAddr);

// export function allAddrs() {
//   return useAppSelector((s) => Object.values(s.contactBook.contactsByAddr));
// }
// export function allAliasAddrs() {
//   return useAppSelector((s) => Object.values(s.contactBook.contactsByAddr).filter((x) => !!x.isAlias));
// }
// export function allContacts() {
//   return useAppSelector((s) => {
//     const list = Object.values(s.contactBook.contactsByAddr);
//     return list.filter((item): item is ContactBookItem => !!item?.isContact) || [];
//   });
// }

export const getContactBookAsync = createAsyncThunk('contactBook/getContactBookAsync', async (_, thunkApi) => {
  const state = thunkApi.getState() as AppState;
  const dispatch = thunkApi.dispatch;
  const contactsByAddr: Record<string, ContactBookItem> = await state.app.wallet.walletEVM.getContactsByMap<
    Record<string, ContactBookItem>
  >();
  Object.values(contactsByAddr).forEach((item) => {
    if (item) {
      item.address = item.address.toLowerCase();
    }
  });
  dispatch(contactBookActions.setField({ contactsByAddr }));
  return contactsByAddr;
});
