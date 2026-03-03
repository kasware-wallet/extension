import type { OrderStatusResponse } from '@/shared/types';
import axios from 'axios';

const API_URL = 'https://api2.chainge.finance/fun/checkSwap';

// status:
// Unknown, Refunding, Pending //all regarded as pending
// Succeeded //order executed successfully
// Dropped //order dropped for any reasons, manual refund is needed
// Refunded //order cannot proceed for any reasons, system refunded automatically

export const fetchOrderStatus = async (orderId: string): Promise<OrderStatusResponse> => {
  try {
    const response = await axios.get<OrderStatusResponse>(API_URL, {
      params: { id: orderId }
    });
    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new Error(error?.response?.data?.msg || 'Error checking swap order status from Chainge');
  }
};
