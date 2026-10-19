import type { Inscription } from './nft';
import type { IKNSDomain } from './kns';

export interface IResultPsbtHex {
  to: string;
  amount: number;
  // The same amount in sompi. `amount` is the KAS figure the approval screen renders; anything that
  // has to build or compare a transaction reads this one, because a decimal that has been through
  // KAS and back is not exact.
  amountSompi?: string;
  feeRate: number;
  fee: number;
  priorityFee?: number;
  mass?: number;
  payload?: string;
  // The amount is the whole spendable balance and the fee comes out of it, so the broadcast has to
  // use FeeSource.ReceiverPays.
  sendAll?: boolean;
  // The exact outpoints this payment must spend, when the user picked them.
  inputOutpoints?: {
    transactionId: string;
    index: number;
  }[];
  // Actual inputs/outputs from the generated transaction
  inputs?: {
    txid: string;
    vout: number;
    address: string;
    value: number;
    sighashType: number;
  }[];
  outputs?: {
    address: string;
    value: number;
    isChange?: boolean;
  }[];
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
  SIGN_KSPRNFT_TRANSFER,
  SIGN_KCC20_TRANSFER
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

/**
 * The network and account a dApp `signPskt` request was created under, captured before the approval
 * window opens and re-checked right before signing.
 */
export interface SignPsktDappContext {
  networkId: string;
  accountAddress: string;
}

export interface ToSignInput {
  index: number;
  publicKey: string;
  sighashTypes?: number[];
}

/**
 * Severity of a risk raised while decoding a transaction.
 *
 * 'high' hides the Sign button in the approval screens, so it is reserved for
 * findings that no legitimate transaction produces. 'medium' and 'low' are
 * advisory: the user is told what was found and decides.
 */
export type TxRiskLevel = 'high' | 'medium' | 'low';

export interface TxRisk {
  level: TxRiskLevel;
  desc: string;
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
    isChange?: boolean;
  }[];
  feeRate: number;
  priorityFee: number;
  fee: number;
  features: {
    rbf: boolean;
  };
  risks: TxRisk[];
  payload?: string | undefined;
}

export interface DecodedPskt {
  inputInfos: IInputInfo[];
  outputInfos: IOutputInfo[];
  feeRate: number;
  priorityFee: number;
  fee: number;
  /**
   * The same fee in sompi as an integer decimal string. `''` for a partial PSKT.
   */
  feeSompi?: string;
  /**
   * True when an input is signed with a non-standard sighash (ANYONECANPAY / SINGLE / NONE),
   * so the counterparty still has to add inputs or outputs.
   */
  isPartial?: boolean;
  features: {
    rbf: boolean;
  };
  risks: TxRisk[];
  payload: string;
}

export interface IInputInfo {
  txid: string;
  vout: number;
  address: string;
  value: number;
  /** The exact amount in sompi as an integer string. */
  valueSompi?: string;
  sighashType: number;
  isToSign?: boolean;
  /** Detected script type for risk-display purposes. */
  scriptType?: 'p2pk' | 'p2sh' | 'unknown';
}

export interface IOutputInfo {
  address: string;
  value: number;
  /** The exact amount in sompi as an integer string. */
  valueSompi?: string;
  isChange?: boolean;
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
  // Decimal KAS. String when the send screen forwarded what the user typed.
  amount?: number | string;
  priorityFee?: number;
  fee?: number;
  mass?: number;
  payload?: string;
}

export type TPendingTxType = 'sendkas' | 'retrieve' | 'commit' | 'reveal' | 'buykrc20token' | 'compound';

export interface IKaspaApiTxInput {
  previous_outpoint_address?: string;
  previous_outpoint_amount?: number | string;
}

export interface IKaspaApiTxOutput {
  script_public_key_address?: string;
  amount?: number;
}

/**
 * One entry of the kaspa.org `full-transactions` response.
 */
export interface IKaspaApiTransaction {
  transaction_id: string;
  block_time: number;
  is_accepted: boolean;
  inputs?: IKaspaApiTxInput[];
  outputs?: IKaspaApiTxOutput[];
  payload?: string;
}

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

/**
 * The sighash types `signPskt` will sign for a dApp. NONE and NONE|ANYONECANPAY are excluded on
 * purpose: a NONE signature does not commit to the outputs.
 */
export const ALLOWED_PSKT_SIGHASH: readonly number[] = [
  SighashBiType.All,
  SighashBiType.Single,
  SighashBiType.AllAnyOneCanPay,
  SighashBiType.SingleAnyOneCanPay
];

export type TSignMessage = 'schnorr' | 'ecdsa' | 'auto';
