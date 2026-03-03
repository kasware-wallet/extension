import { useMemo, useState } from 'react';

import { Text } from '@/ui/components';
import { useAppSelector } from '@/ui/state/hooks';
import { selectKasTick } from '@/ui/state/settings/reducer';

import { Icon } from '../Icon';
import { Row } from '../Row';

export function SubInputAmount({
  inputAmountType,
  setInputAmountType,
  inputAmountUsd,
  tokenPrice,
  tokenTick,
  inputAmount
}) {
  const [hover, setHover] = useState(false);
  const kasTick = useAppSelector(selectKasTick);
  const displayedUsd = useMemo(() => {
    if (Number(inputAmountUsd) >= 0.01) return `$${Number(inputAmountUsd).toLocaleString()}`;
    return `< $0.01`;
  }, [inputAmountUsd, tokenTick, kasTick]);
  if (tokenPrice > 0 && Number(inputAmount) > 0) {
    return (
      <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <Row
          itemsCenter
          onClick={() => {
            if (inputAmountType == 'kas') {
              setInputAmountType('usd');
            } else {
              setInputAmountType('kas');
            }
          }}>
          <Icon icon="swap" color={hover ? 'text' : 'textDim'} size={12} />
          {inputAmountType == 'kas' && tokenPrice > 0 && (
            <Text text={displayedUsd} color={hover ? 'text' : 'textDim'} />
          )}
          {inputAmountType == 'usd' && tokenPrice > 0 && (
            <Text
              text={`${Number(inputAmount).toLocaleString()} ${tokenTick ?? kasTick}`}
              color={hover ? 'text' : 'textDim'}
            />
          )}
        </Row>
      </div>
    );
  } else {
    return <></>;
  }
}
