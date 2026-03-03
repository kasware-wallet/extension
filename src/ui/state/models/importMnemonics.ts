import { KEYRING_TYPE } from '@/constant';
import { createSlice } from '@reduxjs/toolkit';

import type { AppState, TAppDispatch } from '..';
import type { Account } from '@/shared/types';

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

export const { actions: importMnemonicsActions, reducer: importMnemonicsReducer } = importMnemonics;

// export function accountsToImport() {
//   return useAppSelector(
//     (s) =>
//       s.importMnemonics.confirmingAccounts.filter(
//         (account) => !new Set(s.importMnemonics.importedAddresses).has(account.address)
//       ) as Account[]
//   );
// }
// export function countDraftSelected() {
//   return useAppSelector(
//     (s) =>
//       [...s.importMnemonics.draftAddressSelection].filter(
//         (addr) => !new Set(s.importMnemonics.importedAddresses).has(addr)
//       ).length
//   );
// }

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

export function getImportedAccountsAsync() {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    const importedAccounts = !store.importMnemonics.isExistedKeyring
      ? await store.app.wallet.walletEVM.requestKeyring<Account['address'][]>(
          KEYRING_TYPE.HdKeyring,
          'getAccounts',
          store.importMnemonics.stashKeyringId ?? null
        )
      : await store.app.wallet.walletEVM.requestHDKeyringByMnemonics<Account['address'][]>(
          store.importMnemonics.finalMnemonics,
          'getAccounts',
          store.importMnemonics.passphrase
        );

    dispatch(
      importMnemonicsActions.setField({
        importedAddresses: [...new Set(importedAccounts.map((address) => address.toLowerCase()))]
      })
    );
  };
}

export function getImportedAccounts(payload = {}) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    const { isExistedKeyring, stashKeyringId, finalMnemonics } = store.importMnemonics;
    const wallet = store.app.wallet;
    let addresses: string[];

    if (!isExistedKeyring) {
      addresses = await wallet.walletEVM.requestKeyring(KEYRING_TYPE.HdKeyring, 'getAccounts', stashKeyringId ?? null);
    } else {
      addresses = await wallet.walletEVM.requestHDKeyringByMnemonics(
        finalMnemonics,
        'getAccounts',
        store.importMnemonics.passphrase
      );
    }

    const accounts = await Promise.all(
      addresses.map(async (address) => {
        let index = 0;

        if (!isExistedKeyring) {
          index = (
            await wallet.walletEVM.requestKeyring(
              KEYRING_TYPE.HdKeyring,
              'getInfoByAddress',
              stashKeyringId ?? null,
              address
            )
          ).index;
        } else {
          index = (
            await wallet.walletEVM.requestHDKeyringByMnemonics(
              finalMnemonics,
              'getInfoByAddress',
              store.importMnemonics.passphrase,
              address
            )
          ).index;
        }
        return {
          address,
          index: index + 1
        };
      })
    );

    return accounts;
  };
}

export function cleanUpImportedInfoAsync() {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    if (!store.importMnemonics.isExistedKeyring) {
      store.app.wallet.walletEVM.requestKeyring(
        KEYRING_TYPE.HdKeyring,
        'cleanUp',
        store.importMnemonics.stashKeyringId ?? null
      );
    } else {
      store.app.wallet.walletEVM.requestHDKeyringByMnemonics(
        store.importMnemonics.finalMnemonics,
        'cleanUp',
        store.importMnemonics.passphrase
      );
    }
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

export function confirmAllImportingAccountsAsync() {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    const stashKeyringId = store.importMnemonics.stashKeyringId;
    const confirmingAccounts = store.importMnemonics.confirmingAccounts;
    const importedAddresses = store.importMnemonics.importedAddresses;
    const accountsToImport: ISimpleAccount[] = confirmingAccounts.filter(
      (account) => !new Set(importedAddresses).has(account.address)
    );

    if (!store.importMnemonics.isExistedKeyring) {
      await store.app.wallet.walletEVM.requestKeyring(
        KEYRING_TYPE.HdKeyring,
        'activeAccounts',
        stashKeyringId ?? null,
        accountsToImport.map((acc) => (acc.index as number) - 1)
      );
      await store.app.wallet.walletEVM.addKeyring(stashKeyringId!);
    } else {
      await store.app.wallet.walletEVM.activeAndPersistAccountsByMnemonics(
        store.importMnemonics.finalMnemonics,
        store.importMnemonics.passphrase,
        accountsToImport
      );
    }

    if (accountsToImport?.length) {
      const { basePublicKey } = await store.app.wallet.walletEVM.requestKeyring(
        KEYRING_TYPE.HdKeyring,
        'getInfoByAddress',
        stashKeyringId ?? null,
        accountsToImport[0].address
      );

      await store.app.wallet.walletEVM.addHDKeyRingLastAddAddrTime(basePublicKey);
    }

    await Promise.all(
      accountsToImport.map((account) => {
        return store.app.wallet.updateAlianName(account.address?.toLowerCase(), account.alianName || '');
      })
    );
  };
}
