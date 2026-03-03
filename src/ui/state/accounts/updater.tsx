import log from 'loglevel';
import { useCallback, useEffect, useRef } from 'react';

import eventBus from '@/shared/eventBus';
import type { Account } from '@/shared/types';
import { useWallet } from '@/ui/utils';

import { useIsUnlocked, useRpcStatus } from '../global/hooks';
import { globalActions } from '../global/reducer';
import { useAppDispatch, useAppSelector } from '../hooks';
import { useAutoLockMinutes } from '../settings/hooks';
import { transactionsActions } from '../transactions/reducer';
import { useCurrentAccount, useFetchBalanceCallback, useReloadAccounts } from './hooks';
import { accountsActions, selectAccountBalance } from './reducer';
import { sompiToAmount } from '@/shared/utils/format';

export default function AccountUpdater() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const currentAccount = useCurrentAccount();
  const isUnlocked = useIsUnlocked();
  const balance = useAppSelector((s) => selectAccountBalance(s, undefined));
  const autoLockMinutes = useAutoLockMinutes();
  const selfRef = useRef({
    preAccountKey: '',
    loadingBalance: false,
    loadingHistory: false
  });
  const self = selfRef.current;

  const reloadAccounts = useReloadAccounts();
  const onCurrentChange = useCallback(async () => {
    if (isUnlocked && currentAccount && currentAccount.key != self.preAccountKey) {
      self.preAccountKey = currentAccount.key;

      // setLoading(true);

      reloadAccounts();

      // setLoading(false);
    }
  }, [dispatch, currentAccount, wallet, isUnlocked]);

  useEffect(() => {
    onCurrentChange();
  }, [currentAccount && currentAccount.key, isUnlocked]);
  const rpcStatus = useRpcStatus();
  const fetchBalance = useFetchBalanceCallback();
  useEffect(() => {
    if (self.loadingBalance) {
      return;
    }
    if (!isUnlocked) {
      return;
    }
    if (!balance.expired) {
      return;
    }
    self.loadingBalance = true;
    fetchBalance().finally(() => {
      self.loadingBalance = false;
    });
  }, [fetchBalance, wallet, isUnlocked, self, rpcStatus]);

  useEffect(() => {
    log.debug('from updater');
    wallet.handleRpcConnect().catch((e) => {
      log.debug(e.message);
    });
    const handleRpcStatus = (e: string) => {
      if (e === 'connected') {
        dispatch(globalActions.updateRpcStatus({ rpcStatus: true }));
      } else {
        dispatch(globalActions.updateRpcStatus({ rpcStatus: false }));
        if (isUnlocked) {
          log.debug('start to connect from updater');
          wallet.handleRpcConnect().catch((e) => {
            log.debug(e);
          });
        }
      }
    };
    eventBus.addEventListener('rpcstatus', handleRpcStatus);
    return () => {
      eventBus.removeEventListener('rpcstatus', handleRpcStatus);
    };
  }, [dispatch, isUnlocked, wallet]);

  useEffect(() => {
    const accountChangeHandler = (account: Account) => {
      if (account && account.address) {
        dispatch(accountsActions.setCurrent(account));
      }
    };
    const processorBalanceHandler = (event) => {
      const amount = sompiToAmount(event.balance?.mature, 8);
      const pending = sompiToAmount(event.balance?.pending, 8);
      const outgoing = sompiToAmount(event.balance?.outgoing, 8);
      const address = event.address;
      dispatch(
        accountsActions.setBalance({
          address,
          amount: amount,
          kas_amount: amount,
          confirm_kas_amount: '0',
          pending_kas_amount: pending,
          outgoing
        })
      );
      // wallet.expireUICachedData(currentAccount.address);
      dispatch(accountsActions.expireHistory());
    };
    const blueScoreHandler = (event) => {
      dispatch(accountsActions.setBlueScore(event));
    };
    const utxosChangedHandler = () => {
      dispatch(accountsActions.expireBalance());
      dispatch(transactionsActions.setIncomingTx(true));
      // setTimeout(() => {
      //   fetchTxActivities();
      // }, 15000);
    };
    eventBus.addEventListener('accountsChanged', accountChangeHandler);
    eventBus.addEventListener('utxosChangedNotification', utxosChangedHandler);
    eventBus.addEventListener('processor-balance-event', processorBalanceHandler);
    eventBus.addEventListener('eventbus-sink-blue-score-changed', blueScoreHandler);
    return () => {
      eventBus.removeEventListener('accountsChanged', accountChangeHandler);
      eventBus.removeEventListener('utxosChangedNotification', utxosChangedHandler);
      eventBus.removeEventListener('processor-balance-event', processorBalanceHandler);
      eventBus.removeEventListener('eventbus-sink-blue-score-changed', blueScoreHandler);
    };
  }, [dispatch]);

  const extHandleSystemIdle = useCallback(
    (state: 'idle' | 'locked' | 'active') => {
      if (state === 'idle' || state === 'locked') {
        wallet.getBatchMintStatus().then((status) => {
          if (status == false) {
            wallet.lockWallet().then(() => {
              window.location.reload();
            });
          }
        });
      }
    },
    [wallet]
  );
  useEffect(() => {
    if (isUnlocked) {
      log.debug('unlocked');
      if (chrome?.idle?.setDetectionInterval) chrome.idle.setDetectionInterval(60 * autoLockMinutes);
      if (chrome?.idle?.onStateChanged) chrome.idle.onStateChanged.addListener(extHandleSystemIdle);
    } else {
      log.debug('locked');
      if (chrome?.idle?.onStateChanged) {
        chrome.idle.onStateChanged.removeListener(extHandleSystemIdle);
      } else {
        log.debug('chrome idle is not ready');
      }
    }
    return () => {
      if (chrome?.idle?.onStateChanged) chrome.idle.onStateChanged.removeListener(extHandleSystemIdle);
    };
  }, [extHandleSystemIdle, isUnlocked, autoLockMinutes]);
  useEffect(() => {
    const lockHandler = () => {
      dispatch(globalActions.update({ isUnlocked: false }));
    };
    eventBus.addEventListener('lock', lockHandler);
    return () => {
      eventBus.removeEventListener('lock', lockHandler);
    };
  }, [dispatch]);
  return null;
}
