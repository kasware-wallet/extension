import axios from 'axios';

import type { KsprTokenResponse } from '@/ui/utils2/interfaces';
import { useQuery } from '@tanstack/react-query';

/**
 * Fetches the KSPR token data from the marketplace JSON endpoint.
 * @returns An object of KSPR tokens, where each key is a token symbol.
 *
 * KSPR Bot dev Dwayne says:
 * "replace timestamp by a timestamp of course, data are refreshed every 15 mins, floor price (price per unit) in KAS"
 * https://storage.googleapis.com/kspr-api-v1/marketplace/marketplace.json?t=TIMESTAMP
 */
const fetchKsprPrices = async (): Promise<KsprTokenResponse> => {
  try {
    const response = await axios.get<KsprTokenResponse>(
      'https://storage.googleapis.com/kspr-api-v1/marketplace/marketplace.json'
    );
    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.response && error.response.status === 403) {
      console.error('Error 403: KSPR Bot token price API unavailable');
    } else {
      console.error(
        `Error ${error.response.status}: cannot get token price data from KSPR Bot API.`,
        error.message || error
      );
    }
    throw error;
  }
};

/**
 * Custom hook to fetch and cache KSPR token data using React Query.
 * @returns The query result containing KSPR token data, loading state, and error.
 */
export const useKsprPrices = () => {
  return useQuery<KsprTokenResponse, Error>({
    queryKey: ['ksprPrices'],
    queryFn: fetchKsprPrices,
    staleTime: 300_000 // Cache for 5 minutes
    // refetchInterval: 300_000 // Refetch every 5 minutes
  });
};
