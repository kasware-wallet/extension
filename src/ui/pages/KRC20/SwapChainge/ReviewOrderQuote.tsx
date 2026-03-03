import { Row, Text } from '@/ui/components';
import type { ChaingeAggregateQuote } from '@/ui/state/transactions/chainge/fetchAggregateQuote';
import { formatGasFee, formatPercentage } from '@/ui/utils';
import React, { useMemo } from 'react';

interface ReviewOrderProps {
  gasFee: string;
  slippage: string;
  aggregateQuote: ChaingeAggregateQuote;
  networkFee: string;
}

const ReviewOrderQuote: React.FC<ReviewOrderProps> = ({ gasFee, slippage, aggregateQuote, networkFee }) => {
  const rows = useMemo(() => {
    return [
      {
        label: `Network fee`,
        // value: <EstimatedCurrencyValue formattedCurrencyValue={networkFee} />
        value: networkFee
      },
      {
        label: 'Gas fee',
        value: `${formatGasFee(gasFee)} KAS`
      },
      {
        label: 'Price impact',
        value: formatPercentage(aggregateQuote.priceImpact)
      },
      {
        label: 'Slippage',
        value: formatPercentage(slippage)
      }
    ];
  }, [gasFee, slippage, aggregateQuote.priceImpact, networkFee]);

  return (
    <>
      {rows.map((row) => (
        <Row key={row.label} justifyBetween>
          <Text mt="md" text={row.label} textCenter color="textDim" selectText preset="sub" />
          <Text mt="md" text={row.value} textCenter selectText />
        </Row>
      ))}
    </>
  );
};

export default ReviewOrderQuote;
