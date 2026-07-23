import type { CHAINS_ENUM } from '@kasware-wallet/common';
import IgraLogo from '@/assets/igra.png';
import KasplexLogo from '@/assets/kasplex.ico';
import KaspaIconDarkGreen from '@/assets/icons/Kaspa-Icon-Dark-Green-on-Black.svg';
import KaspaIcon from '@/assets/icons/kaspa.svg';

interface ChainLogoItem {
  chain_logo_url: string;
  token_logo_url?: string;
  tokens?: { id: string; logoURI: string }[];
}

export const EvmChainLogoMap: Record<string, ChainLogoItem> = {
  '1': { chain_logo_url: 'https://coin-images.coingecko.com/asset_platforms/images/279/thumb/ethereum.png?1706606803' },
  '10': { chain_logo_url: 'https://coin-images.coingecko.com/asset_platforms/images/41/thumb/optimism.png?1706606778' },
  '56': {
    chain_logo_url: 'https://coin-images.coingecko.com/asset_platforms/images/1/thumb/bnb_smart_chain.png?1706606721'
  },
  '100': {
    chain_logo_url:
      'https://coin-images.coingecko.com/asset_platforms/images/11062/thumb/Aatar_green_white.png?1706606458'
  },
  '130': {
    chain_logo_url: 'https://coin-images.coingecko.com/asset_platforms/images/22206/thumb/unichain.png?1739323630'
  },
  '137': {
    chain_logo_url: 'https://coin-images.coingecko.com/asset_platforms/images/15/thumb/polygon_pos.png?1706606645'
  },
  '146': {
    chain_logo_url:
      'https://coin-images.coingecko.com/asset_platforms/images/22192/thumb/128xS_token_Black-BG_2x.png?1735963719'
  },
  '250': { chain_logo_url: 'https://coin-images.coingecko.com/asset_platforms/images/17/thumb/fantom.png?1706606773' },
  '324': {
    chain_logo_url: 'https://coin-images.coingecko.com/asset_platforms/images/121/thumb/zksync.jpeg?1706606814'
  },
  '19416': { chain_logo_url: IgraLogo, token_logo_url: KaspaIconDarkGreen },
  '38836': { chain_logo_url: IgraLogo, token_logo_url: KaspaIconDarkGreen },
  '38833': { chain_logo_url: IgraLogo, token_logo_url: KaspaIconDarkGreen },
  '8217': { chain_logo_url: 'https://coin-images.coingecko.com/asset_platforms/images/9672/thumb/kaia.png?1734946776' },
  '8453': {
    chain_logo_url: 'https://coin-images.coingecko.com/asset_platforms/images/131/thumb/base-network.png?1720533039'
  },
  '202555': {
    chain_logo_url: KasplexLogo,
    token_logo_url: KaspaIconDarkGreen
  },
  '42161': {
    chain_logo_url: 'https://coin-images.coingecko.com/asset_platforms/images/33/thumb/AO_logomark.png?1706606717'
  },
  '43114': {
    chain_logo_url: 'https://coin-images.coingecko.com/asset_platforms/images/12/thumb/avalanche.png?1706606775'
  },
  '59144': {
    chain_logo_url: 'https://coin-images.coingecko.com/asset_platforms/images/135/thumb/linea.jpeg?1706606705'
  },
  '167012': {
    chain_logo_url: KasplexLogo,
    token_logo_url: KaspaIconDarkGreen
  },
  '1313161554': {
    chain_logo_url:
      'https://coin-images.coingecko.com/asset_platforms/images/53/thumb/Aurora-logo-token-darkBG.png?1706606474'
  }
};

export const KASPA_FAKE_EVM = {
  id: 2,
  serverId: 'custom_2',
  name: 'Kaspa',
  hex: '0x2',
  enum: 'CUSTOM_2' as CHAINS_ENUM,
  network: '2',
  nativeTokenSymbol: 'KAS',
  nativeTokenLogo: KaspaIconDarkGreen,
  nativeTokenDecimals: 8,
  nativeTokenAddress: 'custom_2',
  scanLink: 'https://explorer.kaspa.org',
  eip: {
    1559: false
  },
  logo: KaspaIcon
};
