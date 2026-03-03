import type {
  IKNSDomain,
  IKRC20TokenIntro,
  Inscription,
  RawTxInfo,
  TFeeSummary,
  TTabKey,
  TTokenType
} from '@/shared/types';
import { BridgeTabKey } from '@/shared/types';
import { AssetTabKey, NftTabKey, ActivityTabKey, SwapTabKey, TokensTabKey, TxType } from '@/shared/types';
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
  krc20MintDeployTabKey: KRC20MintDeployTabKey;
  krc20MintDeployScreen: {
    deploy?: {
      ticker: string;
      supply: number;
      lim: number;
      pre?: number;
      dec?: number;
    };
    mint?: {
      ticker: string;
    };
    priorityFee?: number;
  };
  uiTxCreateScreen: {
    toInfo: {
      address: string;
      domain: string;
      inscription?: Inscription;
      knsDomain?: IKNSDomain;
    };
    inputAmount: string;
    feeRate: number;
    priorityFee: number;
    rawTxInfo: RawTxInfo | undefined;
    type: TxType;
    tokenType: TTokenType;
    tick: string;
    ca?: string;
    decimals: string;
  };
  donation: {
    checked: boolean;
    donationAmount: number;
  };
  krc20History: { [networkId: string]: { mintArr: string[]; transferArr: string[]; deployArr: string[] } };
  feeRateOption: TFeeSummary;
  krc20TokenIntro: { [tick: string]: IKRC20TokenIntro };
  krc20OTCOrder: {
    tickA: string;
  };
  evmChainId: number;
}

export enum KRC20MintDeployTabKey {
  MINT,
  DEPLOY
}

export const initialState: UIState = {
  assetTabKey: AssetTabKey.TOKENS,
  nftTabKey: NftTabKey.KNS,
  activityTabKey: ActivityTabKey.KAS,
  tokensTabKey: TokensTabKey.KASPA,
  swapTabKey: SwapTabKey.CHAINGE,
  bridgeTabKey: BridgeTabKey.KaspaL2,
  tabsStatus: initialTabsStatus,
  krc20MintDeployTabKey: KRC20MintDeployTabKey.MINT,
  krc20MintDeployScreen: {},
  uiTxCreateScreen: {
    toInfo: {
      address: '',
      domain: '',
      inscription: undefined
    },
    inputAmount: '',
    feeRate: 0,
    priorityFee: 0,
    rawTxInfo: undefined,
    type: TxType.SEND_KASPA,
    tokenType: 'KAS',
    tick: 'KAS',
    decimals: '8'
  },
  donation: {
    checked: false,
    donationAmount: 1
  },
  krc20History: {},
  feeRateOption: [
    {
      title: 'Slow',
      desc: '< 1 sec',
      feeRate: 1
    },
    {
      title: 'Avg',
      desc: '< 1 sec',
      feeRate: 1
    },
    {
      title: 'Fast',
      desc: '< 1 sec',
      feeRate: 1
    }
  ],
  krc20TokenIntro: {},
  krc20OTCOrder: {
    tickA: 'KAS'
  },
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
    updateKRC20MintDeployTab(
      state,
      action: {
        payload: {
          krc20MintDeployTabKey: KRC20MintDeployTabKey;
        };
      }
    ) {
      const { payload } = action;
      if (payload.krc20MintDeployTabKey !== undefined) {
        state.krc20MintDeployTabKey = payload.krc20MintDeployTabKey;
      }
    },
    updateTxCreateScreen(
      state,
      action: {
        payload: Partial<UIState['uiTxCreateScreen']>;
      }
    ) {
      if (action.payload.toInfo !== undefined) {
        state.uiTxCreateScreen.toInfo = action.payload.toInfo;
      }
      if (action.payload.inputAmount !== undefined) {
        state.uiTxCreateScreen.inputAmount = action.payload.inputAmount;
      }
      if (action.payload.feeRate !== undefined) {
        state.uiTxCreateScreen.feeRate = action.payload.feeRate;
      }
      if (action.payload.priorityFee !== undefined) {
        state.uiTxCreateScreen.priorityFee = action.payload.priorityFee;
      }
      if (action.payload.rawTxInfo !== undefined) {
        state.uiTxCreateScreen.rawTxInfo = action.payload.rawTxInfo;
      }
      if (action.payload.type !== undefined) {
        state.uiTxCreateScreen.type = action.payload.type;
      }
      if (action.payload.tokenType !== undefined) {
        state.uiTxCreateScreen.tokenType = action.payload.tokenType;
      }
      if (action.payload.tick !== undefined) {
        state.uiTxCreateScreen.tick = action.payload.tick;
      }
      if (action.payload.ca !== undefined) {
        state.uiTxCreateScreen.ca = action.payload.ca;
      }
      if (action.payload.decimals !== undefined) {
        state.uiTxCreateScreen.decimals = action.payload.decimals;
      }
    },
    updateKRC20MintDeployScreen(
      state,
      action: {
        payload: Partial<UIState['krc20MintDeployScreen']>;
      }
    ) {
      if (action.payload.deploy !== undefined) {
        state.krc20MintDeployScreen = { ...state.krc20MintDeployScreen, deploy: action.payload.deploy };
      }
      if (action.payload.mint !== undefined) {
        state.krc20MintDeployScreen = { ...state.krc20MintDeployScreen, mint: action.payload.mint };
      }
      if (action.payload.priorityFee !== undefined) {
        state.krc20MintDeployScreen = { ...state.krc20MintDeployScreen, priorityFee: action.payload.priorityFee };
      }
    },
    updateKRC20History(
      state,
      action: {
        payload: {
          networkId: string;
          mint?: string;
          deploy?: string;
          transfer?: string;
        };
      }
    ) {
      const networkId = action.payload.networkId;
      let data = state.krc20History[networkId];
      if (action.payload.deploy !== undefined) {
        const deployArr = data?.deployArr || [];
        if (!deployArr.includes(action.payload.deploy)) {
          deployArr.unshift(action.payload.deploy);
          if (deployArr.length > 20) deployArr.pop();
          data = { ...data, deployArr };
          state.krc20History = { ...state.krc20History, [networkId]: data };
        }
      }
      if (action.payload.mint !== undefined) {
        const mintArr = data?.mintArr || [];
        if (!mintArr.includes(action.payload.mint)) {
          mintArr.unshift(action.payload.mint);
          if (mintArr.length > 50) mintArr.pop();
          data = { ...data, mintArr };
          state.krc20History = { ...state.krc20History, [networkId]: data };
        }
      }
      if (action.payload.transfer !== undefined) {
        const transferArr = data?.transferArr || [];
        if (!transferArr.includes(action.payload.transfer)) {
          transferArr.unshift(action.payload.transfer);
          if (transferArr.length > 20) transferArr.pop();
          data = { ...data, transferArr };
          state.krc20History = { ...state.krc20History, [networkId]: data };
        }
      }
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
    updateKRC20OTCOrder(
      state,
      action: {
        payload: {
          tickA: string;
        };
      }
    ) {
      if (action.payload.tickA !== undefined) {
        state.krc20OTCOrder = { ...state.krc20OTCOrder, tickA: action.payload.tickA };
      }
    },
    updateFeeRateOption(
      state,
      action: {
        payload: {
          feeRateOption: {
            title: string;
            desc: string;
            feeRate: number;
          }[];
        };
      }
    ) {
      if (action.payload.feeRateOption !== undefined) {
        state.feeRateOption = action.payload.feeRateOption;
      }
    },
    updateDoationSetting(
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
    resetTxCreateScreen(state) {
      state.uiTxCreateScreen = initialState.uiTxCreateScreen;
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
      if (!state.uiTxCreateScreen) {
        state.uiTxCreateScreen = initialState.uiTxCreateScreen;
      }
      if (!state.krc20History) {
        state.krc20History = initialState.krc20History;
      }
      if (!state.krc20OTCOrder) {
        state.krc20OTCOrder = initialState.krc20OTCOrder;
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
