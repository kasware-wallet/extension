import type { KASPA_CHAINS_ENUM } from '../constant';

// default means KASPA_44_111111
export enum AddressType {
  KASPA_44_111111,
  KASPA_44_972,
  KASPA_ONEKEY_44_111111,
  KASPA_TANGEM_44_111111,
  KASPA_CHAINGE_44_111111_0_0,
  ETH_44_60_0, // ledger legacy
  ETH_44_60_0_0_0 //EIP44
}

// the sequence of RestoreWalletType should be aligned with RESTORE_WALLETS.
export enum RestoreWalletType {
  KASWARE,
  // OTHERS,
  KASPIUM,
  KASPANET_WEB,
  KDX,
  CORE_GOLANG_CLI,
  OKX,
  CHAINGE,
  LEDGER,
  ONEKEY,
  TANGEM
}

export interface IScannedGroup {
  type: AddressType;
  address_arr: string[];
  sompi_arr: number[];
  krc20_arr: boolean[];
  dtype_arr: number[];
  index_arr: number[];
  // Number('1' + deriveType.toString() + keyringindex.toString());
}

export type BooleanByChain = Partial<Record<KASPA_CHAINS_ENUM, boolean>>;
export type StringByChain = Partial<Record<KASPA_CHAINS_ENUM, string>>;
export type NumberByChain = Partial<Record<KASPA_CHAINS_ENUM, number>>;

/**
 * key -- used for store keyring display name.
 * alianName -- used for display.
 */
export type WalletKeyring = {
  key: string;
  index: number;
  type: string;
  addressType: AddressType;
  // addressTypeMap: Map<KASPA_CHAINS_ENUM, AddressType>;
  accounts: Account[];
  alianName: string;
  hdPath: string;
  // hdPathMap: StringByChain;
  balanceKas: number;
  // balanceMap: NumberByChain;
};

/**
 * @type keyring type
 * @key used for store keyring display name.
 * @alianName used for display.
 */
export interface Account {
  type: string;
  /** @deprecated */
  pubkeyMap?: StringByChain;
  pubkey: string;
  /** @deprecated */
  addressMap?: StringByChain;
  address: string;
  evmAddress: string;
  brandName: string;
  alianName?: string;
  displayBrandName?: string;
  index?: number; // 1 + dereiveType + activeIndex
  deriveType?: number; //The second to last number of the derived path
  /** @deprecated */
  balanceMap?: NumberByChain;
  balance?: number;
  key: string;
  flag: number;
}

export interface TempAccount {
  publickey: string;
  deriveType: number;
  index: number;
}

export interface IOpts {
  activeIndexes: number[] | IActiveIndexes; //last number of derivepath
  activeChangeIndexes?: number[] | IActiveIndexes; //last number of derivepath
  hdPath: string;
  mnemonic: string;
  passphrase: string;
  addressType: AddressType;
}

export interface IActiveIndexes {
  receiveIndexes: number[];
  changeIndexes: number[];
}
