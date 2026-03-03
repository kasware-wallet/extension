import { KEYRING_CLASS } from 'consts';

import type { ConnectedSite } from '@/shared/types/permission';
import type { TestnetChain } from '@/shared/types/chain';
import {
  findChainByEnum,
  getChainList,
  getMainnetListFromLocal,
  updateChainStore,
  varyAndSortChainItems
} from '@/utils/chain';
import type { Chain } from '@kasware-wallet/common';
import type { EVM_CHAINS_ENUM } from '@/shared/constant';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';

import type { AppState, TAppDispatch } from '..';
import type { AccountsState } from '../accounts/reducer';
import { getMatteredChainBalance } from '../accounts/reducer';
import { getPreference } from './preference';

type IState = {
  currentConnection: ConnectedSite | null | undefined;
  gnosisPendingCount: number;
  gnosisNetworkIds: string[];
  mainnetList: Chain[];
  testnetList: TestnetChain[];
};
const initialState: IState = {
  currentConnection: null,
  gnosisPendingCount: 0,
  gnosisNetworkIds: [] as string[],
  mainnetList: getChainList('mainnet'),
  testnetList: getChainList('testnet')
};

export const chains = createSlice({
  name: 'chains',
  initialState,
  reducers: {
    setField(
      state,
      action: {
        payload: Partial<IState>;
      }
    ) {
      const { payload } = action;
      return { ...state, ...payload };
    }
  }
});

export const { actions: chainsActions, reducer: chainsReducer } = chains;
export const selectEvmChains = (state: AppState) => state.chains;
export const selectMainnetList = createSelector([selectEvmChains], (state) => state.mainnetList);
export const selectTestnetList = createSelector([selectEvmChains], (state) => state.testnetList);
export const selectCurrentConnection = createSelector([selectEvmChains], (state) => state.currentConnection);
export const selectGnosisNetworkIds = createSelector([selectEvmChains], (state) => state.gnosisNetworkIds);
export const selectCurrentConnectionChain = createSelector([selectCurrentConnection], (state) => state?.chain);
// export function isCurrentAccountGnosis() {
//   return useAppSelector((state) => state.accounts.current?.type === KEYRING_CLASS.GNOSIS);
// }

// export function isShowGnosisWrongChainAlert() {
//   return useAppSelector((state) => {
//     if (!state.chains.currentConnection) {
//       return false;
//     }

//     const chainItem = findChainByEnum(state.chains.currentConnection.chain);

//     return !!chainItem && !state.chains.gnosisNetworkIds.includes(chainItem.network);
//   });
// }

export const selectIsShowGnosisWrongChainAlert = createSelector(
  [selectCurrentConnection, selectGnosisNetworkIds],
  (currentConnection, gnosisNetworkIds) => {
    if (!currentConnection) {
      return false;
    }

    const chainItem = findChainByEnum(currentConnection.chain);

    return !!chainItem && !gnosisNetworkIds.includes(chainItem.network);
  }
);

// export const chainsInit = createAsyncThunk('chain/init', async (_, thunkApi) => {
//   const state = thunkApi.getState() as AppState;
//   const dispatch = thunkApi.dispatch;

//   state.app.wallet.walletEVM.getCustomTestnetLogos();
//   state.app.wallet.walletEVM.getCustomTestnetList().then((testnetList) => {
//     updateChainStore({
//       testnetList: testnetList
//     });
//     dispatch(chainsActions.setField({ testnetList }));
//   });
//   getMainnetListFromLocal().then((mainnetList) => {
//     if (mainnetList.length) {
//       updateChainStore({
//         mainnetList: mainnetList
//       });
//       dispatch(chainsActions.setField({ mainnetList }));
//     }
//   });

//   return null;
// });

export function chainsInit() {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    store.app.wallet.walletEVM.getCustomTestnetLogos();
    await store.app.wallet.walletEVM.getCustomTestnetList().then((testnetList) => {
      updateChainStore({
        testnetList: testnetList
      });
      dispatch(chainsActions.setField({ testnetList }));
    });
    getMainnetListFromLocal().then((mainnetList) => {
      if (mainnetList.length) {
        updateChainStore({
          mainnetList: mainnetList
        });
        dispatch(chainsActions.setField({ mainnetList }));
      }
    });

    return null;
  };
}

// init(_: void, store) {
//   store.app.wallet.getCustomTestnetLogos();
//   store.app.wallet.getCustomTestnetList().then((testnetList) => {
//     updateChainStore({
//       testnetList: testnetList,
//     });
//     this.setField({ testnetList });
//   });
//   getMainnetListFromLocal().then((mainnetList) => {
//     if (mainnetList.length) {
//       updateChainStore({
//         mainnetList: mainnetList,
//       });
//       this.setField({ mainnetList });
//     }
//   });
// },
/**
 * @description get all chains current account could access, vary them and sort them
 */

export const getOrderedChainList = createAsyncThunk(
  'chains/getOrderedChainList',
  async (opts: { supportChains?: EVM_CHAINS_ENUM[] }, thunkApi) => {
    // const state = thunkApi.getState() as AppState;
    const dispatch = thunkApi.dispatch;

    const { supportChains } = opts || {};
    const { pinned, matteredChainBalances } = await Promise.allSettled([
      dispatch(getPreference('pinnedChain')),
      dispatch(getMatteredChainBalance())
    ]).then(([pinnedChain, balance]) => {
      return {
        pinned: (pinnedChain.status === 'fulfilled' ? pinnedChain.value : []) as EVM_CHAINS_ENUM[],
        matteredChainBalances: (balance.status === 'fulfilled'
          ? // only SUPPORT mainnet now
            balance.value.matteredChainBalances
          : {}) as AccountsState['matteredChainBalances']
      };
    });

    const { matteredList, unmatteredList } = varyAndSortChainItems({
      supportChains,
      pinned,
      matteredChainBalances
    });

    return {
      matteredList,
      unmatteredList,
      firstChain: matteredList[0]
    };
  }
);
