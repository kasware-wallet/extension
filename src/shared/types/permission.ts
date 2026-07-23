import type { BasicDappInfo } from '@kasware-wallet/api';
import type { EVM_CHAINS_ENUM, KASPA_CHAINS_ENUM } from '../constant';

export interface ConnectedSite {
  origin: string;
  icon: string;
  name: string;
  chain: EVM_CHAINS_ENUM | KASPA_CHAINS_ENUM;
  e?: number;
  isSigned: boolean;
  isTop: boolean;
  order?: number;
  isConnected: boolean;
  /**
   * @deprecated
   */
  preferMetamask?: boolean;
  isFavorite?: boolean;
  info?: BasicDappInfo;
  /**
   * eip6963 rdns
   */
  rdns?: string;
  isMetamaskMode?: boolean;
}
