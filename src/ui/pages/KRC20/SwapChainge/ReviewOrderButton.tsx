import type { IChaingeToken } from '@/shared/types';
import { Row } from '@/ui/components';
import NextButton from '@/ui/components/buttons/NextButton';
import ErrorMessage from '@/ui/components/messages/ErrorMessage';
import WarningMessage from '@/ui/components/WarningMessage';
import { formatUsd } from '@/ui/utils';
import { MINIMUM_RECEIVE_AMOUNT_USD } from '@/ui/utils2/constants/constants';
import React from 'react';

interface ReviewOrderButtonProps {
  amountError: string | null;
  gasFeeError: string | null;
  amountOutUsd: string;
  payAmount: string;
  loadingQuote: boolean;
  payToken: IChaingeToken | null;
  receiveToken: IChaingeToken | null;
  setIsReviewOrderOpen: () => void;
}

const ReviewOrderButton: React.FC<ReviewOrderButtonProps> = ({
  amountError,
  gasFeeError,
  amountOutUsd,
  payAmount,
  loadingQuote,
  payToken,
  receiveToken,
  setIsReviewOrderOpen
}) => {
  const isBelowMinimum = parseFloat(amountOutUsd.replace(/,/g, '')) < MINIMUM_RECEIVE_AMOUNT_USD;

  return (
    <div>
      {payToken?.ticker === receiveToken?.ticker && payToken && receiveToken ? (
        <WarningMessage message="Cannot swap the same token to itself" />
      ) : payAmount === '0' ? (
        <WarningMessage message="Pay amount must be more than 0" />
      ) : amountError && Number(payAmount) > 0 ? (
        // <ErrorButton text="Insufficient funds" />
        <Row justifyCenter itemsCenter>
          <ErrorMessage message={'insufficient funds'} />
        </Row>
      ) : !loadingQuote && isBelowMinimum && Number(payAmount) > 0 ? (
        <WarningMessage message={`Receive amount must be more than ${formatUsd(MINIMUM_RECEIVE_AMOUNT_USD)}`} />
      ) : gasFeeError ? (
        <WarningMessage message="Either the pay amount is invalid or not enough KAS for gas fees" />
      ) : Number(payAmount) > 0 ? (
        <NextButton text="Review Order" onClick={setIsReviewOrderOpen} buttonEnabled={!loadingQuote} />
      ) : (
        <div />
      )}
    </div>
  );
};

export default ReviewOrderButton;
