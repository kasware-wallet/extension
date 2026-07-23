import { useEffect, useState } from 'react';

import type { IKRC20Transfer, IKRC20TransferIssue, IToken, TKRC20History, TKRC20HistoryIssue } from '@/shared/types';
import { useAppSelector } from '@/ui/state/hooks';
import { selectNetworkId } from '@/ui/state/settings/reducer';
import { useKrc20DecName } from '@/ui/utils/hooks/kasplex/fetchKrc20AddressTokenList';
import { KRC20HistoryCard } from './KRC20HistoryCard';

interface KRC20HistoryCardWithoutTokenProps {
  history: TKRC20History | TKRC20HistoryIssue;
}

export function KRC20HistoryCardWithoutToken({ history }: KRC20HistoryCardWithoutTokenProps) {
  const [tokenTickDec, setTokenTickDec] = useState<IToken>({ tick: '', decimals: '8' });
  const kasNetworkId = useAppSelector(selectNetworkId);
  const { name: tokenName, dec: tokenDec } = useKrc20DecName(
    kasNetworkId,
    (history as IKRC20Transfer)?.tick || (history as IKRC20TransferIssue)?.ca
  );

  useEffect(() => {
    if (tokenName && tokenDec) {
      setTokenTickDec({ tick: tokenName, decimals: tokenDec });
    }
  }, [tokenName, tokenDec]);

  return <KRC20HistoryCard history={history} token={tokenTickDec} />;
}
