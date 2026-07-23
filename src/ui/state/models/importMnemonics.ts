import { createSlice } from '@reduxjs/toolkit';

import type { Account } from '@/shared/types';
import type { AppState, TAppDispatch } from '..';

export type ISimpleAccount = Required<Pick<Account, 'address' | 'alianName' | 'index'>>;

interface IState {
  isExistedKeyring: boolean;
  finalMnemonics: string;
  stashKeyringId: number | null;
  passphrase: string;

  queriedAccountsByAddress: Record<Exclude<Account['address'], undefined>, Account>;

  confirmingAccounts: ISimpleAccount[];
  // importedAddresses: Set<Exclude<Account['address'], void>>;
  // importedAccounts: Set<Exclude<Pick<Account, 'address' | 'index'>, void>>;
  // selectedAddresses: Set<Exclude<Account['address'], void>>;
  // draftAddressSelection: Set<Exclude<Account['address'], void>>;
  importedAddresses: Account['address'][];
  importedAccounts: Account[];
  selectedAddresses: Account['address'][];
  draftAddressSelection: Account['address'][];
}

const makeInitValues = () => {
  return {
    isExistedKeyring: false,
    finalMnemonics: '',
    passphrase: '',
    stashKeyringId: null,

    queriedAccountsByAddress: {},

    confirmingAccounts: [],
    // importedAddresses: new Set(),
    // importedAccounts: new Set(),
    // selectedAddresses: new Set(),
    // draftAddressSelection: new Set()
    importedAddresses: [],
    importedAccounts: [],
    selectedAddresses: [],
    draftAddressSelection: []
  } as IState;
};

export const importMnemonics = createSlice({
  name: 'importMnemonics',

  initialState: makeInitValues(),

  reducers: {
    setField(state, action: { payload: Partial<typeof state> }) {
      const { payload } = action;
      Object.assign(state, payload || {});
    }
  }
});

export const { actions: importMnemonicsActions, reducer: importMnemonicsReducer } = importMnemonics;

export function switchKeyring(payload: {
  finalMnemonics?: IState['finalMnemonics'];
  passphrase?: IState['passphrase'];
  isExistedKeyring?: IState['isExistedKeyring'];
  stashKeyringId: IState['stashKeyringId'];
}) {
  return async (dispatch: TAppDispatch) => {
    const initValues = makeInitValues();

    if (payload.isExistedKeyring && !payload.finalMnemonics) {
      throw new Error('[imporetMnemonics::switchKeyring] finalMnemonics is required if keyring existed!');
    }

    return dispatch(
      importMnemonicsActions.setField({
        confirmingAccounts: initValues.confirmingAccounts,
        importedAddresses: initValues.importedAddresses,

        draftAddressSelection: initValues.draftAddressSelection,
        queriedAccountsByAddress: initValues.queriedAccountsByAddress,

        finalMnemonics: payload.finalMnemonics || '',
        passphrase: payload.passphrase || '',
        stashKeyringId: payload.stashKeyringId ?? null,
        isExistedKeyring: payload.isExistedKeyring ?? false
      })
    );
  };
}

export function getAccounts(payload: { firstFlag?: boolean; start?: number; end?: number }) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    const { firstFlag = false, start, end } = payload;

    const wallet = store.app.wallet;
    let accounts: Account[];
    if (!store.importMnemonics.isExistedKeyring) {
      const stashKeyringId = store.importMnemonics.stashKeyringId;

      accounts = firstFlag
        ? await wallet.walletEVM.requestKeyring(KEYRING_TYPE.HdKeyring, 'getFirstPage', stashKeyringId ?? null)
        : end
        ? await wallet.walletEVM.requestKeyring(
            KEYRING_TYPE.HdKeyring,
            'getAddresses',
            stashKeyringId ?? null,
            start,
            end
          )
        : await wallet.walletEVM.requestKeyring(KEYRING_TYPE.HdKeyring, 'getNextPage', stashKeyringId ?? null);
    } else {
      const finalMnemonics = store.importMnemonics.finalMnemonics;
      const passphrase = store.importMnemonics.passphrase;
      accounts = firstFlag
        ? await wallet.walletEVM.requestHDKeyringByMnemonics(finalMnemonics, 'getFirstPage', passphrase)
        : end
        ? await wallet.walletEVM.requestHDKeyringByMnemonics(finalMnemonics, 'getAddresses', passphrase, start, end)
        : await wallet.walletEVM.requestHDKeyringByMnemonics(finalMnemonics, 'getNextPage', passphrase);
    }

    dispatch(
      memorizeQuriedAccounts({
        accounts
      })
    );
    return accounts;
  };
}

export function memorizeQuriedAccounts(payload: { accounts: Account[] }) {
  return (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    const queriedAccountsByAddress = store.importMnemonics.queriedAccountsByAddress;

    payload.accounts.forEach((account) => {
      queriedAccountsByAddress[account.address] = account;
    });

    dispatch(
      importMnemonicsActions.setField({
        queriedAccountsByAddress: Object.assign({}, queriedAccountsByAddress)
      })
    );
  };
}

export function setImportingAccountAlianNameByIndex(payload: { index: Account['index']; alianName: string }) {
  return (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    const confirmingAccounts = store.importMnemonics.confirmingAccounts;
    const accountIndex = confirmingAccounts.findIndex((item) => item.index === payload.index);
    const account = confirmingAccounts[accountIndex];

    if (account) {
      account.alianName = payload.alianName;
      dispatch(
        importMnemonicsActions.setField({
          confirmingAccounts: [...confirmingAccounts]
        })
      );
    }
  };
}

export function setSelectedAccounts(addresses: Exclude<Account['address'], void>[]) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    const importedAddresses = store.importMnemonics.importedAddresses;
    const stashKeyringId = store.importMnemonics.stashKeyringId!;
    const isExistedKeyring = store.importMnemonics.isExistedKeyring;
    const queriedAccountsByAddress = store.importMnemonics.queriedAccountsByAddress;

    const selectedAddresses = [...new Set(addresses)];
    const addressList = [...selectedAddresses].sort(
      (a, b) => queriedAccountsByAddress[a].index! - queriedAccountsByAddress[b].index!
    );

    if (isExistedKeyring) {
      const addressesUnImporeted = addressList.filter((addr) => !new Set(importedAddresses).has(addr));
      await store.app.wallet.walletEVM.generateAliasCacheForExistedMnemonic(
        store.importMnemonics.finalMnemonics,
        addressesUnImporeted
      );
    } else {
      await store.app.wallet.walletEVM.generateAliasCacheForFreshMnemonic(
        stashKeyringId,
        addressList.map((addr) => queriedAccountsByAddress[addr].index! - 1)
      );
    }

    const confirmingAccounts = await Promise.all(
      addressList.map(async (addr) => {
        const account = queriedAccountsByAddress[addr];
        let alianName = (await store.app.wallet.walletEVM.getAlianName(addr))!;
        if (!alianName) {
          const draftContactItem = await store.app.wallet.walletEVM.getCacheAlias(account.address);
          alianName = draftContactItem!.name;
        }

        return {
          address: account.address,
          index: account.index!,
          alianName: alianName
        };
      })
    );

    dispatch(
      importMnemonicsActions.setField({
        confirmingAccounts,
        selectedAddresses
      })
    );
  };
}

export function beforeImportMoreAddresses() {
  return (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    const selectedAddresses = store.importMnemonics.selectedAddresses;
    dispatch(
      importMnemonicsActions.setField({
        draftAddressSelection: [...new Set([...selectedAddresses])]
      })
    );
  };
}

export function clearDraftAddresses() {
  return (dispatch: TAppDispatch) => {
    dispatch(
      importMnemonicsActions.setField({
        // draftAddressSelection: new Set()
        draftAddressSelection: []
      })
    );
  };
}
