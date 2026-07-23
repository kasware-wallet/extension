import { useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import log from 'loglevel';
import React, { useCallback, useEffect } from 'react';

import type { Account, AddressType, TTokenType, WalletKeyring } from '@/shared/types';
import { useWallet, type WalletController } from '@/ui/utils';
import { useKaspaPrice, useTetherPrice } from '@/ui/utils/hooks/price/usePrice';

import { sompiToAmount } from '@/shared/utils/format';
import type { AppState } from '..';
import { useRpcStatus } from '../global/hooks';
import { useAppDispatch, useAppSelector } from '../hooks';
import { useCurrentKeyring, useKeyrings } from '../keyrings/hooks';
import { keyringsActions } from '../keyrings/reducer';
import { selectNetworkId } from '../settings/reducer';
import { transactionsActions } from '../transactions/reducer';
import {
  accountsActions,
  selectAccountInscriptions,
  selectAccounts,
  selectAccountsState,
  selectAppSummary,
  selectBalanceMap,
  selectCurrentAccount,
  selectCurrentKaspaAddress,
  selectHistoryMap,
  selectTestnetTokens,
  selectTokens
} from './reducer';

export function useAccountsState(): AppState['accounts'] {
  return useAppSelector(selectAccountsState);
}

export function useCurrentAccount() {
  return useAppSelector(selectCurrentAccount);
}
export function useMainnetTokens() {
  return useAppSelector(selectTokens);
}
export function useTestnetTokens() {
  return useAppSelector(selectTestnetTokens);
}

/**
 * @param contractAddress tick in mint mode and ca min issue mode
 */
export function useKRC20Price(contractAddress: string) {
  // if (!ticker) return 0;
  const accountInscriptions = useAppSelector(selectAccountInscriptions);
  const kasPrice = useKaspaPrice();
  const inscription = accountInscriptions.list.find((item) => {
    if (contractAddress?.length > 10) {
      return item?.ca?.toLowerCase() === contractAddress?.toLowerCase();
    } else {
      return item?.tick?.toLowerCase() === contractAddress?.toLowerCase();
    }
  });
  if (inscription) {
    const price = new BigNumber(inscription.priceInKas).times(kasPrice).toNumber();
    return price;
  }
  return 0;
}

export function useAccounts() {
  return useAppSelector(selectAccounts);
}

export function useAccountBalance(address?: string) {
  const balanceMap = useAppSelector(selectBalanceMap);
  const currentAccount = useCurrentAccount();
  if (address) {
    return (
      balanceMap[address] || {
        amount: '0',
        expired: false,
        confirm_kas_amount: '0',
        pending_kas_amount: '0',
        outgoing: '0'
      }
    );
  }
  return (
    balanceMap[currentAccount.address] || {
      amount: '0',
      expired: true,
      confirm_kas_amount: '0',
      pending_kas_amount: '0',
      outgoing: '0'
    }
  );
}

export function useAccountInscriptions() {
  const accountInscriptions = useAppSelector(selectAccountInscriptions);
  return accountInscriptions;
}

// export function useAddressSummary() {
//   const accountsState = useAccountsState();
//   return accountsState.addressSummary;
// }

// export function useKRC20LaunchStatus() {
//   const accountsState = useAccountsState();
//   return accountsState.krc20LaunchStatus;
// }

export function useAppSummary() {
  return useAppSelector(selectAppSummary);
}

export function useUnreadAppSummary() {
  const summary = useAppSummary();
  return summary.apps.find((w) => w.time && summary.readTabTime && w.time > summary.readTabTime);
}

export function useReadTab() {
  const wallet = useWallet();
  const dispatch = useAppDispatch();
  // const krc20LaunchStatus = useKRC20LaunchStatus();
  return useCallback(
    async (name: 'app' | 'home' | 'settings') => {
      await wallet.readTab();
      if (name == 'app') {
        const appSummary = await wallet.getAppSummary();
        dispatch(accountsActions.setAppSummary(appSummary));
        // const status = await wallet.getKRC20LaunchStatus();
        // dispatch(accountsActions.setKRC20LaunchStatus(status));
      }
    },
    // [dispatch, wallet, appSummary, krc20LaunchStatus]
    [dispatch, wallet]
  );
}

export function useReadApp() {
  const wallet = useWallet();
  const dispatch = useAppDispatch();
  // const krc20LaunchStatus = useKRC20LaunchStatus();
  return useCallback(
    async (id: number) => {
      await wallet.readApp(id);
      const appSummary = await wallet.getAppSummary();
      dispatch(accountsActions.setAppSummary(appSummary));
      // const status = await wallet.getKRC20LaunchStatus();
      // dispatch(accountsActions.setKRC20LaunchStatus(status));
    },
    // [dispatch, wallet, appSummary, krc20LaunchStatus]
    [dispatch, wallet]
  );
}

export function useHistory() {
  const historyMap = useAppSelector(selectHistoryMap);
  const address = useAccountAddress();
  return historyMap[address] || { list: [], expired: true };
}

export function useAccountAddress() {
  return useAppSelector(selectCurrentKaspaAddress);
}

export function useSetCurrentAccountCallback() {
  const dispatch = useAppDispatch();
  return useCallback(
    (account: Account) => {
      dispatch(accountsActions.setCurrent(account));
    },
    [dispatch]
  );
}

export function useImportAccountCallback() {
  const wallet = useWallet();
  const dispatch = useAppDispatch();
  const currentKeyring = useCurrentKeyring();
  return useCallback(
    async (privateKey: string, addressType: AddressType) => {
      let success = false;
      let error;
      try {
        const alianName = await wallet.getNextAlianName(currentKeyring);
        await wallet.createKeyringWithPrivateKey(privateKey, addressType, alianName);
        const currentAccount = await wallet.getCurrentAccount();
        dispatch(accountsActions.setCurrent(currentAccount));

        success = true;
      } catch (e) {
        log.debug(e);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error = (e as any).message;
      }
      return { success, error };
    },
    [dispatch, wallet, currentKeyring]
  );
}

export function useChangeAccountNameCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const currentAccount = useCurrentAccount();
  return useCallback(
    async (name: string) => {
      await wallet.updateAlianName(currentAccount.pubkey, name);
      dispatch(accountsActions.setCurrentAccountName(name));
    },
    [dispatch, wallet, currentAccount]
  );
}

export function useChangeAddressFlagCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const currentAccount = useCurrentAccount();
  return useCallback(
    async (isAdd: boolean, flag: number) => {
      const account = isAdd
        ? await wallet.addAddressFlag(currentAccount, flag)
        : await wallet.removeAddressFlag(currentAccount, flag);
      dispatch(accountsActions.setCurrentAddressFlag(account.flag));
    },
    [dispatch, wallet, currentAccount]
  );
}

export function useFetchBalanceCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const currentAccount = useCurrentAccount();
  return useCallback(async () => {
    if (!currentAccount.address) return;
    // get utxos
    dispatch(transactionsActions.setUtxos([]));
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
    const total = data.reduce((agg, curr) => {
      return BigInt(curr.entry.amount) + BigInt(agg);
    }, BigInt(0));
    const totalAmount = sompiToAmount(total, 8);
    const cachedBalance = await wallet.getAddressCacheBalance(currentAccount.address);
    // const _accountBalance = await wallet.getAddressBalance(currentAccount.address);
    dispatch(
      accountsActions.setBalance({
        address: currentAccount.address,
        amount: totalAmount,
        kas_amount: totalAmount,
        confirm_kas_amount: totalAmount,
        pending_kas_amount: '0',
        outgoing: '0'
      })
    );
    if (cachedBalance.amount !== totalAmount) {
      dispatch(accountsActions.expireHistory());
    }

    const summary = await wallet.getAddressSummary(currentAccount.address);
    dispatch(accountsActions.setAddressSummary(summary));
  }, [dispatch, wallet, currentAccount]);
}

const fetchKeyringBalances = async (wallet: WalletController, keyring: WalletKeyring) => {
  const accounts = keyring.accounts;
  const addresses: string[] = accounts.map((item) => item.address);
  if (!addresses || addresses.length == 0) return { balances: [], totalBalance: 0 };

  const _accountsBalanceArray = await wallet.getAddressesBalance(addresses);

  interface BalanceItem {
    address: string;
    amount: string;
    kas_amount: string;
    confirm_kas_amount: string;
    pending_kas_amount: string;
  }
  const balanceArray: BalanceItem[] = [];
  for (let i = 0; i < _accountsBalanceArray.length; i++) {
    balanceArray.push({
      address: addresses[i],
      amount: _accountsBalanceArray[i].amount,
      kas_amount: _accountsBalanceArray[i].kas_amount,
      confirm_kas_amount: _accountsBalanceArray[i].confirm_kas_amount,
      pending_kas_amount: _accountsBalanceArray[i].pending_kas_amount
    });
  }

  // calculate total balance
  const balanceKas = _accountsBalanceArray.reduce((pre, cur) => new BigNumber(pre).plus(cur?.amount).toNumber(), 0);

  return {
    balances: balanceArray,
    totalBalance: balanceKas
  };
};

export function useFetchBalancesQuery() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const keyring = useCurrentKeyring();
  const kasNetworkId = useAppSelector(selectNetworkId);
  const rpcStatus = useRpcStatus();

  const query = useQuery({
    queryKey: ['keyringBalances', kasNetworkId, keyring.key, keyring.accounts.map((a) => a.address)],
    queryFn: () => fetchKeyringBalances(wallet, keyring),
    enabled: keyring.accounts.length > 0 && rpcStatus,
    staleTime: 30000, // 30 seconds
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  useEffect(() => {
    if (query.data) {
      const { balances, totalBalance } = query.data;
      if (balances && balances.length > 0) {
        dispatch(accountsActions.setBalances(balances));
      }
      if (typeof totalBalance === 'number') {
        dispatch(keyringsActions.setKeyringBalanceKas({ key: keyring.key, balanceKas: totalBalance }));
      }
    }
  }, [query.data, dispatch, keyring.key]);

  return query;
}

// Pure data fetching function without side effects - reused by both hooks below
const fetchKeyringsBalances = async (
  wallet: WalletController,
  keyrings: WalletKeyring[]
): Promise<Array<{ key: string; balanceKas: number }>> => {
  if (!keyrings.length) return [];

  const balancePromises = keyrings.map(async (keyring) => {
    const addresses: string[] = keyring.accounts.map((item) => item.address);
    if (!addresses || addresses.length === 0) {
      return { key: keyring.key, balanceKas: 0 };
    }

    try {
      const _accountsBalanceArray = await wallet.getAddressesBalance(addresses);
      const balanceKas = _accountsBalanceArray.reduce(
        (pre, cur) => pre.plus(new BigNumber(cur?.amount || '0')),
        new BigNumber(0)
      );
      return { key: keyring.key, balanceKas: Number(balanceKas) };
    } catch (error) {
      console.error(`Failed to fetch balance for keyring ${keyring.key}:`, error);
      return { key: keyring.key, balanceKas: 0 };
    }
  });

  const results = await Promise.allSettled(balancePromises);
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    console.error(`Failed to fetch balance for keyring at index ${index}:`, result.reason);
    return { key: keyrings[index].key, balanceKas: 0 };
  });
};

export function useFetchKeyringsBalancesCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const keyrings = useKeyrings();
  return useCallback(async () => {
    const balances = await fetchKeyringsBalances(wallet, keyrings);
    balances.forEach((balance) => {
      dispatch(keyringsActions.setKeyringBalanceKas(balance));
    });
  }, [dispatch, wallet, keyrings]);
}

export function useKeyringsBalancesQuery() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const keyrings = useKeyrings();
  const kasNetworkId = useAppSelector(selectNetworkId);
  const rpcStatus = useRpcStatus();

  const query = useQuery<Array<{ key: string; balanceKas: number }>>({
    queryKey: ['keyringsBalances', kasNetworkId, keyrings.map((k) => k.key)],
    queryFn: () => fetchKeyringsBalances(wallet, keyrings),
    enabled: keyrings.length > 0 && rpcStatus,
    staleTime: 20 * 1000, // 20 seconds
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Handle side effects separately
  const { data: balances } = query;

  // Use useEffect to update Redux state when data changes
  React.useEffect(() => {
    if (balances && Array.isArray(balances) && balances.length > 0) {
      balances.forEach((balance) => {
        dispatch(keyringsActions.setKeyringBalanceKas(balance));
      });
    }
  }, [balances, dispatch]);

  return query;
}

export function useReloadAccounts() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  return useCallback(async () => {
    const keyrings = await wallet.getKeyrings();
    dispatch(keyringsActions.setKeyrings(keyrings));

    const currentKeyring = await wallet.getCurrentKeyring();
    dispatch(keyringsActions.setCurrent(currentKeyring));

    const _accounts = await wallet.getAccounts();
    dispatch(accountsActions.setAccounts(_accounts));

    const account = await wallet.getCurrentAccount();
    dispatch(accountsActions.setCurrent(account));
    dispatch(accountsActions.expireBalance());
  }, [dispatch, wallet]);
}

export function useFetchInscriptionsQuery() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const currentAccount = useCurrentAccount();
  const tetherPrice = useTetherPrice();
  const kasPrice = useKaspaPrice();
  const kasNetworkId = useAppSelector(selectNetworkId);

  const query = useQuery({
    queryKey: ['inscriptions', currentAccount.address, kasNetworkId],
    queryFn: async () => {
      if (!currentAccount.address) {
        return [];
      }

      try {
        const [inscriptions, priceList] = await Promise.all([
          wallet.getAddressInscriptions(currentAccount.address),
          wallet.fetchKRC20TokenPrice()
        ]);

        return processInscriptions(inscriptions, priceList, tetherPrice.data, kasPrice);
      } catch (error) {
        console.error('Failed to fetch inscriptions:', error);
        throw error;
      }
    },
    enabled: !!currentAccount.address && (kasNetworkId === 'mainnet' || kasNetworkId === 'testnet-10'),
    staleTime: 1000 * 20, // 20 sec
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  useEffect(() => {
    if (query.data && currentAccount.address) {
      dispatch(
        accountsActions.setInscriptions({
          address: currentAccount.address,
          list: query.data
        })
      );
    }
  }, [query.data, currentAccount.address, dispatch]);

  return query;
}

function processInscriptions(
  inscriptions: any[],
  priceList: any[],
  tetherPrice: number | undefined,
  kasPrice: number | undefined
) {
  const processedInscriptions = inscriptions.map((item) => {
    const tokenType: TTokenType = item?.ca ? 'KRC20Issue' : 'KRC20Mint';

    if (item?.tick?.toLowerCase() === 'cusdt' && tokenType === 'KRC20Mint') {
      return {
        ...item,
        tokenType,
        priceInKas: tetherPrice && kasPrice && Number(kasPrice) > 0 ? tetherPrice / Number(kasPrice) : 0
      };
    } else if (tokenType === 'KRC20Issue') {
      const priceInKas = priceList?.find((p) => p.ticker.toLowerCase() === item?.ca?.toLowerCase())?.price?.floorPrice;
      return {
        ...item,
        tokenType,
        priceInKas: priceInKas || 0
      };
    } else {
      const priceInKas = priceList?.find((p) => p.ticker.toLowerCase() === item?.tick?.toLowerCase())?.price
        ?.floorPrice;
      return {
        ...item,
        tokenType,
        priceInKas: priceInKas || 0
      };
    }
  });

  processedInscriptions.sort((a, b) => {
    const aValue = (Number(a.balance) / Math.pow(10, Number(a.dec))) * a.priceInKas;
    const bValue = (Number(b.balance) / Math.pow(10, Number(b.dec))) * b.priceInKas;
    return bValue > aValue ? 1 : -1;
  });

  return processedInscriptions;
}

export function useFetchInscriptionsCallback() {
  const { refetch } = useFetchInscriptionsQuery();
  return useCallback(async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Failed to fetch inscriptions:', error);
      throw error;
    }
  }, [refetch]);
}
