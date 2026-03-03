import { useEffect } from 'react';

import type { IKNSAssetsResponseData, TNetworkId } from '@/shared/types';
import { getKnsApi } from '@/shared/utils';
import { useAppDispatch } from '@/ui/state/hooks';
import { transactionsActions } from '@/ui/state/transactions/reducer';
import { useQuery } from '@tanstack/react-query';

export const useKnsAssetsQuery = (kasNetworkId: TNetworkId, owner: string, pageNumber: number, size: number) => {
  const dispatch = useAppDispatch();

  const { isLoading, isError, error, data, refetch, isFetching } = useQuery({
    queryKey: ['knsAssets', { networkId: kasNetworkId, owner, pageNumber, size }],
    queryFn: async () => fetchKnsAssets(kasNetworkId, owner, pageNumber, size),
    enabled: !!owner && !!kasNetworkId,
    staleTime: 5 * 1000 // 5 seconds,
    // keepPreviousData: true
  });
  useEffect(() => {
    if (data) {
      dispatch(transactionsActions.setKNSAssets(data?.assets || []));
    }
  }, [data, dispatch]);

  return {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  };
};
async function fetchKnsAssets(
  networkId: TNetworkId,
  owner: string,
  currentPageNumber: number,
  size: number
): Promise<IKNSAssetsResponseData> {
  try {
    const host = getKnsApi(networkId as TNetworkId);
    const url = new URL(`${host}/assets`);
    url.searchParams.append('owner', owner);
    url.searchParams.append('page', currentPageNumber.toString());
    url.searchParams.append('pageSize', size.toString());

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new Error(error?.message || 'Error from KNS');
  }
}
