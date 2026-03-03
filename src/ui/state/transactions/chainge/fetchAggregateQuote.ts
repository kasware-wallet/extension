import type { IChaingeToken } from '@/shared/types';
import axios from 'axios';

interface KnotMemeQuote {
  amountOut: string; // sompi unit
  amountOutUsd: string;
  userAmountOut: string; // sompi unit, userAmountOut = amountOut - serviceFee - gasFee
  serviceFee: string; // sompi unit
  gasFee: string; // sompi unit
  serviceFeeRate: string;
  priceImpact: string; //0.5%
  slippage: string; //5%
}

export interface ChaingeAggregateQuote extends KnotMemeQuote {
  chainDecimal: number;
}

const API_URL = 'https://api2.chainge.finance/fun/quote';

export const fetchAggregateQuote = async (
  fromToken: IChaingeToken,
  toToken: IChaingeToken,
  fromAmount: bigint,
  options: { signal?: AbortSignal } = {}
): Promise<ChaingeAggregateQuote | undefined> => {
  try {
    const fromTicker = fromToken.ticker;
    const toTicker = toToken.ticker;
    const response = await axios.get<{ code: number; msg: string; data: ChaingeAggregateQuote }>(API_URL, {
      params: {
        fromTicker,
        toTicker,
        fromAmount: fromAmount.toString()
      },
      signal: options.signal
    });

    if (response.data.code === 0 && response.data.data) {
      return { ...response.data.data, chainDecimal: toToken.decimals };
    } else {
      console.error('Fetch aggregate quote error:', response);
      throw new Error(`Chainge DEX Error: ${response.data.msg || 'Invalid API response'}`);
    }
  } catch (error) {
    if (axios.isCancel(error)) {
      return undefined;
    } else if (axios.isAxiosError(error) && error.response) {
      if (error.response.status >= 500 && error.response.status < 600) {
        console.error(`${error.response.status} Error: cannot get aggregate quote from Chainge:`, error.response);
        throw new Error(`${error.response.status} Error: Chainge DEX is down or unavailable. Please try again later.`);
      } else {
        console.error('API error:', error.response);
        throw new Error(`${error.response.status} Unknown error: ${error.response.statusText}`);
      }
    } else {
      console.error('Error fetching Chainge tokens:', error);
    }
    throw new Error(`${error instanceof Error ? error.message : error}`);
  }
};
