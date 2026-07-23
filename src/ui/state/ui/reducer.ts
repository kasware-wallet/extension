import type { IKRC20TokenIntro, TTabKey } from '@/shared/types';
import { BridgeTabKey } from '@/shared/types';
import { AssetTabKey, NftTabKey, ActivityTabKey, SwapTabKey, TokensTabKey } from '@/shared/types';
import { createSelector, createSlice } from '@reduxjs/toolkit';

import type { AppState } from '..';
import { updateVersion } from '../global/actions';
import { initialTabsStatus } from '@/shared/constant';

export interface UIState {
  assetTabKey: AssetTabKey;
  nftTabKey: NftTabKey;
  activityTabKey: ActivityTabKey;
  tokensTabKey: TokensTabKey;
  swapTabKey: SwapTabKey;
  bridgeTabKey: BridgeTabKey;
  tabsStatus: Record<TTabKey, boolean>;
  donation: {
    checked: boolean;
    donationAmount: number;
  };
  krc20TokenIntro: { [tick: string]: IKRC20TokenIntro };
  evmChainId: number;
}

export const initialState: UIState = {
  assetTabKey: AssetTabKey.TOKENS,
  nftTabKey: NftTabKey.KNS,
  activityTabKey: ActivityTabKey.KAS,
  tokensTabKey: TokensTabKey.KASPA,
  swapTabKey: SwapTabKey.CHAINGE,
  bridgeTabKey: BridgeTabKey.KaspaL2,
  tabsStatus: initialTabsStatus,
  donation: {
    checked: false,
    donationAmount: 1
  },
  krc20TokenIntro: {},
  evmChainId: 1
};

const slice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    reset(_state) {
      return initialState;
    },
    updateAssetTabScreen(
      state,
      action: {
        payload: {
          assetTabKey: AssetTabKey;
        };
      }
    ) {
      const { payload } = action;
      if (payload.assetTabKey !== undefined) {
        state.assetTabKey = payload.assetTabKey;
      }
    },
    updateNftTab(
      state,
      action: {
        payload: {
          nftTabKey?: NftTabKey;
        };
      }
    ) {
      const { payload } = action;
      if (payload.nftTabKey !== undefined) {
        state.nftTabKey = payload.nftTabKey;
      }
    },
    updateActivityTab(
      state,
      action: {
        payload: {
          activityTabKey?: ActivityTabKey;
        };
      }
    ) {
      const { payload } = action;
      if (payload.activityTabKey !== undefined) {
        state.activityTabKey = payload.activityTabKey;
      }
    },
    updateTokensTab(
      state,
      action: {
        payload: {
          tokensTabKey?: TokensTabKey;
        };
      }
    ) {
      const { payload } = action;
      if (payload.tokensTabKey !== undefined) {
        state.tokensTabKey = payload.tokensTabKey;
      }
    },
    updateBridgeTab(
      state,
      action: {
        payload: {
          bridgeTabKey: BridgeTabKey;
        };
      }
    ) {
      const { payload } = action;
      if (payload.bridgeTabKey !== undefined) {
        state.bridgeTabKey = payload.bridgeTabKey;
      }
    },
    updateSwapTab(
      state,
      action: {
        payload: {
          swapTabKey: SwapTabKey;
        };
      }
    ) {
      const { payload } = action;
      if (payload.swapTabKey !== undefined) {
        state.swapTabKey = payload.swapTabKey;
      }
    },
    setTabsStatus(
      state,
      action: {
        payload: {
          tabKey: TTabKey;
          status: boolean;
        };
      }
    ) {
      const { payload } = action;
      state.tabsStatus = { ...state.tabsStatus, [payload.tabKey]: payload.status };
    },

    updateKRC20TokenIntro(
      state,
      action: {
        payload: {
          krc20TokenIntro: { [tick: string]: IKRC20TokenIntro };
        };
      }
    ) {
      if (action.payload.krc20TokenIntro !== undefined) {
        state.krc20TokenIntro = action.payload.krc20TokenIntro;
      }
    },
    updateDonationSetting(
      state,
      action: {
        payload: {
          checked?: boolean;
          donationAmount?: number;
        };
      }
    ) {
      if (action.payload.checked !== undefined) {
        state.donation = { ...state.donation, checked: action.payload.checked };
      }
      if (action.payload.donationAmount !== undefined) {
        state.donation = { ...state.donation, donationAmount: action.payload.donationAmount };
      }
    },
    updateEvmChainId(
      state,
      action: {
        payload: number;
      }
    ) {
      const { payload } = action;
      if (typeof payload == 'number') {
        state.evmChainId = payload;
      }
    }
  },
  extraReducers: (builder) => {
    builder.addCase(updateVersion, (state) => {
      // todo
      if (!state.assetTabKey) {
        state.assetTabKey = AssetTabKey.TOKENS;
      }
      if (!state.tokensTabKey || state.tokensTabKey === TokensTabKey.KRC20) {
        state.tokensTabKey = TokensTabKey.KASPA;
      }
      if (!state.swapTabKey) {
        state.swapTabKey = SwapTabKey.CHAINGE;
      }
      if (!state.tabsStatus) {
        state.tabsStatus = initialState.tabsStatus;
      }
    });
  }
});

export const uiActions = slice.actions;
export default slice.reducer;

export const selectUiState = (state: AppState) => state.ui;
export const selectTokensTabKey = createSelector([selectUiState], (ui) => ui.tokensTabKey);
export const selectSwapTabKey = createSelector([selectUiState], (ui) => ui.swapTabKey);
export const selectBridgeTabKey = createSelector([selectUiState], (ui) => ui.bridgeTabKey);
export const selectEvmChainId = createSelector([selectUiState], (ui) => ui.evmChainId);
export const selectTabsStatus = createSelector([selectUiState], (ui) => ui.tabsStatus);
