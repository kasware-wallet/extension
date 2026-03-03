import { useAccountAddress } from '@/ui/state/accounts/hooks';
import { useAppSelector } from '@/ui/state/hooks';
import { selectNetworkId } from '@/ui/state/settings/reducer';
import type { WalletController } from '@/ui/utils';
import { useWallet } from '@/ui/utils';
import { useQuery_KEY } from '@/ui/utils2/constants/constants';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
export const useQueryTokenListPrices = (wallet: WalletController) => {
  const networkId = useAppSelector(selectNetworkId);
  const { isLoading, isError, error, data, refetch } = useQuery({
    queryKey: [useQuery_KEY.CustomTestnetTokenListWithPrice, networkId],
    queryFn: async () => wallet.walletEVM.getCustomTestnetTokenListWithPrice(),
    staleTime: 1000 * 60 * 30 // 30 minutes
  });

  return {
    data,
    isLoading,
    isError,
    error,
    refetch
  };
};
export function useUpdateRecentSendToAddressKaspa(toAddress: string) {
  const wallet = useWallet();
  const networkId = useAppSelector(selectNetworkId);
  const currentAddress = useAccountAddress();
  useEffect(() => {
    if (!toAddress || !networkId || !currentAddress) return;
    wallet.updateRecentSendToAddressKaspa(networkId, currentAddress, toAddress);
  }, [wallet, networkId, currentAddress, toAddress]);
}
