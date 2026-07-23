import type { CustomTestnetToken, AbstractPortfolioToken } from '../types/token';
import BigNumber from 'bignumber.js';
import type { TokenItem } from '@kasware-wallet/api';
import { findChain } from '@/utils/chain';
export function mapCTTokenWithPrice2AbstractPortfolioToken(
  token: CustomTestnetToken & { price?: number },
  basePrice: number
): AbstractPortfolioToken {
  const tokenPrice = token.id.startsWith('0x') ? (token.price || 0) * basePrice : token.price || 0;
  return {
    chain: token.chainId,
    decimals: token.decimals,
    display_symbol: token.symbol,
    id: token.id,
    name: token.symbol,
    symbol: token.symbol,
    optimized_symbol: token.symbol,
    _tokenId: token.id,
    _realUsdValue: token.amount * tokenPrice,
    price: tokenPrice,
    raw_amount_hex_str: token.rawAmount ? '0x' + BigInt(token.rawAmount).toString(16) : '',
    amount: token.amount
  };
}

export const customTestnetTokenToTokenItem = (token: CustomTestnetToken): TokenItem => {
  const chain = findChain({
    id: token.chainId
  });
  // if (!chain) {
  //   throw new Error(`chain not found by id: ${token.chainId}`);
  // }
  return {
    id: token.id,
    chain: chain?.id || 0,
    amount: token.amount,
    raw_amount: token.rawAmount,
    raw_amount_hex_str: `0x${new BigNumber(token.rawAmount || 0).toString(16)}`,
    decimals: token.decimals,
    display_symbol: token.symbol,
    is_core: false,
    is_verified: true,
    is_wallet: false,
    is_scam: false,
    is_suspicious: false,
    logo_url: token.logo || '',
    name: token.symbol,
    optimized_symbol: token.symbol,
    price: 0,
    symbol: token.symbol,
    time_at: 0,
    price_24h_change: 0
  };
};
