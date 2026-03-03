import { KASPLEX_MAINNET, KASPLEX_TESTNET_10, KASPLEX_TESTNET_11, KASPLEX_TESTNET_12 } from '@/shared/constant';
import type { IKRC20TokenInfo, IKRC20TokenInfoIssue, TNetworkId } from '@/shared/types';
import { useAppSelector } from '@/ui/state/hooks';
import { selectNetworkId } from '@/ui/state/settings/reducer';
import { useQuery } from '@tanstack/react-query';

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

// export function useKRC20TokenName(tokenType: TTokenType | undefined, tick?: string, ca?: string) {
//   if (!tokenType) return { name: undefined };

//   const wallet = useWallet();
//   const networkId = useNetworkId();
//   const [name, setName] = useState<string | undefined>(undefined);

//   const host = getKasplexHost(networkId);
//   const fetchKRC20Info = async (ca: string) => {
//     const name = await wallet.getKrc20CaToName(ca);
//     if (name && name?.length > 0) return name;

//     const infos = (await fetchKrc20TokenInfo(ca, host)) as IKRC20TokenInfoIssue[] | null;
//     if (infos) {
//       const infoName = infos[0].name;
//       if (infoName && infoName.length > 0) {
//         await wallet.updateKrc20CaToName(ca, infoName);
//         return infoName;
//       }
//     }
//     return shortAddress(ca, 3);
//   };

//   useEffect(() => {
//     if (tokenType !== 'KRC20Issue' && tokenType !== 'KRC20Mint') return;
//     if (tokenType == 'KRC20Mint') setName(tick as string);
//     if (tokenType == 'KRC20Issue' && Boolean(tick)) setName(tick as string);
//     if (tokenType == 'KRC20Issue' && !tick && ca) {
//       fetchKRC20Info(ca)
//         .then((name) => {
//           if (name && name?.length > 0) setName(name);
//         })
//         .catch((err) => {
//           log.debug(err);
//         });
//     }
//   }, [ca, networkId, tick, tokenType]);

//   return {
//     name
//   };
// }
// export function useKRC20TokenDec(tokenType: TTokenType, tick?: string, ca?: string) {
//   const wallet = useWallet();
//   const networkId = useNetworkId();
//   const [dec, setDec] = useState<string | undefined>(undefined);

//   const host = getKasplexHost(networkId);
//   const fetchKRC20Info = async (ca: string | undefined) => {
//     if (!ca) return undefined;
//     const dec = await wallet.getKrc20TokenDec(ca);
//     if (dec && dec?.length > 0) return dec;

//     const infos = await fetchKrc20TokenInfo(ca, host);
//     if (infos) {
//       const infoName = infos[0].dec;
//       if (infoName && infoName.length > 0) {
//         await wallet.updateKrc20TokenDec(ca, infoName);
//         return infoName;
//       }
//     }
//     return undefined;
//   };

//   useEffect(() => {
//     if (tokenType !== 'KRC20Issue' && tokenType !== 'KRC20Mint') return;
//     let arg0 = undefined as unknown as string;
//     if (tokenType == 'KRC20Mint') arg0 = tick as string;
//     if (tokenType == 'KRC20Issue') arg0 = ca as string;

//     fetchKRC20Info(arg0)
//       .then((name) => {
//         if (name && name?.length > 0) setDec(name);
//       })
//       .catch((err) => {
//         log.debug(err);
//       });
//   }, [ca, networkId, tick, tokenType]);

//   return {
//     dec
//   };
// }

export const getKasplexHost = (networkId: TNetworkId) => {
  switch (networkId) {
    case 'mainnet':
      return KASPLEX_MAINNET;
    case 'testnet-10':
      return KASPLEX_TESTNET_10;
    case 'testnet-11':
      return KASPLEX_TESTNET_11;
    case 'testnet-12':
      return KASPLEX_TESTNET_12;
    default:
      return KASPLEX_TESTNET_10;
  }
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
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Network response was not ok ' + response.statusText);
  }
  data = await response.json();
  const results = data.result;
  while (data && data?.result?.length >= 50 && data?.next && data?.next?.length > 0) {
    const res = await fetch(`${url}?next=${data?.next}`);
    if (!res.ok) {
      throw new Error('Network response was not ok ' + res.statusText);
    }
    data = await res.json();
    if (data && data?.result?.length > 0) {
      data.result.forEach((item) => {
        results.push(item);
      });
    }
  }
  return results;
}
