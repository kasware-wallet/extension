import { useCallback, useMemo } from 'react';

import { IKaspaUTXOWithoutBigint, IResultPsbtHex, RawTxInfo, ToAddressInfo } from '@/shared/types';
import { useTools } from '@/ui/components/ActionComponent';
import { satoshisToAmount, sleep, useWallet } from '@/ui/utils';

import { AppState } from '..';
import { useAccountAddress, useCurrentAccount } from '../accounts/hooks';
import { accountActions } from '../accounts/reducer';
import { useAppDispatch, useAppSelector } from '../hooks';
import { transactionsActions } from './reducer';

export function useTransactionsState(): AppState['transactions'] {
  return useAppSelector((state) => state.transactions);
}

export function useBitcoinTx() {
  const transactionsState = useTransactionsState();
  return transactionsState.bitcoinTx;
}

export function usePrepareSendBTCCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const fromAddress = useAccountAddress();
  const utxos = useUtxos();
  const fetchUtxos = useFetchUtxosCallback();
  return useCallback(
    async ({
      toAddressInfo,
      // toAmount is satoshis unit
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
      // const safeBalance = _utxos.filter(v => v?.inscriptions.length == 0).reduce((pre, cur) => pre + cur?.satoshis, 0);
      const safeBalance = _utxos.reduce((pre, cur) => pre + Number(cur?.utxoEntry.amount), 0);
      if (safeBalance < toAmount) {
        throw new Error(
          `Insufficient balance. Non-Inscription balance(${satoshisToAmount(
            safeBalance
          )} KAS) is lower than ${satoshisToAmount(toAmount)} KAS `
        );
      }

      if (!feeRate) {
        const summary = await wallet.getFeeSummary();
        feeRate = summary.list[0].feeRate;
      }
      let psbtHex;

      if (safeBalance === toAmount) {
        psbtHex = await wallet.sendAllBTC({
          to: toAddressInfo.address,
          btcUtxos: _utxos,
          enableRBF,
          feeRate
        });
      } else {
        psbtHex = await wallet.sendBTC({
          to: toAddressInfo.address,
          amount: toAmount,
          btcUtxos: _utxos,
          enableRBF,
          feeRate
        });
        // psbtHex = result.psbtHex;
        // fee = result.fee;
      }
      const result: IResultPsbtHex = JSON.parse(psbtHex);
      const rawtx = psbtHex;
      const fee = result.fee;
      // const psbt = bitcoin.Psbt.fromHex(psbtHex);
      // const rawtx = psbt.extractTransaction().toHex();
      // const fee = psbt.getFee();
      // const rawtx = '0x1';
      // const rawtx = psbtHex;
      // const estimate = await psbtHex.estimate()
      // const fee = estimate.fees
      // psbtHex = '';
      dispatch(
        transactionsActions.updateBitcoinTx({
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

export function usePushBitcoinTxCallback() {
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
        dispatch(transactionsActions.updateBitcoinTx({ txid }));
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

export function useOrdinalsTx() {
  const transactionsState = useTransactionsState();
  return transactionsState.ordinalsTx;
}

export function usePrepareSendOrdinalsInscriptionCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const fromAddress = useAccountAddress();
  const utxos = useUtxos();
  const fetchUtxos = useFetchUtxosCallback();
  return useCallback(
    async ({
      toAddressInfo,
      inscriptionId,
      feeRate,
      outputValue,
      enableRBF
    }: {
      toAddressInfo: ToAddressInfo;
      inscriptionId: string;
      feeRate: number;
      outputValue: number;
      enableRBF: boolean;
    }) => {
      let btcUtxos = utxos;
      if (btcUtxos.length === 0) {
        btcUtxos = await fetchUtxos();
      }

      const psbtHex = await wallet.sendOrdinalsInscription({
        to: toAddressInfo.address,
        inscriptionId,
        feeRate,
        outputValue,
        enableRBF,
        btcUtxos
      });
      // const psbt = bitcoin.Psbt.fromHex(psbtHex);
      // const rawtx = psbt.extractTransaction().toHex();
      const rawtx = '0x1';
      dispatch(
        transactionsActions.updateOrdinalsTx({
          rawtx,
          psbtHex,
          fromAddress,
          // inscription,
          feeRate,
          outputValue
        })
      );
      const rawTxInfo: RawTxInfo = {
        psbtHex,
        rawtx,
        toAddressInfo
      };
      return rawTxInfo;
    },
    [dispatch, wallet, fromAddress, utxos]
  );
}

export function usePrepareSendOrdinalsInscriptionsCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const fromAddress = useAccountAddress();
  const fetchUtxos = useFetchUtxosCallback();
  const utxos = useUtxos();
  return useCallback(
    async ({
      toAddressInfo,
      inscriptionIds,
      feeRate,
      enableRBF
    }: {
      toAddressInfo: ToAddressInfo;
      inscriptionIds: string[];
      feeRate?: number;
      enableRBF: boolean;
    }) => {
      if (!feeRate) {
        const summary = await wallet.getFeeSummary();
        feeRate = summary.list[1].feeRate;
      }

      let btcUtxos = utxos;
      if (btcUtxos.length === 0) {
        btcUtxos = await fetchUtxos();
      }
      const psbtHex = await wallet.sendOrdinalsInscriptions({
        to: toAddressInfo.address,
        inscriptionIds,
        feeRate,
        enableRBF,
        btcUtxos
      });
      // const psbt = bitcoin.Psbt.fromHex(psbtHex);
      // const rawtx = psbt.extractTransaction().toHex();
      const rawtx = '0x1';
      dispatch(
        transactionsActions.updateOrdinalsTx({
          rawtx,
          psbtHex,
          fromAddress,
          feeRate
        })
      );
      const rawTxInfo: RawTxInfo = {
        psbtHex,
        rawtx,
        toAddressInfo
      };
      return rawTxInfo;
    },
    [dispatch, wallet, fromAddress, utxos]
  );
}

export function usePushOrdinalsTxCallback() {
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
        dispatch(transactionsActions.updateOrdinalsTx({ txid }));

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
        console.log(e);
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

export function useFetchUtxosCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const account = useCurrentAccount();
  return useCallback(async () => {
    const data = await wallet.getBTCUtxos();
    // const kasUtxosStr = await wallet.getKASUtxos();
    dispatch(transactionsActions.setUtxos(data));
    // dispatch(transactionsActions.setKasUtxos(kasUtxosStr));
    return data;
  }, [wallet, account]);
}

export function useAssetUtxosAtomicalsFT() {
  const transactionsState = useTransactionsState();
  return transactionsState.assetUtxos_atomicals_ft;
}

export function useSafeBalance() {
  const utxos: IKaspaUTXOWithoutBigint[] = useUtxos();
  return useMemo(() => {
    const sompi = utxos.reduce((agg, curr) => {
      return Number(curr.utxoEntry.amount) + agg;
    }, 0);
    return satoshisToAmount(sompi);
  }, [utxos]);
}

export function usePushAtomicalsTxCallback() {
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
        dispatch(transactionsActions.updateAtomicalsTx({ txid }));

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
        console.log(e);
        ret.error = (e as Error).message;
        tools.showLoading(false);
      }

      return ret;
    },
    [dispatch, wallet]
  );
}

export function useAtomicalsTx() {
  const transactionsState = useTransactionsState();
  return transactionsState.atomicalsTx;
}
