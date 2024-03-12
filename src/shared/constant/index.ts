/* eslint-disable quotes */

/* constants pool */
import { AddressType, Chain, NetworkType, RestoreWalletType } from '../types';

export enum CHAINS_ENUM {
  BTC = 'BTC'
}

export const CHAINS: Record<string, Chain> = {
  [CHAINS_ENUM.BTC]: {
    name: 'BTC',
    enum: CHAINS_ENUM.BTC,
    logo: '',
    network: 'mainnet'
  }
};

export const KEYRING_TYPE = {
  HdKeyring: 'HD Key Tree',
  SimpleKeyring: 'Simple Key Pair',
  WatchAddressKeyring: 'Watch Address',
  WalletConnectKeyring: 'WalletConnect',
  Empty: 'Empty'
};

export const KEYRING_CLASS = {
  PRIVATE_KEY: 'Simple Key Pair',
  MNEMONIC: 'HD Key Tree'
};

export const KEYRING_TYPE_TEXT = {
  [KEYRING_TYPE.HdKeyring]: 'Created by Mnemonic',
  [KEYRING_TYPE.SimpleKeyring]: 'Imported by Private Key',
  [KEYRING_TYPE.WatchAddressKeyring]: 'Watch Mode'
};
export const BRAND_ALIAN_TYPE_TEXT = {
  [KEYRING_TYPE.HdKeyring]: 'Account',
  [KEYRING_TYPE.SimpleKeyring]: 'Private Key',
  [KEYRING_TYPE.WatchAddressKeyring]: 'Watch',
};

export const KEYRING_TYPES: {
  [key: string]: {
    name: string;
    tag: string;
    alianName: string;
  };
} = {
  'HD Key Tree': {
    name: 'HD Key Tree',
    tag: 'HD',
    alianName: 'HD Wallet'
  },
  'Simple Key Pair': {
    name: 'Simple Key Pair',
    tag: 'IMPORT',
    alianName: 'Single Wallet'
  }
};

export const IS_CHROME = /Chrome\//i.test(navigator.userAgent);

export const IS_FIREFOX = /Firefox\//i.test(navigator.userAgent);

export const IS_LINUX = /linux/i.test(navigator.userAgent);

let chromeVersion: number | null = null;

if (IS_CHROME) {
  const matches = navigator.userAgent.match(/Chrome\/(\d+[^.\s])/);
  if (matches && matches.length >= 2) {
    chromeVersion = Number(matches[1]);
  }
}

export const IS_AFTER_CHROME91 = IS_CHROME ? chromeVersion && chromeVersion >= 91 : false;

export const GAS_LEVEL_TEXT = {
  slow: 'Standard',
  normal: 'Fast',
  fast: 'Instant',
  custom: 'Custom'
};

export const IS_WINDOWS = /windows/i.test(navigator.userAgent);

export const LANGS = [
  {
    value: 'en',
    label: 'English'
  },
  {
    value: 'zh_CN',
    label: 'Chinese'
  },
  {
    value: 'ja',
    label: 'Japanese'
  },
  {
    value: 'es',
    label: 'Spanish'
  }
];

export const ADDRESS_TYPES: {
  value: AddressType;
  label: string;
  name: string;
  hdPath: string;
  displayIndex: number;
  isKaswareLegacy?: boolean;
}[] = [
  {
    value: AddressType.KASPA_44_111111,
    label: 'KASPA Default',
    name: 'Default',
    hdPath: "m/44'/111111'/0'",
    displayIndex: 0,
    isKaswareLegacy: false
  },
  {
    value: AddressType.KASPA_44_972,
    label: 'KASPA Legacy',
    name: 'Legacy',
    hdPath: "m/44'/972/0'",
    displayIndex: 1,
    isKaswareLegacy: false
  },
  // {
  //   value: AddressType.P2PKH,
  //   label: 'P2PKH',
  //   name: 'Legacy (P2PKH)',
  //   hdPath: "m/44'/0'/0'/0",
  //   displayIndex: 3,
  //   isKaswareLegacy: false
  // },
  // {
  //   value: AddressType.P2WPKH,
  //   label: 'P2WPKH',
  //   name: 'Native Segwit (P2WPKH)',
  //   hdPath: "m/84'/0'/0'/0",
  //   displayIndex: 6,
  //   isKaswareLegacy: false
  // },
  // {
  //   value: AddressType.P2TR,
  //   label: 'P2TR',
  //   name: 'Taproot (P2TR)',
  //   hdPath: "m/86'/0'/0'/0",
  //   displayIndex: 2,
  //   isKaswareLegacy: false
  // },
  // {
  //   value: AddressType.P2SH_P2WPKH,
  //   label: 'P2SH-P2WPKH',
  //   name: 'Nested Segwit (P2SH-P2WPKH)',
  //   hdPath: "m/49'/0'/0'/0",
  //   displayIndex: 1,
  //   isKaswareLegacy: false
  // },
  // {
  //   value: AddressType.M44_P2WPKH,
  //   label: 'P2WPKH',
  //   name: 'Native SegWit (P2WPKH)',
  //   hdPath: "m/44'/0'/0'/0",
  //   displayIndex: 4,
  //   isKaswareLegacy: true
  // }
  // {
  //   value: AddressType.M44_P2TR,
  //   label: 'P2TR',
  //   name: 'Taproot (P2TR)',
  //   hdPath: "m/44'/0'/0'/0",
  //   displayIndex: 5,
  //   isKaswareLegacy: true
  // },
];

export const OW_HD_PATH = "m/86'/0'/0'";

export enum DeriveType {
  RECEIVE,
  CHANGE
}
// the sequence of RESTORE_WALLETS should be aligned with RestoreWalletType.
export const RESTORE_WALLETS: { value: RestoreWalletType; name: string; addressTypes: AddressType[] }[] = [
  {
    value: RestoreWalletType.KASWARE,
    name: 'KasWare Wallet',
    addressTypes: [AddressType.KASPA_44_111111]
  },
  // {
  //   value: RestoreWalletType.KASWARE,
  //   name: 'KasWare Wallet',
  //   addressTypes: [
  //     AddressType.P2WPKH,
  //     // AddressType.P2SH_P2WPKH,
  //     // AddressType.P2TR,
  //     // AddressType.P2PKH,
  //     AddressType.M44_P2WPKH
  //     // AddressType.M44_P2TR
  //   ]
  // },
  // {
  //   value: RestoreWalletType.SPARROW,
  //   name: 'Sparrow Wallet',
  //   addressTypes: [
  //     // AddressType.P2PKH,
  //     AddressType.P2WPKH
  //     // AddressType.P2SH_P2WPKH,
  //     // AddressType.P2TR
  //   ]
  // },
  // {
  //   value: RestoreWalletType.XVERSE,
  //   name: 'Xverse Wallet',
  //   addressTypes: [AddressType.P2SH_P2WPKH, AddressType.P2TR]
  // },
  // {
  //   value: RestoreWalletType.OW,
  //   name: 'Ordinals Wallet',
  //   addressTypes: [AddressType.P2TR]
  // },
  // {
  //   value: RestoreWalletType.OTHERS,
  //   name: 'Other Wallet',
  //   addressTypes: [
  //     AddressType.KASPA_44_111111,
  //     // AddressType.P2PKH,
  //     AddressType.P2WPKH,
  //     // AddressType.P2SH_P2WPKH,
  //     // AddressType.P2TR,
  //     AddressType.M44_P2WPKH
  //     // AddressType.M44_P2TR
  //   ]
  // },
  {
    value: RestoreWalletType.KASPIUM,
    name: 'Kaspium Wallet',
    addressTypes: [AddressType.KASPA_44_111111]
  },
  {
    value: RestoreWalletType.KASPANET_WEB,
    name: 'Kaspanet Web Wallet',
    addressTypes: [AddressType.KASPA_44_972]
  },
  {
    value: RestoreWalletType.KDX,
    name: 'KDX Wallet',
    addressTypes: [AddressType.KASPA_44_972]
  },
  {
    value: RestoreWalletType.CORE_GOLANG_CLI,
    name: 'Core Golang Cli Wallet',
    addressTypes: [AddressType.KASPA_44_111111]
  }
];


export const MINIMUM_GAS_LIMIT = 21000;

export enum WATCH_ADDRESS_CONNECT_TYPE {
  WalletConnect = 'WalletConnect'
}

export const WALLETCONNECT_STATUS_MAP = {
  PENDING: 1,
  CONNECTED: 2,
  WAITING: 3,
  SIBMITTED: 4,
  REJECTED: 5,
  FAILD: 6
};

export const INTERNAL_REQUEST_ORIGIN = 'https://kasware.xyz';

export const INTERNAL_REQUEST_SESSION = {
  name: 'KasWare Wallet',
  origin: INTERNAL_REQUEST_ORIGIN,
  icon: './images/logo/logo@128x.png'
};

export const OPENAPI_URL_MAINNET = 'https://api.kaspa.org';
export const OPENAPI_URL_TESTNET = 'https://api.kaspa.org/test';
export const OPENAPI_URL_DEVNET = 'https://api.kaspa.org/dev';
export const OPENAPI_RPC_MAINNET = 'wss://us-1.kaspa-ng.org/mainnet';
export const OPENAPI_RPC_TESTNET = 'wss://eu-1.kaspa-ng.org/testnet-10';
export const OPENAPI_RPC_DEVNET = 'ws://127.0.0.1:17610';

export const NETWORK_TYPES = [
  { value: NetworkType.Mainnet, label: 'Kaspa Mainnet', name: 'kaspa_mainnet', validNames: [0, 'kaspa_mainnet'],url:OPENAPI_RPC_MAINNET },
  { value: NetworkType.Testnet, label: 'Kaspa Testnet', name: 'kaspa_testnet', validNames: ['kaspa_testnet'],url:OPENAPI_RPC_TESTNET },
  { value: NetworkType.Devnet, label: 'Kaspa Devnet', name: 'kaspa_devnet', validNames: ['kaspa_devnet'],url:OPENAPI_RPC_DEVNET},
  { value: NetworkType.Simnet, label: 'Kaspa Simnet', name: 'kaspa_simnet', validNames: ['kaspa_simnet'],url:'' }
  // { value: NetworkType.MAINNET, label: 'LIVENET', name: 'livenet', validNames: [0, 'livenet', 'mainnet'] },
  // { value: NetworkType.TESTNET, label: 'TESTNET', name: 'testnet', validNames: ['testnet'] }
];

export const EVENTS = {
  broadcastToUI: 'broadcastToUI',
  broadcastToBackground: 'broadcastToBackground',
  SIGN_FINISHED: 'SIGN_FINISHED',
  WALLETCONNECT: {
    STATUS_CHANGED: 'WALLETCONNECT_STATUS_CHANGED',
    INIT: 'WALLETCONNECT_INIT',
    INITED: 'WALLETCONNECT_INITED'
  }
};

export const SORT_WEIGHT = {
  [KEYRING_TYPE.HdKeyring]: 1,
  [KEYRING_TYPE.SimpleKeyring]: 2,
  [KEYRING_TYPE.WalletConnectKeyring]: 4,
  [KEYRING_TYPE.WatchAddressKeyring]: 5
};

export const GASPRICE_RANGE = {
  [CHAINS_ENUM.BTC]: [0, 10000]
};

export const COIN_NAME = 'BTC';
export const COIN_SYMBOL = 'BTC';

export const COIN_DUST = 1000;

export const TO_LOCALE_STRING_CONFIG = {
  minimumFractionDigits: 8
};

export const SUPPORTED_DOMAINS = ['sats', 'kasware', 'x', 'btc'];
export const SAFE_DOMAIN_CONFIRMATION = 3;

export const GITHUB_URL = 'https://github.com/kasware-wallet/extension';
export const DISCORD_URL = 'https://discord.gg/Hx8fVpsW';
export const TWITTER_URL = 'https://twitter.com/kasware_wallet';
export const TELEGRAM_URL = 'https://t.me/+eBTwLzz_BcwwMmE1';

export const CHANNEL = process.env.channel!;
// export const VERSION = process.env.release!;
export const VERSION = '0.2.0';
export const MANIFEST_VERSION = process.env.manifest!;

export enum AddressFlagType {
  Is_Enable_Atomicals = 0b1
}
