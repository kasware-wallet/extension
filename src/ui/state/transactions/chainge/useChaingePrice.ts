import axios from 'axios';

import type { IChaingeToken } from '@/shared/types';
import { useQuery } from '@tanstack/react-query';

const API_URL = 'https://api2.chainge.finance/fun/getPrice';

export interface ChaingePriceResponse {
  code: number;
  msg: string;
  data: {
    price: string;
    updateTime: number;
    source: string;
  };
}

const fetchChaingePrice = async (token: IChaingeToken | null): Promise<ChaingePriceResponse> => {
  try {
    const response = await axios.get<ChaingePriceResponse>(API_URL, {
      params: {
        ticker: token?.ticker
      }
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.msg) {
      throw new Error(error.response.data?.msg);
    } else {
      throw new Error(`Error getting token price from Chainge for ${token?.ticker}`);
    }
  }
};

export default function useChaingePrice(token: IChaingeToken | null) {
  return useQuery({
    queryKey: ['chaingePrice', token?.ticker],
    queryFn: () => fetchChaingePrice(token),
    enabled: !!token
  });
}
