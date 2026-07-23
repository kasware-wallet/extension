import type { PortfolioItemToken } from '@kasware-wallet/api';

export interface CustomTestnetTokenBase {
  id: string;
  chainId: number;
  symbol: string;
  decimals: number;
}

export interface CustomTestnetToken extends CustomTestnetTokenBase {
  amount: number;
  rawAmount: string;
  logo?: string;
}

export type AbstractPortfolioToken = PortfolioItemToken & {
  _tokenId: string;
  _amountStr?: string;
  _priceStr?: string;
  _amountChange?: number;
  _amountChangeStr?: string;
  _usdValue?: number;
  _realUsdValue: number;
  _usdValueStr?: string;
  _historyPatched?: boolean;
  _usdValueChange?: number;
  _usdValueChangeStr?: string;
  _amountChangeUsdValueStr?: string;
  _usdValueChangePercent?: string;
  _realUsdValueChange?: number;
};
