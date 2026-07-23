import type { ConfigJSON, IKRC20TokenIntro } from '@/shared/types';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import log from 'loglevel';
import { getBase64JSON } from '../fetchJSON';
export const useKrc20TokenSocialInfosQuery = () => {
  const enabled = !!process.env.KASWARE_IO_KRC20S;
  const { isLoading, isError, error, data, refetch } = useQuery({
    queryKey: ['krc20TokenSocialInfos'],
    queryFn: async () => fetchKrc20TokenSocialInfos(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled,
  });

  return {
    data,
    isLoading,
    isError,
    error,
    refetch
  };
};
async function fetchKrc20TokenSocialInfos(): Promise<{ [tick: string]: IKRC20TokenIntro } | undefined> {
  try {
    const jsonFile = await getBase64JSON(process.env.KASWARE_IO_KRC20S as string);
    const res = jsonFile?.krc20s;
    return res;
  } catch (e) {
    log.debug((e as Error).message);
    throw new Error('Network response issue: ' + (e as Error).message);
  }
}
export function useQueryConfigJSON(): UseQueryResult<ConfigJSON> {
  const enabled = !!process.env.KASWARE_IO_CONFIG;
  return useQuery({
    queryKey: ['config.json'],
    queryFn: () => getBase64JSON(process.env.KASWARE_IO_CONFIG as string),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled,
  });
}