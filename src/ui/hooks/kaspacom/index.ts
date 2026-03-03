import { useEffect, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

interface IKrc20Image {
  ticker: string;
  logo: string; // url link
}
/**
 *
 * @param contractAddress tick in mint mode and ca min issue mode
 */
export const useKrc20ProfileImageQuery = (contractAddress: string) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const { isLoading, isError, error, data, refetch } = useQuery({
    queryKey: ['krc20ProfileImageQuery'],
    queryFn: async () => fetchKrc20ProfileImageFromKaspaCom(),
    // enabled: !!contractAddress,
    staleTime: 1 * 24 * 60 * 60 * 1000, // 1 day
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000) // Exponential backoff, max 30s
  });
  useEffect(() => {
    if (!contractAddress) return;
    const image = data?.find((item) => item.ticker.toLowerCase() === contractAddress.toLowerCase());
    if (data && data?.length > 0 && image) return setImageUrl(image?.logo);
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
  const url = `https://api.kaspa.com/api/tokens-logos`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Network response was not ok ' + response.statusText);
  }
  const data = await response.json();
  return data;
}
