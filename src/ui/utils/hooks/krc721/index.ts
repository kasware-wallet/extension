import produce from 'immer';
import { useEffect, useState } from 'react';

import type { TNetworkId } from '@/shared/types';
import { useQuery } from '@tanstack/react-query';

export const getKrc721Host = (networkId: TNetworkId) => {
  switch (networkId) {
    case 'mainnet':
      return 'https://mainnet.krc721.stream/api/v1/krc721/mainnet';
    case 'testnet-10':
      return 'https://testnet-10.krc721.stream/api/v1/krc721/testnet-10';
    case 'testnet-11':
      return 'https://testnet-11.krc721.stream/api/v1/krc721/testnet-11';
    case 'testnet-12':
      return 'https://testnet-12.krc721.stream/api/v1/krc721/testnet-12';
    default:
      return 'https://testnet-10.krc721.stream/api/v1/krc721/testnet-10';
  }
};
export const useKrc721ActivitiesQuery = (kasNetworkId: TNetworkId, kasAddress: string, contractAddress?: string) => {
  // const kasAddress = 'kaspa:qrd9da83tual6h9uskqp2ycva7z3kzs35hz330asvvu4nf9sg0e7uvup5k3cd';
  const [activities, setActivities] = useState<any[]>([]);
  const { isLoading, isError, error, data, refetch } = useQuery({
    queryKey: ['krc721Activities', { networkId: kasNetworkId, address: kasAddress, contractAddress }],
    queryFn: async () => fetchKrc721Activities(kasNetworkId, kasAddress, contractAddress),
    enabled: !!kasAddress,
    staleTime: 5 * 1000
  });
  useEffect(() => {
    if (data && data.length > 0) {
      let tempActivities: any[] = [];
      tempActivities = produce(data, (draft) => {
        draft?.sort((a, b) => (a.mtsAdd > b.mtsAdd ? -1 : a.mtsAdd < b.mtsAdd ? 1 : 0));
      });
      setActivities(tempActivities);
    }
  }, [data]);

  return {
    activities,
    isLoading,
    isError,
    error,
    refetch
  };
};
/**
 * @param contractAddress - means tick
 */
async function fetchKrc721Activities(
  networkId: TNetworkId,
  addr: string,
  contractAddress?: string
): Promise<any[] | null> {
  const host = getKrc721Host(networkId);
  let url = `${host}/ops?address=${addr}`;
  if (contractAddress) url = `${url}&tick=${contractAddress}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Network response was not ok ' + response.statusText);
  }
  const data = await response.json();
  return data.result;
}
