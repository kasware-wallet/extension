import log from 'loglevel';

import type { IChaingeToken } from '@/shared/types';
import useChaingePrice from '@/ui/state/transactions/chainge/useChaingePrice';
import { formatTokenBalance, formatUsd } from '@/ui/utils';
import { useKaspaPrice } from '@/ui/utils/hooks/price/usePrice';
import { useMemo } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useChaingeTokenData = (amount: string, token: IChaingeToken | null, tokens: any[]) => {
  const chaingePriceData = useChaingePrice(token);
  const priceDifference = useChaingeKaspPriceDifference();

  const tokenSymbol = token?.ticker || 'KAS';
  const tokenData = tokens.find(
    (t) =>
      t.tick === tokenSymbol ||
      (t.tick === 'KASPA' && tokenSymbol === 'KAS') ||
      (t.tick === 'CUSDT' && token?.ticker === 'CUSDT')
  );

  const availableBalance = tokenData ? Number(tokenData.balance) : 0;
  const formattedBalance = tokenData ? formatTokenBalance(availableBalance, tokenData.tick, Number(tokenData.dec)) : 0;

  const tokenPrice = chaingePriceData?.data?.data?.price ?? '0';
  const currencyValue = Number(amount) * Number(tokenPrice) * priceDifference;

  // TODO find way to properly convert USD to other currencies
  const formattedCurrencyValue = formatUsd(currencyValue);

  return {
    formattedCurrencyValue,
    formattedBalance,
    availableBalance,
    tokenSymbol,
    currencyValue
  };
};

export default useChaingeTokenData;

export const useChaingeKaspPriceDifference = () => {
  const kaspaToken = {
    id: 1,
    index: 18,
    ticker: 'KAS',
    lpTicker: 'LPKASP',
    totalSupply: '2559000000000000000',
    name: 'Kaspa',
    icon: 'https://icon.chainge.finance/knot/icon_KAS_color.png',
    header: 'https://icon.chainge.finance/knot/header_KAS_color.png',
    evmChain: 'BASE',
    evmTokenAddr: '0x2adaf20fc35221bac93c9362499e47f3f3701982',
    evmTokenDecimals: 8,
    evmPairAddr: '0x0b013721fcc34c9c92801a5686ed49481918fff9',
    isFun: false,
    flags: 11,
    decimals: 8
  };
  const chaingePriceData = useChaingePrice(kaspaToken);
  const chaingeTokenPrice = chaingePriceData?.data?.data?.price ?? '0';
  const price = useKaspaPrice();
  const kasPrice = price ?? 0;
  log.debug('chaingeTokenPrice, kasPrice', chaingeTokenPrice, kasPrice);

  const res = useMemo(() => {
    if (!chaingeTokenPrice || !kasPrice) return 1;
    return Number(kasPrice) / Number(chaingeTokenPrice);
  }, [kasPrice, chaingeTokenPrice]);
  log.debug('chainge price difference', res);
  return res;
};
