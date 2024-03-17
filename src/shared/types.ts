/* eslint-disable no-unused-vars */
import { NetworkType } from 'kaspa-wasm';

import { CHAINS_ENUM } from './constant';

// default means KASPA_44_111111
export enum AddressType {
  KASPA_44_111111,
  KASPA_44_972
  // P2PKH,
  // P2WPKH,
  // P2TR,
  // P2SH_P2WPKH,
  // M44_P2WPKH,
  // M44_P2TR,
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
  // OW,
  // OTHERS,
  KASPIUM,
  KASPANET_WEB,
  KDX,
  CORE_GOLANG_CLI
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
  satoshis_arr: number[];
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

export interface BitcoinBalance {
  confirm_amount: string;
  pending_amount: string;
  amount: string;
  confirm_btc_amount: string;
  pending_btc_amount: string;
  btc_amount: string;
  confirm_inscription_amount: string;
  pending_inscription_amount: string;
  inscription_amount: string;
  usd_value: string;
}

export interface AddressAssets {
  total_btc: string;
  satoshis?: number;
  total_inscription: number;
}

export interface TxHistoryItem {
  txid: string;
  time: number;
  date: string;
  amount: string;
  symbol: string;
  address: string;
}

export interface Inscription {
  inscriptionId: string;
  inscriptionNumber: number;
  address: string;
  outputValue: number;
  preview: string;
  content: string;
  contentType: string;
  contentLength: number;
  timestamp: number;
  genesisTransaction: string;
  location: string;
  output: string;
  offset: number;
  contentBody: string;
  utxoHeight: number;
  utxoConfirmation: number;
}

export interface Atomical {
  atomicalId: string;
  atomicalNumber: number;
  type: 'FT' | 'NFT';
  ticker?: string;

  // mint info
  address: string;
  outputValue: number;
  preview: string;
  content: string;
  contentType: string;
  contentLength: number;
  timestamp: number;
  genesisTransaction: string;
  location: string;
  output: string;
  offset: number;
  contentBody: string;
  utxoHeight: number;
  utxoConfirmation: number;
}

export interface InscriptionMintedItem {
  title: string;
  desc: string;
  inscriptions: Inscription[];
}

export interface InscriptionSummary {
  mintedList: InscriptionMintedItem[];
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
  // txid: string;
  // vout: number;
  // satoshis: number;
  // scriptPk: string;
  // addressType: AddressType;
  // inscriptions: {
  //   inscriptionId: string;
  //   inscriptionNumber?: number;
  //   offset: number;
  // }[];
  // atomicals: {
  //   atomicalId: string;
  //   atomicalNumber: number;
  //   type: 'NFT' | 'FT';
  //   ticker?: string;
  // }[];
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
  satoshis: number;
  scriptPk: string;
  addressType: AddressType;
  inscriptions: {
    inscriptionId: string;
    inscriptionNumber?: number;
    offset: number;
  }[];
  atomicals: {
    atomicalId: string;
    atomicalNumber: number;
    type: 'NFT' | 'FT';
    ticker?: string;
  }[];
}

export interface UTXO_Detail {
  txId: string;
  outputIndex: number;
  satoshis: number;
  scriptPk: string;
  addressType: AddressType;
  inscriptions: Inscription[];
}

export enum TxType {
  SIGN_TX,
  SEND_BITCOIN,
  SEND_ORDINALS_INSCRIPTION,
  SEND_ATOMICALS_INSCRIPTION
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

export interface InscribeOrder {
  orderId: string;
  payAddress: string;
  totalFee: number;
  minerFee: number;
  originServiceFee: number;
  serviceFee: number;
  outputValue: number;
}

export interface TokenBalance {
  availableBalance: string;
  overallBalance: string;
  ticker: string;
  transferableBalance: string;
  availableBalanceSafe: string;
  availableBalanceUnSafe: string;
}

export interface Arc20Balance {
  ticker: string;
  balance: number;
  confirmedBalance: number;
  unconfirmedBalance: number;
}

export interface TokenInfo {
  totalSupply: string;
  totalMinted: string;
}

export enum TokenInscriptionType {
  INSCRIBE_TRANSFER,
  INSCRIBE_MINT
}
export interface TokenTransfer {
  ticker: string;
  amount: string;
  inscriptionId: string;
  inscriptionNumber: number;
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
    inscriptions: Inscription[];
    atomicals: Atomical[];
    sighashType: number;
  }[];
  outputInfos: {
    address: string;
    value: number;
    inscriptions: Inscription[];
    atomicals: Atomical[];
  }[];
  inscriptions: { [key: string]: Inscription };
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
  inscription?: Inscription;
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
  totalSatoshis: number;
  btcSatoshis: number;
  assetSatoshis: number;
  inscriptionCount: number;
  atomicalsCount: number;
  brc20Count: number;
  arc20Count: number;
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
