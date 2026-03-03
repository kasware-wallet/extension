import type { TNetworkId } from '@/shared/types';

export const getApiBase = (selectedNode: TNetworkId): string => {
  switch (selectedNode) {
    case 'mainnet':
      return 'api';
    case 'testnet-10':
      return 'tn10api';
    case 'testnet-11':
      return 'tn11api';
    case 'testnet-12':
      return 'tn12api';
    default:
      return 'api'; // Default case, if no selected node is found
  }
};
