import { useEffect, useMemo, useState } from 'react';

import { useAccountBalance } from '@/ui/state/accounts/hooks';
import { selectCurrentAccount } from '@/ui/state/accounts/reducer';
import { useRpcStatus } from '@/ui/state/global/hooks';
import { useAppSelector } from '@/ui/state/hooks';
import { selectNetworkId } from '@/ui/state/settings/reducer';
import type { KaspaToken, Token, TokenFromApi } from '@/ui/utils2/interfaces';
import { sortTokensByValue } from '@/ui/utils2/sorting';

import { useKasFyiMarketData } from '../kas-fyi/fetchMarketData';
import { useIsKrc20QueryEnabled, useKrc20TokensQuery } from '../kasplex/fetchKrc20AddressTokenList';
import { useKsprPrices } from '../kspr/fetchKsprPrices';
import { useKaspaPrice, useTetherPrice } from '../price/usePrice';

export function useWalletTokens() {
  const kaspaPrice = useKaspaPrice();
  const kasPrice = kaspaPrice ?? 0;
  const tetherPrice = useTetherPrice();
  const usdtPrice = useMemo(() => tetherPrice.data ?? 0, [tetherPrice.data]);
  const [walletError, setWalletError] = useState<string | null>(null);
  const rpcStatus = useRpcStatus();
  const kasBalance = useAccountBalance();
  const currentAccount = useAppSelector(selectCurrentAccount);
  const networkId = useAppSelector(selectNetworkId);

  const isQueryEnabled = useIsKrc20QueryEnabled(rpcStatus, kasBalance, currentAccount, networkId);
  const krc20TokensQuery = useKrc20TokensQuery(networkId, currentAccount, isQueryEnabled);
  const krc20TokensData = krc20TokensQuery.data;

  const tickers = useMemo(() => {
    const ticks = krc20TokensData?.map((token: TokenFromApi) => token.tick) || [];
    return ticks.length > 0 ? ticks : null;
  }, [krc20TokensData]);

  const kasFyiMarketDataQuery = useKasFyiMarketData(tickers || []);
  const kasFyiMarketData = useMemo(() => kasFyiMarketDataQuery.data ?? { results: [] }, [kasFyiMarketDataQuery.data]);
  const ksprPrices = useKsprPrices();
  const ksprPricesQuery = kasFyiMarketData ? null : ksprPrices;
  const ksprPricesData = ksprPricesQuery?.data;

  const kaspaCrypto: KaspaToken = useMemo(
    () => ({
      isKaspa: true,
      tick: 'KASPA',
      balance: Number(kasBalance.amount),
      dec: 8,
      floorPrice: kasPrice
    }),
    [kasBalance.amount, kasPrice]
  );

  const tokens = useMemo(() => {
    if (!krc20TokensData) {
      return [kaspaCrypto];
    }

    const tokensWithPrices = krc20TokensData.map((token) => {
      if (kasFyiMarketData) {
        const kasFyiToken = kasFyiMarketData.results.find((data) => data.ticker === token.tick);
        const floorPrice = token.tick === 'CUSDT' ? usdtPrice : (kasFyiToken?.price.kas || 0) * kasPrice;
        const volume24h = kasFyiToken?.volume24h.usd || 0;
        const rank = kasFyiToken?.rank || 0;

        return {
          ...token,
          floorPrice,
          volume24h,
          rank
        } as Token;
      } else if (ksprPricesData) {
        const ksprToken = ksprPricesData[token.tick];

        return {
          ...token,
          floorPrice: token.tick === 'CUSDT' ? usdtPrice : (ksprToken?.floor_price || 0) * kasPrice,
          volume24h: 0,
          rank: 0
        } as Token;
      } else {
        return {
          ...token,
          floorPrice: 0,
          volume24h: 0,
          rank: 0
        } as Token;
      }
    });

    return [kaspaCrypto, ...tokensWithPrices] as (KaspaToken | Token)[];
  }, [kaspaCrypto, krc20TokensData, kasFyiMarketData, ksprPricesData, kasPrice, usdtPrice]);

  const sortedTokens = sortTokensByValue(tokens);

  useEffect(() => {
    if (krc20TokensQuery.isError) {
      setWalletError(krc20TokensQuery.error?.message || 'An unknown error occurred while fetching tokens.');
    }
  }, [krc20TokensQuery.isError, krc20TokensQuery.error]);

  return { tokens: sortedTokens, walletError };
}
