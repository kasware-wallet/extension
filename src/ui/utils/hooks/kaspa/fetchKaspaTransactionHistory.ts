import type { KaspaTransactionList } from '@/ui/utils2/interfaces';
import axios from 'axios';

export const fetchKaspaTransactionHistory = async (
  address: string,
  limit: number | null = null,
  before: number | null = null
) => {
  try {
    const params = new URLSearchParams();
    if (limit) {
      params.append('limit', limit.toString());
    }
    if (before) {
      params.append('before', before.toString());
    }
    const response = await axios.get<KaspaTransactionList>(
      `https://api.kaspa.org/addresses/${address}/full-transactions-page?${params.toString()}`
    );

    if (response.data) {
      return response.data;
    } else {
      throw new Error('Error fetching Kaspa transactions. Invalid API response structure');
    }
  } catch (error) {
    console.error('Error fetching Kaspa transactions:', error);
    throw error;
  }
};
