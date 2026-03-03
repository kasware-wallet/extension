import BigNumber from 'bignumber.js';
import log from 'loglevel';
import { useCallback, useMemo } from 'react';
import { KASPLEX } from '@/shared/constant';
import type {
  ChaingeFeeEstimateRequest,
  IResultPsbtHex,
  ISignKRC20TX,
  KaspaBalance,
  RawTxInfo,
  ToAddressInfo,
  TProtocol
} from '@/shared/types';
import { TxType } from '@/shared/types';
import { constructKRC20TransferJsonStrLowerCase } from '@/shared/utils';
import { useTools } from '@/ui/components/ActionComponent';
import { sleepSecond, useWallet } from '@/ui/utils';
import { chaingeMinterAddresses } from '@/ui/utils2/constants/constants';

import type { AppState } from '..';
import { selectCurrentAccount } from '../accounts/reducer';
import { accountsActions, selectCurrentKaspaAddress } from '../accounts/reducer';
import { useAppDispatch, useAppSelector } from '../hooks';
import { selectUtxos, transactionsActions } from './reducer';
import { selectNetworkId } from '../settings/reducer';
import { fetchKaspaTxActivities } from '@/ui/utils/hooks/kaspa';
import { amountToSompi, sompiToAmount } from '@/shared/utils/format';

export function useTransactionsState(): AppState['transactions'] {
  return useAppSelector((state) => state.transactions);
}

export function usePrepareSendKASCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const fromAddress = useAppSelector(selectCurrentKaspaAddress);
  const utxos = useAppSelector(selectUtxos);
  const fetchUtxos = useFetchUtxosCallback();
  return useCallback(
    async ({
      toAddressInfo,
      toAmount,
      priorityFee,
      payload
    }: {
      toAddressInfo: ToAddressInfo;
      toAmount: number;
      priorityFee?: number;
      payload?: string;
    }) => {
      let _utxos = utxos;
      if (_utxos.length === 0) {
        _utxos = await fetchUtxos();
      }
      const safeBalanceSompi = _utxos.reduce((pre, cur) => pre + BigInt(cur.entry.amount), BigInt(0));
      if (safeBalanceSompi < BigInt(amountToSompi(toAmount, 8))) {
        throw new Error(
          `Insufficient balance. Balance(${sompiToAmount(safeBalanceSompi, 8)} KAS) is lower than ${toAmount} KAS `
        );
      }

      if (!priorityFee) {
        priorityFee = 0;
      }
      let psbtHex;

      if (safeBalanceSompi === BigInt(amountToSompi(toAmount, 8))) {
        psbtHex = await wallet.prepareSendAllKAS({
          to: toAddressInfo.address,
          kasUtxos: _utxos,
          priorityFee,
          payload
        });
      } else {
        psbtHex = await wallet.prepareSendKAS({
          to: toAddressInfo.address,
          amount: toAmount,
          kasUtxos: _utxos,
          priorityFee,
          payload
        });
      }
      const result: IResultPsbtHex = JSON.parse(psbtHex);
      const rawtx = psbtHex;
      const fee = result.fee;
      dispatch(
        transactionsActions.updateKaspaTx({
          rawtx,
          psbtHex,
          fromAddress,
          priorityFee,
          payload
        })
      );
      const rawTxInfo: RawTxInfo = {
        psbtHex,
        rawtx,
        toAddressInfo,
        amount: toAmount,
        priorityFee,
        fee,
        payload
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
    async (
      rawtx: string,
      isRBF = false,
      option?: {
        payload?: string;
      }
    ) => {
      const ret = {
        success: false,
        txSeralizedJSON: '',
        error: '',
        type: TxType.SEND_KASPA
      };
      try {
        tools.showLoading(true);
        const txSeralizedJSON = await wallet.sendKaspa(rawtx, isRBF, undefined, option);
        const txObj = JSON.parse(txSeralizedJSON);
        await sleepSecond(1); // Wait for transaction synchronization
        dispatch(transactionsActions.updateKaspaTx({ txid: txObj?.id }));
        dispatch(accountsActions.expireBalance());
        ret.success = true;
        ret.txSeralizedJSON = txSeralizedJSON;
      } catch (e) {
        ret.error = (e as Error).message;
        tools.toastError(ret.error);
      } finally {
        tools.showLoading(false);
      }

      return ret;
    },
    [dispatch, tools, wallet]
  );
}

export function usePendingList() {
  const transactionsState = useTransactionsState();
  return transactionsState.pendingList;
}

export function useIncomingTx() {
  const transactionsState = useTransactionsState();
  return transactionsState.incomingTx;
}

export function useFetchUtxosCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const currentAccount = useAppSelector(selectCurrentAccount);
  return useCallback(async () => {
    const data = await wallet.getKASUtxos();
    data.sort((a, b) =>
      Number(a.entry.blockDaaScore) > Number(b.entry.blockDaaScore)
        ? -1
        : Number(a.entry.blockDaaScore) < Number(b.entry.blockDaaScore)
        ? 1
        : a.entry.amount < b.entry.amount
        ? 1
        : -1
    );
    dispatch(transactionsActions.setUtxos(data));
    let totalValue = BigInt(0);
    data.map((utxo) => {
      const amountSompi = BigInt(utxo.entry.amount);
      totalValue += amountSompi;
    });

    const _accountBalance: KaspaBalance = {
      confirm_amount: '0',
      pending_amount: '0',
      amount: '0',
      confirm_kas_amount: '0',
      pending_kas_amount: '0',
      kas_amount: '0',
      usd_value: '0'
    };
    let t = '0';
    if (totalValue != BigInt(0)) t = sompiToAmount(totalValue, 8);
    _accountBalance.amount = t;
    dispatch(
      accountsActions.setBalance({
        address: currentAccount.address,
        amount: _accountBalance.amount,
        kas_amount: _accountBalance.kas_amount,
        confirm_kas_amount: _accountBalance.confirm_kas_amount,
        pending_kas_amount: _accountBalance.pending_kas_amount,
        outgoing: _accountBalance?.pending_kas_amount ? _accountBalance?.pending_kas_amount : '0'
      })
    );
    const cachedBalance = await wallet.getAddressCacheBalance(currentAccount.address);
    if (cachedBalance.amount !== _accountBalance.amount) {
      dispatch(accountsActions.expireHistory());
    }

    const summary = await wallet.getAddressSummary(currentAccount.address);
    dispatch(accountsActions.setAddressSummary(summary));
    return data;
  }, [wallet, dispatch, currentAccount.address]);
}

export function useFetchTxActivitiesCallback() {
  const dispatch = useAppDispatch();
  const currentKasAddress = useAppSelector(selectCurrentKaspaAddress);
  const kaspaNetworkId = useAppSelector(selectNetworkId);
  return useCallback(async () => {
    const data = await fetchKaspaTxActivities(kaspaNetworkId, currentKasAddress);
    if (data) {
      data.sort((a, b) => b.block_time - a.block_time);
      dispatch(transactionsActions.setTxActivities(data));
      dispatch(transactionsActions.setIncomingTx(false));
    }
    return data;
  }, [kaspaNetworkId, currentKasAddress, dispatch]);
}

export function useReplaceTransactionCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  return useCallback(
    async (oldId: string, txFee: number) => {
      if (txFee <= 0) return;
      const res = await wallet.replaceTransaction(oldId, txFee);
      // .catch((e) => console.error('replace transaction error', e));
      if (!res) {
        console.error('replace transaction failed');
        throw new Error('replace transaction failed');
        // return;
      }
      if (res?.status && (res.status == 'replace by fee found no double' || res.status == 'no param found')) {
        dispatch(transactionsActions.removeFromPendingList(oldId));
      } else {
        dispatch(transactionsActions.replaceOldIdFromPendingList({ item: res, oldId }));
      }
    },
    [dispatch, wallet]
  );
}

export function useSafeBalance() {
  const utxos = useAppSelector(selectUtxos);
  return useMemo(() => {
    const sompi = utxos.reduce((agg, curr) => {
      return new BigNumber(curr.entry.amount).plus(agg);
    }, new BigNumber(0));
    return sompiToAmount(sompi, 8);
  }, [utxos]);
}

export function usePushKasplexTxCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const { showLoading } = useTools();
  return useCallback(
    async (
      inscribeJsonString: string,
      type: TxType,
      destAddr?: string,
      priorityFee = 0,
      protocol = KASPLEX as TProtocol
    ) => {
      const res = {
        success: false,
        txids: '',
        revealTxStr: '',
        commitTxStr: '',
        error: '',
        type,
        inscribeJsonString,
        destAddr
      };
      try {
        const txids = await wallet.signKRC20Tx(inscribeJsonString, type, priorityFee, true, false, protocol);
        await sleepSecond(2); // Wait for transaction synchronization
        const txidsObj: ISignKRC20TX = JSON.parse(txids);
        const txidReveal = txidsObj.revealId;
        dispatch(transactionsActions.updateKasplexTx({ txid: txidReveal }));
        res.txids = txids;
        res.revealTxStr = txidsObj.revealTxStr;
        res.commitTxStr = txidsObj.commitTxStr;

        dispatch(accountsActions.expireBalance());
        setTimeout(() => {
          dispatch(accountsActions.expireBalance());
        }, 2000);
        setTimeout(() => {
          dispatch(accountsActions.expireBalance());
        }, 5000);
        res.success = true;
      } catch (e) {
        log.debug(e);
        res.error = (e as Error).message;
        showLoading(false);
      }

      return res;
    },
    [dispatch, showLoading, wallet]
  );
}

export function useOrdinalsTx() {
  const transactionsState = useTransactionsState();
  return transactionsState.ordinalsTx;
}

export function useEstimateChaingeTransactionFeesCallback() {
  const wallet = useWallet();
  return useCallback(
    async ({ fromAmount, fromToken }: ChaingeFeeEstimateRequest) => {
      if (fromToken.ticker === 'KAS') {
        // KAS
        const fee = await wallet.estimateKaspaTransactionFee([[chaingeMinterAddresses.KAS, fromAmount]]);
        return fee;
      } else {
        // KRC-20
        const toAddress = ['CUSDT', 'CUSDC', 'CETH', 'CBTC', 'CXCHNG'].includes(fromToken.ticker)
          ? chaingeMinterAddresses.other
          : chaingeMinterAddresses.KRC20;

        const krc20Token = {
          tick: fromToken.ticker,
          dec: fromToken.decimals
        };
        const str = constructKRC20TransferJsonStrLowerCase(
          krc20Token.tick,
          fromAmount,
          toAddress,
          krc20Token.dec.toString() ?? '8'
        ); // const info = await this.krc20Transactions.getKRC20Info(toAddress, krc20Token, fromAmount)

        const fee = await wallet.estimateKRC20TransactionFee(str);
        return fee;
      }
    },

    [wallet]
  );
}

export function useFetchDecimalCallback() {
  const wallet = useWallet();
  return useCallback(
    async (ticker: string) => {
      if (ticker.toUpperCase() === 'KAS') {
        // KAS
        return 8;
      } else {
        // KRC-20
        const tokenInfos = await wallet.getKRC20TokenInfo(ticker?.toLowerCase());
        const dec = tokenInfos ? Number(tokenInfos[0]?.dec) : 8;
        return dec;
      }
    },

    [wallet]
  );
}
