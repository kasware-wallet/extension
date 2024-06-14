import { useCallback, useMemo } from 'react';

import { IKaspaUTXOWithoutBigint, IResultPsbtHex, RawTxInfo, ToAddressInfo } from '@/shared/types';
import { useTools } from '@/ui/components/ActionComponent';
import { sleep, sompiToAmount, useWallet } from '@/ui/utils';

import { AppState } from '..';
import { useAccountAddress, useCurrentAccount } from '../accounts/hooks';
import { accountActions } from '../accounts/reducer';
import { useAppDispatch, useAppSelector } from '../hooks';
import { transactionsActions } from './reducer';

export function useTransactionsState(): AppState['transactions'] {
  return useAppSelector((state) => state.transactions);
}

export function useKaspaTx() {
  const transactionsState = useTransactionsState();
  return transactionsState.kaspaTx;
}

export function usePrepareSendKASCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const fromAddress = useAccountAddress();
  const utxos = useUtxos();
  const fetchUtxos = useFetchUtxosCallback();
  return useCallback(
    async ({
      toAddressInfo,
      // toAmount is sompi unit
      toAmount,
      feeRate,
      enableRBF
    }: {
      toAddressInfo: ToAddressInfo;
      toAmount: number;
      feeRate?: number;
      enableRBF: boolean;
    }) => {
      let _utxos = utxos;
      if (_utxos.length === 0) {
        _utxos = await fetchUtxos();
      }
      const safeBalance = _utxos.reduce((pre, cur) => pre + Number(cur.amount), 0);
      if (safeBalance < toAmount) {
        throw new Error(
          `Insufficient balance. Balance(${sompiToAmount(
            safeBalance
          )} KAS) is lower than ${sompiToAmount(toAmount)} KAS `
        );
      }

      if (!feeRate) {
        const summary = await wallet.getFeeSummary();
        feeRate = summary.list[0].feeRate;
      }
      let psbtHex;

      if (safeBalance === toAmount) {
        psbtHex = await wallet.sendAllKAS({
          to: toAddressInfo.address,
          kasUtxos: _utxos,
          enableRBF,
          feeRate
        });
      } else {
        psbtHex = await wallet.sendKAS({
          to: toAddressInfo.address,
          amount: toAmount,
          kasUtxos: _utxos,
          enableRBF,
          feeRate
        });
        // psbtHex = result.psbtHex;
        // fee = result.fee;
      }
      const result: IResultPsbtHex = JSON.parse(psbtHex);
      const rawtx = psbtHex;
      const fee = result.fee;
      // const rawtx = psbt.extractTransaction().toHex();
      // const fee = psbt.getFee();
      // const rawtx = '0x1';
      // const rawtx = psbtHex;
      // const estimate = await psbtHex.estimate()
      // const fee = estimate.fees
      // psbtHex = '';
      dispatch(
        transactionsActions.updateKaspaTx({
          rawtx,
          psbtHex,
          fromAddress,
          feeRate
        })
      );
      const rawTxInfo: RawTxInfo = {
        psbtHex,
        rawtx,
        toAddressInfo,
        fee
      };
      return rawTxInfo;
    },
    [dispatch, wallet, fromAddress, utxos, fetchUtxos]
  );
}

export function usePushKaspaTxCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const tools = useTools();
  return useCallback(
    async (rawtx: string) => {
      const ret = {
        success: false,
        txid: '',
        error: ''
      };
      try {
        tools.showLoading(true);
        const txid = await wallet.pushTx(rawtx);
        await sleep(3); // Wait for transaction synchronization
        tools.showLoading(false);
        dispatch(transactionsActions.updateKaspaTx({ txid }));
        dispatch(accountActions.expireBalance());
        setTimeout(() => {
          dispatch(accountActions.expireBalance());
        }, 2000);
        setTimeout(() => {
          dispatch(accountActions.expireBalance());
        }, 5000);

        ret.success = true;
        ret.txid = txid;
      } catch (e) {
        ret.error = (e as Error).message;
        tools.showLoading(false);
      }

      return ret;
    },
    [dispatch, wallet]
  );
}


export function useUtxos() {
  const transactionsState = useTransactionsState();
  return transactionsState.utxos;
}

export function useTxActivities() {
  const transactionsState = useTransactionsState();
  return transactionsState.txActivities;
}

export function useIncomingTx() {
  const transactionsState = useTransactionsState();
  return transactionsState.incomingTx;
}

export function useFetchUtxosCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const account = useCurrentAccount();
  return useCallback(async () => {
    const data = await wallet.getKASUtxos();
    dispatch(transactionsActions.setUtxos(data));
    // dispatch(transactionsActions.setKasUtxos(kasUtxosStr));
    return data;
  }, [wallet, account]);
}

export function useFetchTxActivitiesCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const incomingTx = useIncomingTx();
  const account = useCurrentAccount();
  return useCallback(async () => {
    const data = await wallet.getTxActivities(); 
    dispatch(transactionsActions.setTxActivities(data));
    if(incomingTx) dispatch(transactionsActions.setIncomingTx(false));
    // dispatch(transactionsActions.setKasUtxos(kasUtxosStr));
    return data;
  }, [wallet, account]);
}


export function useSafeBalance() {
  const utxos: IKaspaUTXOWithoutBigint[] = useUtxos();
  return useMemo(() => {
    const sompi = utxos.reduce((agg, curr) => {
      return Number(curr.amount) + agg;
    }, 0);
    return sompiToAmount(sompi);
  }, [utxos]);
}

