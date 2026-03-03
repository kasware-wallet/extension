import type { ChainGas } from '@/shared/types/gas';
import { DEX } from 'consts';
import { selectNetworkId } from '@/ui/state/settings/reducer';
import type { SwapServiceStore } from '@/evm/background/service/swap';
import type { DEX_ENUM } from '@kasware-wallet/common';
import type { TokenItem } from '@kasware-wallet/api/dist/types';
import { NETWORK_ID, type EVM_CHAINS_ENUM } from '@/shared/constant';
import { createSelector, createSlice } from '@reduxjs/toolkit';

import type { AppState, TAppDispatch } from '..';
import { useAppSelector } from '../hooks';

export const swap = createSlice({
  name: 'swap',

  initialState: {
    slippage: '0.1',
    autoSlippage: true,
    supportedDEXList: Object.keys(DEX),
    selectedDex: null,
    selectedChain: null,
    gasPriceCache: {},
    unlimitedAllowance: false,
    viewList: {},
    tradeList: {},
    sortIncludeGasFee: false,
    preferMEVGuarded: false,
    $$initialSelectedChain: null,
    recentToTokens: [] as TokenItem[],
    evmMainnetDexList: [] as DEX_ENUM[],
    evmTestnetDexList: [] as DEX_ENUM[]
  } as Partial<SwapServiceStore> & {
    $$initialSelectedChain: EVM_CHAINS_ENUM | null;
    supportedDEXList: string[];
    evmMainnetDexList: DEX_ENUM[];
    evmTestnetDexList: DEX_ENUM[];
  },

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

export const { actions: swapActions, reducer: swapReducer } = swap;
export const selectSwapState = (state: AppState) => state.swap;
export const selectRecentTokens = createSelector([selectSwapState], (state) => state.recentToTokens);
export const selectSelectedChain = createSelector([selectSwapState], (state) => state.selectedChain);
export const selectSupportedDEXList = createSelector([selectSwapState], (state) => state.supportedDEXList);
export const selectEvmMainnetDexList = createSelector([selectSwapState], (state) => state.evmMainnetDexList);
export const selectEvmTestnetDexList = createSelector([selectSwapState], (state) => state.evmTestnetDexList);
export const selectSlippage = createSelector([selectSwapState], (state) => state.slippage);
export const selectSelectedFromToken = createSelector([selectSwapState], (state) => state.selectedFromToken);
export const selectSelectedToToken = createSelector([selectSwapState], (state) => state.selectedToToken);
export const selectInitialSelectedChain = createSelector([selectSwapState], (state) => state.$$initialSelectedChain);
export const selectAutoSlippage = createSelector([selectSwapState], (state) => state.autoSlippage);
export const selectIsCustomSlippage = createSelector([selectSwapState], (state) => state.isCustomSlippage);
export const selectPreferMEVGuarded = createSelector([selectSwapState], (state) => state.preferMEVGuarded);
export function swapInit() {
  return async (dispatch: TAppDispatch) => {
    return dispatch(swapSyncState());
  };
}

export function swapSyncState(key?: keyof SwapServiceStore) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    const data = await store.app.wallet.walletEVM.getSwap(key);

    dispatch(
      swapActions.setField(
        key
          ? {
              [key]: data
            }
          : {
              ...(data as SwapServiceStore)
            }
      )
    );

    if (!key) {
      dispatch(
        swapActions.setField({
          $$initialSelectedChain: (data as SwapServiceStore).selectedChain || null
        })
      );
    }

    await dispatch(getSwapSupportedDEXList());
  };
}

export function getSwapGasCache(chain: EVM_CHAINS_ENUM) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    const gasCache = await store.app.wallet.walletEVM.getSwapGasCache(chain);
    dispatch(
      swapActions.setField({
        ...store.swap.gasPriceCache,
        [chain]: gasCache
      })
    );
    return gasCache;
  };
}

export function updateSwapGasCache(obj: { chain: EVM_CHAINS_ENUM; gas: ChainGas }) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.updateSwapGasCache(obj.chain, obj.gas);
    dispatch(getSwapGasCache(obj.chain));
  };
}

export function setSwapDexId(selectedDex: DEX_ENUM) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.setSwapDexId(selectedDex);
    dispatch(
      swapActions.setField({
        selectedDex
      })
    );
  };
}

export function setSelectedChain(selectedChain: EVM_CHAINS_ENUM) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.setLastSelectedSwapChain(selectedChain);

    dispatch(
      swapActions.setField({
        selectedChain
      })
    );
  };
}

export function setSelectedFromToken(selectedFromToken: TokenItem | undefined) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.setSelectedFromToken(selectedFromToken);

    dispatch(
      swapActions.setField({
        selectedFromToken
      })
    );
  };
}

export function setSelectedToToken(selectedToToken: TokenItem | undefined) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.setSelectedToToken(selectedToToken);

    dispatch(
      swapActions.setField({
        selectedToToken
      })
    );
  };
}

export function setUnlimitedAllowance(unlimitedAllowance: boolean) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.setUnlimitedAllowance(unlimitedAllowance);

    dispatch(
      swapActions.setField({
        unlimitedAllowance
      })
    );
  };
}

export function getSwapViewList() {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    const viewList = await store.app.wallet.walletEVM.getSwapViewList();
    dispatch(
      swapActions.setField({
        viewList
      })
    );
    return viewList;
  };
}

// export function getSwapTradeList() {
//   return async (dispatch: TAppDispatch, getState) => {
//     const store = getState() as AppState;
//     const tradeList = await store.app.wallet.walletEVM.getSwapTradeList();
//     dispatch(
//       swapActions.setField({
//         tradeList
//       })
//     );
//     return tradeList;
//   };
// }

export function setSwapView(unlimitedAllowance: Parameters<any>) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.setSwapView(unlimitedAllowance[0], unlimitedAllowance[1]);
    dispatch(getSwapViewList());
  };
}

// export function setSwapTrade(unlimitedAllowance: Parameters<any>) {
//   return async (dispatch: TAppDispatch, getState) => {
//     const store = getState() as AppState;
//     await store.app.wallet.walletEVM.setSwapTrade(unlimitedAllowance[0], unlimitedAllowance[1]);

//     dispatch(getSwapTradeList());
//   };
// }

export function getSwapSortIncludeGasFee() {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    const sortIncludeGasFee = await store.app.wallet.walletEVM.getSwapSortIncludeGasFee();
    dispatch(
      swapActions.setField({
        sortIncludeGasFee
      })
    );
  };
}

export function setSwapSortIncludeGasFee(bool: boolean) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.setSwapSortIncludeGasFee(bool);
    dispatch(getSwapSortIncludeGasFee());
  };
}

export function getSwapPreferMEV() {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    const preferMEVGuarded = await store.app.wallet.walletEVM.getSwapPreferMEVGuarded();
    dispatch(
      swapActions.setField({
        preferMEVGuarded
      })
    );
  };
}

export function setSwapPreferMEV(bool: boolean) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.setSwapPreferMEVGuarded(bool);
    dispatch(getSwapPreferMEV());
  };
}

export function getSwapSupportedDEXList() {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    const data = await store.app.wallet.openapiEVM.getSupportedDEXList();
    if (data.evmTestnetDexList) {
      dispatch(
        swapActions.setField({
          evmTestnetDexList: data.evmTestnetDexList?.filter((item) => Object.keys(DEX).includes(item))
        })
      );
    }
    if (data.evmMainnetDexList) {
      dispatch(
        swapActions.setField({
          evmMainnetDexList: data.evmMainnetDexList?.filter((item) => Object.keys(DEX).includes(item))
        })
      );
    }
  };
}

export function setAutoSlippage(autoSlippage: boolean) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.setAutoSlippage(autoSlippage);
    dispatch(swapActions.setField({ autoSlippage }));
  };
}

export function setIsCustomSlippage(isCustomSlippage: boolean) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.setIsCustomSlippage(isCustomSlippage);
    dispatch(swapActions.setField({ isCustomSlippage }));
  };
}

export function setSlippage(slippage: string) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.setSlippage(slippage);
    dispatch(swapActions.setField({ slippage }));
  };
}

export function setRecentSwapToToken(token: TokenItem) {
  return async (dispatch: TAppDispatch, getState) => {
    const store = getState() as AppState;
    await store.app.wallet.walletEVM.setRecentSwapToToken(token);
    const recentToTokens = await store.app.wallet.walletEVM.getRecentSwapToTokens();
    dispatch(swapActions.setField({ recentToTokens }));
  };
}

export function useSupportedDEXList() {
  const networkId = useAppSelector(selectNetworkId);
  const evmMainnetDexList = useAppSelector(selectEvmMainnetDexList);
  const evmTestnetDexList = useAppSelector(selectEvmTestnetDexList);
  const supportedDEXList = networkId === NETWORK_ID.mainnet ? evmMainnetDexList : evmTestnetDexList;
  return supportedDEXList;
}
