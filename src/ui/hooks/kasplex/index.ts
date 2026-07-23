import type { IKRC20ByAddress, IKRC20History, TNetworkId } from '@/shared/types';
import { getKasplexHost } from '@/ui/utils';
import { useQuery } from '@tanstack/react-query';
import { getJson } from '../fetchJSON';

export const useKrc20ActivityByTxidQuery = (kasNetworkId: TNetworkId, txid: string, enableQuery = false) => {
  const { isLoading, isError, error, data, refetch } = useQuery({
    queryKey: ['krc20ActivityByTxid', { networkId: kasNetworkId, txid }],
    queryFn: () => fetchKrc20ActivityByTxid(kasNetworkId, txid),
    enabled: !!txid && !!kasNetworkId && enableQuery,
    staleTime: 1 * 24 * 60 * 60 * 1000, // 1 day
    select: (res: any) => (res?.result?.length > 0 ? res.result[0] : null) as IKRC20History | null
  });

  return {
    activity: data ?? null,
    isLoading,
    isError,
    error,
    refetch
  };
};

async function fetchKrc20ActivityByTxid(networkId: TNetworkId, id: string) {
  const host = getKasplexHost(networkId);
  return getJson(`${host}/krc20/op/${encodeURIComponent(id)}`);
}

export interface IKrc20MarketInfo {
  tick?: string; //"KOBA",
  ca?: string; // contract address
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
  const { isLoading, isError, error, data, refetch } = useQuery({
    queryKey: ['krc20MarketInfo', { networkId: kasNetworkId, address: kasAddress, contractAddress }],
    queryFn: () => fetchKrc20MarketInfo(kasNetworkId, kasAddress, contractAddress),
    enabled: !!kasAddress && !!kasNetworkId && !!contractAddress && enableQuery,
    staleTime: 5 * 1000, // 5 sec
    select: (res: any) => (res?.result?.length > 0 ? res.result : null) as IKrc20MarketInfo[] | null
  });

  return {
    listOrders: data ?? null,
    isLoading,
    isError,
    error,
    refetch
  };
};

async function fetchKrc20MarketInfo(networkId: TNetworkId, address: string, contractAddress: string) {
  const host = getKasplexHost(networkId);
  return getJson(`${host}/krc20/market/${encodeURIComponent(contractAddress)}?address=${encodeURIComponent(address)}`);
}

export const useKrc20TokenBalanceQuery = (
  kasNetworkId: TNetworkId,
  kasAddress: string,
  contractAddress: string,
  enableQuery = true
) => {
  const { isLoading, isError, error, data, refetch } = useQuery({
    queryKey: ['krc20TokenBalance', { networkId: kasNetworkId, kasAddress, contractAddress }],
    queryFn: () => fetchKrc20TokenBalanceByContractAddress(kasNetworkId, kasAddress, contractAddress),
    enabled: !!kasAddress && !!contractAddress && !!kasNetworkId && enableQuery,
    staleTime: 10 * 1000, // 10 sec
    select: (res: any) => (res?.result?.length > 0 ? res.result[0] : null) as IKRC20ByAddress | null
  });

  return {
    tokenBalance: data ?? null,
    isLoading,
    isError,
    error,
    refetch
  };
};

async function fetchKrc20TokenBalanceByContractAddress(
  networkId: TNetworkId,
  kasAddress: string,
  contractAddress: string
) {
  const host = getKasplexHost(networkId);
  // NOTE: Kaspa address contains ':' which should NOT be encoded as the API server
  // returns 403 for encoded colons (%3A). Only encode contract address if needed.
  return getJson(`${host}/krc20/address/${kasAddress}/token/${encodeURIComponent(contractAddress)}`);
}
