import React from 'react';

import type { IChaingeToken } from '@/shared/types';
import { Card, Column, Row, Text } from '@/ui/components';
import EstimatedCurrencyValue from '@/ui/components/EstimatedCurrencyValue';
import type { ChaingeAggregateQuote } from '@/ui/state/transactions/chainge/fetchAggregateQuote';
import { useChaingeKaspPriceDifference } from '@/ui/state/transactions/chainge/useChaingeTokenData';
import useReceiveAmountAfterFees from '@/ui/state/transactions/chainge/useReceiveAmountAfterFees';
import { formatUsd } from '@/ui/utils';

import ChaingeTokenDropdown from './ChaingeTokenDropdown';

interface YouReceiveSectionProps {
  receiveAmount: string;
  receiveToken: IChaingeToken | null;
  payAmount: string;
  openTokenSelect: () => void;
  aggregateQuote: ChaingeAggregateQuote | undefined;
  loadingQuote: boolean;
}

const YouReceiveSection: React.FC<YouReceiveSectionProps> = ({
  receiveAmount,
  receiveToken,
  payAmount,
  openTokenSelect,
  aggregateQuote,
  loadingQuote
}) => {
  const receiveAmountAfterFees = useReceiveAmountAfterFees(aggregateQuote, receiveToken);
  const displayAmount = receiveAmount ? receiveAmountAfterFees.toString() : '';

  const isPayAmountValid = Number(payAmount) > 0;
  const priceDifference = useChaingeKaspPriceDifference();
  // TODO allow for other currencies
  const formattedCurrencyValue = formatUsd(
    Number(isPayAmountValid ? aggregateQuote?.amountOutUsd || 0 : 0) * priceDifference
  );

  return (
    <Card>
      <Column full>
        <Row justifyBetween itemsCenter mb="sm">
          <Text text={'To'} color="textDim" style={{ wordWrap: 'break-word' }} selectText mb="md" preset="sub" />
        </Row>

        <Row justifyBetween itemsCenter>
          {loadingQuote || (payAmount && !receiveAmount && !aggregateQuote?.amountOutUsd) ? (
            <div className="w-40 h-8 bg-muted rounded-md animate-pulse"></div>
          ) : (
            <input
              type="text"
              value={displayAmount}
              placeholder="0"
              readOnly
              className={`bg-transparent ${
                displayAmount ? 'text-primarytext' : 'text-lightmuted'
              } placeholder:text-lightmuted text-2xl w-40 focus:outline-none`}
            />
          )}
          <ChaingeTokenDropdown selectedToken={receiveToken} openTokenSelect={openTokenSelect} />
        </Row>

        {loadingQuote || (payAmount && !receiveAmount && !aggregateQuote?.amountOutUsd) ? (
          <div className="w-14 h-5 bg-muted rounded-md mb-1 animate-pulse"></div>
        ) : (
          <EstimatedCurrencyValue formattedCurrencyValue={formattedCurrencyValue} />
        )}
      </Column>
    </Card>
  );
};

export default YouReceiveSection;
