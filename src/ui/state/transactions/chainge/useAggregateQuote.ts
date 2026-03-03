import log from 'loglevel';
import { useEffect, useState } from 'react';

import type { IChaingeToken } from '@/shared/types';
import { fetchAggregateQuote } from '@/ui/state/transactions/chainge/fetchAggregateQuote';
import type { ChaingeAggregateQuote } from '@/ui/state/transactions/chainge/fetchAggregateQuote';
import { formatNumberWithDecimal } from '@/ui/utils';

// TODO refetch every 15 seconds
const useAggregateQuote = (payToken: IChaingeToken | null, receiveToken: IChaingeToken | null, payAmount: string) => {
  const [aggregateQuote, setAggregateQuote] = useState<ChaingeAggregateQuote | undefined>(undefined);
  const [receiveAmount, setReceiveAmount] = useState('');
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const formatPayAmountToBigInt = (amount: number, decimals: number): bigint => {
      const scaledAmount = Math.round(amount * Math.pow(10, decimals));
      return BigInt(scaledAmount);
    };

    const fetchQuote = async () => {
      if (!payAmount || !(Number(payAmount) > 0)) {
        setReceiveAmount('');
        return;
      }

      if (payToken && receiveToken && payAmount && !isNaN(Number(payAmount))) {
        setLoadingQuote(true);
        await new Promise((resolve) => setTimeout(resolve, 200));
        setError(null);
        try {
          const adjustedPayAmount = formatPayAmountToBigInt(parseFloat(payAmount), payToken.decimals || 8);
          const quote = await fetchAggregateQuote(payToken, receiveToken, adjustedPayAmount, { signal });
          setAggregateQuote(quote);
          log.debug('chainge quote', quote);
          if (quote) {
            setReceiveAmount(formatNumberWithDecimal(quote.amountOut, quote.chainDecimal).toString());
          } else {
            setReceiveAmount('');
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          if (error.name === 'AbortError') {
            console.error('Fetch aborted for Chainge aggregate quote');
          } else {
            console.error('Error getting aggregate quote from Chainge API:', error);
            // setError('Chainge DEX error. Please try again.');
            setError(`${error instanceof Error ? error.message : error}`);
            setReceiveAmount('');
          }
        } finally {
          setLoadingQuote(false);
        }
      }
    };

    fetchQuote();

    return () => {
      controller.abort(); // Cancel the previous request on cleanup
    };
  }, [payAmount, payToken, receiveToken]);

  return { aggregateQuote, receiveAmount, setReceiveAmount, loadingQuote, quoteError: error };
};

export default useAggregateQuote;
