import type { DEX_ENUM } from '@kasware-wallet/common';

export enum NetworkType {
  Mainnet = 0,
  Testnet = 1,
  Devnet = 2,
  Simnet = 3
}

export interface INetworkType {
  value: NetworkType;
  label: string;
  id: TNetworkId;
  name: string;
  validNames: string[];
  url: string;
  isResolver?: boolean;
  resolverUrls?: string[];
}

export type TNetworkId = 'mainnet' | 'testnet-10' | 'testnet-11' | 'testnet-12' | 'devnet' | 'testnet' | 'simnet';

export interface IChain {
  name: string;
  logo: string;
  // network: 'mainnet' | 'testnet' | 'devnet' | 'simnet' | 'testnet10' | 'testnet11';
  network: TNetworkId;
  chainId: number;
}

export interface KaspaBalance {
  confirm_amount: string;
  pending_amount: string;
  outgoing?: string;
  amount: string;
  confirm_kas_amount: string;
  pending_kas_amount: string;
  kas_amount: string;
  usd_value: string;
}

export interface AddressAssets {
  total_kas: string;
  sompi?: number;
}

export interface TxHistoryItem {
  txid: string;
  time: number;
  date: string;
  amount: string;
  symbol: string;
  address: string;
}

export interface AppInfo {
  logo: string;
  title: string;
  desc: string;
  url: string;
  time: number;
  id: string;
  tag?: string;
  readtime?: number;
  new?: boolean;
  tagColor?: string;
}

export interface AppSummary {
  apps: AppInfo[];
  readTabTime?: number;
}

export interface ConfigJSON {
  testnet?: boolean;
  mainnet?: boolean;
  versionConfig: WalletConfig;
  notice: {
    versions: string[];
    showsafenotice: boolean;
    notice: string;
  };
  content: string;
  evmDexList: DEX_ENUM[];
  evmMainnetDexList: DEX_ENUM[];
  evmTestnetDexList: DEX_ENUM[];
  evmBridgeChainList: number[];
  kaspaL2BridgeChainList: number[];
  krcL2BridgeChainList: number[];
}

export type TFeeSummary = Array<{
  title: string;
  desc: string;
  feeRate: number;
}>;

export interface WalletConfig {
  version: string;
  moonPayEnabled: boolean;
  // swapEnabled: boolean;
  // swapEnabledV2: boolean;
  hibitSwapEnabled: boolean;
  chaingeSwapEnabled: boolean;
  evmBridgeEnabled: boolean;
  kaspaL2BridgeEnabled: boolean;
  krcL2BridgeEnabled: boolean;
  statusMessage: string;
  forceUpdate: boolean;
  shouldPopVersion: boolean;
}

export enum WebsiteState {
  CHECKING,
  SCAMMER,
  SAFE
}

export interface AddressSummary {
  totalSompi: number;
  kasSompi: number;
  assetSompi: number;
  loading?: boolean;
}

export interface VersionDetail {
  version: string;
  title: string;
  changelogs: string[];
}

export interface INotice {
  showsafenotice: boolean;
  notice: undefined | string;
}

export interface IKasBalance {
  amount: string;
  kas_amount: string;
  confirm_kas_amount: string;
  pending_kas_amount: string;
  outgoing?: string;
  expired: boolean;
}

export interface IApprovalHistoryItem {
  time: number;
  origin: string;
  fnName: string;
  params: string;
}

export type ICurrencyType = 'crypto' | 'fiat' | 'popular';

export type ICurrencyItem = {
  id: string;
  unit: string;
  name: string;
  type: ICurrencyType;
};

export const CURRENCIES = {
  USD: {
    id: 'usd',
    name: 'US Dollar',
    unit: '$',
    type: 'fiat' as ICurrencyType,
    symbol: '$'
  }, // US Dollar
  EUR: {
    id: 'eur',
    name: 'EUR',
    unit: '€',
    type: 'fiat' as ICurrencyType
  }, // Euro
  GBP: {
    id: 'gbp',
    name: 'British Pound',
    unit: '£',
    type: 'fiat' as ICurrencyType
  } // British Pound
  // AED: 'AED', // UAE Dirham
  // ARS: 'ARS', // Argentine Peso
  // AUD: 'AUD', // Australian Dollar
  // BDT: 'BDT', // Bangladeshi Taka
  // BRL: 'BRL', // Brazilian Real
  // CAD: 'CAD', // Canadian Dollar
  // CHF: 'CHF', // Swiss Franc
  // CLP: 'CLP', // Chilean Peso
  // CNY: 'CNY', // Chinese Yuan
  // COP: 'COP', // Colombian Peso
  // CZK: 'CZK', // Czech Koruna
  // DKK: 'DKK', // Danish Krone
  // EGP: 'EGP', // Egyptian Pound
  // HKD: 'HKD', // Hong Kong Dollar
  // HUF: 'HUF', // Hungarian Forint
  // IDR: 'IDR', // Indonesian Rupiah
  // ILS: 'ILS', // Israeli New Shekel
  // INR: 'INR', // Indian Rupee
  // JPY: 'JPY', // Japanese Yen
  // KRW: 'KRW', // South Korean Won
  // KWD: 'KWD', // Kuwaiti Dinar
  // LKR: 'LKR', // Sri Lankan Rupee
  // MAD: 'MAD', // Moroccan Dirham
  // MXN: 'MXN', // Mexican Peso
  // MYR: 'MYR', // Malaysian Ringgit
  // NGN: 'NGN', // Nigerian Naira
  // NOK: 'NOK', // Norwegian Krone
  // NZD: 'NZD', // New Zealand Dollar
  // PHP: 'PHP', // Philippine Peso
  // PKR: 'PKR', // Pakistani Rupee
  // PLN: 'PLN', // Polish Zloty
  // QAR: 'QAR', // Qatari Riyal
  // RUB: 'RUB', // Russian Ruble
  // SAR: 'SAR', // Saudi Riyal
  // SEK: 'SEK', // Swedish Krona
  // SGD: 'SGD', // Singapore Dollar
  // THB: 'THB', // Thai Baht
  // TRY: 'TRY', // Turkish Lira
  // TWD: 'TWD', // Taiwan Dollar
  // UAH: 'UAH', // Ukrainian Hryvnia
  // VND: 'VND', // Vietnamese Dong
  // ZAR: 'ZAR' // South African Rand
};
