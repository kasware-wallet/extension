import { useEffect, useState } from 'react';

import type { IKRC20ByAddress, IKRC20History, TNetworkId } from '@/shared/types';
import { getKasplexHost } from '@/ui/utils';
import { useQuery } from '@tanstack/react-query';

export const useKrc20ActivityByTxidQuery = (kasNetworkId: TNetworkId, txid: string, enableQuery = false) => {
  const [activity, setActivity] = useState<IKRC20History | null>(null);
  const { isLoading, isError, error, data, refetch } = useQuery({
    queryKey: ['krc20ActivityByTxid', { networkId: kasNetworkId, txid }],
    queryFn: async () => fetchKrc20ActivityByTxid(kasNetworkId, txid),
    enabled: !!txid && !!kasNetworkId && enableQuery,
    staleTime: 1 * 24 * 60 * 60 * 1000 // 1 day
  });
  useEffect(() => {
    if (data?.result && data?.result.length > 0) return setActivity(data.result[0]);
  }, [data]);

  return {
    activity,
    isLoading,
    isError,
    error,
    refetch
  };
};

async function fetchKrc20ActivityByTxid(networkId: TNetworkId, id: string): Promise<any | null> {
  const host = getKasplexHost(networkId);
  const url = `${host}/krc20/op/${id}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Network response was not ok ' + response.statusText);
  }
  const data = await response.json();
  return data;
  // if (data?.result && data?.result.length > 0) return data.result[0];
  // return null;
}
export interface IKrc20MarketInfo {
  tick?: 'string'; //"KOBA",
  ca?: 'string'; // contract address
  from: string; //"kaspatest:qz9dvce5d92czd6t6msm5km3p5m9dyxh5av9xkzjl6pz8hhvc4q7wqg8njjyp",
  amount: string; //"1000000000",
  uTxid: string; //"3f4d5b2c3689fa1a3022e17dc326f2fa1a7d0630e35c14f571d02a1f010a5cfd",
  uAddr: string; //"kaspatest:pp5aty2s929ckzhyf0t62nxdcptyzw9kp2940xmj5ptze9u96m5y6kx7evajh",
  uAmt: string; //"100008291",
  uScript: string; //"208ad66334695581374bd6e1ba5b710d365690d7a758535852fe8223deecc541e7ac0063076b6173706c657800287b2270223a226b72632d3230222c226f70223a2273656e64222c227469636b223a226b6f6261227d68",
  opScoreAdd: string; //"2205207250000"
}

export const useKrc20MarketInfoQuery = (
  kasNetworkId: TNetworkId,
  kasAddress: string,
  contractAddress: string,
  enableQuery = true
) => {
  const [listOrders, setListOrders] = useState<IKrc20MarketInfo[] | null>(null);
  const { isLoading, isError, error, data, refetch } = useQuery({
    queryKey: ['krc20MarketInfo', { networkId: kasNetworkId, address: kasAddress, contractAddress }],
    queryFn: async () => fetchKrc20MarketInfo(kasNetworkId, kasAddress, contractAddress),
    enabled: !!kasAddress && !!kasNetworkId && !!contractAddress && enableQuery,
    staleTime: 5 * 1000 // 5 sec
  });
  useEffect(() => {
    if (data?.result && data?.result.length > 0) return setListOrders(data.result);
  }, [data]);

  return {
    listOrders,
    isLoading,
    isError,
    error,
    refetch
  };
};

async function fetchKrc20MarketInfo(networkId: TNetworkId, address: string, contractAddress): Promise<any | null> {
  const host = getKasplexHost(networkId);
  const url = `${host}/krc20/market/${contractAddress}?address=${address}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Network response was not ok ' + response.statusText);
  }
  const data = await response.json();
  return data;
}

export const useKrc20TokenBalanceQuery = (
  kasNetworkId: TNetworkId,
  kasAddress: string,
  contractAddress: string,
  enableQuery = true
) => {
  const [activity, setActivity] = useState<IKRC20ByAddress | null>(null);
  const { isLoading, isError, error, data, refetch } = useQuery({
    queryKey: ['krc20TokenBalance', { networkId: kasNetworkId, kasAddress, contractAddress }],
    queryFn: async () => fetchKrc20TokenBalanceByConractAddress(kasNetworkId, kasAddress, contractAddress),
    enabled: !!kasAddress && !!contractAddress && !!kasNetworkId && enableQuery,
    staleTime: 10 * 1000 // 10 sec
  });
  useEffect(() => {
    if (data?.result && data?.result.length > 0) return setActivity(data.result[0]);
  }, [data]);

  return {
    tokenBalance: activity,
    isLoading,
    isError,
    error,
    refetch
  };
};

async function fetchKrc20TokenBalanceByConractAddress(
  networkId: TNetworkId,
  kasAddress: string,
  contractAddress: string
): Promise<any | null> {
  const host = getKasplexHost(networkId);
  const url = `${host}/krc20/address/${kasAddress}/token/${contractAddress}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Network response was not ok ' + response.statusText);
  }
  const data = await response.json();
  return data;
  // if (data?.result && data?.result.length > 0) return data.result[0];
  // return null;
}
