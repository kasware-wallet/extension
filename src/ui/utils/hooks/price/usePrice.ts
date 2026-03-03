import { useEffect, useState } from 'react';

import { useCurrency } from '@/ui/state/settings/hooks';
import { useQuery } from '@tanstack/react-query';

import { useWallet } from '../../WalletContext';
import { fetchFromCoinGecko } from '../coingecko/fetchFromCoinGecko';
import { fetchFromKaspaApi } from '../kaspa/fetchFromKaspaApi';
import { getNativeTokenPrice } from '@kasware-wallet/common';

export function useKaspaPrice() {
  const wallet = useWallet();
  const currency = useCurrency();
  const name = 'Kaspa';
  const [kasPrice, setKasPrice] = useState<number | null>(null);

  const { data } = useQuery({
    queryKey: ['kaspaPrice', currency],
    queryFn: async () => {
      try {
        return await fetchFromCoinGecko(currency, name);
      } catch (error) {
        await wallet.setCurrency('USD');
        // if (currency === 'USD') {
        return fetchFromKaspaApi();
        // }
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes

    retry: 5
  });
  useEffect(() => {
    if (data) {
      setKasPrice(data);
    }
  }, [data]);
  return kasPrice || 0;
}
export function useNativeCoinPrice(chainId: number) {
  const [nativeCoinPrice, setNativeCoinPrice] = useState<number | null>(null);

  const { data } = useQuery({
    queryKey: ['nativeCoinPrice', chainId],
    queryFn: async () => {
      try {
        const price = await getNativeTokenPrice(chainId);
        return price;
      } catch (error) {
        return 0;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 5
  });
  useEffect(() => {
    if (data) {
      setNativeCoinPrice(data);
    }
  }, [data]);
  return nativeCoinPrice || 0;
}

export function useTetherPrice() {
  const name = 'Tether';
  const currency = useCurrency();

  return useQuery({
    queryKey: ['tetherPrice', currency],
    queryFn: async () => {
      try {
        return await fetchFromCoinGecko(currency, name);
      } catch (error) {
        if (currency === 'USD') {
          return 1.0;
        }
      }
    },
    staleTime: 60 * 60 * 1000, // 60 minutes
    retry: 5
  });
}
