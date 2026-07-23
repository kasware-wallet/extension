import type { Inscription, RawTxInfo, TTokenType } from '@/shared/types';
import type { TxType } from '@/shared/types';

import { useWallet } from '@/ui/utils';
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { selectUiState, tempUiActions } from './reducer';
import { createSelector } from '@reduxjs/toolkit';

const selectKRC20MintDeployTabKey = createSelector(selectUiState, (ui) => ui.krc20MintDeployTabKey);
export function useKRC20MintDeployTabKey() {
  return useAppSelector(selectKRC20MintDeployTabKey);
}

const selectUiTxCreateScreen = createSelector(selectUiState, (ui) => ui.uiTxCreateScreen);
export function useUiTxCreateScreen() {
  return useAppSelector(selectUiTxCreateScreen);
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

export function useLowFeeRate() {
  const rates = useFeeRateOption();
  // feeSummary[0] is the Slow/Low tier
  if (rates[0]?.feeRate) {
    return rates[0].feeRate;
  }
  return 1;
}

export function useUpdateUiTxCreateScreenCallback() {
  const dispatch = useAppDispatch();
  return useCallback(
    ({
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
        tempUiActions.updateTxCreateScreen({
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
    },
    [dispatch]
  );
}

export function useResetUiTxCreateScreenCallback() {
  const dispatch = useAppDispatch();
  return useCallback(() => {
    dispatch(tempUiActions.resetTxCreateScreen());
  }, [dispatch]);
}

export function useFetchFeeRateOptionCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  return useCallback(async () => {
    const data = await wallet.getFeeSummary();
    dispatch(tempUiActions.updateFeeRateOption({ feeRateOption: data }));
    return data;
  }, [wallet, dispatch]);
}
