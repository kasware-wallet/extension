import type { IChaingeToken } from '@/shared/types';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = 'https://api2.chainge.finance/fun/getVault';

export interface KsprNftResponse {
  code: number;
  msg: string;
  data: {
    vault: string; // kaspa address
  };
}

const fetchChaingeFunValut = async (token: IChaingeToken | null): Promise<string> => {
  try {
    const response = await axios.get<KsprNftResponse>(API_URL, {
      params: {
        ticker: token?.ticker
      }
    });
    if (response.data.code === 0 && response.data.data?.vault) {
      return response.data.data.vault;
    } else {
      throw new Error('Invalid API response, missing vault address');
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.msg) {
      throw new Error(error.response.data?.msg);
    } else {
      throw new Error(`Error getting token valut from Knote.Meme for ${token?.ticker}`);
    }
  }
};

export default function useChaingeFunValut(token: IChaingeToken | null) {
  return useQuery({
    queryKey: ['chaingeFunValut', token?.ticker],
    queryFn: () => fetchChaingeFunValut(token),
    enabled: !!token
  });
}
