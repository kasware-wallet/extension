import useDebounceValue from '@/evm/ui/hooks/useDebounceValue';
import type {
  Account,
  IKasBalance,
  IKRC20Deploy,
  IKRC20Mint,
  IKRC20TokenInfo,
  IKRC20TokenInfoIssue,
  IKRC20Transfer,
  TNetworkId
} from '@/shared/types';
import { useAppDispatch } from '@/ui/state/hooks';
import { transactionsActions } from '@/ui/state/transactions/reducer';
import ErrorMessages from '@/ui/utils2/constants/errorMessages';
import type { KRC20TokenListForAddress, TokenFromApi } from '@/ui/utils2/interfaces';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import produce from 'immer';
import { useEffect, useMemo, useState } from 'react';

import { getKasplexHost } from '.';
import { useWallet } from '../../WalletContext';
import { getApiBase } from './fetchHelper';

const fetchKrc20AddressTokenList = async (kasNetworkId: TNetworkId, address: string) => {
  const apiBase = getApiBase(kasNetworkId);

  try {
    let allTokens: TokenFromApi[] = [];
    let nextPage: string | null = null;

    do {
      const params = new URLSearchParams();
      if (nextPage) {
        params.append('next', nextPage);
      }

      const response = await axios.get<KRC20TokenListForAddress>(
        `https://${apiBase}.kasplex.org/v1/krc20/address/${address}/tokenlist?${params.toString()}`
      );

      if (response.data && response.data.result) {
        allTokens = [...allTokens, ...response.data.result];
        nextPage = response.data.next;
      } else if (response.status === 204) {
        throw new Error(ErrorMessages.KRC20.KASPLEX_204);
      } else {
        throw new Error(ErrorMessages.KRC20.KASPLEX_UNKNOWN(response.status));
      }
    } while (nextPage);

    return allTokens;
  } catch (error) {
    console.error(`Error fetching KRC20 token list for address ${address}:`, error);
    throw error;
  }
};

export const useIsKrc20QueryEnabled = (
  rpcStatus: boolean,
  kasBalance: IKasBalance,
  currentAccount: Account,
  selectedNetwork: string
) => {
  return useMemo(() => {
    if (!(currentAccount.address.length > 0)) return false;
    const address = currentAccount.address;
    if (rpcStatus && selectedNetwork === 'mainnet' && address.startsWith('kaspa:')) {
      return true;
    }
    // return kaspa.connected && selectedNetwork === 'testnet-10' && address.startsWith('kaspatest:');
    return rpcStatus && selectedNetwork === 'testnet-10' && address.startsWith('kaspatest:');
  }, [currentAccount.address, rpcStatus, selectedNetwork]);
};

export const useKrc20TokensQuery = (kasNetworkId: TNetworkId, account: Account, isQueryEnabled: boolean) => {
  return useQuery({
    queryKey: ['krc20Tokens', { selectedNode: kasNetworkId, address: account.address }],
    queryFn: async () => fetchKrc20AddressTokenList(kasNetworkId, account.address),
    enabled: isQueryEnabled,
    staleTime: 10 * 1000
  });
};
/**
 *
 * @param contractAddress - means tick in krc20 mint mode and ca in krc20 issue mode
 */
export const useKrc20ActivitiesQuery = (kasNetworkId: TNetworkId, kasAddress: string, contractAddress?: string) => {
  const [activities, setActivities] = useState<IKRC20Transfer[] | IKRC20Mint[] | IKRC20Deploy[]>([]);
  const dispatch = useAppDispatch();
  const { isLoading, isError, error, data, refetch } = useQuery({
    queryKey: ['krc20Activities', { networkId: kasNetworkId, address: kasAddress, contractAddress }],
    queryFn: async () => fetchKrc20Activities(kasNetworkId, kasAddress, contractAddress),
    enabled: !!kasAddress,
    staleTime: 5 * 1000
  });
  useEffect(() => {
    if (data && data.length > 0) {
      let tempActivities: IKRC20Transfer[] | IKRC20Mint[] | IKRC20Deploy[] = [];
      tempActivities = produce(data, (draft) => {
        draft?.sort((a, b) => (a.mtsAdd > b.mtsAdd ? -1 : a.mtsAdd < b.mtsAdd ? 1 : 0));
      });
      setActivities(tempActivities);
      dispatch(transactionsActions.setKrc20Activities(tempActivities));
    }
  }, [data, dispatch]);

  return {
    activities,
    isLoading,
    isError,
    error,
    refetch
  };
};
/**
 * @param contractAddress - means tick in krc20 mint mode and ca in krc20 issue mode
 */
async function fetchKrc20Activities(
  networkId: TNetworkId,
  addr: string,
  contractAddress?: string
): Promise<IKRC20Transfer[] | IKRC20Mint[] | IKRC20Deploy[] | null> {
  const host = getKasplexHost(networkId);
  let url = `${host}/krc20/oplist?address=${addr}`;
  if (contractAddress) url = `${url}&tick=${contractAddress}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Network response was not ok ' + response.statusText);
  }
  const data = await response.json();
  return data.result;
}

/**
 *
 * @param contractAddress - tick in krc20 mint mode and ca in krc20 issue mode
 */
export const useKrc20TokenInfoQuery = (
  kasNetworkId: TNetworkId,
  contractAddress: string,
  includeHolders = false,
  enableQuery = true
) => {
  const debouncedTick = useDebounceValue(contractAddress, 250);

  const { isLoading, isError, error, data, refetch } = useQuery({
    queryKey: ['krc20TokenInfo', { networkId: kasNetworkId, contractAddress: debouncedTick, includeHolders }],
    queryFn: async () => fetchKrc20TokenInfo(kasNetworkId, debouncedTick, includeHolders),
    enabled: !!debouncedTick && enableQuery,
    staleTime: 30 * 1000
  });

  return {
    data,
    isLoading,
    isError,
    error,
    refetch
  };
};
/**
 * @param contractAddress - means tick in krc20 mint mode and ca in krc20 issue mode
 */
async function fetchKrc20TokenInfo(
  networkId: TNetworkId,
  contractAddress: string,
  includeHolders = false
): Promise<IKRC20TokenInfo | IKRC20TokenInfoIssue | null> {
  try {
    const host = getKasplexHost(networkId);
    let url = `${host}/krc20/token/${contractAddress}`;
    if (includeHolders) url = `${url}?holder=true`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }
    const data = await response.json();
    if (data.result && data.result.length > 0) {
      return data.result[0];
    } else {
      throw new Error('No token info found for the given contract address');
    }
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(e.message);
    } else {
      throw new Error(JSON.stringify(e));
    }
  }
}
/**
 * Hook to fetch KRC20 token name and decimal information with caching
 * @param kasNetworkId - The Kaspa network ID
 * @param contractAddress - Contract address (tick in krc20 mint mode, ca in krc20 issue mode)
 */
export function useKrc20DecName(kasNetworkId: TNetworkId, contractAddress: string) {
  const wallet = useWallet();
  const [nameDec, setNameDec] = useState<{ name: string; dec: string } | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedContractAddress = useDebounceValue(contractAddress, 250);

  // Improved type guards with better type safety
  const isTokenInfoIssue = (token: unknown): token is IKRC20TokenInfoIssue => {
    return Boolean(
      token && typeof token === 'object' && 'ca' in token && typeof (token as any).ca === 'string' && 'name' in token
    );
  };

  useEffect(() => {
    let isMounted = true;
    let shouldQueryApi = false;

    const fetchTokenInfo = async () => {
      if (!debouncedContractAddress) return;

      setIsLoading(true);
      setError(null);

      try {
        // 1. First try to get from wallet cache
        try {
          const cachedNameDec = await wallet.getKrc20DecName(kasNetworkId, debouncedContractAddress);
          if (cachedNameDec && isMounted) {
            setNameDec(cachedNameDec);
            setIsLoading(false);
            return;
          } else {
            shouldQueryApi = true;
          }
        } catch (cacheError) {
          console.warn('Error fetching from wallet cache, falling back to API:', cacheError);
          shouldQueryApi = true;
        }

        // 2. If not in cache or cache error, query API
        if (shouldQueryApi) {
          const apiData = await fetchKrc20TokenInfo(kasNetworkId, debouncedContractAddress, false);

          if (!isMounted) return;

          if (apiData) {
            let resolvedContractAddress: string;
            let resolvedName: string;

            if (isTokenInfoIssue(apiData)) {
              resolvedContractAddress = apiData.ca;
              resolvedName = apiData.name;
            } else {
              resolvedContractAddress = apiData.tick;
              resolvedName = apiData.tick;
            }

            const resolvedDec = apiData.dec;
            const newNameDec = { name: resolvedName, dec: resolvedDec };

            setNameDec(newNameDec);

            // Update wallet cache
            try {
              await wallet.updateKrc20DecName(kasNetworkId, resolvedContractAddress, resolvedDec, resolvedName);
            } catch (updateError) {
              console.warn('Failed to update wallet cache:', updateError);
            }
          } else {
            setError('Invalid token data received from API');
          }
        }
      } catch (fetchError) {
        if (isMounted) {
          console.error('Error fetching KRC20 token info:', fetchError);
          setError(fetchError instanceof Error ? fetchError.message : 'Unknown error occurred');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTokenInfo();

    return () => {
      isMounted = false;
    };
  }, [debouncedContractAddress, kasNetworkId, wallet]);

  return {
    name: nameDec?.name,
    dec: nameDec?.dec,
    isLoading,
    error,
    isError: Boolean(error)
  };
}
