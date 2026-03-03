import useDebounceValue from '@/evm/ui/hooks/useDebounceValue';
import type { IKRC20TokenInfo, IKRC20TokenInfoIssue } from '@/shared/types';
import { useTools } from '@/ui/components/ActionComponent';
import { useWallet } from '@/ui/utils';
import log from 'loglevel';
import { useCallback, useEffect, useState } from 'react';

export interface ChaingePriceResponse {
  code: number;
  msg: string;
  data: {
    price: string;
    updateTime: number;
    source: string;
  };
}

export default function useKRC20TokenInfo(tick: string | undefined) {
  const wallet = useWallet();
  const { toastError } = useTools();
  const [krc20Info, setKrc20Info] = useState<IKRC20TokenInfo | IKRC20TokenInfoIssue>();
  const debouncedTick = useDebounceValue(tick, 250);

  const fetchKRC20Info = useCallback(
    async (tick: string) => {
      const tokenInfos = await wallet.getKRC20TokenInfo(tick?.toLowerCase()).catch((e) => {
        log.debug(e);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        toastError((e as any).message);
      });
      if (tokenInfos && Array.isArray(tokenInfos) && tokenInfos.length > 0) {
        setKrc20Info(tokenInfos[0]);
      }
    },
    [wallet, toastError]
  );

  useEffect(() => {
    if (debouncedTick && debouncedTick?.length >= 4) {
      fetchKRC20Info(debouncedTick);
    }
  }, [debouncedTick, fetchKRC20Info]);

  return {
    krc20Info,
    dec: Number(krc20Info?.dec) || 8
  };
}
