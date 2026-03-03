import axios from 'axios';

import type { IChaingeToken, IKnotMemeToken } from '@/shared/types';
import { sortChaingeTokens } from '@/ui/utils2/sorting';
import { useQuery } from '@tanstack/react-query';

export interface IChaingeTokenWithBalance extends IChaingeToken {
  // sompi unit
  balance: string;
  priceInKas: number;
}

export interface ChaingeTokensList {
  version: number;
  list: IChaingeToken[];
}

const API_URL = 'https://api2.chainge.finance/fun/getFun';

export function useChaingeTokens() {
  return useQuery({
    queryKey: ['chaingeTokens'],
    queryFn: fetchChaingeTokens,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

const FunFlags = {
  CanAddLp: 1 << 0, // 1  - Can add liquidity
  CanRemoveLp: 1 << 1, // 2  - Can remove liquidity
  CanSwapBuy: 1 << 2, // 4  - Can buy token
  CanSwapSell: 1 << 3, // 8  - Can sell token
  CanBridge: 1 << 4 // 16 - Can bridge token cross-chain
};

const fetchChaingeTokens = async (): Promise<IKnotMemeToken[]> => {
  try {
    const response = await axios.get<{ code: number; msg: string; data: ChaingeTokensList }>(API_URL);

    if (response.data.code === 0 && response.data.data?.list) {
      let tokenList = response.data.data.list
        .filter(
          (token) =>
            (token.flags & FunFlags.CanSwapBuy) === FunFlags.CanSwapBuy ||
            (token.flags & FunFlags.CanSwapSell) === FunFlags.CanSwapSell
        )
        .filter((token) => token.ticker !== 'CUSDT');

      // Sort the tokens according to the priority order
      tokenList = sortChaingeTokens(tokenList);

      return tokenList;
    } else {
      throw new Error('Invalid API response');
    }
  } catch (error) {
    console.error('Error fetching Chainge tokens from primary API:', error);
    throw error;
  }
};
