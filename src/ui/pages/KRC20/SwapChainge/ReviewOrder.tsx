import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { IChaingeToken } from '@/shared/types';
import { Row, Text } from '@/ui/components';
import WarningMessage from '@/ui/components/WarningMessage';
import NextButton from '@/ui/components/buttons/NextButton';
import Spinner from '@/ui/components/loaders/Spinner';
import ErrorMessage from '@/ui/components/messages/ErrorMessage';
import PopupMessageDialog from '@/ui/components/messages/PopupMessageDialog';
import type { ChaingeAggregateQuote } from '@/ui/state/transactions/chainge/fetchAggregateQuote';
import useChaingeFunValut from '@/ui/state/transactions/chainge/useChaingeFunValut';
import { useChaingePollOrders } from '@/ui/state/transactions/chainge/useChaingePollOrders';
import useChaingeTokenData, {
  useChaingeKaspPriceDifference
} from '@/ui/state/transactions/chainge/useChaingeTokenData';
import useReceiveAmountAfterFees from '@/ui/state/transactions/chainge/useReceiveAmountAfterFees';
import { formatNumberAbbreviated, formatNumberWithDecimal, formatPercentage, formatUsd, useWallet } from '@/ui/utils';
import { WarningMessages } from '@/ui/utils2/constants/warningMessages';

import ReviewOrderQuote from './ReviewOrderQuote';
import { getChaingeTicker } from '@/shared/utils/chainge';

interface ReviewOrderProps {
  payToken: IChaingeToken;
  receiveToken: IChaingeToken;
  payAmount: string;
  slippage: string;
  priorityFee: number;
  gasFee: string;
  aggregateQuote: ChaingeAggregateQuote;
  onClose: () => void;
}

const ReviewOrder: React.FC<ReviewOrderProps> = ({
  payToken,
  receiveToken,
  payAmount,
  slippage,
  priorityFee,
  gasFee,
  aggregateQuote,
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  onClose
}) => {
  const navigate = useNavigate();
  const wallet = useWallet();
  const receiveAmountAfterFees = useReceiveAmountAfterFees(aggregateQuote, receiveToken);
  const { currencyValue } = useChaingeTokenData(payAmount, payToken, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const { addOrder } = useChaingePollOrders();

  const totalNetworkFees = formatNumberWithDecimal(
    Number(aggregateQuote.gasFee) + Number(aggregateQuote.serviceFee),
    aggregateQuote.chainDecimal
  );
  const { formattedCurrencyValue: formattedNetworkFee } = useChaingeTokenData(
    totalNetworkFees.toString(),
    receiveToken,
    []
  );
  const { data: toAddress } = useChaingeFunValut(payToken);

  const chaingeServiceFee = formatNumberWithDecimal(Number(aggregateQuote.serviceFee), aggregateQuote.chainDecimal);
  const { currencyValue: chaingeServiceFeeCurrencyValue } = useChaingeTokenData(
    chaingeServiceFee.toString(),
    receiveToken,
    []
  );
  const priceDifference = useChaingeKaspPriceDifference();

  // TODO convert USD to local settings currency
  // const formattedOutAmountUsd = formatUsd(Number(aggregateQuote?.amountOutUsd));

  useEffect(() => {
    const amountOutUsd = Number(aggregateQuote.amountOutUsd) * priceDifference;

    if (amountOutUsd < currencyValue * 0.93) {
      // if more than 5% loss on trade
      const difference = currencyValue - amountOutUsd;
      const percentageLoss = ((difference / currencyValue) * 100).toFixed(2);
      const formattedPercentageLoss = formatPercentage(percentageLoss);
      const formattedDifference = formatUsd(difference);
      // const formattedPriceImpact = formatPercentage(aggregateQuote.priceImpact);
      setWarning(WarningMessages.LOW_LIQUIDITY(formattedDifference, formattedPercentageLoss));
    } else {
      setWarning(null);
    }
  }, [aggregateQuote.amountOutUsd, currencyValue, priceDifference]);

  const handleSwap = async () => {
    setLoading(true);
    try {
      if (!toAddress) {
        setError('Error getting Vault address from Chainge API');
        return;
      }

      const order = await wallet.submitChaingeOrder({
        fromAmount: payAmount,
        fromToken: payToken,
        toToken: receiveToken,
        toAddress: toAddress,
        quote: aggregateQuote,
        slippage,
        priorityFee,
        serviceFeeUsd: chaingeServiceFeeCurrencyValue
      });

      if (order?.data?.id) {
        const newOrder = {
          orderId: order.data.id,
          payTokenTicker: getChaingeTicker(payToken),
          payAmount,
          receiveTokenTicker: getChaingeTicker(receiveToken),
          time: Date.now()
        };
        addOrder(newOrder);
      }
      navigate('/krc20/swap/confirmed', { state: { order, receiveToken } });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(`Error submitting swap order to Chainge: ${error.message}`);
      } else {
        setError(`Error submitting swap order to Chainge: ${JSON.stringify(error)}`);
      }
      setShowDialog(true);
      console.error('Error submitting Chainge order:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-90 z-50 px-4">
          <div className="text-center">
            <Spinner />
            <p className="mt-4 text-lg font-semibold text-primarytext">Submitting to Chainge...</p>
            <p className="mt-2 text-base text-mutedtext">Do not close or refresh KasWare Wallet.</p>
          </div>
        </div>
      )}

      <Row justifyBetween itemsCenter>
        <Text text={'From'} color="textDim" style={{ wordWrap: 'break-word' }} selectText mb="md" preset="sub" />
        <Text text={`${formatNumberAbbreviated(Number(payAmount))} ${getChaingeTicker(payToken)}`} />
      </Row>
      <Row justifyBetween itemsCenter>
        <Text text={'To'} color="textDim" style={{ wordWrap: 'break-word' }} selectText mb="md" preset="sub" />
        <Text text={`${formatNumberAbbreviated(receiveAmountAfterFees)} ${getChaingeTicker(receiveToken)}`} />
      </Row>

      {warning && <WarningMessage message={warning} />}

      <ReviewOrderQuote
        gasFee={gasFee}
        slippage={slippage}
        aggregateQuote={aggregateQuote}
        networkFee={formattedNetworkFee}
      />
      {error && <ErrorMessage message={error} />}
      <Row mt="xl" fullX>
        <NextButton text="Swap" onClick={handleSwap} />
      </Row>
      <PopupMessageDialog message={error} onClose={() => setShowDialog(false)} isOpen={showDialog} title="Error" />
    </>
  );
};

export default ReviewOrder;
