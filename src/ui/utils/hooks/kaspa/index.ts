import type { ITransactionInfo, TNetworkId } from '@/shared/types';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { transactionsActions } from '@/ui/state/transactions/reducer';
import { useAppDispatch } from '@/ui/state/hooks';
import { handleTransactions } from '../..';
import produce from 'immer';
import {
  OPENAPI_URL_MAINNET,
  OPENAPI_URL_TESTNET_10,
  OPENAPI_URL_TESTNET_11,
  OPENAPI_URL_TESTNET_12
} from '@/shared/constant';

export const useKaspaTxActivitiesQuery = (kasNetworkId: TNetworkId, kasAddress: string) => {
  const [activities, setActivities] = useState<ITransactionInfo[]>([]);
  const dispatch = useAppDispatch();
  const { isLoading, isError, error, data, refetch } = useQuery({
    queryKey: ['kaspaTxActivities', { networkId: kasNetworkId, address: kasAddress }],
    queryFn: async () => fetchKaspaTxActivities(kasNetworkId, kasAddress),
    enabled: !!kasAddress,
    staleTime: 5 * 1000
  });
  useEffect(() => {
    if (data && data.length > 0) {
      let tempActivities: ITransactionInfo[] = [];
      tempActivities = produce(data, (draft) => {
        draft?.sort((a, b) => b.block_time - a.block_time);
      });
      data.sort((a, b) => b.block_time - a.block_time);
      dispatch(transactionsActions.setTxActivities(tempActivities));
      dispatch(transactionsActions.setIncomingTx(false));
      setActivities(tempActivities);
    }
  }, [data, dispatch]);

  return {
    activities,
    isLoading,
    isError,
    error,
    refetch
  };
};

export async function fetchKaspaTxActivities(
  networkId: TNetworkId,
  address: string
): Promise<ITransactionInfo[] | null> {
  const host = getKaspaOrgHost(networkId);
  const response = await fetch(
    `${host}/addresses/${address}/full-transactions?limit=10&resolve_previous_outpoints=light`
  );
  if (!response.ok) {
    throw new Error('Network response was not ok ' + response.statusText);
  }
  const data = await response.json();
  const trans = handleTransactions(data, address);
  return trans;
}

export const getKaspaOrgHost = (networkId: TNetworkId) => {
  switch (networkId) {
    case 'mainnet':
      return OPENAPI_URL_MAINNET;
    case 'testnet-10':
      return OPENAPI_URL_TESTNET_10;
    case 'testnet-11':
      return OPENAPI_URL_TESTNET_11;
    case 'testnet-12':
      return OPENAPI_URL_TESTNET_12;
    default:
      return OPENAPI_URL_TESTNET_10;
  }
};
