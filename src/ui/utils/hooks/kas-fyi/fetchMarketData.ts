import axios from 'axios';

import type { KasFyiToken, KasFyiTokenResponse } from '@/ui/utils2/interfaces';
import { useQuery } from '@tanstack/react-query';

const KAS_FYI_LIMIT = 500;

/**
 * Utility to split an array into chunks
 * @param array The array to chunk
 * @param size The maximum size of each chunk
 * @returns Array of chunks
 */
const chunkArray = <T>(array: T[], size: number): T[][] => {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, index) =>
    array.slice(index * size, index * size + size)
  );
};

/**
 * Fetch KasFyi market data for a chunk of tickers
 * @param tickers Array of ticker strings (max 500)
 * @returns KasFyiTokenResponse for the given tickers
 */
const fetchKasFyiMarketDataChunk = async (tickers: string[]): Promise<KasFyiTokenResponse> => {
  const tickersParam = tickers.join(',');
  const response = await axios.get<KasFyiTokenResponse>(
    `https://api.kas.fyi/token/krc20/marketData?tickers=${tickersParam}`
  );
  return response.data;
};

/**
 * Fetch KasFyi market data for tickers, handling API limits of 500 tickers per request.
 * @param tickers Array of ticker strings
 * @returns Combined KasFyiTokenResponse
 */
export const fetchKasFyiMarketData = async (tickers: string[]): Promise<KasFyiTokenResponse> => {
  try {
    const chunks = chunkArray(tickers, KAS_FYI_LIMIT);
    const responses = await Promise.all(chunks.map(fetchKasFyiMarketDataChunk));
    const combinedResults: KasFyiToken[] = responses.flatMap((response) => response.results);
    return {
      results: combinedResults
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 403) {
      console.error('Error 403: Kas FYI market data API unavailable');
    } else {
      console.error(
        `Error ${status || 'unknown'}: cannot get token market data from Kas FYI API.`,
        error.message || error
      );
    }
    throw error;
  }
};

/**
 * React Query hook for KasFyi market data.
 * @param tickers Array of ticker strings
 * @returns Query result for KasFyi market data
 */
export const useKasFyiMarketData = (tickers: string[]) => {
  return useQuery<KasFyiTokenResponse, Error>({
    queryKey: ['kasFyiMarketData', tickers],
    queryFn: () => fetchKasFyiMarketData(tickers),
    staleTime: 10 * 60 * 1000 // 10 minutes
    // refetchInterval: 10_000 // Refetch every 10 seconds
  });
};
