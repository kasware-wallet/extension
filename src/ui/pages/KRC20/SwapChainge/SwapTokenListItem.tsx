import React, { useEffect, useMemo, useState } from 'react';

import { Card, Column, Row, Text } from '@/ui/components';
import CryptoImage from '@/ui/components/CryptoImage';
import { useAppSelector } from '@/ui/state/hooks';
import { selectKasTick } from '@/ui/state/settings/reducer';
import type { IChaingeTokenWithBalance } from '@/ui/state/transactions/chainge/useChaingeTokens';
import { formatLocaleString, getUsdValueStr } from '@/ui/utils';
import { useKaspaPrice } from '@/ui/utils/hooks/price/usePrice';
import { getChaingeTicker } from '@/shared/utils/chainge';
import { sompiToAmount } from '@/shared/utils/format';

interface SwapTokenListItemProps {
  token: IChaingeTokenWithBalance;
}

const SwapTokenListItem: React.FC<SwapTokenListItemProps> = ({ token }) => {
  const ticker = useMemo(() => {
    return getChaingeTicker(token);
  }, [token]);

  const kasTick = useAppSelector(selectKasTick);

  const kasPrice = useKaspaPrice();
  const [usdValueStr, setUsdValueStr] = useState<string>('-');

  const protocol = useMemo(() => {
    if (ticker == kasTick && token.priceInKas == 1) return 'Kaspa';
    return 'KRC20';
  }, [kasTick, ticker, token.priceInKas]);

  useEffect(() => {
    const amt = sompiToAmount(token.balance, token.decimals);
    const res = getUsdValueStr(kasPrice * token.priceInKas, amt);
    setUsdValueStr(res);
  }, [token, kasPrice]);
  return (
    <Card classname="card-select" full justifyBetween mt="sm">
      <Column style={{ width: 40 }} selfItemsCenter>
        <CryptoImage ticker={ticker} size={32} />
      </Column>
      <Column full>
        <Row justifyBetween>
          <Text text={ticker} />
          <Text
            text={formatLocaleString(sompiToAmount(BigInt(token?.balance) ?? 0, token.decimals))}
            style={{ paddingRight: 5, wordWrap: 'normal' }}
            preset="regular"
          />
        </Row>
        <Row justifyBetween>
          <Text text={protocol} preset="sub" />
          <Text text={usdValueStr} preset="sub" />
        </Row>
      </Column>
    </Card>
  );
};

export default SwapTokenListItem;
