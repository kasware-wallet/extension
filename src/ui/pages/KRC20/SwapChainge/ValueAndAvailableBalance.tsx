import { Card, Row, Text } from '@/ui/components';
import EstimatedCurrencyValue from '@/ui/components/EstimatedCurrencyValue';
import { formatNumberAbbreviated } from '@/ui/utils';
import React from 'react';

interface ValueAndAvailableBalanceProps {
  formattedCurrencyValue: string;
  formattedBalance: string | number;
  showMaxButton?: boolean;
  onMaxClick?: () => void;
}

const ValueAndAvailableBalance: React.FC<ValueAndAvailableBalanceProps> = ({
  formattedCurrencyValue,
  formattedBalance,
  showMaxButton = false,
  onMaxClick
}) => {
  return (
    <Row justifyBetween itemsCenter mt="md">
      <EstimatedCurrencyValue formattedCurrencyValue={formattedCurrencyValue} />
      <div className="flex items-center space-x-2">
        <span className="text-mutedtext text-base">{formatNumberAbbreviated(Number(formattedBalance))}</span>
        {showMaxButton && (
          <Card classname="card-select" preset="style2" onClick={onMaxClick}>
            <Text text="MAX" preset="sub" />
          </Card>
        )}
      </div>
    </Row>
  );
};

export default ValueAndAvailableBalance;
