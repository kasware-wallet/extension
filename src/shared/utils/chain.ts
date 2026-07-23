import type { EVM_CHAINS_ENUM } from '../constant';
import { EvmChainLogoMap } from '../constant/chain';
import type { TNetworkId } from '../types';
import type { TestnetChain, TestnetChainBase } from '../types/chain';
import { intToHex } from '@ethereumjs/util';

export const createTestnetChain = (chain: TestnetChainBase): TestnetChain => {
  chain.id = +chain.id;
  const logo =
    chain.logo ||
    EvmChainLogoMap[chain.id]?.chain_logo_url ||
    `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 28'><circle cx='14' cy='14' r='14' fill='%236A7587'></circle><text x='14' y='15' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='16' font-weight='500'>${encodeURIComponent(
      chain.name.trim().substring(0, 1).toUpperCase()
    )}</text></svg>`;
  return {
    ...chain,
    id: +chain.id,
    hex: intToHex(+chain.id),
    network: '' + chain.id,
    enum: `CUSTOM_${chain.id}` as EVM_CHAINS_ENUM,
    serverId: `custom_${chain.id}`,
    nativeTokenAddress: `custom_${chain.id}`,
    nativeTokenDecimals: 18,
    nativeTokenLogo: chain.nativeTokenLogo || EvmChainLogoMap[chain.id]?.token_logo_url || logo,

    scanLink: chain.scanLink || '',
    logo,
    eip: {
      1559: true
    },
    isTestnet: true,
    severity: 0
  };
};

export function getKaspaExplorerUrl(networkId: TNetworkId) {
  switch (networkId) {
    case 'mainnet':
      return 'https://explorer.kaspa.org';
    case 'testnet-12':
      return 'https://next-explorer.kasia.fyi';
    case 'testnet-11':
      return 'https://explorer-tn11.kaspa.org';
    case 'testnet-10':
      return 'https://tn10.kaspa.stream';
    default:
      return '';
  }
}
