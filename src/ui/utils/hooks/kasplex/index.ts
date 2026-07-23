import {
  KASPLEX_FALLBACK_MAINNET,
  KASPLEX_FALLBACK_TESTNET_10,
  KASPLEX_FALLBACK_TESTNET_11,
  KASPLEX_FALLBACK_TESTNET_12
} from '@/shared/constant';
import type { IKRC20TokenInfo, IKRC20TokenInfoIssue, TNetworkId } from '@/shared/types';
import { useAppSelector } from '@/ui/state/hooks';
import { selectNetworkId } from '@/ui/state/settings/reducer';
import { useQuery } from '@tanstack/react-query';
import { fetchWithRetryAndFallback } from '@/ui/utils/fetchWithRetry';
import { getKasplexHost } from '../..';

export function useKRC20TokenInfo(tick: string) {
  const networkId = useAppSelector(selectNetworkId);
  const host = getKasplexHost(networkId);

  return useQuery({
    queryKey: [tick, host],
    queryFn: () => fetchKrc20TokenInfo(tick, host),
    staleTime: 1_000 * 60 * 60, // 1 hour
    retry: 5
  });
}

/**
 * @param ca contract address for krc20 token in issue mode
 */
export function useKRC20Blacklist(ca: string | undefined) {
  const networkId = useAppSelector(selectNetworkId);
  const host = getKasplexHost(networkId);

  return useQuery({
    queryKey: ['useKRC20Blacklist', ca, host],
    queryFn: async () => {
      if (!ca) {
        throw new Error('Contract address is required');
      }
      try {
        return await fetchKrc20Blacklist(ca, host);
      } catch (error) {
        console.error('Failed to fetch KRC20 blacklist:', error);
        throw error; // Re-throw to let react-query handle retries
      }
    },
    enabled: Boolean(ca),
    staleTime: 1_000 * 60 * 60, // 1 hour
    retry: (failureCount, error) => {
      // Don't retry for validation errors
      if (error instanceof Error && error.message === 'Contract address is required') {
        return false;
      }
      return failureCount < 5; // Retry up to 5 times
    },
    retryDelay: 1000 // 1 second between retries
  });
}

// Returns primary + fallback hosts for retry logic
export const getKasplexHosts = (networkId: TNetworkId): string[] => {
  const primary = getKasplexHost(networkId);
  let fallback: string | undefined;
  switch (networkId) {
    case 'mainnet':
      fallback = KASPLEX_FALLBACK_MAINNET;
      break;
    case 'testnet-10':
      fallback = KASPLEX_FALLBACK_TESTNET_10;
      break;
    case 'testnet-11':
      fallback = KASPLEX_FALLBACK_TESTNET_11;
      break;
    case 'testnet-12':
      fallback = KASPLEX_FALLBACK_TESTNET_12;
      break;
    default:
      break;
  }
  fallback = undefined; // TODO, fallback hosts are not available now.
  return fallback ? [primary, fallback] : [primary];
};

async function fetchKrc20TokenInfo(
  tick: string,
  host,
  includeHolders = false
): Promise<(IKRC20TokenInfo | IKRC20TokenInfoIssue)[] | null> {
  let url = `${host}/krc20/token/${tick}`;
  if (includeHolders) url = `${url}?holder=true`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Network response was not ok ' + response.statusText);
  }
  const data = await response.json();
  // log.debug('data result', data.result);
  return data.result;
}

interface IKRC20TokenBlacklistItem {
  ca: string;
  address: string;
  opScoreAdd: string;
}

async function fetchKrc20Blacklist(ca: string, host: string) {
  let data: { message: string; prev?: string; next?: string; result: IKRC20TokenBlacklistItem[] };
  const url = `${host}/krc20/blacklist/${ca}`;
  const response = await fetchWithRetryAndFallback([url]);
  data = await response.json();
  const results = data.result;
  while (data && data?.result?.length >= 50 && data?.next && data?.next?.length > 0) {
    const nextPageUrl = `${url}?next=${data?.next}`;
    const res = await fetchWithRetryAndFallback([nextPageUrl]);
    data = await res.json();
    if (data && data?.result?.length > 0) {
      data.result.forEach((item) => {
        results.push(item);
      });
    }
  }
  return results;
}
