import KaswareLogo from '@/assets/logo/logo@128x.png';
import type { IChain, INetworkType, TNetworkId } from '../types';
import { AddressType, NetworkType, RestoreWalletType } from '../types';

export enum NETWORK_ID {
  mainnet = 'mainnet',
  testnet10 = 'testnet-10',
  testnet11 = 'testnet-11',
  testnet12 = 'testnet-12',
  testnet = 'testnet',
  devnet = 'devnet',
  simnet = 'simnet'
}
export enum KASPA_CHAINS_ENUM {
  KASPA_MAINNET = 'kaspa_mainnet',
  KASPA_TN10 = 'kaspa_testnet10',
  KASPA_TN11 = 'kaspa_testnet11',
  KASPA_TN12 = 'kaspa_testnet12'
}
export const CHAINS: Record<KASPA_CHAINS_ENUM, IChain> = {
  [KASPA_CHAINS_ENUM.KASPA_MAINNET]: {
    name: 'KASPA',
    logo: '',
    network: 'mainnet',
    chainId: 111111
  },
  [KASPA_CHAINS_ENUM.KASPA_TN10]: {
    name: 'KASPA',
    logo: '',
    network: 'testnet-10',
    chainId: 111111
  },
  [KASPA_CHAINS_ENUM.KASPA_TN11]: {
    name: 'KASPA',
    logo: '',
    network: 'testnet-11',
    chainId: 111111
  },
  [KASPA_CHAINS_ENUM.KASPA_TN12]: {
    name: 'KASPA',
    logo: '',
    network: 'testnet-12',
    chainId: 111111
  }
};

export const KEYRING_TYPE = {
  HdKeyring: 'HD Key Tree',
  SimpleKeyring: 'Simple Key Pair',
  WatchAddressKeyring: 'Watch Address',
  WalletConnectKeyring: 'WalletConnect',
  Empty: 'Empty'
};

export const KEYRING_TYPE_TEXT = {
  [KEYRING_TYPE.HdKeyring]: 'Created by Mnemonic',
  [KEYRING_TYPE.SimpleKeyring]: 'Imported by Private Key',
  [KEYRING_TYPE.WatchAddressKeyring]: 'Watch Mode'
};
export const BRAND_ALIAN_TYPE_TEXT = {
  [KEYRING_TYPE.HdKeyring]: 'Account',
  [KEYRING_TYPE.SimpleKeyring]: 'Private Key',
  [KEYRING_TYPE.WatchAddressKeyring]: 'Watch'
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

export const IS_CHROME = /Chrome\//i.test(typeof navigator !== 'undefined' ? navigator.userAgent : '');

export const IS_FIREFOX = /Firefox\//i.test(typeof navigator !== 'undefined' ? navigator.userAgent : '');

export const IS_LINUX = /linux/i.test(typeof navigator !== 'undefined' ? navigator.userAgent : '');

let chromeVersion: number | null = null;

if (IS_CHROME) {
  const matches = typeof navigator !== 'undefined' ? navigator.userAgent.match(/Chrome\/(\d+[^.\s])/) : null;
  if (matches && matches.length >= 2) {
    chromeVersion = Number(matches[1]);
  }
}

export const IS_AFTER_CHROME91 = IS_CHROME ? chromeVersion && chromeVersion >= 91 : false;

export const GAS_LEVEL_TEXT = {
  $unknown: 'Unknown',
  normal: 'Standard',
  fast: 'Fast',
  instant: 'Instant',
  custom: 'Custom'
} as const;

export const IS_WINDOWS = /windows/i.test(typeof navigator !== 'undefined' ? navigator.userAgent : '');

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
    name: 'ECDSA',
    hdPath: "m/44'/111111'/0'",
    displayIndex: 0,
    isKaswareLegacy: false
  },
  {
    value: AddressType.KASPA_CHAINGE_44_111111_0_0,
    label: 'Chainge',
    name: 'Chainge',
    hdPath: "m/44'/111111'/0'/0'",
    displayIndex: 0,
    isKaswareLegacy: false
  }
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
    value: RestoreWalletType.CHAINGE,
    name: 'Chainge Wallet',
    addressTypes: [AddressType.KASPA_CHAINGE_44_111111_0_0]
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

export const MINIMUM_GAS_LIMIT = 21000 as const;
export const KASPLEX = 'kasplex' as const;
export const KNS = 'kns' as const;
export const CONST_KSRP = 'kspr' as const;

export enum WATCH_ADDRESS_CONNECT_TYPE {
  WalletConnect = 'WalletConnect'
}

export const WALLETCONNECT_STATUS_MAP = {
  PENDING: 1,
  CONNECTED: 2,
  WAITING: 3,
  SUBMITTED: 4,
  REJECTED: 5,
  FAILED: 6,
  SUBMITTING: 7
};

export const INTERNAL_REQUEST_ORIGIN = 'https://kasware.xyz';

export const INTERNAL_REQUEST_SESSION = {
  name: 'KasWare Wallet',
  origin: INTERNAL_REQUEST_ORIGIN,
  icon: KaswareLogo
};

export const VAULT_ADDRESS1_TESTNET = process.env.VAULT_ADDRESS1_TESTNET as string;
export const MULTISIG_ADDRESS2_TESTNET = process.env.MULTISIG_ADDRESS2_TESTNET as string;

export const OPENAPI_URL_MAINNET = 'https://api.kaspa.org';
export const OPENAPI_URL_TESTNET_12 = 'https://api-tn12.kaspa.org';
export const OPENAPI_URL_TESTNET_11 = 'https://api-tn11.kaspa.org';
export const OPENAPI_URL_TESTNET_10 = 'https://api-tn10.kaspa.org';
export const OPENAPI_URL_DEVNET = 'https://api.kaspa.org/dev';

// Fallback API hosts used when primary hosts are unreachable
export const OPENAPI_FALLBACK_MAINNET = 'https://api-fallback.kaspa.org';
export const OPENAPI_FALLBACK_TESTNET_12 = 'https://api-tn12-fallback.kaspa.org';
export const OPENAPI_FALLBACK_TESTNET_11 = 'https://api-tn11-fallback.kaspa.org';
export const OPENAPI_FALLBACK_TESTNET_10 = 'https://api-tn10-fallback.kaspa.org';
export const OPENAPI_URL_MAP: Partial<Record<TNetworkId, string>> = {
  ['mainnet']: OPENAPI_URL_MAINNET,
  ['testnet-12']: OPENAPI_URL_TESTNET_12,
  ['testnet-11']: OPENAPI_URL_TESTNET_11,
  ['testnet-10']: OPENAPI_URL_TESTNET_10,
  ['devnet']: OPENAPI_URL_DEVNET
};

export const OPENAPI_RPC_DEVNET = 'ws://127.0.0.1:17610';
export const KSPR_KRC721_MAINNET = 'https://mainnet.krc721.stream/api/v1/krc721/mainnet';
export const KSPR_KRC721_TESTNET_12 = 'https://testnet-12.krc721.stream/api/v1/krc721/testnet-12';
export const KSPR_KRC721_TESTNET_11 = 'https://testnet-11.krc721.stream/api/v1/krc721/testnet-11';
export const KSPR_KRC721_TESTNET_10 = 'https://testnet-10.krc721.stream/api/v1/krc721/testnet-10';
export const KASPLEX_MAINNET = 'https://api.kasplex.org/v1';
export const KASPLEX_TESTNET_12 = 'https://tn12api.kasplex.org/v1';
export const KASPLEX_TESTNET_11 = 'https://tn11api.kasplex.org/v1';
export const KASPLEX_TESTNET_10 = 'https://tn10api.kasplex.org/v1';
export const KASPLEX_DEVNET = 'https://tn11api.kasplex.org/v1';

// Fallback Kasplex API hosts used when primary hosts are unreachable
export const KASPLEX_FALLBACK_MAINNET = 'https://api-fallback.kasplex.org/v1';
export const KASPLEX_FALLBACK_TESTNET_12 = 'https://tn12api-fallback.kasplex.org/v1';
export const KASPLEX_FALLBACK_TESTNET_11 = 'https://tn11api-fallback.kasplex.org/v1';
export const KASPLEX_FALLBACK_TESTNET_10 = 'https://tn10api-fallback.kasplex.org/v1';
export const KRC20OTC_API_TESTNET_10 = process.env.KRC20OTC_API_TESTNET_10 as string;

export const CHAINGE_API_URL = 'https://api2.chainge.finance/v1/checkOrder';
export const API_POST_ORDER_URL = process.env.API_POST_ORDER_URL as string;

export const KNS_WEBSITE_MAINNET = 'https://www.knsdomains.org';
export const KNS_WEBSITE_MAINNET_APP = 'https://app.knsdomains.org';
export const KNS_WEBSITE_TESTNET_10 = 'https://tn10.knsdomains.org';

export const KNS_API_MAINNET = 'https://api.knsdomains.org/mainnet/api/v1';
export const KNS_API_TESTNET_10 = 'https://api.knsdomains.org/tn10/api/v1';
export const KNS_API_TESTNET_11 = 'https://api.knsdomains.org/tn11/api/v1';
export const KNS_API_TESTNET_12 = 'https://api.knsdomains.org/tn12/api/v1';
export const KNS_API_DEVNET = 'https://api.knsdomains.org/tn10/api/v1';

export const NETWORK_TYPES: {
  [networkId in 'mainnet' | 'testnet-12' | 'testnet-11' | 'testnet-10' | 'devnet']: INetworkType;
} = {
  mainnet: {
    value: NetworkType.Mainnet,
    label: 'Mainnet',
    id: 'mainnet',
    name: 'kaspa_mainnet',
    validNames: [0, 'kaspa_mainnet'] as string[],
    url: '',
    isResolver: true,
    resolverUrls: []
  },
  'testnet-12': {
    value: NetworkType.Testnet,
    label: 'Testnet 12',
    id: 'testnet-12',
    name: 'kaspa_testnet_12',
    validNames: ['kaspa_testnet_12'],
    url: '',
    isResolver: true,
    resolverUrls: []
  },
  'testnet-11': {
    value: NetworkType.Testnet,
    label: 'Testnet 11',
    id: 'testnet-11',
    name: 'kaspa_testnet_11',
    validNames: ['kaspa_testnet_11'],
    url: '',
    isResolver: true,
    resolverUrls: []
  },
  'testnet-10': {
    value: NetworkType.Testnet,
    label: 'Testnet 10',
    id: 'testnet-10',
    name: 'kaspa_testnet_10',
    validNames: ['kaspa_testnet_10'],
    url: '',
    isResolver: true,
    resolverUrls: []
  },
  devnet: {
    value: NetworkType.Devnet,
    label: 'Devnet',
    id: 'devnet',
    name: 'kaspa_devnet',
    validNames: ['kaspa_devnet'],
    url: OPENAPI_RPC_DEVNET,
    isResolver: true,
    resolverUrls: []
  }
  // {
  //   value: NetworkType.Simnet,
  //   id: 'simnet',
  //   label: 'Simnet',
  //   name: 'kaspa_simnet',
  //   validNames: ['kaspa_simnet'],
  //   url: ''
  // }
  // { value: NetworkType.MAINNET, label: 'LIVENET', name: 'livenet', validNames: [0, 'livenet', 'mainnet'] },
  // { value: NetworkType.TESTNET, label: 'TESTNET', name: 'testnet', validNames: ['testnet'] }
};

export const KASPA_EVENTS = {
  broadcastToUI: 'broadcastToUI',
  sendToUI: 'sendToUI',
  broadcastToBackground: 'broadcastToBackground',
  SIGN_FINISHED: 'SIGN_FINISHED',
  WALLETCONNECT: {
    STATUS_CHANGED: 'WALLETCONNECT_STATUS_CHANGED',
    INIT: 'WALLETCONNECT_INIT',
    INITED: 'WALLETCONNECT_INITED'
  }
};

export const EVM_EVENTS = {
  broadcastToUI: 'broadcastToUI',
  broadcastToBackground: 'broadcastToBackground',
  TX_COMPLETED: 'TX_COMPLETED',
  SIGN_FINISHED: 'SIGN_FINISHED',
  TX_SUBMITTING: 'TX_SUBMITTING',
  WALLETCONNECT: {
    STATUS_CHANGED: 'WALLETCONNECT_STATUS_CHANGED',
    SESSION_STATUS_CHANGED: 'SESSION_STATUS_CHANGED',
    SESSION_ACCOUNT_CHANGED: 'SESSION_ACCOUNT_CHANGED',
    SESSION_NETWORK_DELAY: 'SESSION_NETWORK_DELAY',
    INIT: 'WALLETCONNECT_INIT',
    INITED: 'WALLETCONNECT_INITED',
    TRANSPORT_ERROR: 'TRANSPORT_ERROR',
    SCAN_ACCOUNT: 'SCAN_ACCOUNT'
  },
  GNOSIS: {
    TX_BUILT: 'TransactionBuilt',
    TX_CONFIRMED: 'TransactionConfirmed'
  },
  QRHARDWARE: {
    ACQUIRE_MEMSTORE_SUCCEED: 'ACQUIRE_MEMSTORE_SUCCEED'
  },
  LEDGER: {
    REJECTED: 'LEDGER_REJECTED',
    REJECT_APPROVAL: 'LEDGER_REJECT_APPROVAL'
  },
  COMMON_HARDWARE: {
    REJECTED: 'COMMON_HARDWARE_REJECTED'
  },
  LOCK_WALLET: 'LOCK_WALLET',
  RELOAD_TX: 'RELOAD_TX',
  SIGN_BEGIN: 'SIGN_BEGIN',
  SIGN_WAITING_AMOUNTED: 'SIGN_WAITING_AMOUNTED',
  // FORCE_EXPIRE_ADDRESS_BALANCE: 'FORCE_EXPIRE_ADDRESS_BALANCE',
  GAS_ACCOUNT: {
    LOG_IN: 'LOG_IN',
    LOG_OUT: 'LOG_OUT'
  }
};
export const SORT_WEIGHT = {
  [KEYRING_TYPE.HdKeyring]: 1,
  [KEYRING_TYPE.SimpleKeyring]: 2,
  [KEYRING_TYPE.WalletConnectKeyring]: 4,
  [KEYRING_TYPE.WatchAddressKeyring]: 5
};

export const GASPRICE_RANGE = {
  [KASPA_CHAINS_ENUM.KASPA_MAINNET]: [0, 10000]
};

export const COIN_NAME = 'KAS';
export const COIN_SYMBOL = 'KAS';

export const COIN_DUST = 100000; // 0.001 KAS

export const TO_LOCALE_STRING_CONFIG = {
  minimumFractionDigits: 8
};

export const SUPPORTED_DOMAINS = ['kas'];
export const SAFE_DOMAIN_CONFIRMATION = 3;

export const GITHUB_URL = 'https://github.com/kasware-wallet/extension';
export const DISCORD_URL = 'https://discord.gg/8FSkXrjhGT';
export const TWITTER_URL = 'https://twitter.com/kasware_wallet';
export const TELEGRAM_URL = 'https://t.me/kasware_wallet';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion, no-undef
export const VERSION = process.env.release as string;
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion, no-undef
export const MANIFEST_VERSION = process.env.manifest!;
export const KASWARE_IO_KRC20_PRICE = process.env.KASWARE_IO_KRC20_PRICE as string;

export enum AddressFlagType {
  Is_Enable_Kasplex = 0b1
}

export const DEFAULT_FEE_SUMMARY = [
  {
    title: 'Slow',
    desc: '<1 sec',
    feeRate: 1
  },
  {
    title: 'Avg',
    desc: '<1 sec',
    feeRate: 1
  },
  {
    title: 'Fast',
    desc: '<1 sec',
    feeRate: 1
  }
];

export const REQUIRED_VALUE_KRC20_MINT = '1';
export const REQUIRED_VALUE_KRC20_DEPLOY = '1000';
export const TXFEE_COEFF = 1.1;
export const DONATION_ADDRESS = process.env.DONATION_ADDRESS as string;
export const DONATION_ADDRESS_TESTNET = process.env.DONATION_ADDRESS_TESTNET as string;
export const CHARGE_FEE_ADDRESS = process.env.CHARGE_FEE_ADDRESS as string;
export const CHARGE_FEE_ADDRESS2 = process.env.CHARGE_FEE_ADDRESS2 as string;
export const CHARGE_FEE_ADDRESS3 = process.env.CHARGE_FEE_ADDRESS3 as string;
export const CHARGE_FEE_ADDRESS4 = process.env.CHARGE_FEE_ADDRESS4 as string;
export const CHARGE_FEE_ADDRESS5 = process.env.CHARGE_FEE_ADDRESS5 as string;
export const CHARGE_FEE_ADDRESS6 = process.env.CHARGE_FEE_ADDRESS6 as string;
export const CHARGE_FEE_ADDRESS_TESTNET = process.env.CHARGE_FEE_ADDRESS_TESTNET as string;
export const CHARGE_FEE_ADDRESS_TESTNET2 = process.env.CHARGE_FEE_ADDRESS_TESTNET2 as string;
export const CHARGE_FEE_ADDRESS_TESTNET3 = process.env.CHARGE_FEE_ADDRESS_TESTNET3 as string;
export const CHARGE_FEE_ADDRESS_TESTNET4 = process.env.CHARGE_FEE_ADDRESS_TESTNET4 as string;
export const CHARGE_FEE_ADDRESS_TESTNET5 = process.env.CHARGE_FEE_ADDRESS_TESTNET5 as string;
export const CHARGE_FEE_ADDRESS_TESTNET6 = process.env.CHARGE_FEE_ADDRESS_TESTNET6 as string;
export const CHARGE_FEE_MINT = '1';
export const CHARGE_FEE_DEPLOY = '1';
export const KRC20_TRADE_FEE = '1';

export const MINIMUM_KAS_BALANCE = 5;

export const KRC20_TRADE_FEE_ADDRESS = process.env.KRC20_TRADE_FEE_ADDRESS as string;
export const KRC20_TRADE_FEE_ADDRESS2 = process.env.KRC20_TRADE_FEE_ADDRESS2 as string;
export const KRC20_TRADE_FEE_ADDRESS3 = process.env.KRC20_TRADE_FEE_ADDRESS3 as string;
export const KRC20_TRADE_FEE_ADDRESS4 = process.env.KRC20_TRADE_FEE_ADDRESS4 as string;
export const KRC20_TRADE_FEE_ADDRESS5 = process.env.KRC20_TRADE_FEE_ADDRESS5 as string;
export const KRC20_TRADE_FEE_ADDRESS_TEST = process.env.KRC20_TRADE_FEE_ADDRESS_TEST as string;
export const KRC20_TRADE_FEE_ADDRESS_TEST2 = process.env.KRC20_TRADE_FEE_ADDRESS_TEST2 as string;
export const KRC20_TRADE_FEE_ADDRESS_TEST3 = process.env.KRC20_TRADE_FEE_ADDRESS_TEST3 as string;
export const KRC20_TRADE_FEE_ADDRESS_TEST4 = process.env.KRC20_TRADE_FEE_ADDRESS_TEST4 as string;
export const KRC20_TRADE_FEE_ADDRESS_TEST5 = process.env.KRC20_TRADE_FEE_ADDRESS_TEST5 as string;

export const initialTabsStatus = {
  TOKENS: true,
  NFT: true,
  ACTIVITIES: true,
  UTXO: true
};

// key name for long term storage
export enum STORE_KEYS {
  preference = 'preference',
  openapi = 'openapi',
  permission = 'permission',
  contactBook = 'contactBook',
  customTestnet = 'customTestnet',
  permissionEVM = 'permissionEVM',
  preferenceEVM = 'preferenceEVM',
  transactions = 'transactions',
  transactionBroadcastWatcher = 'transactionBroadcastWatcher',
  txHistory = 'txHistory',
  contactBookEVM = 'contactBookEVM',
  signTextHistory = 'signTextHistory',
  whitelist = 'whitelist',
  swap = 'swap',
  rpc = 'rpc',
  securityEngine = 'securityEngine',
  HDKeyRingLastAddAddrTime = 'HDKeyRingLastAddAddrTime',
  bridge = 'bridge',
  gasAccount = 'gasAccount',
  UninstalledMetric = 'UninstalledMetric',
  metamaskMode = 'metamaskMode',
  OfflineChains = 'OfflineChains',
  widgets = 'widgets'
}
