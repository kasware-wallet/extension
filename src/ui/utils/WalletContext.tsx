/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
import { createContext, ReactNode, useContext } from 'react';

import { AccountAsset } from '@/background/controller/wallet';
import { ContactBookItem, ContactBookStore } from '@/background/service/contactBook';
import { ToSignInput } from '@/background/service/keyring';
import { ConnectedSite } from '@/background/service/permission';
import { AddressFlagType, NETWORK_TYPES } from '@/shared/constant';
import {
  Account,
  AddressSummary,
  AddressType,
  AppSummary,
  DecodedPsbt,
  FeeSummary,
  IKaspaUTXOWithoutBigint,
  IScannedGroup,
  ITransactionInfo,
  KaspaBalance,
  NetworkType,
  SignPsbtOptions,
  TxHistoryItem,
  VersionDetail,
  WalletConfig,
  WalletKeyring
} from '@/shared/types';



export interface WalletController {
  openapi: {
    [key: string]: (...params: any) => Promise<any>;
  };

  boot(password: string): Promise<void>;
  isBooted(): Promise<boolean>;

  getApproval(): Promise<any>;
  resolveApproval(data?: any, data2?: any): Promise<void>;
  rejectApproval(data?: any, data2?: any, data3?: any): Promise<void>;

  hasVault(): Promise<boolean>;
  getRpcStatus(): Promise<boolean>;
  subscribeUtxosChanged(): Promise<void>;

  verifyPassword(password: string): Promise<void>;
  changePassword: (password: string, newPassword: string) => Promise<void>;

  unlock(password: string): Promise<void>;
  isUnlocked(): Promise<boolean>;

  lockWallet(): Promise<void>;
  setPopupOpen(isOpen: boolean): void;
  isReady(): Promise<boolean>;

  getAddressBalance(address: string): Promise<KaspaBalance>;
  getAddressesBalance(addresses: string[]): Promise<KaspaBalance[]>;
  getAddressCacheBalance(address: string): Promise<KaspaBalance>;
  getMultiAddressAssets(addresses: string): Promise<AddressSummary[]>;
  findGroupAssets(groups: IScannedGroup[]): Promise<IScannedGroup[]>;

  getAddressHistory: (address: string) => Promise<TxHistoryItem[]>;
  getAddressCacheHistory: (address: string) => Promise<TxHistoryItem[]>;

  listChainAssets: (address: string) => Promise<AccountAsset[]>;

  getLocale(): Promise<string>;
  setLocale(locale: string): Promise<void>;

  getCurrency(): Promise<string>;
  setCurrency(currency: string): Promise<void>;

  clearKeyrings(): Promise<void>;
  getPrivateKey(password: string, account: { address: string; type: string }): Promise<{ hex: string; wif: string }>;
  getMnemonics(
    password: string,
    keyring: WalletKeyring
  ): Promise<{
    hdPath: string;
    mnemonic: string;
    passphrase: string;
  }>;
  createKeyringWithPrivateKey(data: string, addressType: any, alianName?: string): Promise<Account[]>;
  getPreMnemonics(wordCount:number): Promise<any>;
  generatePreMnemonic(wordCount:number): Promise<string>;
  removePreMnemonics(): void;
  createKeyringWithMnemonics(
    mnemonic: string,
    hdPath: string,
    passphrase: string,
    addressType: AddressType,
    // accountCount: number,
    // startIndex?: number,
    activeIndexes: number[],
    activeChangeIndexes?: number[]
  ): Promise<{ address: string; type: string }[]>;

  createTmpKeyringWithPrivateKey(privateKey: string, addressType: AddressType): Promise<WalletKeyring>;

  createTmpKeyringWithMnemonics(
    mnemonic: string,
    hdPath: string,
    passphrase: string,
    addressType: AddressType,
    accountCount?: number,
    startIndex?: number
  ): Promise<WalletKeyring>;
  createTmpKeyringWithMnemonicsWithAddressDiscovery(
    mnemonic: string,
    hdPath: string,
    passphrase: string,
    addressType: AddressType,
    accountCount?: number,
    startIndex?: number
  ): Promise<IScannedGroup | null>;
  removeKeyring(keyring: WalletKeyring): Promise<WalletKeyring>;
  deriveNewAccountFromMnemonic(keyring: WalletKeyring, alianName?: string): Promise<string[]>;
  getAccountsCount(): Promise<number>;
  getAllAlianName: () => (ContactBookItem | undefined)[];
  getContactsByMap: () => ContactBookStore;
  listContact: () => ContactBookItem[];
  addContact: (contact: ContactBookItem) => Promise<void>;
  updateContact: (contact: ContactBookItem) => Promise<void>;
  updateAlianName: (pubkey: string, name: string) => Promise<void>;
  removeContact: (address: string) => Promise<void>;
  discoverAddressesWithBalance: (keyring: WalletKeyring, accountCount?: number, startIndex?: number) => Promise<any>;
  compoundUtxos(accounts: Account[]): Promise<string>;
  getCurrentAccount(): Promise<Account>;
  getAccounts(): Promise<Account[]>;
  getNextAlianName: (keyring: WalletKeyring) => Promise<string>;

  getCurrentKeyringAccounts(): Promise<Account[]>;

  signTransaction(psbt: any, inputs: ToSignInput[]): Promise<any>;

  sendKAS(data: { to: string; amount: number; kasUtxos: any[]; feeRate: number; enableRBF: boolean }): Promise<string>;

  sendAllKAS(data: { to: string; kasUtxos: any[]; feeRate: number; enableRBF: boolean }): Promise<string>;

  pushTx(rawtx: string): Promise<string>;

  getAppSummary(): Promise<AppSummary>;
  getKASUtxos(): Promise<IKaspaUTXOWithoutBigint[]>;
  getTxActivities(): Promise<ITransactionInfo[]>;

  getNetworkType(): Promise<NetworkType>;
  getRpcLinks(): Promise<typeof NETWORK_TYPES>;
  setNetworkType(type: NetworkType): Promise<void>;
  setRpcLinks(type: typeof NETWORK_TYPES): Promise<void>;

  getConnectedSites(): Promise<ConnectedSite[]>;
  removeConnectedSite(origin: string): Promise<void>;
  getCurrentConnectedSite(id: string): Promise<ConnectedSite>;

  getCurrentKeyring(): Promise<WalletKeyring>;
  getKeyrings(): Promise<WalletKeyring[]>;
  changeKeyring(keyring: WalletKeyring, accountIndex?: number): Promise<void>;
  getAllAddresses(keyring: WalletKeyring, index: number): Promise<string[]>;

  setKeyringAlianName(keyring: WalletKeyring, name: string): Promise<WalletKeyring>;
  changeAddressType(addressType: any): Promise<void>;

  setAccountAlianName(account: Account, name: string): Promise<Account>;
  getFeeSummary(): Promise<FeeSummary>;

  setEditingKeyring(keyringIndex: number): Promise<void>;
  getEditingKeyring(): Promise<WalletKeyring>;

  setEditingAccount(account: Account): Promise<void>;
  getEditingAccount(): Promise<Account>;


  decodePsbt(psbtHex: string): Promise<DecodedPsbt>;

  createMoonpayUrl(address: string): Promise<string>;

  getWalletConfig(): Promise<WalletConfig>;

  getSkippedVersion(): Promise<string>;
  setSkippedVersion(version: string): Promise<void>;

  checkWebsite(website: string): Promise<{ isScammer: boolean; warning: string }>;

  readTab(tabName: string): Promise<void>;
  readApp(appid: number): Promise<void>;

  formatOptionsToSignInputs(psbtHex: string, options: SignPsbtOptions): Promise<ToSignInput[]>;

  getAddressSummary(address: string): Promise<AddressSummary>;

  getShowSafeNotice(): Promise<boolean>;
  setShowSafeNotice(show: boolean): Promise<void>;

  // address flag
  addAddressFlag(account: Account, flag: AddressFlagType): Promise<Account>;
  removeAddressFlag(account: Account, flag: AddressFlagType): Promise<Account>;

  getVersionDetail(version: string): Promise<VersionDetail>;
  disconnectRpc(): void;
  handleRpcConnect():Promise<void>;
  isValidKaspaAddr: (addr: string) => Promise<boolean>;
}

const WalletContext = createContext<{
  wallet: WalletController;
} | null>(null);

const WalletProvider = ({ children, wallet }: { children?: ReactNode; wallet: WalletController }) => (
  <WalletContext.Provider value={{ wallet }}>{children}</WalletContext.Provider>
);

const useWallet = () => {
  const { wallet } = useContext(WalletContext) as {
    wallet: WalletController;
  };

  return wallet;
};

export { useWallet, WalletProvider };

