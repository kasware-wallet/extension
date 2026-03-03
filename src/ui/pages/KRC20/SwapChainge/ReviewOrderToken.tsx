import type { IChaingeToken } from '@/shared/types';
import { getChaingeTicker } from '@/shared/utils/chainge';
import { Column, Row, Text } from '@/ui/components';
import CryptoImage from '@/ui/components/CryptoImage';
import EstimatedCurrencyValue from '@/ui/components/EstimatedCurrencyValue';
import React from 'react';

interface ReviewOrderTokenProps {
  title: string;
  token: IChaingeToken;
  amount: string;
  formattedCurrencyValue: string;
}

const ReviewOrderToken: React.FC<ReviewOrderTokenProps> = ({ title, token, amount, formattedCurrencyValue }) => {
  const ticker = getChaingeTicker(token);

  return (
    <Row itemsCenter>
      <CryptoImage ticker={ticker} size={32} />
      <Column>
        <Row justifyBetween itemsCenter>
          <Text preset="title" text={title} />
          <span>
            <EstimatedCurrencyValue formattedCurrencyValue={formattedCurrencyValue} />
          </span>
        </Row>
        <Text preset="title" text={`${amount} ${ticker}`} />
      </Column>
    </Row>
  );
};

export default ReviewOrderToken;
