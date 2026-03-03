import type { Inscription, RawTxInfo, TTokenType } from '@/shared/types';
import type { TxType } from '@/shared/types';

import { useWallet } from '@/ui/utils';
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { selectUiState, uiActions } from './reducer';
import { createSelector } from '@reduxjs/toolkit';

const selectAssetTabKey = createSelector(selectUiState, (ui) => ui.assetTabKey);
export function useAssetTabKey() {
  return useAppSelector(selectAssetTabKey);
}

const selectNftTabKey = createSelector(selectUiState, (ui) => ui.nftTabKey);
export function useNftTabKey() {
  return useAppSelector(selectNftTabKey);
}

const selectActivityTabKey = createSelector(selectUiState, (ui) => ui.activityTabKey);
export function useActivityTabKey() {
  return useAppSelector(selectActivityTabKey);
}
const selectKRC20MintDeployTabKey = createSelector(selectUiState, (ui) => ui.krc20MintDeployTabKey);
export function useKRC20MintDeployTabKey() {
  return useAppSelector(selectKRC20MintDeployTabKey);
}

const selectUiTxCreateScreen = createSelector(selectUiState, (ui) => ui.uiTxCreateScreen);
export function useUiTxCreateScreen() {
  return useAppSelector(selectUiTxCreateScreen);
}

const selectKRC20MintDeployScreen = createSelector(selectUiState, (ui) => ui.krc20MintDeployScreen);
export function useKRC20MintDeployScreen() {
  return useAppSelector(selectKRC20MintDeployScreen);
}

const selectKRC20History = createSelector(selectUiState, (ui) => ui.krc20History);
export function useKRC20History() {
  return useAppSelector(selectKRC20History);
}

const selectKRC20TokenIntro = createSelector(selectUiState, (ui) => ui.krc20TokenIntro);
export function useKRC20TokenIntro() {
  return useAppSelector(selectKRC20TokenIntro);
}

const selectFeeRateOption = createSelector(selectUiState, (ui) => ui.feeRateOption);
export function useFeeRateOption() {
  return useAppSelector(selectFeeRateOption);
}

export function useAvgFeeRate() {
  const rates = useFeeRateOption();
  const res = rates.find((rate) => rate?.title === 'Avg');
  if (res) {
    return res.feeRate;
  } else {
    return 1;
  }
}

export function useUpdateUiTxCreateScreen() {
  const dispatch = useAppDispatch();
  return ({
    toInfo,
    inputAmount,
    feeRate,
    priorityFee,
    rawTxInfo,
    type,
    tokenType,
    tick,
    ca,
    decimals
  }: {
    toInfo?: { address: string; domain: string; inscription?: Inscription };
    inputAmount?: string;
    feeRate?: number;
    priorityFee?: number;
    rawTxInfo?: RawTxInfo;
    type?: TxType;
    tokenType?: TTokenType;
    tick?: string;
    ca?: string;
    decimals?: string;
  }) => {
    dispatch(
      uiActions.updateTxCreateScreen({
        toInfo,
        inputAmount,
        feeRate,
        priorityFee,
        rawTxInfo,
        type,
        tokenType,
        tick,
        ca,
        decimals
      })
    );
  };
}

export function useResetUiTxCreateScreen() {
  const dispatch = useAppDispatch();
  return () => {
    dispatch(uiActions.resetTxCreateScreen());
  };
}

export function useFetchFeeRateOptionCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  return useCallback(async () => {
    const data = await wallet.getFeeSummary();
    dispatch(uiActions.updateFeeRateOption({ feeRateOption: data }));
    return data;
  }, [wallet, dispatch]);
}
