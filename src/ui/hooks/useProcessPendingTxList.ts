import { useEffect, useState } from 'react';
import { selectCurrentKaspaAddress } from '../state/accounts/reducer';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import type { ITxInfo } from '@/shared/types';
import { selectTxActivities, transactionsActions } from '../state/transactions/reducer';
import eventBus from '@/shared/eventBus';
import { usePendingList } from '../state/transactions/hooks';
import { useWallet } from '../utils';
import { getKaspaOrgHost } from '../utils/hooks/kaspa';
import { selectNetworkId } from '../state/settings/reducer';
import log from 'loglevel';

export default function useProcessPendingTxList() {
  const kasNetworkId = useAppSelector(selectNetworkId);
  const currentAddress = useAppSelector(selectCurrentKaspaAddress);
  const dispatch = useAppDispatch();
  const pendingList = usePendingList();
  const wallet = useWallet();
  const [lastPendingTxId, setLastPendingTxId] = useState<string | undefined>();
  const transactionInfos = useAppSelector(selectTxActivities);
  useEffect(() => {
    wallet.getPendingTxDatas(currentAddress).then((res) => {
      dispatch(transactionsActions.setPendingList(res));
    });
  }, [currentAddress, dispatch, wallet, kasNetworkId]);
  useEffect(() => {
    for (let i = 0; i < transactionInfos.length; i++) {
      const id = transactionInfos[i].transaction_id;
      dispatch(transactionsActions.setStatusInPendingList({ id, status: 'success', isAccepted: true }));
      setTimeout(() => {
        dispatch(transactionsActions.removeFromPendingList(id));
      }, 4000);
    }
  }, [transactionInfos, dispatch]);
  useEffect(() => {
    const pendingTransactionHandler = (e: string) => {
      const res: { sendKasInfo?: ITxInfo; retrieveInfo?: ITxInfo; commitInfo?: ITxInfo; revealInfo?: ITxInfo } =
        JSON.parse(e);
      const res2 = res?.sendKasInfo || res?.retrieveInfo || res?.commitInfo || res?.revealInfo;
      if (res2 != undefined && res2.motherAddress == currentAddress) {
        dispatch(transactionsActions.addToPendingList(res2));
      }
    };
    const processorUtxoChangeHandler = (e: string[]) => {
      e.forEach((id) => {
        dispatch(transactionsActions.setStatusInPendingList({ id, status: 'success', isAccepted: true }));
        setTimeout(() => {
          dispatch(transactionsActions.removeFromPendingList(id));
        }, 4000);
      });
    };
    eventBus.addEventListener('pending-transaction-event', pendingTransactionHandler);
    eventBus.addEventListener('remove-pending-tx', processorUtxoChangeHandler);
    return () => {
      eventBus.removeEventListener('pending-transaction-event', pendingTransactionHandler);
      eventBus.removeEventListener('remove-pending-tx', processorUtxoChangeHandler);
    };
  }, [currentAddress, dispatch]);
  useEffect(() => {
    if (pendingList.length === 0) {
      setLastPendingTxId(undefined);
      return;
    }

    const currentTime = Date.now();
    const txs = pendingList.filter((e) => {
      const timeDiffSeconds = (currentTime - Number(e.block_time)) / 1000;
      return timeDiffSeconds > 20;
    });

    if (txs.length > 0) {
      const latestTxId = txs[txs.length - 1]?.transaction_id;
      setLastPendingTxId((prevId) => (prevId !== latestTxId ? latestTxId : prevId));
    }
  }, [pendingList]);
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (lastPendingTxId) {
      const host = getKaspaOrgHost(kasNetworkId);
      timer = setInterval(async () => {
        const id = lastPendingTxId;
        try {
          const response = await fetch(`${host}/transactions/${id}`);
          if (response.ok) {
            log.debug('successfully removed pending', id);
            wallet.removePendingTx(id);
            dispatch(transactionsActions.removeFromPendingList(id));
          }
        } catch (e) {
          console.error(e);
        }
      }, 5 * 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
        timer = undefined;
      }
    };
  }, [dispatch, kasNetworkId, lastPendingTxId, wallet]);
}
