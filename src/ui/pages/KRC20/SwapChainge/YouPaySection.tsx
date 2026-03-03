import type { IChaingeToken } from '@/shared/types';
import { Card, Column, Row, Text } from '@/ui/components';
import EstimatedCurrencyValue from '@/ui/components/EstimatedCurrencyValue';
import useChaingeTokenData from '@/ui/state/transactions/chainge/useChaingeTokenData';
import { formatNumberAbbreviated, formatNumberWithDecimal } from '@/ui/utils';
import { validateAmountToSend } from '@/ui/utils2/validation';
import React, { useEffect, useState } from 'react';
import ChaingeTokenDropdown from './ChaingeTokenDropdown';

interface YouPaySectionProps {
  payAmount: string;
  payToken: IChaingeToken | null;
  openTokenSelect: () => void;

  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAmountErrorChange?: (error: string | null) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tokens: any[];
}

const YouPaySection: React.FC<YouPaySectionProps> = ({
  payAmount,
  payToken,
  openTokenSelect,
  onAmountChange,
  onAmountErrorChange,
  tokens
}) => {
  const { formattedCurrencyValue, formattedBalance, tokenSymbol } = useChaingeTokenData(
    payAmount && !isNaN(Number(payAmount)) ? payAmount : '0',
    payToken,
    tokens
  );

  const [amountError, setAmountError] = useState<string | null>(null);

  useEffect(() => {
    validateAmountToSend(tokenSymbol, payAmount, formattedBalance, setAmountError);
  }, [payAmount, formattedBalance, tokenSymbol]);

  useEffect(() => {
    if (onAmountErrorChange) {
      onAmountErrorChange(amountError);
    }
  }, [amountError, onAmountErrorChange]);

  const maxBalance = tokens.find((token) => token.tick === payToken?.ticker)?.balance;

  const handleMaxClick = () => {
    if (maxBalance) {
      const formattedMaxBalance = formatNumberWithDecimal(maxBalance, payToken?.decimals || 0);
      onAmountChange({
        target: { value: formattedMaxBalance.toString() }
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/[^0-9.]/g, '');

    const [whole, decimals] = value.split('.');
    const allowedDecimals = payToken?.decimals || 0;
    const truncatedDecimals = decimals?.slice(0, allowedDecimals);

    const validatedValue = truncatedDecimals !== undefined ? `${whole}.${truncatedDecimals}` : whole;
    onAmountChange({
      target: { value: validatedValue }
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <Card>
      <Column full>
        <Row justifyBetween itemsCenter mb="sm">
          <Text text={'From'} color="textDim" style={{ wordWrap: 'break-word' }} selectText mb="md" preset="sub" />
          {/* <ValueAndAvailableBalance
          formattedCurrencyValue={formattedCurrencyValue}
          formattedBalance={formattedBalance}
          showMaxButton={payToken?.symbol !== 'KAS'}
          onMaxClick={handleMaxClick}
        /> */}
          <div className="flex items-center space-x-2">
            {payToken?.ticker !== 'KAS' && (
              <Card classname="card-select" preset="style2" onClick={handleMaxClick}>
                <Text text="MAX" preset="sub" />
              </Card>
            )}
            <span className="text-mutedtext text-base">{`${formatNumberAbbreviated(Number(formattedBalance))} ${
              payToken?.ticker
            }`}</span>
          </div>
        </Row>
        {/* <Row justifyBetween itemsCenter gap="zero">
        <Column full>
          <Input
            preset="text"
            value={payAmount}
            onChange={handleAmountChange}
            placeholder="0"
            style={{ minWidth: 100 }}
          />
        </Column>
        <ChaingeTokenDropdown selectedToken={payToken} openTokenSelect={openTokenSelect} />
      </Row> */}
        <Row justifyBetween itemsCenter>
          <input
            type="text"
            value={payAmount}
            onChange={handleAmountChange}
            placeholder="0"
            className={`bg-transparent text-2xl w-full placeholder-lightmuted ${
              amountError ? 'text-error' : 'text-primarytext'
            }`}
            autoFocus
          />
          <ChaingeTokenDropdown selectedToken={payToken} openTokenSelect={openTokenSelect} />
        </Row>
        <EstimatedCurrencyValue formattedCurrencyValue={formattedCurrencyValue} />
      </Column>
    </Card>
  );
};

export default YouPaySection;
