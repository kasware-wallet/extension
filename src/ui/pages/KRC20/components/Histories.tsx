import { useEffect } from 'react';

import type { IKRC20ByAddress, Inscription } from '@/shared/types';
import { Button, Column, Row, Text } from '@/ui/components';
import { Empty } from '@/ui/components/Empty';
import { useCurrentAccount } from '@/ui/state/accounts/hooks';
import { useAppSelector } from '@/ui/state/hooks';
import { selectNetworkId } from '@/ui/state/settings/reducer';
import { useKrc20ActivitiesQuery } from '@/ui/utils/hooks/kasplex/fetchKrc20AddressTokenList';
import { LoadingSpinner } from '@/ui/components';
import { KRC20HistoryCard } from './KRC20HistoryCard';

interface HistoriesProps {
  token: Inscription;
  tokenBalance: IKRC20ByAddress | null;
}

export function Histories({ token, tokenBalance }: HistoriesProps) {
  const currentAccount = useCurrentAccount();
  const networkId = useAppSelector(selectNetworkId);
  const {
    activities: krc20Histories,
    isLoading,
    isError,
    error,
    refetch
  } = useKrc20ActivitiesQuery(
    networkId,
    currentAccount.address,
    token?.tokenType == 'KRC20Mint' ? token?.tick : token?.ca
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      refetch();
    }, 2000);
    return () => {
      clearTimeout(timer);
    };
  }, [refetch, tokenBalance]);

  if (krc20Histories && krc20Histories.length > 0) {
    return (
      <div>
        {krc20Histories.map((e, index) => (
          <KRC20HistoryCard history={e} key={index} token={{ tick: token?.tick ?? '', decimals: token.dec }} />
        ))}
      </div>
    );
  } else if (isLoading) {
    return (
      <Row justifyCenter>
        <LoadingSpinner size="medium" />
      </Row>
    );
  } else if (isError) {
    return (
      <Column justifyCenter>
        <Text text={error?.message} textCenter preset="sub" color="error" selectText />
        <Row justifyCenter>
          <Button
            text="Retry"
            preset="default"
            onClick={() => {
              refetch();
            }}
          />
        </Row>
      </Column>
    );
  } else {
    return <Empty />;
  }
}
