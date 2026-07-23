import type { IKNSDomain, Inscription, RawTxInfo, TFeeSummary, TTokenType } from '@/shared/types';
import { TxType } from '@/shared/types';
import { createSlice } from '@reduxjs/toolkit';

import type { AppState } from '..';
import { updateVersion } from '../global/actions';

export interface UIState {
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
  feeRateOption: TFeeSummary;
}

export enum KRC20MintDeployTabKey {
  MINT,
  DEPLOY
}

export const initialState: UIState = {
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
  ]
};

const slice = createSlice({
  name: 'tempUi',
  initialState,
  reducers: {
    reset(_state) {
      return initialState;
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
    resetTxCreateScreen(state) {
      state.uiTxCreateScreen = initialState.uiTxCreateScreen;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(updateVersion, (state) => {
      // todo
      if (!state.uiTxCreateScreen) {
        state.uiTxCreateScreen = initialState.uiTxCreateScreen;
      }
    });
  }
});

export const tempUiActions = slice.actions;
export default slice.reducer;

export const selectUiState = (state: AppState) => state.tempUi;
