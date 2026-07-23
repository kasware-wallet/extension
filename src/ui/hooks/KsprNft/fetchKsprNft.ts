import {
  KSPR_KRC721_MAINNET,
  KSPR_KRC721_TESTNET_10,
  KSPR_KRC721_TESTNET_11,
  KSPR_KRC721_TESTNET_12
} from '@/shared/constant';
import type { TNetworkId } from '@/shared/types';
import { useCacheKrc721StreamUrl } from '@/ui/state/settings/hooks';
import { useQuery } from '@tanstack/react-query';
import { getJson } from '../fetchJSON';

interface KsprNftResult {
  tick: string;
  buri: string;
  tokenId: string;
  opScoreMod: string;
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

const fetchKsprNftList = async (
  address: string,
  networkId: TNetworkId,
  offset: string | undefined
): Promise<KsprNftResponse> => {
  const url = getUrl(networkId);
  let webLink = url + '/address/' + address;
  if (offset) webLink = webLink + '?offset=' + offset;
  return getJson(webLink);
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

export interface KsprNftMeta {
  name: string;
  image: string; //ipfs link
  description: string;
  attributes: { trait_type: string; value: string }[];
  data: number;
  edition: number;
}

const fetchKsprNftMetadata = async (url: string, tick: string, id: string): Promise<KsprNftMeta> => {
  return getJson(`${url}/metadata/${tick}/${id}`);
};

export function useKsprNftMetadataQuery(tick: string, id: string) {
  const cacheKrc721StreamUrl = useCacheKrc721StreamUrl();

  return useQuery({
    queryKey: ['ksprNft', { url: cacheKrc721StreamUrl, tick, id }],
    queryFn: () => fetchKsprNftMetadata(cacheKrc721StreamUrl, tick, id),
    staleTime: 60 * 60 * 1000
  });
}
