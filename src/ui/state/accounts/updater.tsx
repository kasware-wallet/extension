/* eslint-disable @typescript-eslint/no-empty-function */
import { useCallback, useEffect, useRef } from 'react';

import eventBus from '@/shared/eventBus';
import { Account } from '@/shared/types';
import { sompiToKas, useWallet } from '@/ui/utils';
import { IBalanceEvent } from 'kaspa-wasm';

import { useIsUnlocked } from '../global/hooks';
import { useAppDispatch } from '../hooks';
import { useFetchTxActivitiesCallback } from '../transactions/hooks';
import { transactionsActions } from '../transactions/reducer';
import { useAccountBalance, useCurrentAccount, useFetchBalanceCallback, useReloadAccounts } from './hooks';
import { accountActions } from './reducer';

export default function AccountUpdater() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const currentAccount = useCurrentAccount();
  const isUnlocked = useIsUnlocked();
  const balance = useAccountBalance();
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

  const fetchBalance = useFetchBalanceCallback();
  const fetchTxActivities = useFetchTxActivitiesCallback();
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
  }, [fetchBalance, wallet, isUnlocked, self]);

  useEffect(() => {
    const accountChangeHandler = (account: Account) => {
      if (account && account.address) {
        dispatch(accountActions.setCurrent(account));
      }
    };
    eventBus.addEventListener('accountsChanged', accountChangeHandler);
    eventBus.addEventListener('utxosChangedNotification', () => {
      dispatch(accountActions.expireBalance());
      dispatch(transactionsActions.setIncomingTx(true));
      setTimeout(() => {
        fetchTxActivities()
        console.log('utxosChangedNotification true')
      }, 15000);
    });

    eventBus.addEventListener('processor-balance-event', (event: IBalanceEvent) => {
      const amount = sompiToKas(event.balance?.mature);
      const pending = sompiToKas(event.balance?.pending);
      const outgoing = sompiToKas(event.balance?.outgoing);
      dispatch(
        accountActions.setBalance({
          address: currentAccount.address,
          amount: amount,
          kas_amount: amount,
          confirm_kas_amount: '0',
          pending_kas_amount: pending,
          outgoing
        })
      );
      wallet.expireUICachedData(currentAccount.address);
      dispatch(accountActions.expireHistory());
    });
    eventBus.addEventListener('eventbus-sink-blue-score-changed', (event: number) => {
      dispatch(accountActions.setBlueScore(event));
    });
    return () => {
      eventBus.removeEventListener('accountsChanged', accountChangeHandler);
      eventBus.removeEventListener('utxosChangedNotification', () => {
        // console.log('removed utxo changed');
      });
      eventBus.removeEventListener('processor-balance-event', () => {});
      eventBus.removeEventListener('eventbus-sink-blue-score-changed', () => {});
      wallet.disconnectRpc();
    };
  }, [dispatch]);

  return null;
}
