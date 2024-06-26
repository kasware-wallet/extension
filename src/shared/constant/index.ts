/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-undef */
/* eslint-disable quotes */

/* constants pool */
import { AddressType, Chain, NetworkType, RestoreWalletType } from '../types';

export enum CHAINS_ENUM {
  KAS = 'KAS'
}

export const CHAINS: Record<string, Chain> = {
  [CHAINS_ENUM.KAS]: {
    name: 'KAS',
    enum: CHAINS_ENUM.KAS,
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
    alianName: 'Wallet'
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
// should be aligned with the order of AddressType
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
  {
    value: AddressType.KASPA_ONEKEY_44_111111,
    label: 'OneKey',
    name: 'Onekey',
    hdPath: "m/44'/111111'/0'",
    displayIndex: 0,
    isKaswareLegacy: false
  },
  {
    value: AddressType.KASPA_TANGEM_44_111111,
    label: 'Tangem',
    name: 'Tangem',
    hdPath: "m/44'/111111'/0'",
    displayIndex: 0,
    isKaswareLegacy: false
  },
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
  },
  {
    value: RestoreWalletType.OKX,
    name: 'OKX Wallet',
    addressTypes: [AddressType.KASPA_44_111111]
  },
  {
    value: RestoreWalletType.LEDGER,
    name: 'Ledger Wallet',
    addressTypes: [AddressType.KASPA_44_111111]
  },
  {
    value: RestoreWalletType.ONEKEY,
    name: 'OneKey Wallet',
    addressTypes: [AddressType.KASPA_ONEKEY_44_111111]
  },
  {
    value: RestoreWalletType.TANGEM,
    name: 'Tangem Wallet',
    addressTypes: [AddressType.KASPA_TANGEM_44_111111]
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
export const OPENAPI_RPC_TESTNET = 'wss://eu-1.kaspa-ng.org/testnet-11';
export const OPENAPI_RPC_DEVNET = 'ws://127.0.0.1:17610';

export const NETWORK_TYPES = [
  { value: NetworkType.Mainnet, label: 'Kaspa Mainnet', name: 'kaspa_mainnet', validNames: [0, 'kaspa_mainnet'],url:undefined },
  { value: NetworkType.Testnet, label: 'Kaspa Testnet 11', name: 'kaspa_testnet', validNames: ['kaspa_testnet'],url:undefined },
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
  [CHAINS_ENUM.KAS]: [0, 10000]
};

export const COIN_NAME = 'KAS';
export const COIN_SYMBOL = 'KAS';

export const COIN_DUST = 20000000;

export const TO_LOCALE_STRING_CONFIG = {
  minimumFractionDigits: 8
};

export const SUPPORTED_DOMAINS = ['sats', 'kasware', 'x', 'kas'];
export const SAFE_DOMAIN_CONFIRMATION = 3;

export const GITHUB_URL = 'https://github.com/kasware-wallet/extension';
export const DISCORD_URL = 'https://discord.gg/vQ4Jd9hKU5';
export const TWITTER_URL = 'https://twitter.com/kasware_wallet';
export const TELEGRAM_URL = 'https://t.me/+eBTwLzz_BcwwMmE1';

export const CHANNEL = process.env.channel!;
// export const VERSION = process.env.release!;
export const VERSION = '0.6.0';
export const MANIFEST_VERSION = process.env.manifest!;

export enum AddressFlagType {
  Is_Enable_Kasplex = 0b1
}
