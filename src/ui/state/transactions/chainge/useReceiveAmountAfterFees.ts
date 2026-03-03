import type { IChaingeToken } from '@/shared/types';
import type { ChaingeAggregateQuote } from '@/ui/state/transactions/chainge/fetchAggregateQuote';
import { formatNumberWithDecimal } from '@/ui/utils';
import { useEffect, useState } from 'react';

const useReceiveAmountAfterFees = (
  aggregateQuote: ChaingeAggregateQuote | undefined,
  receiveToken: IChaingeToken | null
) => {
  const [receiveAmountAfterFees, setReceiveAmountAfterFees] = useState(0);

  useEffect(() => {
    if (aggregateQuote && receiveToken) {
      const calculatedAmount = formatNumberWithDecimal(
        Number(aggregateQuote.amountOut) - Number(aggregateQuote.serviceFee) - Number(aggregateQuote.gasFee),
        aggregateQuote.chainDecimal
      );
      setReceiveAmountAfterFees(calculatedAmount);
    } else {
      setReceiveAmountAfterFees(0);
    }
  }, [aggregateQuote, receiveToken]);

  return receiveAmountAfterFees;
};

export default useReceiveAmountAfterFees;
