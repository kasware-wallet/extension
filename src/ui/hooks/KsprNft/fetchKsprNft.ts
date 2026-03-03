import {
  KSPR_KRC721_MAINNET,
  KSPR_KRC721_TESTNET_10,
  KSPR_KRC721_TESTNET_11,
  KSPR_KRC721_TESTNET_12
} from '@/shared/constant';
import type { TNetworkId } from '@/shared/types';
import { useCacheKrc721StreamUrl } from '@/ui/state/settings/hooks';
import { useQuery } from '@tanstack/react-query';

export interface KsprNftResult {
  tick: string;
  buri: string;
  tokenId: string;
  opScoreMod: string;
}

export interface KsprNftImage {
  tick: string;
  tokenId: string;
  url: string;
}

export interface KsprNftJson {
  attributes: any[];
  description: string;
  image: string;
  name: string;
}
const getUrl = (networkId: TNetworkId) => {
  switch (networkId) {
    case 'mainnet':
      return KSPR_KRC721_MAINNET;
    case 'testnet-12':
      return KSPR_KRC721_TESTNET_12;
    case 'testnet-11':
      return KSPR_KRC721_TESTNET_11;
    case 'testnet-10':
      return KSPR_KRC721_TESTNET_10;
    default:
      return KSPR_KRC721_TESTNET_10;
  }
};
export interface KsprNftResponse {
  message: string;
  result: KsprNftResult[];
  next?: string;
}

export const fetchKsprNftList = async (
  address: string,
  networkId: TNetworkId,
  offset: string | undefined
): Promise<KsprNftResponse> => {
  const url = getUrl(networkId);
  let webLink = url + '/address/' + address;
  if (offset) webLink = webLink + '?offset=' + offset;

  try {
    const response = await fetch(webLink);

    if (response.ok) {
      const res: KsprNftResponse = await response.json();
      return res;
    } else {
      throw new Error(`${url} response was not ok, status: ${response.statusText}`);
    }
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

export const fetchKsprNft2 = async (address: string, networkId: TNetworkId): Promise<KsprNftImage[]> => {
  const url = getUrl(networkId);
  try {
    const response = await fetch(url + '/address/' + address);
    if (response.ok) {
      const res: KsprNftResponse = await response.json();
      if (res.message == 'success') {
        const nfts = res.result?.map((item) => {
          return {
            tick: item.tick,
            tokenId: item.tokenId,
            url: `https://cache.krc721.stream/krc721/mainnet/thumbnail/${item.tick}/${item.tokenId}`
          };
        });
        return nfts;
      } else {
        throw new Error(`${url} response was not ok, status: ${response.statusText}, message: ${res?.message}`);
      }
    }
    throw new Error(`${url} response was not ok, status: ${response.statusText}`);
  } catch (error) {
    throw new Error((error as Error).message);
  }
};
/**
 * @param address
 * @param networkId
 * @param offset e.g. offset=KANGOEGGS-2658
 * @returns
 */
export default function useKsprNftQuery(address: string, networkId: TNetworkId, offset?: string) {
  const { isLoading, isError, error, data, refetch, isFetching } = useQuery({
    queryKey: ['ksprNft', { address, networkId, offset }],
    queryFn: () => fetchKsprNftList(address, networkId, offset),
    enabled: !!address,
    staleTime: 10 * 1000 // 10 seconds
  });
  return {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  };
}

export const getCacheKrc721StreamUrl = (networkId: TNetworkId) => {
  switch (networkId) {
    case 'mainnet':
      return 'https://cache.krc721.stream/krc721/mainnet';
    case 'testnet-12':
      return 'https://cache.krc721.stream/krc721/testnet-12';
    case 'testnet-11':
      return 'https://cache.krc721.stream/krc721/testnet-11';
    case 'testnet-10':
      return 'https://cache.krc721.stream/krc721/testnet-10';
    default:
      return 'https://cache.krc721.stream/krc721/mainnet';
  }
};

export const fetchKsprNftPhoto = async (
  type: string,
  tick: string,
  id: string,
  networkId: TNetworkId
): Promise<KsprNftImage[]> => {
  const url = getCacheKrc721StreamUrl(networkId);
  try {
    const response = await fetch(url + `/${type}/${tick}/${id}`);
    if (response.ok) {
      const res: KsprNftResponse = await response.json();
      if (res.message == 'success') {
        const nfts = res.result?.map((item) => {
          return {
            tick: item.tick,
            tokenId: item.tokenId,
            url: `https://cache.krc721.stream/krc721/mainnet/thumbnail/${item.tick}/${item.tokenId}`
          };
        });
        return nfts;
      }
      throw new Error(`${url} response was not ok, status: ${response.statusText}, message: ${res?.message}`);
    }
    throw new Error(`${url} response was not ok, status: ${response.statusText}`);
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

export interface KsprNftMeta {
  name: string;
  image: string; //ipfs link
  description: string;
  attributes: { trait_type: string; value: string }[];
  data: number;
  edition: number;
}

export const fetchKsprNftMetadata = async (url: string, tick: string, id: string): Promise<KsprNftMeta> => {
  const weblink = `${url}/metadata/${tick}/${id}`;
  try {
    const response = await fetch(weblink);
    if (response.ok) {
      const res: KsprNftMeta = await response.json();
      return res;
    } else {
      throw new Error(`${weblink} response was not ok, status: ${response.statusText}`);
    }
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

export function useKsprNftMetadataQuery(tick: string, id: string) {
  const cacheKrc721StreamUrl = useCacheKrc721StreamUrl();

  return useQuery({
    queryKey: ['ksprNft', { url: cacheKrc721StreamUrl, tick, id }],
    queryFn: () => fetchKsprNftMetadata(cacheKrc721StreamUrl, tick, id),
    staleTime: 60 * 60 * 1000
  });
}

// const fetchKsprNftJsons = async (address: string, networkId: TNetworkId): Promise<KsprNftResult> => {
//   // const url = getUrl(networkId);
//   const result = await fetchKsprNftList(address, networkId);
//   const urls = result.map((item) => {
//     const buris = item.buri.split('//')?.[1];
//     const id = item.tokenId;
//     return `https://ipfs.io/ipfs/${buris}/${id}.json`;
//   });
//   const finalResults: KsprNftJson[] = [];
//   urls.forEach(async (url) => {
//     const res = await fetchKsprNftJson(url);
//     finalResults.push(res);
//   });
// };

// const fetchKsprNftJson = async (url): Promise<KsprNftJson> => {
//   try {
//     const response = await axios.get<KsprNftJson>(url);
//     log.debug('fetchKsprNftJson', response);
//     if (response?.data) {
//       return response.data;
//     } else {
//       return;
//       // throw new Error('Invalid API response');
//     }
//   } catch (error: unknown) {
//     if (axios.isAxiosError(error) && error.response?.data?.msg) {
//       throw new Error(error.response.data?.msg);
//     } else {
//       throw new Error(`Error getting kspr nft`);
//     }
//   }
// };
