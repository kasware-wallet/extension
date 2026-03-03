import type { ConfigJSON, IKRC20TokenIntro } from '@/shared/types';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import log from 'loglevel';
import { getBase64JSON, getJson } from '../fetchJSON';
import { fetchWithCache, KASPA_LAYER2_CHAIN_ID_ARRAY } from '@kasware-wallet/common';
import { KASWARE_IO_KRC20_PRICE } from '@/shared/constant';
export const useKrc20TokenSocialInfosQuery = () => {
  const { isLoading, isError, error, data, refetch } = useQuery({
    queryKey: ['krc20TokenSocialInfos'],
    queryFn: async () => fetchKrc20TokenSocialInfos(),
    staleTime: 24 * 60 * 60 * 1000 // 24 hours
  });

  return {
    data,
    isLoading,
    isError,
    error,
    refetch
  };
};
async function fetchKrc20TokenSocialInfos(): Promise<{ [tick: string]: IKRC20TokenIntro } | undefined> {
  try {
    const jsonFile = await getBase64JSON(process.env.KASWARE_IO_KRC20S as string);
    const res = jsonFile?.krc20s;
    return res;
  } catch (e) {
    log.debug((e as Error).message);
    throw new Error('Network response issue: ' + (e as Error).message);
    // return undefined;
  }
}
export function useQueryConfigJSON(): UseQueryResult<ConfigJSON> {
  return useQuery({
    queryKey: ['config.json'],
    queryFn: () => getBase64JSON(process.env.KASWARE_IO_CONFIG as string),
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
}
export function useQueryNativePriceMap(): UseQueryResult<Record<string, number>> {
  return useQuery({
    queryKey: ['NativePriceMap'],
    queryFn: async () => {
      const evmPrices = await fetchWithCache(KASWARE_IO_KRC20_PRICE + '?chainIds=');
      let kaspaPrice = await fetchWithCache('https://api.kaspa.org/info/price').then((res) => res?.price);

      const isEvmPricesEmpty = !evmPrices || Object.keys(evmPrices).length === 0;
      const isKaspaPriceEmpty = !kaspaPrice;

      if (isKaspaPriceEmpty) {
        kaspaPrice = await fetchWithCache(
          'https://api.coingecko.com/api/v3/simple/price?ids=Kaspa&vs_currencies=USD'
        ).then((res) => res?.kaspa?.usd);
        throw new Error('failed to fetch Kaspa price , skipping cache');
      }

      const priceMap: Record<string, number> = {};

      if (!isEvmPricesEmpty) {
        for (const chainId in evmPrices) {
          priceMap[chainId] = evmPrices[chainId].current_price;
        }
      }

      if (!isKaspaPriceEmpty) {
        KASPA_LAYER2_CHAIN_ID_ARRAY.forEach((chainId) => {
          priceMap[chainId] = kaspaPrice;
        });
      }

      return priceMap;
    },
    staleTime: 1000 * 60 * 10
  });
}
