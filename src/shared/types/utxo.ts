import type { AddressType } from './keyring';

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
export interface IUtxoEntryJson {
  entry: {
    address: {
      version: string;
      prefix: string;
      payload: string;
    };
    outpoint: {
      transactionId: string;
      index: number;
    };
    amount: number;
    scriptPublicKey: {
      version: number;
      script: string;
    };
    blockDaaScore: number;
    isCoinbase: boolean;
  };
  outpoint: {
    transactionId: string;
    index: number;
  };
  address: {
    version: string;
    prefix: string;
    payload: string;
  };
  amount: number;
  isCoinbase: boolean;
  blockDaaScore: number;
  scriptPublicKey: {
    version: number;
    script: string;
  };
}
export interface ISubmitCommitParams {
  priorityEntries?: IUtxoEntryJson[];
  entries: IUtxoEntryJson[];
  outputs: { address: string; amount: number }[];
  changeAddress: string;
  priorityFee?: number;
  feeRate?: number;
  script: string;
  networkId?: string;
}

export interface ISubmitRevealParams {
  priorityEntries: IUtxoEntryJson[];
  entries: IUtxoEntryJson[];
  outputs?: { address: string; amount: number }[];
  changeAddress: string;
  priorityFee?: number;
  feeRate?: number;
  script: string;
  networkId?: string;
}

export interface IKaspaUtxoEntryReference {
  entry: {
    address: string;
    amount: string;
    blockDaaScore: string;
    isCoinbase: boolean;
    outpoint: { index: number; transactionId: string };
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

export interface IP2shOutput {
  transaction_id: string;
  utxo_index: number;
  utxoJson: IUtxoEntryJson;
  script_public_key: string;
  commitAddress: string;
  // balance is in sompi unit
  balance: string;
  inscribeJsonString: string;
  redeemScript: string;
  scriptPublicKey: string;
}
