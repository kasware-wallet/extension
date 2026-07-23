import { useEffect, useMemo, useState } from 'react';
import { RightOutlined } from '@ant-design/icons';

import type { TTokenType } from '@/shared/types';
import { TxType } from '@/shared/types';
import { useAppSelector } from '@/ui/state/hooks';
import { selectAccountBalance } from '@/ui/state/accounts/reducer';
import { selectKasTick } from '@/ui/state/settings/reducer';
import { useKaspaPrice } from '@/ui/utils/hooks/price/usePrice';
import { useKRC20Price } from '@/ui/state/accounts/hooks';
import { formatLocaleString, shortAddress } from '@/ui/utils';
import { sompiToAmount } from '@/shared/utils/format';
import { Card, Column, Row, Text } from '../index';
import { ProfileImage } from '../CryptoImage';
import { useNavigate } from '@/ui/pages/MainRoute';

interface InputToken {
  tokenType: string;
  type: TxType;
  tick?: string;
  ca?: string;
  dec: string;
  balance: string;
  locked: string;
}

interface TokenCardProps {
  inputToken: InputToken;
  tokenType: TTokenType;
}

export function TokenCard({ inputToken, tokenType }: TokenCardProps) {
  const navigate = useNavigate();
  const [tick, setTick] = useState<string>('');
  const kasTick = useAppSelector(selectKasTick);
  const accountBalance = useAppSelector((s) => selectAccountBalance(s, undefined));
  const [balance, setBalance] = useState<string>('');
  const kasPrice = useKaspaPrice();
  const krc20Price = useKRC20Price(inputToken?.ca ? inputToken?.ca : inputToken?.tick ? inputToken?.tick : 'KAS');

  const tokenPrice = useMemo(() => {
    if (inputToken?.type && inputToken.type == TxType.SIGN_KRC20_TRANSFER) return krc20Price;
    return kasPrice;
  }, [inputToken?.type, kasPrice, krc20Price]);

  const content = useMemo(() => {
    if (tokenType == 'KAS') return 'kaspa';
    if (tokenType == 'KRC20Mint') return 'KRC20: ' + (inputToken?.tick as string).toLowerCase();
    if (tokenType == 'KRC20Issue') return 'KRC20: ' + shortAddress(inputToken?.ca);
  }, [tokenType, inputToken]);

  useEffect(() => {
    if (inputToken) {
      setTick(inputToken.tick || '');
      setBalance(sompiToAmount(inputToken.balance, inputToken.dec));
    } else {
      setTick(kasTick);
      setBalance(accountBalance?.amount);
    }
  }, [accountBalance?.amount, inputToken, kasTick]);

  return (
    <Card
      classname="card-select"
      fullX
      justifyBetween
      mt="md"
      onClick={() => {
        navigate('ChooseTokenScreen', { source: 'TxCreateScreen' });
      }}
    >
      <Row full>
        <Column style={{ width: 40 }} selfItemsCenter>
          <ProfileImage size={40} ticker={inputToken?.tick} tokenType={tokenType} ca={inputToken?.ca} />
        </Column>
        <Column full>
          <Row justifyBetween>
            <Text text={tick} />
            <Text text={formatLocaleString(balance)} />
          </Row>
          {tokenPrice <= 0 && <Text text={content} preset="sub" />}
          {tokenPrice > 0 && (
            <Row justifyBetween>
              <Text text={content} preset="sub" />
              <Text text={`$${(Number(balance) * tokenPrice).toLocaleString()}`} preset="sub" />
            </Row>
          )}
        </Column>
        <Row style={{ width: 30 }} selfItemsCenter justifyEnd>
          <RightOutlined />
        </Row>
      </Row>
    </Card>
  );
}
