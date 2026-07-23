import type { ChaingeAggregateQuote } from '@/ui/state/transactions/chainge/fetchAggregateQuote';

export interface KatBridgeTokenPair {
  id: number;
  l1_name: string;
  l1_symbol: string;
  l1_decimals: number;
  l1_logo_url: string;
  l2_name: string;
  l2_symbol: string;
  l2_decimals: number;
  l2_chain_id: number;
  l2_address: string;
  l2_logo_url: string;
  created_at: string;
  updated_at: string;
  tokenHash: string;
  maxSupply: string;
  is_active: boolean;
}

export interface IKnotMemeToken {
  id: number;
  index: number;
  ticker: string; // uppercase
  lpTicker: string; // uppercase
  totalSupply: string; // sompi unit
  name: string;
  icon: string; // url
  header: string; // url
  evmChain: string;
  evmTokenAddr: string; // 0x...
  evmTokenDecimals: number;
  evmPairAddr: string; // 0x...
  isFun: boolean;
  flags: number;
}

export interface IChaingeToken extends IKnotMemeToken {
  decimals: number;
}

export interface OrderStatusResponse {
  code: number;
  msg: string;
  data: {
    status: string;
    since: number;
    hash?: string;
    amountOut?: string;
  };
}

export interface IChaingeResponse<T> {
  code: number;
  data: T;
  msg: string;
}
export interface AggregateQuoteResponse {
  chain: string;
  chainDecimal: number;
  aggregator: string;
  outAmount: string;
  outAmountUsd: string;
  gasFee: string;
  serviceFeeRate: string;
  serviceFee: string;
  slippage: string;
  priceImpact: string;
  routeSummary: string;
}

type ChaingeQuote = Omit<AggregateQuoteResponse, 'routeSummary'>;

export interface IPostChaingeOrderRequest {
  transactionId: string;
  walletAddress: string;
  payTokenTicker: string;
  payAmount: string;
  receiveTokenTicker: string;
  receiveAmount: string;
  receiveAmountUsd: string;
  chaingeOrderId: string;
  slippage: string;
  quote: ChaingeQuote;
  serviceFeeUsd: number;
  orderTimestamp: number;
}

export interface ISubmitChaingeOrderRequest {
  fromAmount: string;
  fromToken: IChaingeToken;
  toToken: IChaingeToken;
  toAddress: string;
  quote: ChaingeAggregateQuote;
  slippage: string;
  priorityFee: number;
  serviceFeeUsd: number;
}

export type TChaingeOrderResponse = IChaingeResponse<{ id: string }>;
/**
 * time: milliseconds elapsed since midnight, January 1, 1970 Universal Coordinated Time (UTC)
 */
export interface IOrder {
  orderProvider?: string;
  time: number;
  orderId: string;
  payTokenTicker: string;
  payAmount: string;
  payId?: string;
  receiveTokenTicker: string;
  receiveAmount?: string;
  receiveOrRefundId?: string;
  status?: string | number;
}

export interface PostChaingeOrderRequest {
  transactionId: string;
  walletAddress: string;
  payTokenTicker: string;
  payAmount: string;
  receiveTokenTicker: string;
  receiveAmount: string;
  receiveAmountUsd: string;
  chaingeOrderId: string;
  slippage: string;
  quote: ChaingeAggregateQuote;
  serviceFeeUsd: number;
  orderTimestamp: number;
}
export interface ChaingeFeeEstimateRequest {
  fromAmount: string;
  fromToken: IChaingeToken;
}

export type SwapBridgeType = 'swap' | 'bridge' | 'kaspaL2Bridge' | 'krcL2Bridge';
