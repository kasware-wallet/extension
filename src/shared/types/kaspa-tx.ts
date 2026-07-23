import type { Inscription } from './nft';
import type { IKNSDomain } from './kns';

export interface IResultPsbtHex {
  to: string;
  amount: number;
  feeRate: number;
  fee: number;
  priorityFee?: number;
  mass?: number;
  payload?: string;
  // rawtx: string;
}
export interface IFeeRate {
  feerate: number;
  estimatedSeconds: number;
}

export enum TxType {
  SIGN_TX,
  SEND_KASPA,
  SIGN_KRC20_DEPLOY,
  SIGN_KRC20_MINT,
  SIGN_KRC20_TRANSFER,
  SIGN_KRC20_TRANSFER_BATCH,
  SIGN_KRC20_MINT_BATCH,
  SIGN_KNS_TRANSFER,
  SIGN_KSPRNFT_TRANSFER
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
/**
 * @param index index of input
 * @param sighashType sighash type of input
 */
export interface SignPsktOptions {
  signInputs: {
    index: number; // index of input
    sighashType: SighashBiType;
  }[];
}

export interface ToSignInput {
  index: number;
  publicKey: string;
  sighashTypes?: number[];
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
  priorityFee: number;
  fee: number;
  features: {
    rbf: boolean;
  };
  risks: { level: 'high' | 'low'; desc: string }[];
  payload?: string | undefined;
}

export interface DecodedPskt {
  inputInfos: IInputInfo[];
  outputInfos: IOutputInfo[];
  feeRate: number;
  priorityFee: number;
  fee: number;
  features: {
    rbf: boolean;
  };
  risks: { level: 'high' | 'low'; desc: string }[];
  payload: string;
}

export interface IInputInfo {
  txid: string;
  vout: number;
  address: string;
  value: number;
  sighashType: number;
}

export interface IOutputInfo {
  address: string;
  value: number;
}

export interface ToAddressInfo {
  address: string;
  domain?: string;
  inscription?: Inscription;
  knsDomain?: IKNSDomain;
}

export interface RawTxInfo {
  psbtHex: string;
  rawtx: string;
  toAddressInfo?: ToAddressInfo;
  amount?: number;
  priorityFee?: number;
  fee?: number;
  mass?: number;
  payload?: string;
}

export type TPendingTxType = 'sendkas' | 'retrieve' | 'commit' | 'reveal' | 'buykrc20token' | 'compound';

export interface ITransactionInfo {
  mode: string;
  isAccepted: boolean;
  amount: string;
  usdValue: string;
  block_time: number;
  transaction_id: string;
  relatedAddresses?: string[];
  txDetail: Record<string, unknown>;
  payload: string | undefined;
}

export interface IRecentTransactoinAddresses {
  mode: string;
  block_time: number;
  transaction_id: string;
  relatedAddresses: string[];
}

export interface ISignKRC20TX {
  commitId: string;
  revealId: string;
  commitTxStr: string;
  revealTxStr: string;
}

export interface ITxInfo {
  motherAddress: string;
  txFee: number;
  transaction_id: string;
  sourceAddress: string;
  // mode: 'Send KAS' | 'Commit' | 'Retrieve' | 'Reveal';
  mode: TPendingTxType;
  isAccepted: boolean;
  status: 'submitted' | 'success';
  amount: number;
  usdValue: string;
  block_time: number;
  txDetail: {
    accepting_block_blue_score: number;
  };
}

export interface ITxParam {
  type: TPendingTxType;
  txFee: number;
  outputIndexOfFee: number;
  transaction: string;
  redeemScript: string | Uint8Array;
  toSignInputs: ToSignInput[];
}

/**
 * Kaspa Sighash types allowed by consensus
 * @category Consensus https://kaspa-mdbook.aspectron.com/transactions/sighashes.html
 */
export enum SighashBiType {
  All = 0b00000001 as const, // 1
  None = 0b00000010 as const, // 2
  Single = 0b00000100 as const, // 4
  AllAnyOneCanPay = 0b10000001 as const, // 128 + 1 = 129
  NoneAnyOneCanPay = 0b10000010 as const, // 128 + 2 = 130
  SingleAnyOneCanPay = 0b10000100 as const // 128 + 4 = 132
}

export type TSignMessage = 'schnorr' | 'ecdsa' | 'auto';
