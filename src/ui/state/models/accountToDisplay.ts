import PQueue from 'p-queue';

import type { DisplayedKeyring } from '@/evm/background/service/keyring';
import type { TotalBalanceResponse } from '@kasware-wallet/api/dist/types';
import { sortAccountsByBalance } from '@/evm/ui/utils/account';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';

import type { AppState } from '..';

type IDisplayedAccount = Required<DisplayedKeyring['accounts'][number]>;
export type IDisplayedAccountWithBalance = IDisplayedAccount & {
  balance: number;
  byImport?: boolean;
  publicKey?: string;
  hdPathBasePublicKey?: string;
  hdPathType?: string;
};

type IState = {
  loadingAccounts: boolean;
  accountsList: IDisplayedAccountWithBalance[];
};

export const accountToDisplay = createSlice({
  name: 'accountToDisplay',
  initialState: {
    loadingAccounts: false,
    accountsList: []
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

export const { actions: accountToDisplayActions, reducer: accountToDisplayReducer } = accountToDisplay;
export const selectAccountToDisplayState = (state: AppState) => state.accountToDisplay;
export const selectAccountsList = createSelector([selectAccountToDisplayState], (state) => state.accountsList);

export const getAllAccountsToDisplay = createAsyncThunk(
  'accountToDisplay/getAllAccountsToDisplay',
  async (_, thunkApi) => {
    const store = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;
    const walletKeyrings = store.keyrings.keyrings;
    const allAlianNamesWallet: any[] = [];
    walletKeyrings.forEach((keyring) => {
      keyring.accounts.forEach((account) => {
        const item = {
          [account.evmAddress]: {
            address: account?.evmAddress,
            name: keyring.alianName + ' ' + account.alianName,
            isAlias: true,
            isContact: false
          }
        };
        allAlianNamesWallet.push(item);
      });
    });

    dispatch(accountToDisplayActions.setField({ loadingAccounts: true }));

    const [displayedKeyrings, allAlianNames] = await Promise.all([
      store.app.wallet.getAllVisibleAccounts(),
      store.app.wallet.walletEVM.getAllAlianNameByMap()
    ]);

    const result = await Promise.all<IDisplayedAccountWithBalance>(
      displayedKeyrings
        .map((item) => {
          return item.accounts.map((account) => {
            return {
              ...account,
              address: account?.evmAddress.toLowerCase(),
              type: item.type,
              byImport: item?.byImport,
              alianName:
                allAlianNames[account?.evmAddress?.toLowerCase()]?.name ||
                allAlianNamesWallet[account?.evmAddress?.toLowerCase()]?.name,
              keyring: item.keyring,
              publicKey: item?.evmPublicKey
            };
          });
        })
        .flat(1)
        .map(async (item) => {
          let balance: TotalBalanceResponse | null = null;

          let accountInfo = {} as {
            hdPathBasePublicKey?: string;
            hdPathType?: string;
          };

          await Promise.allSettled([
            store.app.wallet.walletEVM.getAddressCacheBalance(item?.evmAddress),
            store.app.wallet.walletEVM.requestKeyring(item.type, 'getAccountInfo', null, item.evmAddress)
          ]).then(([res1, res2]) => {
            if (res1.status === 'fulfilled') {
              balance = res1.value;
            }
            if (res2.status === 'fulfilled') {
              accountInfo = res2.value;
            }
          });

          if (!balance) {
            balance = {
              total_usd_value: 0,
              chain_list: []
            };
          }
          return {
            ...item,
            balance: balance?.total_usd_value || 0,
            hdPathBasePublicKey: accountInfo?.hdPathBasePublicKey,
            hdPathType: accountInfo?.hdPathType
          };
        })
    );
    dispatch(accountToDisplayActions.setField({ loadingAccounts: false }));

    if (result) {
      const withBalanceList = sortAccountsByBalance(result);
      dispatch(accountToDisplayActions.setField({ accountsList: withBalanceList }));
    }
    return null;
  }
);

export const updateAllBalance = createAsyncThunk('accountToDisplay/updateAllBalance', async (_, thunkApi) => {
  const store = thunkApi.getState() as AppState;
  const dispatch = thunkApi.dispatch;
  const queue = new PQueue({ concurrency: 10 });
  let hasError = false;
  const result = await queue.addAll(
    (store.accountToDisplay?.accountsList || []).map((item) => {
      return async () => {
        try {
          const balance = await store.app.wallet.walletEVM.getInMemoryAddressBalance(item?.evmAddress);
          return {
            ...item,
            balance: balance?.total_usd_value || 0
          };
        } catch (e) {
          hasError = true;
          return item;
        }
      };
    })
  );

  dispatch(
    accountToDisplayActions.setField({
      accountsList: result
    })
  );

  if (hasError) {
    throw new Error('update balance error');
  }

  return null;
});
