/// fork from https://github.com/MetaMask/KeyringController/blob/master/index.js
import { ADDRESS_TYPES, KEYRING_TYPE } from '@/shared/constant';
import type { Account, IOpts, NetworkType, TempAccount } from '@/shared/types';
import { AddressType } from '@/shared/types';
import log from '@/shared/utils/logger';
import browser from '@/shared/webapi/browser';
import { decrypt, encrypt } from '@metamask/browser-passworder';
import { ObservableStore } from '@metamask/obs-store';
import type { Hex } from '@metamask/utils';
import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { EventEmitter } from 'events';
import type { HexString, PendingTransaction, SighashType, Transaction } from 'kaspa-wasm';
import kaspaWasmInit, { createAddress, Mnemonic } from 'kaspa-wasm';

const encryptor = { encrypt, decrypt };

import keyring from '../keyringclass';
import preference from '../preference';
import DisplayKeyring from './display';

const { SimpleKeyring, HdKeyring } = keyring;

export const KEYRING_SDK_TYPES = {
  SimpleKeyring,
  HdKeyring
};

export const KEYRING_CLASS = {
  PRIVATE_KEY: SimpleKeyring.type,
  MNEMONIC: HdKeyring.type
};

interface MemStoreState {
  isUnlocked: boolean;
  keyringTypes: any[];
  keyrings: any[];
  preMnemonics: string;
}
export interface DisplayedAccount {
  pubkey: string;
  // evmPubkey?: string;
  evmAddress?: string;
  brandName: string;
  deriveType: number;
  index: number;
  type?: string;
  keyring?: DisplayKeyring;
  alianName?: string;
}

export interface DisplayedKeyring {
  type: string;
  accounts: DisplayedAccount[];
  keyring: DisplayKeyring;
  addressType: AddressType;
  index: number;
  byImport?: boolean;
  evmPublicKey?: string;
}
export interface ToSignInput {
  index: number;
  publicKey: string;
}
export interface Keyring {
  byImport?: boolean;
  type: string;
  hdPath: string;
  serialize(): any;
  deserialize(opts: any): void;
  addAccounts(n: number, dType?: number, startIndex?: number): string[];
  getAccounts(): Promise<string[]>;
  getXpub(): Promise<string>;
  getAccountsAndIndexAndDType: () => Promise<TempAccount[]>;
  signPendingTransaction(
    psbt: PendingTransaction,
    inputs: ToSignInput[],
    checkFullSigned?: boolean
  ): Promise<PendingTransaction>;
  createInputSignature: (
    pTx: PendingTransaction,
    inputs: ToSignInput[],
    input_index: number,
    sighash_type?: SighashType
  ) => string[];
  signTransactionOneKaspa(
    tx: Transaction,
    inputs: ToSignInput[],
    verify_sig: boolean,
    txInputsLength: number
  ): Promise<Transaction>;
  signTransactionKaspa(tx: Transaction, inputs: ToSignInput[], verify_sig: boolean): Promise<Transaction>;
  signEcdsaTransaction(
    tx: Transaction,
    inputs: ToSignInput[],
    // signerLenght: number,
    verify_sig: boolean
    // inputIndexs: Uint8Array,
    // sigHashType: Uint8Array
  ): Promise<Transaction>;
  signSchnorrTransaction(
    tx: Transaction,
    inputs: ToSignInput[],
    // signerLenght: number,
    verifySig: boolean
    // inputIndexs: Uint8Array,
    // sighashType: Uint8Array
  ): Promise<Transaction>;
  signMessage(pubkey: string, message: string, noAuxRand?: boolean): Promise<string>;
  signMessageECDSA(pubkey: string, message: string, noAuxRand?: boolean): Promise<string>;
  verifyMessage(publicKey: string, message: string, sig: string): Promise<boolean>;
  verifyMessageECDSA(publicKey: string, message: string, sig: string): Promise<boolean>;
  exportAccount(address: string): string;
  removeAccount(address: string): void;

  accounts?: string[];
  // accountsMap?: { KASPA_CHAINS_ENUM: string }[];
  // unlock?(): Promise<void>;
  getFirstPage?(): Promise<{ address: string; index: number }[]>;
  getNextPage?(): Promise<{ address: string; index: number }[]>;
  getPreviousPage?(): Promise<{ address: string; index: number }[]>;
  getAddresses?(start: number, end: number): { address: string; index: number }[];
  getIndexByAddress?(pubkey: string): string | null;

  getAccountsWithBrand?(): { address: string; index: number }[];
  activeAccounts?(indexes: number[]): string[];

  changeHdPath?(hdPath: string): void;
  getAccountByHdPath?(hdPath: string, index: number): string;
}

class EmptyKeyring implements Keyring {
  type = KEYRING_TYPE.Empty;
  hdPath = '';
  constructor() {
    // todo
  }
  accounts?: string[] | undefined;
  getFirstPage?(): Promise<{ address: string; index: number }[]> {
    throw new Error('Method not implemented.');
  }
  getNextPage?(): Promise<{ address: string; index: number }[]> {
    throw new Error('Method not implemented.');
  }
  getPreviousPage?(): Promise<{ address: string; index: number }[]> {
    throw new Error('Method not implemented.');
  }
  getAddresses?(_start: number, _end: number): { address: string; index: number }[] {
    throw new Error('Method not implemented.');
  }
  getIndexByAddress?(_pubkey: string): string | null {
    throw new Error('Method not implemented.');
  }
  getAccountsWithBrand?(): { address: string; index: number }[] {
    throw new Error('Method not implemented.');
  }
  activeAccounts?(_indexes: number[]): string[] {
    throw new Error('Method not implemented.');
  }
  changeHdPath?(_hdPath: string): void {
    throw new Error('Method not implemented.');
  }
  getAccountByHdPath?(_hdPath: string, _index: number): string {
    throw new Error('Method not implemented.');
  }
  addAccounts(_n: number, _dType?: number, _startIndex?: number): string[] {
    return [];
  }

  async getAccounts(): Promise<string[]> {
    return [];
  }
  async getXpub(): Promise<string> {
    return '';
  }
  async getAccountsAndIndexAndDType(): Promise<TempAccount[]> {
    return [];
  }
  signPendingTransaction(_psbt: PendingTransaction, _inputs: ToSignInput[]): Promise<PendingTransaction> {
    throw new Error('Method not implemented.');
  }
  signTransactionKaspa(_tx: Transaction, _inputs: ToSignInput[], _verify_sig: boolean): Promise<Transaction> {
    throw new Error('Method not implemented.');
  }

  signTransactionOneKaspa(
    _tx: Transaction,
    _inputs: ToSignInput[],
    _verify_sig: boolean,
    _txInputsLength?: number
  ): Promise<Transaction> {
    throw new Error('Method not implemented.');
  }
  signEcdsaTransaction(
    _tx: Transaction,
    _inputs: ToSignInput[],
    // signerLenght: number,
    _verify_sig: boolean
    // inputIndexs: Uint8Array,
    // sigHashType: Uint8Array
  ): Promise<Transaction> {
    throw new Error('Method not implemented.');
  }
  signSchnorrTransaction(
    _tx: Transaction,
    _inputs: ToSignInput[],
    // signerLenght: number,
    _verifySig: boolean
    // inputIndexs: Uint8Array,
    // sighashType: Uint8Array
  ): Promise<Transaction> {
    throw new Error('Method not implemented.');
  }
  createInputSignature(
    _pTx: PendingTransaction,
    _inputs: ToSignInput[],
    _input_index: number,
    _sighash_type?: SighashType
  ): string[] {
    throw new Error('Method not implemented.');
  }
  signMessage(_publicKey: string, _message: string, _noAuxRand?: boolean): Promise<string> {
    throw new Error('Method not implemented.');
  }
  signMessageECDSA(_publicKey: string, _message: string, _noAuxRand?: boolean): Promise<string> {
    throw new Error('Method not implemented.');
  }
  verifyMessage(_publicKey: string, _message: string, _sig: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  verifyMessageECDSA(_publicKey: string, _message: string, _sig: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  exportAccount(_address: string): string {
    throw new Error('Method not implemented.');
  }
  removeAccount(_address: string): void {
    throw new Error('Method not implemented.');
  }

  async serialize() {
    return '';
  }

  async deserialize(_opts: any) {
    return;
  }
}

export class KeyringService extends EventEmitter {
  //
  // PUBLIC METHODS
  //
  keyringTypes: any[];
  store!: ObservableStore<any>;
  memStore: ObservableStore<MemStoreState>;
  keyrings: Keyring[];
  addressTypes: AddressType[];
  encryptor: typeof encryptor = encryptor;
  password: string | null = null;

  constructor() {
    super();
    this.keyringTypes = Object.values(KEYRING_SDK_TYPES);
    this.memStore = new ObservableStore({
      isUnlocked: false,
      keyringTypes: this.keyringTypes.map((krt) => krt.type),
      keyrings: [],
      preMnemonics: '',
      addressTypes: []
    });

    this.keyrings = [];
    this.addressTypes = [];
  }
  initKapaWasm = async () => {
    // Pass explicit WASM URL via browser.runtime.getURL to avoid relying on
    // import.meta.url / self.location resolution which can fail in MV3 service workers
    const wasmUrl = browser.runtime.getURL('kaspa_bg.wasm');
    const MAX_RETRIES = 3;
    let lastError: unknown;
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        await kaspaWasmInit(wasmUrl);
        return;
      } catch (err) {
        lastError = err;
        log.warn(`kaspa-wasm init attempt ${i + 1} failed:`, err);
        if (i < MAX_RETRIES - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }
    throw lastError;
  };

  loadStore = (initState) => {
    this.store = new ObservableStore(initState);
  };

  boot = async (password: string) => {
    this.password = password;
    const encryptBooted = await this.encryptor.encrypt(password, 'true');
    this.store.updateState({ booted: encryptBooted });
    this.memStore.updateState({ isUnlocked: true });
  };

  isBooted = () => {
    return !!this.store.getState().booted;
  };

  hasVault = () => {
    return !!this.store.getState().vault;
    // vault is an ObservableStore object
  };

  /**
   * Full Update
   *
   * Emits the `update` event and @returns a Promise that resolves to
   * the current state.
   *
   * Frequently used to end asynchronous chains in this class,
   * indicating consumers can often either listen for updates,
   * or accept a state-resolving promise to consume their results.
   *
   * @returns {Object} The controller state.
   */
  fullUpdate = (): MemStoreState => {
    this.emit('update', this.memStore.getState());
    return this.memStore.getState();
  };

  /**
   * Import Keychain using Private key
   *
   * @emits KeyringController#unlock
   * @param  privateKey - The privateKey to generate address
   * @returns  A Promise that resolves to the state.
   */
  importPrivateKey = async (privateKey: string, addressType: AddressType) => {
    await this.persistAllKeyrings();
    const keyring = await this.addNewKeyring('Simple Key Pair', [privateKey], addressType);
    await this.persistAllKeyrings();
    this.setUnlocked();
    this.fullUpdate();
    return keyring;
  };

  private generateMnemonic = (wordCount = 12): string => {
    // return bip39.generateMnemonic(128);
    const mnemonic1 = Mnemonic.random(wordCount);
    // an object
    return mnemonic1.phrase;
  };

  generatePreMnemonic = async (wordCount = 12): Promise<string> => {
    if (!this.password) {
      // throw new Error(i18n.t('you need to unlock wallet first'));
      throw new Error('you need to unlock wallet first');
    }
    const mnemonic = this.generateMnemonic(wordCount);
    const preMnemonics = await this.encryptor.encrypt(this.password, mnemonic);
    this.memStore.updateState({ preMnemonics });

    return mnemonic;
  };

  getKeyringByType = (type: string) => {
    const keyring = this.keyrings.find((keyring) => keyring.type === type);

    return keyring;
  };

  removePreMnemonics = () => {
    this.memStore.updateState({ preMnemonics: '' });
  };

  getPreMnemonics = async (wordCount = 12): Promise<any> => {
    if (!this.memStore.getState().preMnemonics) {
      return '';
    }

    if (!this.password) {
      // throw new Error(i18n.t('you need to unlock wallet first'));
      throw new Error('you need to unlock wallet first');
    }
    const _menmonics = (await this.encryptor.decrypt(this.password, this.memStore.getState().preMnemonics)) as Buffer;
    if (_menmonics && _menmonics.length > 0 && (_menmonics as unknown as string).split(' ').length === wordCount) {
      return _menmonics;
    } else {
      return '';
    }
  };

  /**
   * CreateNewVaultAndRestore Mnenoic
   *
   * Destroys any old encrypted storage,
   * creates a new HD wallet from the given seed with 1 account.
   *
   * @emits KeyringController#unlock
   * @param  seed - The BIP44-compliant seed phrase.
   * @returns  A Promise that resolves to the state.
   */
  createKeyringWithMnemonics = async (
    seed: string,
    hdPath: string,
    passphrase: string,
    addressType: AddressType,
    // accountCount: number,
    // startIndex = 0
    activeIndexes: number[],
    activeChangeIndexes = [] as number[]
  ) => {
    // if (accountCount < 1) {
    //   // throw new Error(i18n.t('account count must be greater than 0'));
    //   throw new Error('account count must be greater than 0');
    // }
    if (!validateMnemonic(seed, wordlist)) {
      // return Promise.reject(new Error(i18n.t('mnemonic phrase is invalid')));
      return Promise.reject(new Error('mnemonic phrase is invalid'));
    }

    await this.persistAllKeyrings();
    const keyring = await this.addNewKeyring(
      'HD Key Tree',
      {
        mnemonic: seed,
        activeIndexes,
        activeChangeIndexes,
        hdPath,
        passphrase,
        addressType
      },
      addressType
    );
    const accounts = await keyring.getAccounts();
    if (!accounts[0]) {
      throw new Error('KeyringController - First Account not found.');
    }
    this.persistAllKeyrings();
    this.setUnlocked();
    this.fullUpdate();
    return keyring;
  };

  addKeyring = async (keyring: Keyring, addressType: AddressType) => {
    const accounts = await keyring.getAccounts();

    await this.checkForDuplicate(keyring.type, accounts);
    this.keyrings.push(keyring);
    this.addressTypes.push(addressType);
    await this.persistAllKeyrings();
    await this._updateMemStoreKeyrings();
    this.fullUpdate();
    return keyring;
  };

  changeAddressType = async (keyringIndex: number, addressType: AddressType) => {
    const keyring: Keyring = this.keyrings[keyringIndex];
    if (keyring.type === KEYRING_TYPE.HdKeyring) {
      const hdPath = ADDRESS_TYPES[addressType].hdPath;
      if ((keyring as any).hdPath !== hdPath && keyring.changeHdPath) {
        keyring.changeHdPath(hdPath);
      }
    }
    this.addressTypes[keyringIndex] = addressType;
    await this.persistAllKeyrings();
    await this._updateMemStoreKeyrings();
    this.fullUpdate();
    return keyring;
  };

  /**
   * Set Locked
   * This method deallocates all secrets, and effectively locks MetaMask.
   *
   * @emits KeyringController#lock
   * @returns {Promise<Object>} A Promise that resolves to the state.
   */
  setLocked = async (): Promise<MemStoreState> => {
    // set locked
    this.password = null;
    this.memStore.updateState({ isUnlocked: false });
    // remove keyrings
    this.keyrings = [];
    await this._updateMemStoreKeyrings();
    this.emit('lock');
    return this.fullUpdate();
  };

  /**
   * Submit Password
   *
   * Attempts to decrypt the current vault and load its keyrings
   * into memory.
   *
   * Temporarily also migrates any old-style vaults first, as well.
   * (Pre MetaMask 3.0.0)
   *
   * @emits KeyringController#unlock
   * @param {string} password - The keyring controller password.
   * @returns {Promise<Object>} A Promise that resolves to the state.
   */
  submitPassword = async (password: string): Promise<MemStoreState> => {
    await this.verifyPassword(password);
    this.password = password;
    try {
      this.keyrings = await this.unlockKeyrings(password);
    } catch {
      //
    } finally {
      this.setUnlocked();
    }

    return this.fullUpdate();
  };

  changePassword = async (oldPassword: string, newPassword: string) => {
    await this.verifyPassword(oldPassword);
    await this.unlockKeyrings(oldPassword);
    this.password = newPassword;

    const encryptBooted = await this.encryptor.encrypt(newPassword, 'true');
    this.store.updateState({ booted: encryptBooted });

    if (this.memStore.getState().preMnemonics) {
      const mnemonic = await this.encryptor.decrypt(oldPassword, this.memStore.getState().preMnemonics);
      const preMnemonics = await this.encryptor.encrypt(newPassword, mnemonic);
      this.memStore.updateState({ preMnemonics });
    }

    await this.persistAllKeyrings();
    await this._updateMemStoreKeyrings();
    this.fullUpdate();
  };

  /**
   * Verify Password
   *
   * Attempts to decrypt the current vault with a given password
   * to verify its validity.
   *
   * @param {string} password
   */
  verifyPassword = async (password: string): Promise<void> => {
    const encryptedBooted = this.store.getState().booted;
    if (!encryptedBooted) {
      // throw new Error(i18n.t('Cannot unlock without a previous vault'));
      throw new Error('Cannot unlock without a previous vault');
    }
    await this.encryptor.decrypt(password, encryptedBooted);
  };

  /**
   * Add New Keyring
   *
   * Adds a new Keyring of the given `type` to the vault
   * and the current decrypted Keyrings array.
   *
   * All Keyring classes implement a unique `type` string,
   * and this is used to retrieve them from the keyringTypes array.
   *
   * @param  type - The type of keyring to add.
   * @param  opts - The constructor options for the keyring.
   * @returns  The new keyring.
   */

  addNewKeyring = async (type: string, opts: unknown, addressType: AddressType): Promise<Keyring> => {
    const Keyring = this.getKeyringClassForType(type);
    const keyring = new Keyring(opts);
    return await this.addKeyring(keyring, addressType);
  };
  // * @param {string} type - HD Key Tree | simple keyring.
  createTmpKeyring = (type: string, opts: IOpts | string[]) => {
    const Keyring = this.getKeyringClassForType(type);
    const keyring = new Keyring(opts);
    return keyring;
  };

  /**
   * Checks for duplicate keypairs, using the the first account in the given
   * array. Rejects if a duplicate is found.
   *
   * Only supports 'Simple Key Pair'.
   *
   * @param {string} type - The key pair type to check for.
   * @param {Array<string>} newAccountArray - Array of new accounts.
   * @returns {Promise<Array<string>>} The account, if no duplicate is found.
   */
  checkForDuplicate = async (type: string, newAccountArray: string[]): Promise<string[]> => {
    const keyrings = this.getKeyringsByType(type);
    const _accounts = await Promise.all(keyrings.map((keyring) => keyring.getAccounts()));

    const accounts: string[] = _accounts.reduce((m, n) => m.concat(n), [] as string[]);

    const isIncluded = newAccountArray.some((account) => {
      return accounts.find((key) => key === account);
    });

    return isIncluded ? Promise.reject(new Error('Wallet existed.')) : Promise.resolve(newAccountArray);
  };

  /**
   * Add New Account
   *
   * Calls the `addAccounts` method on the given keyring,
   * and then saves those changes.
   *
   * @param {Keyring} selectedKeyring - The currently selected keyring.
   * @returns {Promise<Object>} A Promise that resolves to the state.
   */
  addNewAccount = async (selectedKeyring: Keyring, dType = 0, startIdx = 0): Promise<string[]> => {
    const accounts = await selectedKeyring.addAccounts(1, dType, startIdx);
    accounts.forEach((hexAccount) => {
      this.emit('newAccount', hexAccount);
    });
    await this.persistAllKeyrings();
    await this._updateMemStoreKeyrings();
    this.fullUpdate();
    return accounts;
  };

  /**
   * Export Account
   *
   * Requests the private key from the keyring controlling
   * the specified address.
   *
   * Returns a Promise that may resolve with the private key string.
   *
   * @param {string} address - The address of the account to export.
   * @returns {Promise<string>} The private key of the account.
   */
  exportAccount = async (address: string): Promise<string> => {
    const keyring = await this.getKeyringForAccount(address);
    const privkey = keyring.exportAccount(address);
    return privkey;
  };

  /**
   *
   * Remove Account
   *
   * Removes a specific account from a keyring
   * If the account is the last/only one then it also removes the keyring.
   *
   * @param {string} account - The account to remove.
   * @returns {Promise<void>} A Promise that resolves if the operation was successful.
   */
  removeAccount = async (account: Account, type: string, brand?: string): Promise<any> => {
    const keyring = await this.getKeyringForAccount(account.pubkey, type);

    // Not all the keyrings support this, so we have to check
    if (typeof keyring.removeAccount != 'function') {
      throw new Error(`Keyring ${keyring.type} doesn't support account removal operations`);
    }
    if (account.evmAddress?.length > 0) keyring.ethKeyring?.removeAccount(account.evmAddress as Hex);
    keyring.removeAccount(account.pubkey);
    this.emit('removedAccount', account.pubkey);
    await this.persistAllKeyrings();
    await this._updateMemStoreKeyrings();
    this.fullUpdate();
  };

  removeKeyring = async (keyringIndex: number): Promise<any> => {
    delete this.keyrings[keyringIndex];
    this.keyrings[keyringIndex] = new EmptyKeyring();
    await this.persistAllKeyrings();
    await this._updateMemStoreKeyrings();
    this.fullUpdate();
  };

  //
  // SIGNING METHODS
  //

  /**
   * Sign KAS Transaction
   *
   * Signs an KAS transaction object.
   *
   * @param kasTx - The transaction to sign.
   * @param fromAddress - The transaction 'from' address.
   * @returns  The signed transactio object.
   */
  signPendingTransaction = (
    keyring: Keyring,
    psbt: PendingTransaction,
    inputs: ToSignInput[],
    checkFullSigned?: boolean
  ) => {
    return keyring.signPendingTransaction(psbt, inputs, checkFullSigned);
  };

  createInputSignature = (
    keyring: Keyring,
    pTx: PendingTransaction,
    inputs: ToSignInput[],
    input_index: number,
    sighash_type?: SighashType
  ): HexString[] => {
    return keyring.createInputSignature(pTx, inputs, input_index, sighash_type);
  };

  signTransactionKaspa = (keyring: Keyring, tx: Transaction, inputs: ToSignInput[], verify_sig: boolean) => {
    return keyring.signTransactionKaspa(tx, inputs, verify_sig);
  };

  signTransactionOneKaspa = (
    keyring: Keyring,
    tx: Transaction,
    inputs: ToSignInput[],
    verify_sig: boolean,
    txInputsLength = 1
  ) => {
    return keyring.signTransactionOneKaspa(tx, inputs, verify_sig, txInputsLength);
  };

  signEcdsaTransaction = (
    keyring: Keyring,
    tx: Transaction,
    inputs: ToSignInput[],
    // signerLenght: number,
    verify_sig: boolean
    // inputIndexs: Uint8Array,
    // sigHashType: Uint8Array
  ) => {
    // return keyring.signEcdsaTransaction(tx, inputs, signerLenght, verify_sig, inputIndexs, sigHashType);
    return keyring.signEcdsaTransaction(tx, inputs, verify_sig);
  };
  signSchnorrTransaction = (
    keyring: Keyring,
    tx: Transaction,
    inputs: ToSignInput[],
    // signerLenght: number,
    verifySig: boolean
    // inputIndexs: Uint8Array,
    // sighashType: Uint8Array
  ) => {
    return keyring.signSchnorrTransaction(tx, inputs, verifySig);
  };

  /**
   * Sign Message
   *
   * Attempts to sign the provided message parameters.
   * address here means publickey string
   */
  signMessage = async (pubkey: string, data: string, noAuxRand?: boolean) => {
    const keyring = await this.getKeyringForAccount(pubkey);
    const sig = await keyring.signMessage(pubkey, data, noAuxRand);
    return sig;
  };

  signMessageECDSA = async (pubkey: string, data: string, noAuxRand?: boolean) => {
    const keyring = await this.getKeyringForAccount(pubkey);
    const sig = await keyring.signMessageECDSA(pubkey, data, noAuxRand);
    return sig;
  };

  /**
   * Decrypt Message
   *
   * Attempts to verify the provided message parameters.
   */
  verifyMessage = async (publicKey: string, message: string, sig: string) => {
    const keyring = await this.getKeyringForAccount(publicKey);
    let result = false;
    result = await keyring.verifyMessage(publicKey, message, sig);
    return result;
  };

  verifyMessageECDSA = async (publicKey: string, message: string, sig: string) => {
    const keyring = await this.getKeyringForAccount(publicKey);
    let result = false;
    result = await keyring.verifyMessageECDSA(publicKey, message, sig);
    return result;
  };

  //
  // PRIVATE METHODS
  //

  /**
   * Persist All Keyrings
   *
   * Iterates the current `keyrings` array,
   * serializes each one into a serialized array,
   * encrypts that array with the provided `password`,
   * and persists that encrypted string to storage.
   *
   * @param {string} password - The keyring controller password.
   * @returns {Promise<boolean>} Resolves to true once keyrings are persisted.
   */
  persistAllKeyrings = (): Promise<boolean> => {
    if (!this.password || typeof this.password !== 'string') {
      return Promise.reject(new Error('KeyringController - password is not a string'));
    }
    return Promise.all(
      this.keyrings.map((keyring, index) => {
        return Promise.all([keyring.type, keyring.serialize()]).then((serializedKeyringArray) => {
          // Label the output values on each serialized Keyring:
          return {
            type: serializedKeyringArray[0],
            data: serializedKeyringArray[1],
            addressType: this.addressTypes[index]
          };
        });
      })
    )
      .then((serializedKeyrings) => {
        // eslint-disable-next-line no-undef
        return this.encryptor.encrypt(this.password as string, serializedKeyrings as unknown as Buffer);
      })
      .then((encryptedString) => {
        this.store.updateState({ vault: encryptedString });
        return true;
      });
  };

  /**
   * Unlock Keyrings
   *
   * Attempts to unlock the persisted encrypted storage,
   * initializing the persisted keyrings to RAM.
   *
   * @param {string} password - The keyring controller password.
   * @returns {Promise<Array<Keyring>>} The keyrings.
   */
  unlockKeyrings = async (password: string): Promise<any[]> => {
    const encryptedVault = this.store.getState().vault;
    if (!encryptedVault) {
      // throw new Error(i18n.t('Cannot unlock without a previous vault'));
      throw new Error('Cannot unlock without a previous vault');
    }

    await this.clearKeyrings();
    const vault = (await this.encryptor.decrypt(password, encryptedVault)) as Buffer;

    const arr = Array.from(vault);
    for (let i = 0; i < arr.length; i++) {
      const { keyring, addressType } = await this._restoreKeyring(arr[i]);
      this.keyrings.push(keyring);
      this.addressTypes.push(addressType);
    }

    await this._updateMemStoreKeyrings();
    return this.keyrings;
  };

  /**
   * Restore Keyring
   *
   * Attempts to initialize a new keyring from the provided serialized payload.
   * On success, updates the memStore keyrings and returns the resulting
   * keyring instance.
   *
   * @param {Object} serialized - The serialized keyring.
   * @returns {Promise<Keyring>} The deserialized keyring.
   */
  restoreKeyring = async (serialized: any) => {
    const { keyring } = await this._restoreKeyring(serialized);
    await this._updateMemStoreKeyrings();
    return keyring;
  };

  /**
   * Restore Keyring Helper
   *
   * Attempts to initialize a new keyring from the provided serialized payload.
   * On success, returns the resulting keyring instance.
   *
   * @param {Object} serialized - The serialized keyring.
   * @returns {Promise<Keyring>} The deserialized keyring.
   */
  _restoreKeyring = async (serialized: any): Promise<{ keyring: Keyring; addressType: AddressType }> => {
    const { type, data, addressType } = serialized;
    if (type === KEYRING_TYPE.Empty) {
      const keyring = new EmptyKeyring();
      return { keyring, addressType: addressType === undefined ? preference.getAddressType() : addressType };
    }
    const Keyring = this.getKeyringClassForType(type);
    const keyring = new Keyring();
    await keyring.deserialize(data);

    // getAccounts also validates the accounts for some keyrings
    await keyring.getAccounts();
    return { keyring, addressType: addressType === undefined ? preference.getAddressType() : addressType };
  };

  /**
   * Get Keyring Class For Type
   *
   * Searches the current `keyringTypes` array
   * for a Keyring class whose unique `type` property
   * matches the provided `type`,
   * returning it if it exists.
   *
   * @param {string} type - The type whose class to get.
   * @returns {Keyring|undefined} The class, if it exists.
   */
  getKeyringClassForType = (type: string) => {
    return this.keyringTypes.find((kr) => kr.type === type);
  };

  /**
   * Get Keyrings by Type
   *
   * Gets all keyrings of the given type.
   *
   * @param {string} type - The keyring types to retrieve.
   * @returns {Array<Keyring>} The keyrings.
   */
  getKeyringsByType = (type: string): Keyring[] => {
    return this.keyrings.filter((keyring) => keyring.type === type);
  };

  /**
   * Get Accounts
   *
   * Returns the public addresses of all current accounts
   * managed by all currently unlocked keyrings.
   *
   * @returns {Promise<Array<string>>} The array of accounts.
   */
  getAccounts = async (): Promise<string[]> => {
    const keyrings = this.keyrings || [];
    let addrs: string[] = [];
    for (let i = 0; i < keyrings.length; i++) {
      const keyring = keyrings[i];
      const accounts = await keyring.getAccounts();
      addrs = addrs.concat(accounts);
    }
    return addrs;
  };

  /**
   * Get Keyring For Account
   *
   * Returns the currently initialized keyring that manages
   * the specified `address` if one exists.
   *
   * @param {string} address - An account address(pubkey).
   * @returns {Promise<Keyring>} The keyring of the account, if it exists.
   */
  getKeyringForAccount = async (
    pubkey: string,
    type?: string,
    start?: number,
    end?: number,
    includeWatchKeyring = true
  ): Promise<Keyring> => {
    const keyrings = type ? this.keyrings.filter((keyring) => keyring.type === type) : this.keyrings;
    for (let i = 0; i < keyrings.length; i++) {
      const keyring = keyrings[i];
      const accounts = await keyring.getAccounts();
      if (accounts.includes(pubkey)) {
        return keyring;
      }
    }
    throw new Error('No keyring found for the requested account.');
  };

  getEVMKeyringForAccount(evmAddress: string, type?: string, start?: number, end?: number, includeWatchKeyring = true) {
    const hexed = normalizeAddress(evmAddress).toLowerCase();
    log.debug(`KeyringController - getKeyringForAccount: ${hexed}`);
    let keyrings = type ? this.keyrings.filter((keyring) => keyring.type === type) : this.keyrings;
    if (!includeWatchKeyring) {
      keyrings = keyrings.filter((keyring) => keyring.type !== KEYRING_TYPE.WatchAddressKeyring);
    }
    return Promise.all(
      keyrings.map((keyring) => {
        return Promise.all([keyring.ethKeyring, keyring?.ethKeyring?.getAccounts()]);
      })
    ).then((candidates) => {
      const winners = candidates.filter((candidate) => {
        const accounts = candidate?.[1]?.map((addr) => {
          return normalizeAddress(addr).toLowerCase();
        });
        return accounts?.includes(hexed);
      });
      if (winners && winners.length > 0) {
        return winners[0][0];
      }
      throw new Error('No keyring found for the requested account.');
    });
    // const winners = keyrings?.map((keyring) => [keyring.ethKeyring, keyring?.ethKeyring?.getAccounts()])
    //   .filter((candidate) => {
    //     const accounts = candidate?.[1]?.map((addr) => {
    //       return normalizeAddress(addr).toLowerCase();
    //     });
    //     return accounts?.includes(hexed);
    //   });
    // if (winners && winners.length > 0) {
    //   return winners[0][0];
    // }
    // throw new Error('No keyring found for the requested account.');
  }

  /**
   * Display For Keyring
   *
   * Is used for adding the current keyrings to the state object.
   * @param {Keyring} keyring
   * @param index - index of keyring
   * @returns {Promise<Object>} A keyring display object, with type and accounts properties.
   */
  displayForKeyring = async (keyring: Keyring, addressType: AddressType, index: number): Promise<DisplayedKeyring> => {
    // const accounts = await keyring.getAccounts();
    const accounts = await keyring.getAccountsAndIndexAndDType();
    const all_accounts: DisplayedAccount[] = [];
    for (let i = 0; i < accounts.length; i++) {
      all_accounts.push({
        pubkey: accounts[i].publickey,
        evmAddress: accounts[i].evmAddress || '',
        brandName: keyring.type,
        deriveType: accounts[i].deriveType,
        index: accounts[i].index
      });
    }
    return {
      type: keyring.type,
      accounts: all_accounts,
      keyring: new DisplayKeyring(keyring),
      addressType,
      index,
      byImport: keyring?.byImport,
      evmPublicKey: undefined
    };
  };

  getAllDisplayedKeyrings = (): Promise<DisplayedKeyring[]> => {
    return Promise.all(
      this.keyrings.map((keyring, index) => this.displayForKeyring(keyring, this.addressTypes[index], index))
    );
  };

  getAllVisibleAccountsArray = async () => {
    const typedAccounts = await this.getAllDisplayedKeyrings();
    const result: { pubkey: string; type: string; brandName: string }[] = [];
    typedAccounts.forEach((accountGroup) => {
      result.push(
        ...accountGroup.accounts.map((account) => ({
          pubkey: account.pubkey,
          brandName: account.brandName,
          type: accountGroup.type
        }))
      );
    });

    return result;
  };

  getAllPubkeys = async () => {
    const keyrings = await this.getAllDisplayedKeyrings();
    const result: { pubkey: string; type: string; brandName: string }[] = [];
    keyrings.forEach((accountGroup) => {
      result.push(
        ...accountGroup.accounts.map((account) => ({
          pubkey: account.pubkey,
          brandName: account.brandName,
          type: accountGroup.type
        }))
      );
    });

    return result;
  };

  hasPubkey = async (pubkey: string) => {
    const addresses = await this.getAllPubkeys();
    return !!addresses.find((item) => item.pubkey === pubkey);
  };

  /**
   * Clear Keyrings
   *
   * Deallocates all currently managed keyrings and accounts.
   * Used before initializing a new vault.
   */
  /* eslint-disable require-await */
  clearKeyrings = async (): Promise<void> => {
    // clear keyrings from memory
    this.keyrings = [];
    this.memStore.updateState({
      keyrings: []
    });
  };

  /**
   * Update Memstore Keyrings
   *
   * Updates the in-memory keyrings, without persisting.
   */
  _updateMemStoreKeyrings = async (): Promise<void> => {
    const keyrings = await Promise.all(
      this.keyrings.map((keyring, index) => this.displayForKeyring(keyring, this.addressTypes[index], index))
    );
    return this.memStore.updateState({ keyrings });
  };

  /**
   * Unlock Keyrings
   *
   * Unlocks the keyrings.
   *
   * @emits KeyringController#unlock
   */
  setUnlocked = () => {
    this.memStore.updateState({ isUnlocked: true });
    this.emit('unlock');
  };

  publicKeyToAddress = (pubkey: string, addressType: AddressType, networkType: NetworkType) => {
    if (addressType == AddressType.KASPA_TANGEM_44_111111) {
      const addr = createAddress(pubkey, networkType, true).toString();
      return addr;
    } else {
      const addr = createAddress(pubkey, networkType).toString();
      return addr;
    }
  };
  /**
   * from r evm
   */
  async getAllTypedVisibleAccounts(): Promise<DisplayedKeyring[]> {
    const keyrings = await Promise.all(
      this.keyrings.map((keyring, index) => this.displayForKeyring(keyring, this.addressTypes[index], index))
    );
    return keyrings.filter((keyring) => keyring.accounts.length > 0);
  }
}

export default new KeyringService();
