import { useQuery } from '@tanstack/react-query';

import { fetchKasFyiMarketData } from './fetchMarketData';

export function useRanks(symbols: string[]) {
  return useQuery({
    queryKey: ['kasFyiRanks', symbols],
    queryFn: async () => {
      const data = await fetchKasFyiMarketData(symbols);
      return data.results.reduce((map, token) => {
        map[token.ticker] = { rank: token.rank };
        return map;
      }, {} as Record<string, { rank: number }>);
    },
    staleTime: 60 * 60 * 1000, // 60 minutes
    retry: 5
  });
}
