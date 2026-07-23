import type { ConnectedSite } from '@/shared/types/permission';

export interface SignTextHistoryItem {
  site: ConnectedSite;
  createAt: number;
  text: string;
  type: 'personalSign' | 'ethSignTypedData' | 'ethSignTypedDataV1' | 'ethSignTypedDataV3' | 'ethSignTypedDataV4';
}
