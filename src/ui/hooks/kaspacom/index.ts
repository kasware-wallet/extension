import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import { getJson } from '../fetchJSON';

interface IKrc20Image {
  ticker: string;
  logo: string; // url link
}
/**
 *
 * @param contractAddress tick in mint mode and ca min issue mode
 */
export const useKrc20ProfileImageQuery = (contractAddress: string) => {
  const { isLoading, isError, error, data, refetch } = useQuery({
    queryKey: ['krc20ProfileImageQuery'],
    queryFn: () => fetchKrc20ProfileImageFromKaspaCom(),
    staleTime: 1 * 24 * 60 * 60 * 1000, // 1 day
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000) // Exponential backoff, max 30s
  });

  const imageUrl = useMemo(() => {
    if (!contractAddress || !data || data.length === 0) return null;
    const image = data.find((item) => item.ticker.toLowerCase() === contractAddress.toLowerCase());
    return image?.logo ?? null;
  }, [data, contractAddress]);

  return {
    imageUrl,
    isLoading,
    isError,
    error,
    refetch
  };
};

async function fetchKrc20ProfileImageFromKaspaCom(): Promise<IKrc20Image[] | null> {
  return getJson('https://api.kaspa.com/api/tokens-logos');
}
