import type { OrderStatusResponse, TChaingeOrderResponse } from '@/shared/types';
import { fetchOrderStatus } from '@/ui/state/transactions/chainge/fetchOrderStatus';
import { useEffect, useRef, useState } from 'react';

interface UseOrderStatusProps {
  order: TChaingeOrderResponse;
  onSuccess?: (orderId: string) => void;
}

const useOrderStatus = ({ order, onSuccess }: UseOrderStatusProps) => {
  const [status, setStatus] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);
  const [recieveSompi, setRecieveSompi] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<Record<string, boolean>>({}); // Tracks polling per orderId
  useEffect(() => {
    const currentPollingRef = pollingRef.current;

    if (!order?.data?.id) {
      if (order?.msg) {
        setError(`Chainge DEX error: ${order?.msg}`);
        console.error('Chainge DEX error:', order);
      } else {
        setError(`Unknown error occurred using Chainge DEX: ${JSON.stringify(order)}`);
        console.error('Unknown Chainge DEX error:', order);
      }
      setLoading(false);
      return;
    }

    const orderId = order.data.id;
    currentPollingRef[orderId] = true;

    const pollOrderStatus = async () => {
      try {
        const response: OrderStatusResponse = await fetchOrderStatus(orderId);

        if (response.data.status === 'Succeeded') {
          setStatus('Succeeded');
          setTxId(response.data?.hash || null);
          setRecieveSompi(response.data?.amountOut ? response.data?.amountOut : null);
          setLoading(false);
          currentPollingRef[orderId] = false;

          if (onSuccess) {
            onSuccess(orderId);
          }
        } else if (currentPollingRef[orderId]) {
          setTimeout(pollOrderStatus, 1000);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (currentPollingRef[orderId]) {
          setError(err.message || 'An unexpected error occurred while fetching order status.');
          setLoading(false);
        }
      }
    };

    pollOrderStatus();

    return () => {
      currentPollingRef[orderId] = false;
    };
  }, [order, onSuccess]);

  return { status, txId, recieveSompi, loading, error };
};

export default useOrderStatus;
