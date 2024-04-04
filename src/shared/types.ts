/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
import { NetworkType } from 'kaspa-wasm';

import { CHAINS_ENUM } from './constant';

// default means KASPA_44_111111
export enum AddressType {
  KASPA_44_111111,
  KASPA_44_972,
  KASPA_ONEKEY_44_111111,
}

export { NetworkType };
// export enum NetworkType {
//   KASPA_MAINNET = 0,
//   KASPA_TESTNET = 1,
//   KASPA_DEVNET = 2,
//   KASPA_SIMNET = 3,
//   MAINNET = 4,
//   TESTNET = 5,
// }

// the sequence of RestoreWalletType should be aligned with RESTORE_WALLETS.
export enum RestoreWalletType {
  KASWARE,
  // OTHERS,
  KASPIUM,
  KASPANET_WEB,
  KDX,
  CORE_GOLANG_CLI,
  ONEKEY
}

export interface IResultPsbtHex {
  to: string;
  amountSompi: number;
  feeRate: number;
  fee: number;
  // rawtx: string;
}

export interface IScannedGroup {
  type: AddressType;
  address_arr: string[];
  sompi_arr: number[];
  dtype_arr: number[];
  index_arr: number[]
  // Number('1' + deriveType.toString() + keyringindex.toString());
}

export interface Chain {
  name: string;
  logo: string;
  enum: CHAINS_ENUM;
  network: string;
}

export interface KaspaBalance {
  confirm_amount: string;
  pending_amount: string;
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
  id: number;
  tag?: string;
  readtime?: number;
  new?: boolean;
  tagColor?: string;
}

export interface AppSummary {
  apps: AppInfo[];
  readTabTime?: number;
}

export interface FeeSummary {
  list: {
    title: string;
    desc: string;
    feeRate: number;
  }[];
}
export interface IKaspaUTXO {
  address: string;
  outpoint: { index: number; transactionId: string };
  utxoEntry: {
    amount: bigint;
    blockDaaScore: bigint;
    isCoinbase: boolean;
    scriptPublicKey: string;
  };
}

export interface IKaspaUTXOWithoutBigint {
  address: string;
  outpoint: { index: number; transactionId: string };
  utxoEntry: {
    amount: string;
    blockDaaScore: string;
    isCoinbase: boolean;
    scriptPublicKey: string;
  };
}

export interface UTXO {
  txid: string;
  vout: number;
  sompi: number;
  scriptPk: string;
  addressType: AddressType;
}

export interface UTXO_Detail {
  txId: string;
  outputIndex: number;
  sompi: number;
  scriptPk: string;
  addressType: AddressType;
}

export enum TxType {
  SIGN_TX,
  SEND_KASPA,
}

interface BaseUserToSignInput {
  index: number;
  sighashTypes: number[] | undefined;
  disableTweakSigner?: boolean;
}

export interface AddressUserToSignInput extends BaseUserToSignInput {
  address: string;
}

export interface PublicKeyUserToSignInput extends BaseUserToSignInput {
  publicKey: string;
}

export type UserToSignInput = AddressUserToSignInput | PublicKeyUserToSignInput;

export interface SignPsbtOptions {
  autoFinalized: boolean;
  toSignInputs?: UserToSignInput[];
}

export interface ToSignInput {
  index: number;
  publicKey: string;
  sighashTypes?: number[];
}
export type WalletKeyring = {
  key: string;
  index: number;
  type: string;
  addressType: AddressType;
  accounts: Account[];
  alianName: string;
  hdPath: string;
};

export interface Account {
  type: string;
  pubkey: string;
  address: string;
  brandName?: string;
  alianName?: string;
  displayBrandName?: string;
  index?: number;
  deriveType?: number;
  balance?: number;
  key: string;
  flag: number;
}

export interface tempAccount {
  publickey: string;
  deriveType: number;
  index: number;
}
export interface TokenBalance {
  availableBalance: string;
  overallBalance: string;
  ticker: string;
  transferableBalance: string;
  availableBalanceSafe: string;
  availableBalanceUnSafe: string;
}

export interface TokenInfo {
  totalSupply: string;
  totalMinted: string;
}
export interface TokenTransfer {
  ticker: string;
  amount: string;
  timestamp: number;
}

export interface AddressTokenSummary {
  tokenInfo: TokenInfo;
  tokenBalance: TokenBalance;
  historyList: TokenTransfer[];
  transferableList: TokenTransfer[];
}

export interface DecodedPsbt {
  inputInfos: {
    txid: string;
    vout: number;
    address: string;
    value: number;
    sighashType: number;
  }[];
  outputInfos: {
    address: string;
    value: number;
  }[];
  feeRate: number;
  fee: number;
  features: {
    rbf: boolean;
  };
  risks: { level: 'high' | 'low'; desc: string }[];
}

export interface ToAddressInfo {
  address: string;
  domain?: string;
}

export interface RawTxInfo {
  psbtHex: string;
  rawtx: string;
  toAddressInfo?: ToAddressInfo;
  fee?: number;
}

export interface WalletConfig {
  version: string;
  moonPayEnabled: boolean;
  statusMessage: string;
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

export interface IOpts {
  activeIndexes: number[] | IActiveIndexes;
  activeChangeIndexes?:number[] | IActiveIndexes;
  hdPath: string;
  mnemonic: string;
  passphrase: string;
  addressType:AddressType
}

export interface IActiveIndexes {
  receiveIndexes: number[]
  changeIndexes:number[]
}

export interface ITransactionInfo {
  mode: string;
  isConfirmed: boolean;
  amount: string;
  usdValue: string;
  block_time: number;
  transaction_id: string;
  relatedAddresses?: string[];
  txDetail:any
}

export interface IRecentTransactoinAddresses {
  mode: string;
  block_time: number;
  transaction_id: string;
  relatedAddresses: string[];
}
