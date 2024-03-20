/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  contactBookService,
  keyringService,
  notificationService,
  openapiService,
  permissionService,
  preferenceService,
  sessionService
} from '@/background/service';
import {
  ADDRESS_TYPES,
  AddressFlagType,
  BRAND_ALIAN_TYPE_TEXT,
  CHAINS_ENUM,
  COIN_NAME,
  COIN_SYMBOL,
  KEYRING_TYPE,
  KEYRING_TYPES,
  NETWORK_TYPES,
  OPENAPI_URL_DEVNET,
  OPENAPI_URL_MAINNET,
  OPENAPI_URL_TESTNET
} from '@/shared/constant';
import {
  Account,
  AddressType,
  AddressUserToSignInput,
  BitcoinBalance,
  IKaspaUTXOWithoutBigint,
  IResultPsbtHex,
  IScannedGroup,
  NetworkType,
  PublicKeyUserToSignInput,
  SignPsbtOptions,
  ToSignInput,
  UTXO,
  WalletKeyring
} from '@/shared/types';
import { checkAddressFlag, getKaspaUTXOWithoutBigint, getKaspaUTXOs } from '@/shared/utils';
// import i18n from '@pages/background/service/i18n';
import { DisplayedKeyring, Keyring } from '@/background/service/keyring';
import { Address, Generator } from 'kaspa-wasm';

import { ContactBookItem } from '../service/contactBook';
import { HdKeyring } from '../service/keyringclass/hd-keyring';
import { OpenApiService } from '../service/openapi';
import { ConnectedSite } from '../service/permission';
import BaseController from './base';

const stashKeyrings: Record<string, Keyring> = {};
export type AccountAsset = {
  name: string;
  symbol: string;
  amount: string;
  value: string;
};

export class WalletController extends BaseController {
  openapi: OpenApiService = openapiService;

  /* wallet */
  boot = (password: string) => keyringService.boot(password);
  isBooted = () => keyringService.isBooted();

  getApproval = notificationService.getApproval;
  resolveApproval = notificationService.resolveApproval;
  rejectApproval = notificationService.rejectApproval;

  hasVault = () => keyringService.hasVault();
  verifyPassword = (password: string) => keyringService.verifyPassword(password);
  changePassword = (password: string, newPassword: string) => keyringService.changePassword(password, newPassword);

  initAlianNames = async () => {
    preferenceService.changeInitAlianNameStatus();
    const contacts = this.listContact();
    const keyrings = await keyringService.getAllDisplayedKeyrings();

    keyrings.forEach((v) => {
      v.accounts.forEach((w, index) => {
        this.updateAlianName(w.pubkey, `${BRAND_ALIAN_TYPE_TEXT[v.type]} ${index + 1}`);
      });
    });

    if (contacts.length !== 0 && keyrings.length !== 0) {
      const allAccounts = keyrings.map((item) => item.accounts).flat();
      const sameAddressList = contacts.filter((item) => allAccounts.find((contact) => contact.pubkey == item.address));
      if (sameAddressList.length > 0) {
        sameAddressList.forEach((item) => this.updateAlianName(item.address, item.name));
      }
    }
  };
  disconnectRpc = async () => {
    // if (this.openapi.rpc != null || undefined) {
    //   this.openapi.rpc.disconnect();
    // }
    await this.openapi.disconnectRpc();
  };
  connectRpc = async () => {
    await this.openapi.handleRpcConnect('connectRPC');
  };
  subscribeUtxosChanged = async () => {
    const currentAccount = preferenceService.getCurrentAccount();
    if (currentAccount?.address) {
      await openapiService.subscribeUtxosChanged(currentAccount.address);
    }
  };

  isReady = () => {
    if (contactBookService.store) {
      return true;
    } else {
      return false;
    }
  };

  unlock = async (password: string) => {
    const alianNameInited = preferenceService.getInitAlianNameStatus();
    const alianNames = contactBookService.listAlias();
    await keyringService.submitPassword(password);
    sessionService.broadcastEvent('unlock');
    if (!alianNameInited && alianNames.length === 0) {
      this.initAlianNames();
    }
  };
  isUnlocked = () => {
    return keyringService.memStore.getState().isUnlocked;
  };

  lockWallet = async () => {
    await keyringService.setLocked();
    sessionService.broadcastEvent('accountsChanged', []);
    sessionService.broadcastEvent('lock');
  };

  setPopupOpen = (isOpen: boolean) => {
    preferenceService.setPopupOpen(isOpen);
  };

  getAddressBalance = async (address: string) => {
    const data = await openapiService.getAddressBalance(address);
    preferenceService.updateAddressBalance(address, data);
    return data;
  };
  getAddressesBalance = async (addresses: string[]) => {
    const data = await openapiService.getAddressesBalance(addresses);
    for (let i = 0; i < addresses.length; i++) {
      preferenceService.updateAddressBalance(addresses[i], data[i]);
    }
    return data;
  };

  getMultiAddressAssets = async (addresses: string) => {
    return openapiService.getMultiAddressAssets(addresses);
  };

  findGroupAssets = async (groups: IScannedGroup[]) => {
    const scannedGroup = await openapiService.findGroupAssets(groups);
    return scannedGroup;
  };

  getAddressCacheBalance = (address: string | undefined): BitcoinBalance => {
    const defaultBalance: BitcoinBalance = {
      confirm_amount: '0',
      pending_amount: '0',
      amount: '0',
      usd_value: '0',
      confirm_btc_amount: '0',
      pending_btc_amount: '0',
      btc_amount: '0',
      confirm_inscription_amount: '0',
      pending_inscription_amount: '0',
      inscription_amount: '0'
    };
    if (!address) return defaultBalance;
    return preferenceService.getAddressBalance(address) || defaultBalance;
  };

  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  getAddressHistory = async (address: string) => {
    // const data = await openapiService.getAddressRecentHistory(address);
    // preferenceService.updateAddressHistory(address, data);
    // return data;
    //   todo
  };

  getAddressInscriptions = async (address: string, cursor: number, size: number) => {
    const data = await openapiService.getAddressInscriptions(address, cursor, size);
    return data;
  };

  getAddressCacheHistory = (address: string | undefined) => {
    if (!address) return [];
    return preferenceService.getAddressHistory(address);
  };

  getExternalLinkAck = () => {
    preferenceService.getExternalLinkAck();
  };

  setExternalLinkAck = (ack) => {
    preferenceService.setExternalLinkAck(ack);
  };

  getLocale = () => {
    return preferenceService.getLocale();
  };

  setLocale = (locale: string) => {
    preferenceService.setLocale(locale);
  };

  getCurrency = () => {
    return preferenceService.getCurrency();
  };

  setCurrency = (currency: string) => {
    preferenceService.setCurrency(currency);
  };

  /* keyrings */

  clearKeyrings = () => keyringService.clearKeyrings();

  getPrivateKey = async (password: string, { pubkey, type }: { pubkey: string; type: string }) => {
    await this.verifyPassword(password);
    const keyring = await keyringService.getKeyringForAccount(pubkey, type);
    if (!keyring) return null;
    const privateKey = await keyring.exportAccount(pubkey);
    const hex = privateKey;
    const wif = 'wif';
    return {
      hex,
      wif
    };
  };

  getMnemonics = async (password: string, keyring: WalletKeyring) => {
    await this.verifyPassword(password);
    const originKeyring = keyringService.keyrings[keyring.index];
    const serialized = await originKeyring.serialize();
    return {
      mnemonic: serialized.mnemonic,
      hdPath: serialized.hdPath,
      passphrase: serialized.passphrase
    };
  };

  createKeyringWithPrivateKey = async (data: string, addressType: AddressType, alianName?: string) => {
    // const error = new Error(i18n.t('The private key is invalid'));
    let originKeyring: Keyring;
    try {
      originKeyring = await keyringService.importPrivateKey(data, addressType);
    } catch (e) {
      console.log(e);
      throw e;
    }
    const pubkeys = await originKeyring.getAccounts();
    if (alianName) this.updateAlianName(pubkeys[0], alianName);

    const displayedKeyring = await keyringService.displayForKeyring(
      originKeyring,
      addressType,
      keyringService.keyrings.length - 1
    );
    const keyring = this.displayedKeyringToWalletKeyring(displayedKeyring, keyringService.keyrings.length - 1);
    this.changeKeyring(keyring);
  };

  getPreMnemonics = () => keyringService.getPreMnemonics();
  generatePreMnemonic = () => keyringService.generatePreMnemonic();
  removePreMnemonics = () => keyringService.removePreMnemonics();
  createKeyringWithMnemonics = async (
    mnemonic: string,
    hdPath: string,
    passphrase: string,
    addressType: AddressType,
    // accountCount: number,
    // startIndex = 0,
    activeIndexes: number[],
    activeChangeIndexes = [] as number[]
  ) => {
    const originKeyring = await keyringService.createKeyringWithMnemonics(
      mnemonic,
      hdPath,
      passphrase,
      addressType,
      // accountCount,
      // startIndex
      activeIndexes,
      activeChangeIndexes
    );
    keyringService.removePreMnemonics();

    const displayedKeyring = await keyringService.displayForKeyring(
      originKeyring,
      addressType,
      keyringService.keyrings.length - 1
    );
    const keyring = this.displayedKeyringToWalletKeyring(displayedKeyring, keyringService.keyrings.length - 1);
    this.changeKeyring(keyring);
    preferenceService.setShowSafeNotice(false);
  };

  createTmpKeyringWithMnemonics = async (
    mnemonic: string,
    hdPath: string,
    passphrase: string,
    addressType: AddressType,
    accountCount = 1,
    startIndex = 0
  ) => {
    const activeIndexes: number[] = [];
    for (let i = startIndex; i < accountCount + startIndex; i++) {
      activeIndexes.push(i);
    }
    const originKeyring = keyringService.createTmpKeyring('HD Key Tree', {
      mnemonic,
      activeIndexes,
      activeChangeIndexes: accountCount > 1 ? activeIndexes : [],
      hdPath,
      passphrase
    });
    const displayedKeyring = await keyringService.displayForKeyring(originKeyring, addressType, -1);
    return this.displayedKeyringToWalletKeyring(displayedKeyring, -1, false);
  };
  createTmpKeyringWithMnemonicsWithAddressDiscovery = async (
    mnemonic: string,
    hdPath: string,
    passphrase: string,
    addressType: AddressType,
    accountCount = 20,
    startIndex = 0
  ) => {
    const activeIndexes: number[] = [];
    for (let i = startIndex; i < accountCount + startIndex; i++) {
      activeIndexes.push(i);
    }
    const originKeyring = keyringService.createTmpKeyring('HD Key Tree', {
      mnemonic,
      activeIndexes,
      activeChangeIndexes: accountCount > 1 ? activeIndexes : [],
      hdPath,
      passphrase
    });
    const address_arr_final: string[] = [];
    const satoshis_arr_final: number[] = [];
    const dtype_arr_final: number[] = [];
    const index_arr_final: number[] = [];
    for (let i = 0; ; i = i + accountCount) {
      const receiveAddressObjArr = (originKeyring as HdKeyring).getAddresses(i, i + accountCount, 0);
      const address_arr: string[] = [];
      const satoshis_arr: number[] = [];
      const dtype_arr: number[] = [];
      const index_arr: number[] = [];
      const networkType = preferenceService.getNetworkType();
      receiveAddressObjArr.forEach((a) => {
        const address = keyringService.publicKeyToAddress(a.address, addressType, networkType);
        address_arr.push(address);
        dtype_arr.push(0);
        index_arr.push(Number('10' + a.index.toString()));
      });
      const changeAddressObjArr = (originKeyring as HdKeyring).getAddresses(i, i + accountCount, 1);
      changeAddressObjArr.forEach((a) => {
        const address = keyringService.publicKeyToAddress(a.address, addressType, networkType);
        address_arr.push(address);
        dtype_arr.push(1);
        index_arr.push(Number('11' + a.index.toString()));
      });
      const groups: IScannedGroup[] = [];
      groups.push({
        type: addressType,
        address_arr: address_arr,
        satoshis_arr: satoshis_arr,
        dtype_arr,
        index_arr
      });
      const groupRes = await this.findGroupAssets(groups);
      if (groupRes.length > 0) {
        const res = groupRes[0];
        address_arr_final.splice(address_arr_final.length, 0, ...res.address_arr);
        satoshis_arr_final.splice(satoshis_arr_final.length, 0, ...res.satoshis_arr);
        dtype_arr_final.splice(dtype_arr_final.length, 0, ...res.dtype_arr);
        index_arr_final.splice(index_arr_final.length, 0, ...res.index_arr);
      } else {
        // stop for iteration
        break;
      }
    }
    const groupsFinal: IScannedGroup[] = [];
    if (satoshis_arr_final.length > 0) {
      groupsFinal.push({
        type: addressType,
        address_arr: address_arr_final,
        satoshis_arr: satoshis_arr_final,
        dtype_arr: dtype_arr_final,
        index_arr: index_arr_final
      });
    }
    if (groupsFinal.length > 0) {
      return groupsFinal[0];
    } else {
      return null;
    }
  };
  discoverAddressesWithBalance = async (keyring: WalletKeyring, accountCount = 50, startIndex = 0) => {
    const oKeyring = keyringService.keyrings[keyring.index];
    const serialized = await oKeyring.serialize();
    const group = await this.createTmpKeyringWithMnemonicsWithAddressDiscovery(
      serialized.mnemonic,
      serialized.hdPath,
      serialized.passphrase,
      keyring.addressType,
      accountCount,
      startIndex
    );
    if (group == null) {
      return null;
    }
    const address_arr = group.address_arr;
    const satoshis_arr = group.satoshis_arr;
    const dtype_arr = group.dtype_arr;
    const index_arr = group.index_arr;
    for (let i = 0; i < address_arr.length; ) {
      const idDuplicated = keyring.accounts.find((a) => a.address == address_arr[i]);
      if (idDuplicated) {
        address_arr.splice(i, 1);
        satoshis_arr.splice(i, 1);
        dtype_arr.splice(i, 1);
        index_arr.splice(i, 1);
      } else {
        const index = Number(index_arr[i].toString().slice(2));
        await keyringService.addNewAccount(oKeyring, dtype_arr[i], index);
        i++;
      }
    }
    if (address_arr.length == 0) return null;
    const currentKeyringTemp = await this.getCurrentKeyring();
    if (!currentKeyringTemp) throw new Error('no current keyring');
    currentKeyringTemp.accounts.forEach((account) => {
      if (address_arr.includes(account.address)) {
        this.setAccountAlianName(account, `Discovery ${account.index}`);
      }
    });
    return group;
  };

  createTmpKeyringWithPrivateKey = async (privateKey: string, addressType: AddressType) => {
    const originKeyring = keyringService.createTmpKeyring(KEYRING_TYPE.SimpleKeyring, [privateKey]);
    const displayedKeyring = await keyringService.displayForKeyring(originKeyring, addressType, -1);
    preferenceService.setShowSafeNotice(false);
    return this.displayedKeyringToWalletKeyring(displayedKeyring, -1, false);
  };

  removeKeyring = async (keyring: WalletKeyring) => {
    await keyringService.removeKeyring(keyring.index);
    const keyrings = await this.getKeyrings();
    const nextKeyring = keyrings[keyrings.length - 1];
    if (nextKeyring && nextKeyring.accounts[0]) {
      this.changeKeyring(nextKeyring);
      return nextKeyring;
    }
  };

  getKeyringByType = (type: string) => {
    return keyringService.getKeyringByType(type);
  };

  deriveNewAccountFromMnemonic = async (keyring: WalletKeyring, alianName?: string) => {
    const _keyring = keyringService.keyrings[keyring.index];
    const result = await keyringService.addNewAccount(_keyring);
    if (alianName) this.updateAlianName(result[0], alianName);

    const currentKeyring = await this.getCurrentKeyring();
    if (!currentKeyring) throw new Error('no current keyring');
    keyring = currentKeyring;
    const account = keyring.accounts.find((a) => a.pubkey == result[0]);
    const accountIndex = account ? account.index : 100;
    this.changeKeyring(keyring, accountIndex);
  };

  getAccountsCount = async () => {
    const accounts = await keyringService.getAccounts();
    return accounts.filter((x) => x).length;
  };

  changeKeyring = (keyring: WalletKeyring, accountIndex = 100) => {
    preferenceService.setCurrentKeyringIndex(keyring.index);
    // preferenceService.setCurrentAccount(keyring.accounts[accountIndex]);
    // const flag = preferenceService.getAddressFlag(keyring.accounts[accountIndex].address);
    // openapiService.setClientAddress(keyring.accounts[accountIndex].address, flag);
    let account = keyring.accounts.find((a) => a.index === accountIndex);
    if (account == undefined) {
      account = keyring.accounts[0];
    }
    preferenceService.setCurrentAccount(account);
    const flag = preferenceService.getAddressFlag(account.address);
    openapiService.setClientAddress(account.address, flag);
  };

  getAllAddresses = (keyring: WalletKeyring, index: number) => {
    const networkType = this.getNetworkType();
    const addresses: string[] = [];
    const _keyring = keyringService.keyrings[keyring.index];
    if (keyring.type === KEYRING_TYPE.HdKeyring) {
      const pathPubkey: { [path: string]: string } = {};
      ADDRESS_TYPES.filter((v) => v.displayIndex >= 0).forEach((v) => {
        let pubkey = pathPubkey[v.hdPath];
        if (!pubkey && _keyring.getAccountByHdPath) {
          pubkey = _keyring.getAccountByHdPath(v.hdPath, index);
        }
        // const address = publicKeyToAddress(pubkey, v.value, networkType);
        const address = keyringService.publicKeyToAddress(pubkey, v.value, networkType);
        addresses.push(address);
      });
    } else {
      ADDRESS_TYPES.filter((v) => v.displayIndex >= 0 && v.isKaswareLegacy === false).forEach((v) => {
        const pubkey = keyring.accounts[index].pubkey;
        // const address = publicKeyToAddress(pubkey, v.value, networkType);
        const address = keyringService.publicKeyToAddress(pubkey, v.value, networkType);
        // const address = 'address'
        addresses.push(address);
      });
    }
    return addresses;
  };

  changeAddressType = async (addressType: AddressType) => {
    const currentAccount = await this.getCurrentAccount();
    const currentKeyringIndex = preferenceService.getCurrentKeyringIndex();
    await keyringService.changeAddressType(currentKeyringIndex, addressType);
    const keyring = await this.getCurrentKeyring();
    if (!keyring) throw new Error('no current keyring');
    this.changeKeyring(keyring, currentAccount?.index);
  };

  signTransaction = async (type: string, from: string, psbt: any, inputs: ToSignInput[]) => {
    const keyring = await keyringService.getKeyringForAccount(from, type);
    return keyringService.signTransaction(keyring, psbt, inputs);
  };

  formatOptionsToSignInputs = async (_psbt: string | any, options?: SignPsbtOptions) => {
    const account = await this.getCurrentAccount();
    if (!account) throw null;

    let toSignInputs: ToSignInput[] = [];
    if (options && options.toSignInputs) {
      // We expect userToSignInputs objects to be similar to ToSignInput interface,
      // but we allow address to be specified in addition to publicKey for convenience.
      toSignInputs = options.toSignInputs.map((input) => {
        const index = Number(input.index);
        if (isNaN(index)) throw new Error('invalid index in toSignInput');

        if (!(input as AddressUserToSignInput).address && !(input as PublicKeyUserToSignInput).publicKey) {
          throw new Error('no address or public key in toSignInput');
        }

        if ((input as AddressUserToSignInput).address && (input as AddressUserToSignInput).address != account.address) {
          throw new Error('invalid address in toSignInput');
        }

        if (
          (input as PublicKeyUserToSignInput).publicKey &&
          (input as PublicKeyUserToSignInput).publicKey != account.pubkey
        ) {
          throw new Error('invalid public key in toSignInput');
        }

        const sighashTypes = input.sighashTypes?.map(Number);
        if (sighashTypes?.some(isNaN)) throw new Error('invalid sighash type in toSignInput');

        return {
          index,
          publicKey: account.pubkey,
          sighashTypes,
          disableTweakSigner: input.disableTweakSigner
        };
      });
    } else {
      const networkType = this.getNetworkType();
      // const psbtNetwork = toPsbtNetwork(networkType);
      // const psbtNetwork = 'mainnet';

      const psbt =
        typeof _psbt === 'string'
          ? // ? bitcoin.Psbt.fromHex(_psbt as string, { network: psbtNetwork })
          'string'
          : (_psbt as any);
      psbt.data.inputs.forEach((v, index) => {
        let script: any = null;
        let value = 0;
        if (v.witnessUtxo) {
          script = v.witnessUtxo.script;
          value = v.witnessUtxo.value;
        } else if (v.nonWitnessUtxo) {
          // const tx = bitcoin.Transaction.fromBuffer(v.nonWitnessUtxo);
          const tx = 'tx';
          const output = tx.outs[psbt.txInputs[index].index];
          script = output.script;
          value = output.value;
        }
        const isSigned = v.finalScriptSig || v.finalScriptWitness;
        if (script && !isSigned) {
          // const address = scriptPkToAddress(script, networkType);
          const address = script;
          if (account.address === address) {
            toSignInputs.push({
              index,
              publicKey: account.pubkey,
              sighashTypes: v.sighashType ? [v.sighashType] : undefined
            });
          }
        }
      });
    }
    return toSignInputs;
  };

  signPsbt = async (psbt: any, toSignInputs: ToSignInput[], autoFinalized: boolean) => {
    const account = await this.getCurrentAccount();
    if (!account) throw new Error('no current account');

    const keyring = await this.getCurrentKeyring();
    if (!keyring) throw new Error('no current keyring');
    const _keyring = keyringService.keyrings[keyring.index];

    // const networkType = this.getNetworkType();
    // const psbtNetwork = toPsbtNetwork(networkType);
    // const psbtNetwork = 'mainnet';

    if (!toSignInputs) {
      // Compatibility with legacy code.
      toSignInputs = await this.formatOptionsToSignInputs(psbt);
      if (autoFinalized !== false) autoFinalized = true;
    }
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
    psbt.data.inputs.forEach((v, index) => {
      const isNotSigned = !(v.finalScriptSig || v.finalScriptWitness);
      // const isP2TR = keyring.addressType === AddressType.P2TR || keyring.addressType === AddressType.M44_P2TR;
      const isP2TR = false;
      const lostInternalPubkey = !v.tapInternalKey;
      // Special measures taken for compatibility with certain applications.
      if (isNotSigned && isP2TR && lostInternalPubkey) {
        // const tapInternalKey = toXOnly(Buffer.from(account.pubkey, 'hex'));
        const tapInternalKey = '0xonly';
        // const { output } = bitcoin.payments.p2tr({
        //   internalPubkey: tapInternalKey,
        //   network: psbtNetwork
        // });
        const { output } = 'output';
        if (v.witnessUtxo?.script.toString('hex') == output?.toString('hex')) {
          v.tapInternalKey = tapInternalKey;
        }
      }
    });
    psbt = await keyringService.signTransaction(_keyring, psbt, toSignInputs);
    if (autoFinalized) {
      toSignInputs.forEach((v) => {
        // psbt.validateSignaturesOfInput(v.index, validator);
        psbt.finalizeInput(v.index);
      });
    }
    return psbt;
  };

  signMessage = async (text: string) => {
    const account = preferenceService.getCurrentAccount();
    if (!account) throw new Error('no current account');
    return keyringService.signMessage(account.pubkey, text);
  };

  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  signBIP322Simple = async (text: string) => {
    const account = preferenceService.getCurrentAccount();
    if (!account) throw new Error('no current account');
    // const networkType = this.getNetworkType();
    // return signMessageOfBIP322Simple({
    //   message: text,
    //   address: account.address,
    //   networkType,
    //   wallet: this as any
    // });
    return null;
  };

  requestKeyring = (type: string, methodName: string, keyringId: number | null, ...params) => {
    let keyring;
    if (keyringId !== null && keyringId !== undefined) {
      keyring = stashKeyrings[keyringId];
    } else {
      try {
        keyring = this._getKeyringByType(type);
      } catch {
        const Keyring = keyringService.getKeyringClassForType(type);
        keyring = new Keyring();
      }
    }
    if (keyring[methodName]) {
      return keyring[methodName].call(keyring, ...params);
    }
  };

  private _getKeyringByType = (type: string): Keyring => {
    const keyring = keyringService.getKeyringsByType(type)[0];

    if (keyring) {
      return keyring;
    }

    throw new Error(`No ${type} keyring found`);
  };

  addContact = (data: ContactBookItem) => {
    contactBookService.addContact(data);
  };

  updateContact = (data: ContactBookItem) => {
    contactBookService.updateContact(data);
  };

  removeContact = (address: string) => {
    contactBookService.removeContact(address);
  };

  listContact = (includeAlias = true) => {
    const list = contactBookService.listContacts();
    if (includeAlias) {
      return list;
    } else {
      return list.filter((item) => !item.isAlias);
    }
  };

  getContactsByMap = () => {
    return contactBookService.getContactsByMap();
  };

  getContactByAddress = (address: string) => {
    return contactBookService.getContactByAddress(address);
  };

  private _generateAlianName = (type: string, index: number) => {
    const alianName = `${BRAND_ALIAN_TYPE_TEXT[type]} ${index}`;
    return alianName;
  };

  getNextAlianName = (keyring: WalletKeyring) => {
    return this._generateAlianName(keyring.type, keyring.accounts.length + 1);
  };

  getHighlightWalletList = () => {
    return preferenceService.getWalletSavedList();
  };

  updateHighlightWalletList = (list) => {
    return preferenceService.updateWalletSavedList(list);
  };

  getAlianName = (pubkey: string) => {
    const contactName = contactBookService.getContactByAddress(pubkey)?.name;
    return contactName;
  };

  updateAlianName = (pubkey: string, name: string) => {
    contactBookService.updateAlias({
      name,
      address: pubkey
    });
  };

  getAllAlianName = () => {
    return contactBookService.listAlias();
  };

  getInitAlianNameStatus = () => {
    return preferenceService.getInitAlianNameStatus();
  };

  updateInitAlianNameStatus = () => {
    preferenceService.changeInitAlianNameStatus();
  };

  getIsFirstOpen = () => {
    return preferenceService.getIsFirstOpen();
  };

  updateIsFirstOpen = () => {
    return preferenceService.updateIsFirstOpen();
  };

  listChainAssets = async (pubkeyAddress: string) => {
    const balance = await openapiService.getAddressBalance(pubkeyAddress);
    const assets: AccountAsset[] = [
      { name: COIN_NAME, symbol: COIN_SYMBOL, amount: balance.amount, value: balance.usd_value }
    ];
    return assets;
  };

  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  reportErrors = (error: string) => {
    console.error('report not implemented');
  };

  getNetworkType = () => {
    const networkType = preferenceService.getNetworkType();
    return networkType;
  };
  getRpcLinks = () => {
    const rpcLinks = preferenceService.getRpcLinks();
    return rpcLinks;
  };
  getRpcStatus = () => {
    const status = openapiService.getRpcStatus();
    return status;
  };

  setNetworkType = async (networkType: NetworkType) => {
    preferenceService.setNetworkType(networkType);
    const rpcLinks = preferenceService.getRpcLinks();

    if (networkType === NetworkType.Mainnet) {
      this.openapi.setHost(OPENAPI_URL_MAINNET);
      this.openapi.setNetworkId(NetworkType.Mainnet);
      this.openapi.setRpcHost(rpcLinks[0].url);
    } else if (networkType === NetworkType.Testnet) {
      this.openapi.setHost(OPENAPI_URL_TESTNET);
      this.openapi.setNetworkId(NetworkType.Testnet);
      this.openapi.setRpcHost(rpcLinks[1].url);
    } else if (networkType === NetworkType.Devnet) {
      this.openapi.setHost(OPENAPI_URL_DEVNET);
      this.openapi.setNetworkId(NetworkType.Devnet);
      this.openapi.setRpcHost(rpcLinks[2].url);
    }
    const network = this.getNetworkName();
    sessionService.broadcastEvent('networkChanged', {
      network
    });

    const currentAccount = await this.getCurrentAccount();
    const keyring = await this.getCurrentKeyring();
    if (!keyring) throw new Error('no current keyring');
    this.changeKeyring(keyring, currentAccount?.index);
  };

  setRpcLinks = async (rpcLinks: typeof NETWORK_TYPES) => {
    preferenceService.setRpcLinks(rpcLinks);
  };

  getNetworkName = () => {
    const networkType = preferenceService.getNetworkType();
    return NETWORK_TYPES[networkType].name;
  };

  getBTCUtxos = async () => {
    // getBTCAccount
    const account = preferenceService.getCurrentAccount();
    if (!account) throw new Error('no current account');

    const utxos = await openapiService.getBTCUtxos(account.address);

    // if (openapiService.addressFlag == 1) {
    //   utxos = utxos.filter((v) => (v as any).height !== 4194303);
    // }

    const btcUtxos = getKaspaUTXOWithoutBigint(utxos);
    return btcUtxos;
  };
  getKASUtxos = async () => {
    // getBTCAccount
    const account = preferenceService.getCurrentAccount();
    if (!account) throw new Error('no current account');

    const utxos = await openapiService.getBTCUtxos(account.address);

    const replacer = (key, value) => (typeof value === 'bigint' ? value.toString() : value);
    const str = JSON.stringify(utxos, replacer);
    // const reviver = (key, value) => (key === "amount" || key === "blockDaaScore" ? BigInt(value) : value);
    // const obj = JSON.parse(str, reviver)
    return str;
  };

  // 1. create and sign a transaction
  sendBTC = async ({
    to,
    amount,
    feeRate,
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
    enableRBF,
    btcUtxos
  }: {
    to: string;
    amount: number;
    // treat feeRate as priorityFee, kas unit.
    feeRate: number;
    enableRBF: boolean;
    btcUtxos?: IKaspaUTXOWithoutBigint[];
  }) => {
    const account = preferenceService.getCurrentAccount();
    if (!account) throw new Error('no current account');
    if (!btcUtxos) {
      btcUtxos = await this.getBTCUtxos();
    }
    if (btcUtxos.length == 0) {
      throw new Error('Insufficient balance.');
    }
    const sourceAddress = account.address;
    const destinationAddress = to;
    // const entries = await openapiService.getKASUtxos(sourceAddress);
    // if (!entries.length) {
    //   throw new Error(`No UTXOs found for address ${sourceAddress}`);
    // }
    const entries = getKaspaUTXOs(btcUtxos);
    // entries.sort((a, b) => a.utxoEntry.amount > b.utxoEntry.amount || -(a.utxoEntry.amount < b.utxoEntry.amount));
    const moneySompi = amount;
    // 1. create
    const generator = new Generator({
      // utxoEntries: entries,
      entries,
      outputs: [[destinationAddress, moneySompi]],
      priorityFee: 0n,
      changeAddress: sourceAddress.toString()
      // sigOpCount,
      // minimumSignatures,
      // payload,
    });
    const estimate = await generator.estimate();
    // const finalId = estimate.finalTransactionId;
    const sompiFee = Number(estimate.fees);
    const resultJson = { to, amountSompi: amount, feeRate, fee: sompiFee };
    return JSON.stringify(resultJson);
  };

  sendAllBTC = async ({
    to,
    feeRate,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    enableRBF,
    btcUtxos
  }: {
    to: string;
    feeRate: number;
    enableRBF: boolean;
    btcUtxos?: IKaspaUTXOWithoutBigint[];
  }) => {
    const account = preferenceService.getCurrentAccount();
    if (!account) throw new Error('no current account');

    // const networkType = this.getNetworkType();

    if (!btcUtxos) {
      btcUtxos = await this.getBTCUtxos();
    }

    if (btcUtxos.length == 0) {
      throw new Error('Insufficient balance.');
    }
    const sourceAddress = account.address;
    const destinationAddress = to;
    const entries = getKaspaUTXOs(btcUtxos);
    const total = entries.reduce((agg, curr) => {
      return curr.utxoEntry.amount + agg;
    }, 0n);
    const moneySompi = Number(total - BigInt(entries.length) * 5000n);
    const generator = new Generator({
      entries,
      outputs: [[destinationAddress, moneySompi]],
      priorityFee: 0n,
      changeAddress: sourceAddress.toString()
    });
    try {
      const estimate = await generator.estimate();
      const sompiFee = Number(estimate.fees);
      const resultJson = { to, amountSompi: moneySompi - sompiFee * feeRate, feeRate, fee: sompiFee };
      return JSON.stringify(resultJson);
    } catch (e) {
      throw new Error(e);
    }
  };

  sendOrdinalsInscription = async ({
    to,
    inscriptionId,
    feeRate,
    outputValue,
    enableRBF,
    btcUtxos
  }: {
    to: string;
    inscriptionId: string;
    feeRate: number;
    outputValue: number;
    enableRBF: boolean;
    btcUtxos?: any[];
  }) => {
    const account = preferenceService.getCurrentAccount();
    if (!account) throw new Error('no current account');

    const networkType = preferenceService.getNetworkType();

    const utxo = await openapiService.getInscriptionUtxo(inscriptionId);
    if (!utxo) {
      throw new Error('UTXO not found.');
    }

    // if (utxo.inscriptions.length > 1) {
    //   throw new Error('Multiple inscriptions are mixed together. Please split them first.');
    // }

    const assetUtxo = Object.assign(utxo, { pubkey: account.pubkey });

    if (!btcUtxos) {
      btcUtxos = await this.getBTCUtxos();
    }

    if (btcUtxos.length == 0) {
      throw new Error('Insufficient balance.');
    }

    // const { psbt, toSignInputs } = await txHelpers.sendInscription({
    //   assetUtxo,
    //   btcUtxos,
    //   toAddress: to,
    //   networkType,
    //   changeAddress: account.address,
    //   feeRate,
    //   outputValue,
    //   enableRBF,
    //   enableMixed: true
    // });
    const psbt = 'psbt';
    const toSignInputs = [];

    this.setPsbtSignNonSegwitEnable(psbt, true);
    await this.signPsbt(psbt, toSignInputs, true);
    this.setPsbtSignNonSegwitEnable(psbt, false);
    return psbt.toHex();
  };

  sendOrdinalsInscriptions = async ({
    to,
    inscriptionIds,
    feeRate,
    enableRBF,
    btcUtxos
  }: {
    to: string;
    inscriptionIds: string[];
    utxos: UTXO[];
    feeRate: number;
    enableRBF: boolean;
    btcUtxos?: any[];
  }) => {
    const account = preferenceService.getCurrentAccount();
    if (!account) throw new Error('no current account');

    const networkType = preferenceService.getNetworkType();

    const inscription_utxos = await openapiService.getInscriptionUtxos(inscriptionIds);
    if (!inscription_utxos) {
      throw new Error('UTXO not found.');
    }

    if (inscription_utxos.find((v) => v.inscriptions.length > 1)) {
      throw new Error('Multiple inscriptions are mixed together. Please split them first.');
    }

    const assetUtxos = inscription_utxos.map((v) => {
      return Object.assign(v, { pubkey: account.pubkey });
    });

    if (!btcUtxos) {
      btcUtxos = await this.getBTCUtxos();
    }

    if (btcUtxos.length == 0) {
      throw new Error('Insufficient balance.');
    }

    // const { psbt, toSignInputs } = await txHelpers.sendInscriptions({
    //   assetUtxos,
    //   btcUtxos,
    //   toAddress: to,
    //   networkType,
    //   changeAddress: account.address,
    //   feeRate,
    //   enableRBF
    // });
    const psbt = 'psbt';
    const toSignInputs = [];

    this.setPsbtSignNonSegwitEnable(psbt, true);
    await this.signPsbt(psbt, toSignInputs, true);
    this.setPsbtSignNonSegwitEnable(psbt, false);

    return psbt.toHex();
  };

  pushTx = async (rawtx: string) => {
    const result: IResultPsbtHex = JSON.parse(rawtx);
    const toAddress = result.to;
    const inputAmountSompi = result.amountSompi;
    const priorityFeeSompi = result.feeRate * result.fee;
    const account = await this.getCurrentAccount();
    if (!account) throw new Error('no current account');
    const keyring = await this.getCurrentKeyring();
    if (!keyring) throw new Error('no current keyring');
    const _keyring = keyringService.keyrings[keyring.index];
    const sourceAddress = account.address;
    const destinationAddress = toAddress;
    const rpc = openapiService.rpc;
    const entries = await openapiService.getKASUtxos(sourceAddress);
    if (!entries.length) {
      throw new Error(`No UTXOs found for address ${sourceAddress}`);
    } else {
      entries.sort((a, b) => a.utxoEntry.amount > b.utxoEntry.amount || -(a.utxoEntry.amount < b.utxoEntry.amount));
      // const sigOpCount = 10;
      // const minimumSignatures = 1;
      // const payload = 'test';
      const money = Number(inputAmountSompi);
      const priorityFee = BigInt(priorityFeeSompi);
      // 1. create
      try {
        const generator = new Generator({
          // utxoEntries: entries,
          entries,
          outputs: [[destinationAddress.toString(), money]],
          priorityFee,
          changeAddress: sourceAddress.toString()
          // sigOpCount,
          // minimumSignatures,
          // payload,
        });
        const pending = await generator.next();
        // const estimate = await generator.estimate();
        // sign
        const publicKey = account.pubkey;
        const index = account.index as number;
        const toSignInputs: ToSignInput[] = [{ index, publicKey }];
        const preSubmitPending = await keyringService.signTransaction(_keyring, pending, toSignInputs);
        // submit
        const txid = await preSubmitPending.submit(rpc);
        return txid;
      } catch (e) {
        throw new Error(e);
      }
    }
  };

  getAccounts = async () => {
    const keyrings = await this.getKeyrings();
    const accounts: Account[] = keyrings.reduce<Account[]>((pre, cur) => pre.concat(cur.accounts), []);
    return accounts;
  };

  displayedKeyringToWalletKeyring = (displayedKeyring: DisplayedKeyring, index: number, initName = true) => {
    const networkType = preferenceService.getNetworkType();
    const addressType = displayedKeyring.addressType;
    const key = 'keyring_' + index;
    const type = displayedKeyring.type;
    const accounts: Account[] = [];
    for (let j = 0; j < displayedKeyring.accounts.length; j++) {
      const { pubkey, index, deriveType } = displayedKeyring.accounts[j];
      const accountIndex = Number('1' + deriveType.toString() + index.toString());
      const address = keyringService.publicKeyToAddress(pubkey, addressType, networkType);
      const accountKey = key + '#' + j;
      const defaultName = this.getAlianName(pubkey) || this._generateAlianName(type, j + 1);
      const alianName = preferenceService.getAccountAlianName(accountKey, defaultName);
      const flag = preferenceService.getAddressFlag(address);
      accounts.push({
        type,
        pubkey,
        address,
        alianName,
        index: accountIndex,
        deriveType,
        key: accountKey,
        flag
      });
    }
    const hdPath = type === KEYRING_TYPE.HdKeyring ? displayedKeyring.keyring.hdPath : '';
    const alianName = preferenceService.getKeyringAlianName(
      key,
      initName ? `${KEYRING_TYPES[type].alianName} #${index + 1}` : ''
    );
    const keyring: WalletKeyring = {
      index,
      key,
      type,
      addressType,
      accounts,
      alianName,
      hdPath
    };
    return keyring;
  };

  getKeyrings = async (): Promise<WalletKeyring[]> => {
    const displayedKeyrings = await keyringService.getAllDisplayedKeyrings();
    const keyrings: WalletKeyring[] = [];
    for (let index = 0; index < displayedKeyrings.length; index++) {
      const displayedKeyring = displayedKeyrings[index];
      if (displayedKeyring.type !== KEYRING_TYPE.Empty) {
        const keyring = this.displayedKeyringToWalletKeyring(displayedKeyring, displayedKeyring.index);
        keyrings.push(keyring);
      }
    }

    return keyrings;
  };

  getCurrentKeyring = async () => {
    let currentKeyringIndex = preferenceService.getCurrentKeyringIndex();
    const displayedKeyrings = await keyringService.getAllDisplayedKeyrings();
    if (currentKeyringIndex === undefined) {
      const currentAccount = preferenceService.getCurrentAccount();
      for (let i = 0; i < displayedKeyrings.length; i++) {
        if (displayedKeyrings[i].type !== currentAccount?.type) {
          continue;
        }
        const found = displayedKeyrings[i].accounts.find((v) => v.pubkey === currentAccount?.pubkey);
        if (found) {
          currentKeyringIndex = i;
          break;
        }
      }
      if (currentKeyringIndex === undefined) {
        currentKeyringIndex = 0;
      }
    }

    if (
      !displayedKeyrings[currentKeyringIndex] ||
      displayedKeyrings[currentKeyringIndex].type === KEYRING_TYPE.Empty ||
      !displayedKeyrings[currentKeyringIndex].accounts[0]
    ) {
      for (let i = 0; i < displayedKeyrings.length; i++) {
        if (displayedKeyrings[i].type !== KEYRING_TYPE.Empty) {
          currentKeyringIndex = i;
          preferenceService.setCurrentKeyringIndex(currentKeyringIndex);
          break;
        }
      }
    }
    const displayedKeyring = displayedKeyrings[currentKeyringIndex];
    if (!displayedKeyring) return null;
    return this.displayedKeyringToWalletKeyring(displayedKeyring, currentKeyringIndex);
  };

  getCurrentAccount = async () => {
    const currentKeyring = await this.getCurrentKeyring();
    if (!currentKeyring) return null;
    const account = preferenceService.getCurrentAccount();
    let currentAccount: Account | undefined = undefined;
    currentKeyring.accounts.forEach((v) => {
      if (v.pubkey === account?.pubkey) {
        currentAccount = v;
      }
    });
    if (!currentAccount) {
      currentAccount = currentKeyring.accounts[0];
    }
    if (currentAccount) {
      currentAccount.flag = preferenceService.getAddressFlag(currentAccount.address);
      openapiService.setClientAddress(currentAccount.address, currentAccount.flag);
    }
    return currentAccount;
  };

  getEditingKeyring = async () => {
    const editingKeyringIndex = preferenceService.getEditingKeyringIndex();
    const displayedKeyrings = await keyringService.getAllDisplayedKeyrings();
    const displayedKeyring = displayedKeyrings[editingKeyringIndex];
    return this.displayedKeyringToWalletKeyring(displayedKeyring, editingKeyringIndex);
  };

  setEditingKeyring = async (index: number) => {
    preferenceService.setEditingKeyringIndex(index);
  };

  getEditingAccount = async () => {
    const account = preferenceService.getEditingAccount();
    return account;
  };

  setEditingAccount = async (account: Account) => {
    preferenceService.setEditingAccount(account);
  };

  queryDomainInfo = async (domain: string) => {
    const data = await openapiService.getDomainInfo(domain);
    return data;
  };

  getInscriptionSummary = async () => {
    const data = await openapiService.getInscriptionSummary();
    return data;
  };

  getAppSummary = async () => {
    const appTab = preferenceService.getAppTab();
    try {
      const data = await openapiService.getAppSummary();
      const readTabTime = appTab.readTabTime;
      data.apps.forEach((w) => {
        const readAppTime = appTab.readAppTime[w.id];
        if (w.time) {
          if (Date.now() > w.time + 1000 * 60 * 60 * 24 * 7) {
            w.new = false;
          } else if (readAppTime && readAppTime > w.time) {
            w.new = false;
          } else {
            w.new = true;
          }
        } else {
          w.new = false;
        }
      });
      data.readTabTime = readTabTime;
      preferenceService.setAppSummary(data);
      return data;
    } catch (e) {
      // console.log('getAppSummary error:', e);
      return appTab.summary;
    }
  };

  readTab = async () => {
    return preferenceService.setReadTabTime(Date.now());
  };

  readApp = async (appid: number) => {
    return preferenceService.setReadAppTime(appid, Date.now());
  };

  getAddressUtxo = async (address: string) => {
    const data = await openapiService.getBTCUtxos(address);
    return data;
  };

  getConnectedSite = permissionService.getConnectedSite;
  getSite = permissionService.getSite;
  getConnectedSites = permissionService.getConnectedSites;
  setRecentConnectedSites = (sites: ConnectedSite[]) => {
    permissionService.setRecentConnectedSites(sites);
  };
  getRecentConnectedSites = () => {
    return permissionService.getRecentConnectedSites();
  };
  getCurrentSite = (tabId: number): ConnectedSite | null => {
    const { origin, name, icon } = sessionService.getSession(tabId) || {};
    if (!origin) {
      return null;
    }
    const site = permissionService.getSite(origin);
    if (site) {
      return site;
    }
    return {
      origin,
      name,
      icon,
      chain: CHAINS_ENUM.KAS,
      isConnected: false,
      isSigned: false,
      isTop: false
    };
  };
  getCurrentConnectedSite = (tabId: number) => {
    const { origin } = sessionService.getSession(tabId) || {};
    return permissionService.getWithoutUpdate(origin);
  };
  setSite = (data: ConnectedSite) => {
    permissionService.setSite(data);
    if (data.isConnected) {
      const network = this.getNetworkName();
      sessionService.broadcastEvent(
        'networkChanged',
        {
          network
        },
        data.origin
      );
    }
  };
  updateConnectSite = (origin: string, data: ConnectedSite) => {
    permissionService.updateConnectSite(origin, data);
    const network = this.getNetworkName();
    sessionService.broadcastEvent(
      'networkChanged',
      {
        network
      },
      data.origin
    );
  };
  removeAllRecentConnectedSites = () => {
    const sites = permissionService.getRecentConnectedSites().filter((item) => !item.isTop);
    sites.forEach((item) => {
      this.removeConnectedSite(item.origin);
    });
  };
  removeConnectedSite = (origin: string) => {
    sessionService.broadcastEvent('accountsChanged', [], origin);
    permissionService.removeConnectedSite(origin);
  };

  setKeyringAlianName = (keyring: WalletKeyring, name: string) => {
    preferenceService.setKeyringAlianName(keyring.key, name);
    keyring.alianName = name;
    return keyring;
  };

  setAccountAlianName = (account: Account, name: string) => {
    preferenceService.setAccountAlianName(account.key, name);
    account.alianName = name;
    return account;
  };

  addAddressFlag = (account: Account, flag: AddressFlagType) => {
    account.flag = preferenceService.addAddressFlag(account.address, flag);
    openapiService.setClientAddress(account.address, account.flag);
    return account;
  };
  removeAddressFlag = (account: Account, flag: AddressFlagType) => {
    account.flag = preferenceService.removeAddressFlag(account.address, flag);
    openapiService.setClientAddress(account.address, account.flag);
    return account;
  };

  getFeeSummary = async () => {
    return openapiService.getFeeSummary();
  };

  inscribeBRC20Transfer = (address: string, tick: string, amount: string, feeRate: number) => {
    return openapiService.inscribeBRC20Transfer(address, tick, amount, feeRate);
  };

  getInscribeResult = (orderId: string) => {
    return openapiService.getInscribeResult(orderId);
  };

  decodePsbt = (psbtHex: string) => {
    return openapiService.decodePsbt(psbtHex);
  };

  getBRC20Summary = async (address: string, ticker: string) => {
    const uiCachedData = preferenceService.getUICachedData(address);
    if (uiCachedData.brc20Summary[ticker]) {
      return uiCachedData.brc20Summary[ticker];
    }

    const tokenSummary = await openapiService.getAddressTokenSummary(address, ticker);
    uiCachedData.brc20Summary[ticker] = tokenSummary;
    return tokenSummary;
  };

  expireUICachedData = (address: string) => {
    return preferenceService.expireUICachedData(address);
  };

  createMoonpayUrl = (address: string) => {
    return openapiService.createMoonpayUrl(address);
  };

  getWalletConfig = () => {
    return openapiService.getWalletConfig();
  };

  getSkippedVersion = () => {
    return preferenceService.getSkippedVersion();
  };

  setSkippedVersion = (version: string) => {
    return preferenceService.setSkippedVersion(version);
  };

  checkWebsite = (website: string) => {
    return openapiService.checkWebsite(website);
  };

  // it's used for ori. ---from shawn
  getAddressSummary = async (address: string) => {
    const data = await openapiService.getAddressSummary(address);
    // preferenceService.updateAddressBalance(address, data);
    return data;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setPsbtSignNonSegwitEnable(psbt: any, enabled: boolean) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    psbt.__CACHE.__UNSAFE_SIGN_NONSEGWIT = enabled;
  }

  getShowSafeNotice = () => {
    return preferenceService.getShowSafeNotice();
  };

  setShowSafeNotice = (show: boolean) => {
    return preferenceService.setShowSafeNotice(show);
  };

  getVersionDetail = (version: string) => {
    return openapiService.getVersionDetail(version);
  };

  isAtomicalsEnabled = async () => {
    const current = await this.getCurrentAccount();
    if (!current) return false;
    return checkAddressFlag(current?.flag, AddressFlagType.Is_Enable_Atomicals);
  };
  isValidKaspaAddr = (addr: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
      const addr2 = new Address(addr);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  };
}

export default new WalletController();
