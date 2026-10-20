import { Buffer } from 'buffer';
import type {
  HexString,
  IGeneratorSettingsObject,
  ITransactionInput,
  ITransactionOutput,
  IUtxoEntry,
  PendingTransaction,
  ScriptPublicKey,
  UtxoEntryReference
} from 'kaspa-wasm';
import {
  Address,
  addressFromScriptPublicKey,
  calculateTransactionFee,
  calculateTransactionMass,
  createTransactions,
  estimateTransactions,
  FeeSource,
  Generator,
  kaspaToSompi,
  PaymentOutput,
  payToAddressScript,
  ScriptBuilder,
  sompiToKaspaString,
  Transaction,
  TransactionInput,
  TransactionOutput,
  UtxoEntries
} from 'kaspa-wasm';
import { max } from 'lodash-es';
import log from 'loglevel';

import {
  contactBookService,
  keyringService,
  notificationService,
  openapiService,
  permissionService,
  preferenceService,
  sessionService
} from '@/background/service';
import type { DisplayedKeyring, Keyring } from '@/background/service/keyring';
import type { AddressFlagType } from '@/shared/constant';
import {
  ADDRESS_TYPES,
  BRAND_ALIAN_TYPE_TEXT,
  COIN_NAME,
  COIN_SYMBOL,
  KASPA_CHAINS_ENUM,
  KASPA_EVENTS,
  KASPLEX,
  KASPLEX_MAINNET,
  KASPLEX_TESTNET_10,
  KASPLEX_TESTNET_11,
  KASPLEX_TESTNET_12,
  KEYRING_TYPE,
  KEYRING_TYPES,
  OPENAPI_URL_DEVNET,
  OPENAPI_URL_MAINNET,
  OPENAPI_URL_TESTNET_10,
  OPENAPI_URL_TESTNET_11,
  OPENAPI_URL_TESTNET_12
} from '@/shared/constant';
import { COMMIT_AMOUNT, KRC20_DEPLOY_TX_FEE } from '@/shared/constant/kasplex';
import eventBus from '@/shared/eventBus';
import { toChecksumHexAddress } from '@/shared/modules/hexstring-utils';
import type {
  Account,
  AddressUserToSignInput,
  ConfigJSON,
  CURRENCIES,
  IBatchTransfer,
  IBatchTransferResult,
  IKaspaUtxoEntryReference,
  IKRC20TokenInfoIssue,
  IKRC20TokenPrice,
  INetworkType,
  IP2shOutput,
  IResultPsbtHex,
  IScannedGroup,
  ISubmitCommitParams,
  ISubmitRevealParams,
  IToken,
  ITxInfo,
  ITxParam,
  IUtxoEntryJson,
  KaspaBalance,
  NetworkType,
  PublicKeyUserToSignInput,
  SignPsbtOptions,
  SignPsktDappContext,
  SignPsktOptions,
  TNetworkId,
  ToSignInput,
  TPendingTxType,
  TProtocol,
  TSignMessage,
  WalletKeyring
} from '@/shared/types';
import { ALLOWED_PSKT_SIGHASH, AddressType, BuildScriptType, SighashBiType, TxType } from '@/shared/types';
import type { ContactBookItem } from '@/shared/types/contact-book';
import type { ConnectedSite } from '@/shared/types/permission';
import {
  calculateScriptExtraFee,
  constructKRC20ListJsonStrLowerCase,
  constructKRC20SendJsonStrLowerCase,
  constructKRC20TransferJsonStrLowerCase,
  getKRC20BatchTransferResults,
  getRandomFourDigitNumberWithoutZero,
  getRequireProtocolFee
} from '@/shared/utils';
import { amountToSompi, sompiToAmount } from '@/shared/utils/format';
import { buildIgraEntryPayload } from '@/shared/utils/helper';
import type { HdKeyring } from '../service/keyringclass/hd-keyring';
import type { OpenApiService } from '../service/openapi';
import {
  checkTransactionSum,
  chunkArray,
  getTxFeeFromTx,
  indexGreaterThanSum,
  sleep,
  utxoEntryToTransactionInputs,
  walletBuildScript,
  walletGetRedeemScript00
} from '../utils';
import {
  getCommitAddressesPure,
  getP2shAddressFromScriptBuilderPure,
  getP2shAddressPure,
  getScriptInfo as getScriptInfoUtil
} from '../utils/addressUtils';
import { calculateChargeFee, calculateKRC20TradeFee } from '../utils/feeUtils';
import {
  generateAlianName,
  getNetworkNameById,
  getToSignInputs as getToSignInputsUtil,
  kaspaUtxosToIUtxoEntries as kaspaUtxosToIUtxoEntriesUtil
} from '../utils/transactionUtils';
import { storage } from '../webapi';
import BaseController from './base';

// PSBT input data types for formatOptionsToSignInputs
interface PsbtInputData {
  witnessUtxo: { script: Buffer | string; value: number } | undefined;
  nonWitnessUtxo: Buffer | undefined;
  finalScriptSig: Buffer | undefined;
  finalScriptWitness: Buffer | undefined;
  sighashType: number | undefined;
}

interface PsbtInput {
  [key: number]: PsbtInputData;
}

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

  getApproval = () => notificationService.getApproval();

  resolveApproval = (data?: any, forceReject?: boolean) => notificationService.resolveApproval(data, forceReject);

  rejectApproval = (err?: string, stay?: boolean, isInternal?: boolean) =>
    notificationService.rejectApproval(err, stay, isInternal);

  removeNotifiWindow = () => notificationService.removeNotifiWindow();

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
  disconnectRpc = () => openapiService.disconnectRpc();

  handleRpcConnect = () => openapiService.handleRpcConnect('connectRPC');

  subscribeUtxosChanged = async () => {
    const currentAccount = preferenceService.getCurrentAccount();
    if (currentAccount?.address) {
      await openapiService.subscribeUtxosChanged();
    }
  };

  isReady = () => Boolean(openapiService.store);

  unlock = async (password: string) => {
    const alianNameInited = preferenceService.getInitAlianNameStatus();
    const alianNames = contactBookService.listAlias();
    await keyringService.submitPassword(password);
    sessionService.broadcastEvent('unlock');
    if (!alianNameInited && alianNames.length === 0) {
      this.initAlianNames();
    }
    openapiService.handleRpcConnect();
  };
  isUnlocked = () => keyringService.memStore.getState().isUnlocked;

  lockWallet = async () => {
    await keyringService.setLocked();
    sessionService.broadcastEvent('accountsChanged', []);
    sessionService.broadcastEvent('lock');
    eventBus.emit(KASPA_EVENTS.broadcastToUI, {
      method: 'lock',
      params: {}
    });
    this.disconnectRpc();
  };
  logout = async () => {
    this.clearKeyrings();
    await preferenceService.clearPreference();
    await openapiService.clearOpenApi();
    await permissionService.clearPermission();
    await contactBookService.clearContact();
    await storage.remove('keyringState');
    keyringService.loadStore(undefined);
    keyringService.store.subscribe((value) => storage.set('keyringState', value));
  };

  setPopupOpen = (isOpen: boolean) => preferenceService.setPopupOpen(isOpen);

  getPendingTxDatas = async (sourceAddress: string): Promise<ITxInfo[]> => {
    const pendingTxs = openapiService.getPendingTxs();
    const res: ITxInfo[] = [];
    if (!pendingTxs) return res;
    for (const [, value] of pendingTxs) {
      if (value.txInfo?.motherAddress === sourceAddress) res.push(value.txInfo);
    }
    return res;
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

  getMultiAddressAssets = (addresses: string) => openapiService.getMultiAddressAssets(addresses);

  getAddressInscriptions = (address: string) => openapiService.getAddressInscriptions(address);
  /**
   * @param contractAddress - Contract address (tick in krc20 mint mode, ca in krc20 issue mode)
   */
  getKRC20TokenInfo = (contractAddress: string, includeHolders = false) =>
    openapiService.getKRC20TokenInfo(contractAddress, includeHolders);

  // getKRC20History = (addr: string, tick?: string) => openapiService.getKRC20History(addr, tick);

  getKRC20HistoryLocalStorage = (networkId: string, address: string) =>
    preferenceService.getKrc20History(networkId, address);

  getKRC20HistoryFromID = (txid: string) => openapiService.getKRC20HistoryFromID(txid);

  findGroupAssets = (groups: IScannedGroup[]) => openapiService.findGroupAssets(groups);

  getAddressCacheBalance = (address: string | undefined): KaspaBalance => {
    const defaultBalance: KaspaBalance = {
      confirm_amount: '0',
      pending_amount: '0',
      amount: '0',
      usd_value: '0',
      confirm_kas_amount: '0',
      pending_kas_amount: '0',
      kas_amount: '0'
    };
    if (!address) return defaultBalance;
    return preferenceService.getAddressBalance(address) || defaultBalance;
  };

  getAddressCacheHistory = (address: string | undefined) =>
    !address ? [] : preferenceService.getAddressHistory(address);

  getExternalLinkAck = () => preferenceService.getExternalLinkAck();

  setExternalLinkAck = (ack) => preferenceService.setExternalLinkAck(ack);

  getLocale = () => preferenceService.getLocale();

  setLocale = (locale: string) => preferenceService.setLocale(locale);

  getMintCount = () => preferenceService.getMintCount();

  getChargeFee = (txType: TxType) => {
    if (txType === TxType.SIGN_KRC20_MINT) {
      openapiService.increaseMintCount();
      const mc = openapiService.getMintCount();
      return calculateChargeFee(txType, mc);
    }
    return calculateChargeFee(txType);
  };
  getKRC20TradeFee = (count: number) => {
    if (count <= 0) return BigInt(0);
    const ct = openapiService.getKRC20TradeCount();
    openapiService.increaseKRC20TradeCount(count);
    const ct2 = openapiService.getKRC20TradeCount();
    return calculateKRC20TradeFee(count, ct, ct2);
  };

  getCurrency = () => preferenceService.getCurrency();

  setCurrency = (currency: keyof typeof CURRENCIES) => preferenceService.setCurrency(currency);

  /* keyrings */

  clearKeyrings = () => keyringService.clearKeyrings();
  /**
   * @param pubkey - kaspa pubkey
   * @param type - keyring type
   */
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
      passphrase: serialized.passphrase,
      addressType: serialized.addressType
    };
  };
  getXpub = async (keyring: WalletKeyring) => {
    const originKeyring = keyringService.keyrings[keyring.index];
    if (keyring.type === 'HD Key Tree') {
      const xpub = await originKeyring.getXpub();
      return xpub;
    } else {
      throw new Error('Not support keyring type');
    }
  };
  updateKrc20CaToName = (ca: string, name: string) => preferenceService.updateKrc20CaToName(ca, name);
  updateKrc20TokenDec = (ca: string, dec: string) => preferenceService.updateKrc20TokenDec(ca, dec);
  getKrc20CaToName = async (ca: string) => {
    const name = preferenceService.getKrc20CaToName(ca);
    if (name) return name;

    const info = await openapiService.getKRC20TokenInfo(ca);
    if (info && info.length > 0 && (info[0] as IKRC20TokenInfoIssue)?.name) {
      preferenceService.updateKrc20CaToName(ca, (info[0] as IKRC20TokenInfoIssue).name);
      return (info[0] as IKRC20TokenInfoIssue).name;
    }
  };
  getKrc20TokenDec = async (ca: string) => {
    const dec = preferenceService.getKrc20TokenDec(ca);
    if (dec) return dec;
    const info = await openapiService.getKRC20TokenInfo(ca);
    if (info && info.length > 0 && info[0].dec) {
      preferenceService.updateKrc20CaToName(ca, info[0].dec);
      return info[0].dec;
    }
  };
  getKrc20DecName = (networkId: string, contractAddress: string) =>
    preferenceService.getKrc20DecName(networkId, contractAddress);
  updateKrc20DecName = (networkId: string, contractAddress: string, dec: string, name: string) =>
    preferenceService.updateKrc20DecName(networkId, contractAddress, dec, name);
  createKeyringWithPrivateKey = async (data: string, addressType: AddressType, alianName?: string) => {
    // const error = new Error(i18n.t('The private key is invalid'));
    let originKeyring: Keyring;
    try {
      originKeyring = await keyringService.importPrivateKey(data, addressType);
    } catch (e) {
      log.debug(e);
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

  getPreMnemonics = (wordCount = 12) => keyringService.getPreMnemonics(wordCount);

  generatePreMnemonic = (wordCount = 12) => keyringService.generatePreMnemonic(wordCount);

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
    // preferenceService.setShowSafeNotice(false);
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
      passphrase,
      addressType
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
      passphrase,
      addressType
    });
    const address_arr_final: string[] = [];
    const sompi_arr_final: number[] = [];
    const krc20_arr_final: boolean[] = [];
    const dtype_arr_final: number[] = [];
    const index_arr_final: number[] = [];
    for (let i = 0; ; i = i + accountCount) {
      const receiveAddressObjArr = (originKeyring as HdKeyring).getAddresses(i, i + accountCount, 0);
      const address_arr: string[] = [];
      const sompi_arr: number[] = [];
      const krc20_arr: boolean[] = [];
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
        sompi_arr: sompi_arr,
        krc20_arr: krc20_arr,
        dtype_arr,
        index_arr
      });
      const groupRes = await this.findGroupAssets(groups);
      if (groupRes.length > 0) {
        const res = groupRes[0];
        address_arr_final.splice(address_arr_final.length, 0, ...res.address_arr);
        sompi_arr_final.splice(sompi_arr_final.length, 0, ...res.sompi_arr);
        krc20_arr_final.splice(krc20_arr_final.length, 0, ...res.krc20_arr);
        dtype_arr_final.splice(dtype_arr_final.length, 0, ...res.dtype_arr);
        index_arr_final.splice(index_arr_final.length, 0, ...res.index_arr);
      } else {
        // stop for iteration
        break;
      }
    }
    const groupsFinal: IScannedGroup[] = [];
    if (sompi_arr_final.length > 0) {
      groupsFinal.push({
        type: addressType,
        address_arr: address_arr_final,
        sompi_arr: sompi_arr_final,
        krc20_arr: krc20_arr_final,
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
    const sompi_arr = group.sompi_arr;
    const krc20_arr = group.krc20_arr;
    const dtype_arr = group.dtype_arr;
    const index_arr = group.index_arr;
    for (let i = 0; i < address_arr.length; ) {
      const idDuplicated = keyring.accounts.find((a) => a.address == address_arr[i]);
      if (idDuplicated) {
        address_arr.splice(i, 1);
        sompi_arr.splice(i, 1);
        krc20_arr.splice(i, 1);
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

  /**
   * @description compound utxos
   * @param accounts
   * @attention cannot set priorityFee
   */
  compoundUtxos = async (accounts: Account[]) => {
    const addresses = accounts.map((a) => a.address);
    const currentAccount = preferenceService.getCurrentAccount();
    if (!currentAccount?.address) throw new Error('current address is null');
    const entries = await openapiService.getKASUtxoEntryReferences(addresses);
    if (!entries.length) {
      throw new Error(`No UTXOs found for address ${addresses}`);
    }

    const keyring = await this.getCurrentKeyring();
    if (!keyring) throw new Error('no current keyring');
    const networkId = preferenceService.getNetworkId();
    const feeRate = await openapiService.getLowFeeRate();

    if (keyring.addressType === AddressType.KASPA_TANGEM_44_111111) {
      // Tangem uses ECDSA signing — only sign for the current account
      const currentAddr = currentAccount.address;
      const currentAccountInfo = accounts.find((a) => a.address === currentAddr);
      if (!currentAccountInfo) throw new Error('current account not found in provided accounts');

      // Filter entries to only the current address
      const tangemEntries = entries.filter((e) => e.address?.toString() === currentAddr);
      if (!tangemEntries.length) throw new Error(`No UTXOs found for address ${currentAddr}`);

      const publicKey = currentAccountInfo.pubkey;
      const generator = new Generator({
        entries: tangemEntries,
        feeRate,
        changeAddress: currentAddr,
        networkId
      } as IGeneratorSettingsObject);

      let pending: PendingTransaction;
      const txids: string[] = [];
      while ((pending = await generator.next())) {
        const transaction = pending.transaction;
        const txFee = Number(sompiToAmount(pending.feeAmount, 8));
        const toSignInputs: ToSignInput[] = Array.from({ length: transaction.inputs.length }, (_, i) => ({
          index: i,
          publicKey,
          sighashTypes: [1]
        }));
        const signedTx = await this.walletSignTransaction(keyring, transaction, toSignInputs, false);
        const result = await openapiService.checkAndSubmitTransaction({ transaction: signedTx, allowOrphan: false });
        const outputIndexOfFee = transaction.outputs.length === 1 ? 0 : 1;
        await this.walletAddPendingTx(
          'compound',
          transaction,
          txFee,
          currentAddr,
          currentAddr,
          '',
          outputIndexOfFee,
          toSignInputs
        );
        txids.push(result.transactionId);
      }
      return txids[0];
    }

    const _keyring = keyringService.keyrings[keyring.index];
    const signInputs: ToSignInput[] = accounts.map((account) => ({
      index: account.index as number,
      publicKey: account.pubkey
    }));
    const generator = new Generator({
      entries,
      feeRate,
      changeAddress: currentAccount.address,
      networkId
    } as IGeneratorSettingsObject);

    let pending: PendingTransaction;
    const txids: string[] = [];
    while ((pending = await generator.next())) {
      const preSubmitPending = await keyringService.signPendingTransaction(_keyring, pending, signInputs);
      const txid = await openapiService.submitPendingTransaction(preSubmitPending);
      if (accounts.length === 1) {
        const transaction = preSubmitPending.transaction;
        const outputIndexOfFee = transaction.outputs.length === 1 ? 0 : 1;
        const pendingInputs: ToSignInput[] = Array.from({ length: transaction.inputs.length }, (_, i) => ({
          index: i,
          publicKey: accounts[0].pubkey,
          sighashTypes: [1]
        }));
        await this.walletAddPendingTx(
          'compound',
          transaction,
          Number(sompiToAmount(preSubmitPending.feeAmount, 8)),
          accounts[0].address,
          accounts[0].address,
          '',
          outputIndexOfFee,
          pendingInputs
        );
      }
      txids.push(txid);
    }
    return txids[0];
  };

  createTmpKeyringWithPrivateKey = async (privateKey: string, addressType: AddressType) => {
    const originKeyring = keyringService.createTmpKeyring(KEYRING_TYPE.SimpleKeyring, [privateKey]);
    const displayedKeyring = await keyringService.displayForKeyring(originKeyring, addressType, -1);
    // preferenceService.setShowSafeNotice(false);
    return this.displayedKeyringToWalletKeyring(displayedKeyring, -1, false);
  };

  removeKeyring = async (keyring: WalletKeyring) => {
    await keyringService.removeKeyring(keyring.index);
    keyring.accounts.forEach((account) => preferenceService.removeAccountAlianName(account.key));
    preferenceService.removeKeyringAlianName(keyring.key);
    const keyrings = await this.getKeyrings();
    const nextKeyring = keyrings[keyrings.length - 1];
    if (nextKeyring && nextKeyring.accounts[0]) {
      this.changeKeyring(nextKeyring);
      return nextKeyring;
    }
  };
  removeAccount = async (account: Account, type: string) => {
    await keyringService.removeAccount(account, type);
    preferenceService.removeAccountAlianName(account.key);
  };

  getKeyringByType = (type: string) => keyringService.getKeyringByType(type);

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

  signAndSubmitTransaction = async (transaction: Transaction, isRBF = false) => {
    if (isRBF) {
      await openapiService.checkAndSubmitTransactionReplacement({ transaction });
    } else {
      await openapiService.checkAndSubmitTransaction({ transaction, allowOrphan: false });
    }
    return transaction;
  };
  /**
   * sign pskt
   * @param txJsonString is a serialized transaction object.
   * @param dappContext the network+account a dApp request was approved under; present only on the dApp
   * path, absent for the wallet's own covenant flows. When present, the request is bound to that context
   * and its inputs are re-verified against the active network right before signing.
   * @returns  Serialized "Safe" JSON schema for a signed transaction.
   */
  signPskt = async ({
    txJsonString,
    options,
    dappContext
  }: {
    txJsonString: string;
    options?: SignPsktOptions;
    dappContext?: SignPsktDappContext;
  }) => {
    const account = await this.getCurrentAccount();
    if (!account) throw new Error('no current account');
    const keyring = await this.getCurrentKeyring();
    if (!keyring) throw new Error('no current keyring');

    // Network + account binding (all networks): the window the user approved derived its addresses and
    // network label from the context captured when the request was created. If either changed while the
    // request was pending, the signature would be produced under a context the user never saw - refuse.
    if (dappContext) {
      if (preferenceService.getNetworkId() !== dappContext.networkId) {
        throw new Error('signPskt: the network changed since this request was approved');
      }
      // Bind against preferenceService (same source rpcFlow captured from), not this.getCurrentAccount()
      // which falls back to keyring.accounts[0] when the preference pubkey doesn't match — that fallback
      // would otherwise trip the binding check on a legitimate request.
      const prefAccount = preferenceService.getCurrentAccount();
      if ((prefAccount?.address ?? '') !== dappContext.accountAddress) {
        throw new Error('signPskt: the account changed since this request was approved');
      }
    }

    const publicKey = account.pubkey;
    const pskt = Transaction.deserializeFromSafeJSON(txJsonString) as Transaction;
    let toSignInputs2: ToSignInput[] = Array.from({ length: pskt.inputs.length }, (_, i) => {
      return { index: i, publicKey, sighashTypes: [1] };
    });
    if (options?.signInputs) {
      // sighash whitelist (#2): a NONE signature does not commit to the outputs, so the site can replace
      // them with its own address after the user approves and the node still accepts it. Only ALL/SINGLE
      // (with or without ANYONECANPAY) are signed; SINGLE also needs an output at the same index, else the
      // signature locks nothing. KRON/KCC20 build with SIG_HASH_ALL, so this never blocks the wallet's own flows.
      for (const si of options.signInputs) {
        const sh = Number(si.sighashType);
        if (!ALLOWED_PSKT_SIGHASH.includes(sh)) {
          throw new Error(`signPskt: sighash type ${si.sighashType} is not allowed`);
        }
        if ((sh === SighashBiType.Single || sh === SighashBiType.SingleAnyOneCanPay) && !pskt.outputs[si.index]) {
          throw new Error(`signPskt: SIGHASH_SINGLE input ${si.index} has no output at the same index`);
        }
      }
      toSignInputs2 = options.signInputs.map((input) => {
        return { index: input.index, publicKey, sighashTypes: [input.sighashType] };
      });
    }

    // #1 cross-network re-check right before signing, for a dApp request only. The helper is non-mainnet
    // scoped and fails open when the node is unreachable, so mainnet signing and the wallet's own covenant
    // flows (which pass no dappContext) are untouched.
    if (dappContext) {
      const signIndices = options?.signInputs ? options.signInputs.map((i) => i.index) : pskt.inputs.map((_, i) => i);
      const netVerify = await openapiService.verifyPsktInputsOnActiveNetwork(pskt, signIndices);
      if (!netVerify.ok) {
        throw new Error(`signPskt: ${netVerify.reasons.join(' ')}`);
      }
    }

    const signedTx = await this.walletSignTransaction(keyring, pskt, toSignInputs2, false);
    return signedTx.serializeToSafeJSON();
  };
  /**
   * Push a serialized transaction to the Kaspa network.
   * @param txJsonString - Serialized "Safe" JSON string of the transaction to submit.
   * @returns The transaction ID of the submitted transaction.
   */
  pushTx = async (txJsonString: string) => {
    const tx = Transaction.deserializeFromSafeJSON(txJsonString);
    const res = await openapiService.checkAndSubmitTransaction({ transaction: tx, allowOrphan: false });
    return res.transactionId;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signPendingTransaction = async (type: string, from: string, psbt: PendingTransaction, inputs: ToSignInput[]) => {
    const keyring = await keyringService.getKeyringForAccount(from, type);
    return keyringService.signPendingTransaction(keyring, psbt, inputs);
  };

  formatOptionsToSignInputs = async (_psbt: string | { data: { inputs: PsbtInput[] } }, options?: SignPsbtOptions) => {
    const account = await this.getCurrentAccount();
    if (!account) throw null;

    let toSignInputs: ToSignInput[] = [];
    if (options && options?.toSignInputs) {
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
      const psbt = typeof _psbt === 'string' ? 'string' : _psbt;
      psbt.data.inputs.forEach((v: PsbtInputData, index: number) => {
        let script: Buffer | string | null = null;
        // let value = 0;
        if (v.witnessUtxo) {
          script = v.witnessUtxo.script;
          // value = v.witnessUtxo.value;
        } else if (v.nonWitnessUtxo) {
          // const output = tx?.outs[psbt.txInputs[index].index];
          // script = output.script;
          script = '';
          // value = output.value;
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
  /**
   * Signs a message using the current account's keyring.
   *
   * The signature algorithm is determined by the `type` parameter:
   * - `'ecdsa'`: Uses ECDSA signing
   * - `'schnorr'`: Uses Schnorr signing (BIP-340)
   * - `'auto'` (default): Uses Schnorr for standard addresses, ECDSA for Tangem addresses
   *
   * @param text - The message text to sign
   * @param params - Optional signing parameters
   * @param params.noAuxRand - If true, disables auxiliary random value during signing (useful for reproducible signatures)
   * @param params.type - The signature type: `'schnorr'`, `'ecdsa'`, or `'auto'` (default: `'auto'`)
   * @returns A Promise that resolves to the signed message signature
   * @throws {Error} If no current account is found
   * @throws {Error} If no current keyring is found
   */
  signMessage = async (text: string, params?: { noAuxRand?: boolean; type?: TSignMessage }) => {
    const { noAuxRand, type = 'auto' } = params || {};
    const account = preferenceService.getCurrentAccount();
    if (!account) throw new Error('no current account');
    const keyring = await this.getCurrentKeyring();
    if (!keyring) throw new Error('no current keyring');
    const addressScriptType = keyring.addressType === AddressType.KASPA_TANGEM_44_111111 ? 'ecdsa' : 'schnorr';
    const scriptType = type === 'ecdsa' || type === 'schnorr' ? type : addressScriptType;
    log.debug('type, noAuxRand', scriptType, noAuxRand);
    return scriptType === 'ecdsa'
      ? keyringService.signMessageECDSA(account.pubkey, text, noAuxRand)
      : keyringService.signMessage(account.pubkey, text, noAuxRand);
  };

  verifyMessage = (pubkey: string, message: string, sig: string) => keyringService.verifyMessage(pubkey, message, sig);
  verifyMessageECDSA = (pubkey: string, message: string, sig: string) =>
    keyringService.verifyMessageECDSA(pubkey, message, sig);

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

  addContact = (data: ContactBookItem) => contactBookService.addContact(data);

  updateContact = (data: ContactBookItem) => contactBookService.updateContact(data);

  removeContact = (address: string) => contactBookService.removeContact(address);

  listContact = (includeAlias = true) => {
    const list = contactBookService.listContacts();
    if (includeAlias) {
      return list;
    } else {
      return list.filter((item) => !item.isAlias);
    }
  };

  getContactsByMap = () => contactBookService.getContactsByMap();

  getContactByAddress = (address: string) => contactBookService.getContactByAddress(address);

  private _generateAlianName = (type: string, index: number) => generateAlianName(type, index);

  getNextAlianName = (keyring: WalletKeyring) => this._generateAlianName(keyring.type, keyring.accounts.length + 1);

  getHighlightWalletList = () => preferenceService.getWalletSavedList();

  updateHighlightWalletList = (list) => preferenceService.updateWalletSavedList(list);

  getAlianName = (pubkey: string) => contactBookService.getContactByAddress(pubkey)?.name;

  updateAlianName = (pubkey: string, name: string) => {
    contactBookService.updateAlias({
      name,
      address: pubkey
    });
    preferenceService.setAccountAlianName(pubkey.slice(0, 10), name);
  };
  getSendTxToKaspa = () => preferenceService.getSendTxToKaspa();
  setSendTxToKaspa = (v: boolean) => preferenceService.setSendTxToKaspa(v);

  getAllAlianName = () => contactBookService.listAlias();

  getInitAlianNameStatus = () => preferenceService.getInitAlianNameStatus();

  updateInitAlianNameStatus = () => preferenceService.changeInitAlianNameStatus();

  getIsFirstOpen = () => {
    return preferenceService.getIsFirstOpen();
  };

  updateIsFirstOpen = () => preferenceService.updateIsFirstOpen();

  listChainAssets = async (pubkeyAddress: string) => {
    const balance = await openapiService.getAddressBalance(pubkeyAddress);
    const assets: AccountAsset[] = [
      { name: COIN_NAME, symbol: COIN_SYMBOL, amount: balance.amount, value: balance.usd_value }
    ];
    return assets;
  };

  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  reportErrors = (error: string) => console.error('report not implemented');

  getNetworkType = () => preferenceService.getNetworkType();

  getNetworkId = () => preferenceService.getNetworkId();

  getAutoLockMinutes = () => preferenceService.getAutoLockMinutes();

  setAutoLockMinutes = (minutes: number) => preferenceService.setAutoLockMinutes(minutes);

  getRpcLinks = () => preferenceService.getRpcLinks();

  getRpcStatus = () => openapiService.getRpcStatus();

  getRpcUrl = () => openapiService.getRpcUrl();

  setNetworkType = async (networkType: NetworkType, networkId: TNetworkId) => {
    preferenceService.setNetworkType(networkType);
    preferenceService.setNetworkId(networkId);
    if (networkId == 'mainnet') {
      openapiService.setHost(OPENAPI_URL_MAINNET);
      openapiService.setKasplexHost(KASPLEX_MAINNET);
      // openapiService.setNetworkId('mainnet');
      const rpcurl = preferenceService.getRpcLinksUrl('mainnet');
      openapiService.setRpcHost(rpcurl);
    } else if (networkId === 'testnet-12') {
      openapiService.setHost(OPENAPI_URL_TESTNET_12);
      openapiService.setKasplexHost(KASPLEX_TESTNET_12);
      const rpcurl = preferenceService.getRpcLinksUrl('testnet-12');
      openapiService.setRpcHost(rpcurl);
    } else if (networkId === 'testnet-11') {
      openapiService.setHost(OPENAPI_URL_TESTNET_11);
      openapiService.setKasplexHost(KASPLEX_TESTNET_11);
      const rpcurl = preferenceService.getRpcLinksUrl('testnet-11');
      openapiService.setRpcHost(rpcurl);
    } else if (networkId === 'testnet-10') {
      openapiService.setHost(OPENAPI_URL_TESTNET_10);
      openapiService.setKasplexHost(KASPLEX_TESTNET_10);
      const rpcurl = preferenceService.getRpcLinksUrl('testnet-10');
      openapiService.setRpcHost(rpcurl);
    } else if (networkId === 'devnet') {
      openapiService.setHost(OPENAPI_URL_DEVNET);
      openapiService.setKasplexHost(KASPLEX_TESTNET_11);
      const rpcurl = preferenceService.getRpcLinksUrl('devnet');
      openapiService.setRpcHost(rpcurl);
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

  setRpcLinks = (rpcLinks: { [key: string]: INetworkType }) => preferenceService.setRpcLinks(rpcLinks);

  getNetworkName = () => {
    const networkId = preferenceService.getNetworkId();
    return getNetworkNameById(networkId);
  };

  getKASUtxos = async (addresses?: string[]) => {
    const account = preferenceService.getCurrentAccount();
    if (!account) throw new Error('no current account');
    if (!addresses || addresses.length == 0) addresses = [account.address];
    const utxos = await openapiService.getKASUtxoEntryReferences(addresses);
    const kasUtxos = utxos.map((utxo) => {
      const str = utxo.toString();
      const strObj = JSON.parse(str);
      return strObj as IKaspaUtxoEntryReference;
    });

    return kasUtxos;
  };

  private kaspaUtxosToIUtxoEntries(kasUtxos: IKaspaUtxoEntryReference[]): IUtxoEntry[] {
    return kaspaUtxosToIUtxoEntriesUtil(kasUtxos);
  }
  /**
   * payload is only for mass calculation, not for actual transaction.
   */
  private prepareSendKASBase = async (params: {
    to: string;
    amount?: number;
    priorityFee: number;
    kasUtxos?: IKaspaUtxoEntryReference[];
    payload?: string;
    sendAll?: boolean;
    feeRate?: number;
  }) => {
    const { to, amount, priorityFee, kasUtxos, payload, sendAll, feeRate } = params;
    if (!sendAll && !amount) throw new Error('amount is required when sendAll is false');
    const account = preferenceService.getCurrentAccount();
    if (!account) throw new Error('no current account');
    const sourceAddress = account.address;
    const destinationAddress = to;
    const changeAddress = sendAll ? destinationAddress : sourceAddress;

    let moneySompi: bigint;
    let resultAmount: number;
    if (sendAll) {
      const { total } = await openapiService.getAddressBalanceOfKas(sourceAddress);
      moneySompi = total;
      resultAmount = Number(sompiToAmount(total - BigInt(amountToSompi(priorityFee, 8)), 8));
    } else {
      moneySompi = BigInt(amountToSompi(amount!, 8));
      resultAmount = amount!;
    }

    const payloadHex = payload ? Buffer.from(payload).toString('hex') : undefined;
    const generator = await openapiService.createGenerator(
      sourceAddress,
      destinationAddress,
      changeAddress,
      moneySompi,
      BigInt(0),
      !!sendAll,
      payloadHex,
      kasUtxos ? this.kaspaUtxosToIUtxoEntries(kasUtxos) : undefined,
      feeRate
    );

    const summary = await generator.estimate();
    const fee = Number(sompiToAmount(summary.fees, 8));
    const mass = Number(summary.mass);
    const resultJson = { to, amount: resultAmount, priorityFee, fee, mass, payload, feeRate };
    return JSON.stringify(resultJson);
  };

  prepareSendKAS = async ({
    to,
    amount,
    priorityFee,
    kasUtxos,
    payload,
    feeRate
  }: {
    to: string;
    amount: number;
    // sompi unit.
    priorityFee: number;
    kasUtxos?: IKaspaUtxoEntryReference[];
    payload?: string;
    feeRate?: number;
  }) => {
    try {
      return await this.prepareSendKASBase({ to, amount, priorityFee, kasUtxos, payload, sendAll: false, feeRate });
    } catch (e) {
      if (e instanceof Error) {
        throw new Error((e as Error).message);
      } else {
        throw new Error(JSON.stringify(e));
      }
    }
  };

  prepareSendAllKAS = async ({
    to,
    priorityFee,
    kasUtxos,
    payload,
    feeRate
  }: {
    to: string;
    priorityFee: number;
    kasUtxos?: IKaspaUtxoEntryReference[];
    payload?: string;
    feeRate?: number;
  }) => {
    try {
      return await this.prepareSendKASBase({ to, priorityFee, kasUtxos, payload, sendAll: true, feeRate });
    } catch (e) {
      throw new Error((e as Error).message);
    }
  };

  setBatchMintStatus = (arg: boolean) => openapiService.setBatchMintStatus(arg);
  setBatchMintPriorityFee = (arg: number) => openapiService.setBatchMintPriorityFee(arg);
  getBatchMintStatus = () => openapiService.getBatchMintStatus();

  /**
   * Single-stage batch mint using payload (no commit/reveal split)
   * Directly sends KRC20 mint operation embedded in transaction payload
   */
  signKRC20BatchMintPayload = async (inscribeJsonString: string, times: number, priorityFee = 1) => {
    openapiService.setBatchMintStatus(true);
    openapiService.setBatchMintPriorityFee(priorityFee);
    const networkId = preferenceService.getNetworkId();
    const keyring = await this.getCurrentKeyring();
    if (!keyring) throw new Error('no current keyring');
    const account = await this.getCurrentAccount();
    if (!account) throw new Error('no current account');
    const sourceAddress = account.address;
    const publicKey = account.pubkey;
    const addressType = keyring.addressType;
    const { redeemScript } = this.getScriptInfo(inscribeJsonString, publicKey, addressType, networkId);
    const priorityFeeSompi = priorityFee > 0 ? (kaspaToSompi(priorityFee.toString()) as bigint) : BigInt(0);
    const payloadHex = Buffer.from(inscribeJsonString).toString('hex');

    for (let t = 0; t < times; ) {
      const rpcStatus = await this.getRpcStatus();
      if (rpcStatus == false) {
        console.error('network disconnected');
        openapiService.setBatchMintStatus(false);
        eventBus.emit(KASPA_EVENTS.sendToUI, {
          method: 'batchmintkrc20process',
          params: JSON.stringify({ error: 'network disconnected' })
        });
        break;
      }
      const currentBatchMintStatus = openapiService.getBatchMintStatus();
      if (!currentBatchMintStatus) break;
      const currentNetworkId = preferenceService.getNetworkId();
      if (currentNetworkId !== networkId) {
        console.error('error: network type changed');
        openapiService.setBatchMintStatus(false);
        eventBus.emit(KASPA_EVENTS.sendToUI, {
          method: 'batchmintkrc20process',
          params: JSON.stringify({ error: 'network type changed' })
        });
        break;
      }

      try {
        const entries = await openapiService.getKASUtxoEntryReferences([sourceAddress]);
        if (entries.length < 1) {
          console.error('error: no utxos available');
          await sleep(1000);
          continue;
        }

        const balance = entries.reduce((agg, curr) => {
          return curr.amount + agg;
        }, BigInt(0));
        const minRequiredBalance = kaspaToSompi('10') as bigint;
        if (balance < minRequiredBalance) {
          console.error('error: balance is not enough');
          openapiService.setBatchMintStatus(false);
          eventBus.emit(KASPA_EVENTS.sendToUI, {
            method: 'batchmintkrc20process',
            params: JSON.stringify({ error: 'balance is not enough' })
          });
          break;
        }

        const generator = new Generator({
          entries,
          outputs: [],
          priorityFee: priorityFeeSompi,
          changeAddress: sourceAddress,
          networkId,
          payload: payloadHex
        });

        let pending: PendingTransaction;
        while ((pending = await generator.next())) {
          const transaction = pending.transaction;
          const txInputs = transaction.inputs;
          const utxoAddresses = txInputs.map((input) => input.utxo?.address?.toString());
          const isAllSourceUtxos = utxoAddresses.every((address) => address === sourceAddress || address === undefined);
          if (!isAllSourceUtxos) continue;

          const toSignInputs: ToSignInput[] = Array.from({ length: transaction.inputs.length }, (_, i) => {
            return { index: i, publicKey, sighashTypes: [1] };
          });
          const verifySig = addressType !== AddressType.KASPA_TANGEM_44_111111;
          const signedTx = await this.walletSignTransaction(keyring, transaction, toSignInputs, verifySig);
          await openapiService.checkAndSubmitTransaction({
            transaction: signedTx,
            allowOrphan: false
          });

          eventBus.emit(KASPA_EVENTS.sendToUI, {
            method: 'batchmintkrc20process',
            params: JSON.stringify({ successCount: 1, failedCount: 0 })
          });
          t++;

          await this.walletAddPendingTx(
            'sendkas',
            signedTx,
            Number(sompiToAmount(balance.toString(), 8)),
            sourceAddress,
            sourceAddress,
            redeemScript,
            1,
            toSignInputs
          );
        }
      } catch (e) {
        log.debug('Batch Mint Payload Error', e);
        eventBus.emit(KASPA_EVENTS.sendToUI, {
          method: 'batchmintkrc20process',
          params: JSON.stringify({ successCount: 0, failedCount: 1 })
        });
        await sleep(1000);
      }
    }
    openapiService.setBatchMintStatus(false);
  };

  /**
   * Build a Kaspa commitment-reveal script and derive its P2SH address.
   * Used by dApps via the `kasware.buildScript()` API for constructing
   * inscription transactions (KRC-20, KNS, KSPR KRC-721).
   *
   * The script follows the pattern:
   * `<pubkey> <checkSig> OP_FALSE OP_IF <protocolTag> <0_i64> <data> OP_ENDIF`
   *
   * @param params.type - The inscription protocol type (KRC20, KNS, or KSPR_KRC721)
   * @param params.data - The inscription payload string (e.g. JSON for KRC-20 mint/send)
   * @returns An object containing:
   *   - `script`: The hex-encoded Kaspa script string
   *   - `p2shAddress`: The pay-to-script-hash address derived from the script,
   *     used as the output address in the commit transaction
   * @throws Error if no current account or keyring is found
   */
  buildScript = async ({ type, data }: { type: BuildScriptType; data: string }) => {
    const account = await this.getCurrentAccount();
    if (!account) throw new Error('no current account');
    const keyring = await this.getCurrentKeyring();
    if (!keyring) throw new Error('no current keyring');
    const addressType = keyring.addressType;
    const script = walletBuildScript({ type, data, pubkey: account.pubkey, addressType });

    const p2shAddress = this.getP2shAddressFromScriptBuilder(script);
    return { script, p2shAddress };
  };
  // priorityFee: kas unit
  signKRC20Tx = async (
    inscribeJsonString: string,
    txType: TxType,
    priorityFee = 0,
    protocol = KASPLEX as TProtocol,
    feeRate?: number
  ) => {
    try {
      const account = await this.getCurrentAccount();
      if (!account) throw new Error('no current account');
      const keyring = await this.getCurrentKeyring();
      if (!keyring) throw new Error('no current keyring');
      const sourceAddress = account.address;
      const networkId = preferenceService.getNetworkId();

      eventBus.emit(KASPA_EVENTS.sendToUI, {
        method: 'signkrc20process',
        params: JSON.stringify({ percent: 10, msg: 'preparing...' })
      });

      // Calculate the total value needed in the commit tx output
      const requiredProtocolFee = kaspaToSompi(getRequireProtocolFee(txType)) as bigint;
      const miniValue = kaspaToSompi(COMMIT_AMOUNT) as bigint;
      // priorityFee (derived from feeRate at UI layer) covers the reveal tx mining fee
      const value = requiredProtocolFee + miniValue;

      // Build script via ScriptBuilder and derive P2SH address
      let scriptType: BuildScriptType;
      if (protocol === 'kns') {
        scriptType = BuildScriptType.KNS;
      } else if (protocol === 'kspr') {
        scriptType = BuildScriptType.KSPR_KRC721;
      } else if (protocol === 'kasplex') {
        scriptType = BuildScriptType.KRC20;
      } else {
        throw new Error(`Unsupported protocol: ${protocol}`);
      }
      const script = walletBuildScript({
        type: scriptType,
        data: inscribeJsonString,
        pubkey: account.pubkey,
        addressType: keyring.addressType
      });
      const p2shAddress = this.getP2shAddressFromScriptBuilder(script, networkId);
      if (!p2shAddress) throw new Error('Failed to derive P2SH address from script');

      eventBus.emit(KASPA_EVENTS.sendToUI, {
        method: 'signkrc20process',
        params: JSON.stringify({ percent: 20, msg: 'constructing...' })
      });

      // Get UTXO entries for the source address
      const entries = await openapiService.getKASUtxoEntryReferences([sourceAddress]);

      // Commit phase
      eventBus.emit(KASPA_EVENTS.sendToUI, {
        method: 'signkrc20process',
        params: JSON.stringify({ percent: 30, msg: 'commit tx: submitting...' })
      });
      const sompiValue = Number(sompiToAmount(value.toString(), 8));
      const commitIds = await this.submitCommit({
        priorityEntries: [],
        entries: entries as unknown as IUtxoEntryJson[],
        outputs: [{ address: p2shAddress, amount: sompiValue }],
        changeAddress: sourceAddress,
        priorityFee,
        feeRate,
        networkId,
        script
      });
      const commitId = commitIds[0] || '';

      eventBus.emit(KASPA_EVENTS.sendToUI, {
        method: 'signkrc20process',
        params: JSON.stringify({ percent: 40, msg: 'commit tx: submitted, waiting for confirmation...' })
      });

      // Poll for commit UTXOs - either blockDaaScore > 0 (accepted) or totalValue sufficient
      let checkRevealUtxosEntries = await openapiService.getKASUtxoEntryReferences([p2shAddress]);
      let commitAddressTotalValue = checkRevealUtxosEntries.reduce((agg, curr) => curr.amount + agg, BigInt(0));
      const hasAcceptedUtxo = () => checkRevealUtxosEntries.some((u) => u.blockDaaScore > BigInt(0));
      const hasSufficientValue = () => commitAddressTotalValue >= value;
      const COMMIT_UTXO_POLL_MAX_RETRIES = 120;
      let retries = 0;
      while (checkRevealUtxosEntries.length === 0 || !(hasAcceptedUtxo() || hasSufficientValue())) {
        if (++retries > COMMIT_UTXO_POLL_MAX_RETRIES) {
          throw new Error('Commit UTXOs not confirmed within timeout (2 minutes).');
        }
        await sleep(1000);
        checkRevealUtxosEntries = await openapiService.getKASUtxoEntryReferences([p2shAddress]);
        commitAddressTotalValue = checkRevealUtxosEntries.reduce((agg, curr) => curr.amount + agg, BigInt(0));
      }

      // NOTE: must use Number() (not toString()) — UtxoEntries constructor requires numeric amount fields
      const jsonEntries = JSON.parse(
        JSON.stringify(checkRevealUtxosEntries, (key, val) => (typeof val === 'bigint' ? Number(val) : val))
      );

      // Reveal phase
      eventBus.emit(KASPA_EVENTS.sendToUI, {
        method: 'signkrc20process',
        params: JSON.stringify({ percent: 50, msg: 'reveal tx: submitting...' })
      });

      const revealIds = await this.submitReveal({
        priorityEntries: [],
        entries: jsonEntries,
        outputs: [],
        changeAddress: sourceAddress,
        priorityFee: Number(sompiToAmount(requiredProtocolFee.toString(), 8)),
        feeRate,
        networkId,
        script
      });

      eventBus.emit(KASPA_EVENTS.sendToUI, {
        method: 'signkrc20process',
        params: JSON.stringify({ percent: 100, msg: 'reveal tx: successful' })
      });

      const result = {
        commitId,
        revealId: revealIds[0] || '',
        commitTxStr: '',
        revealTxStr: ''
      };
      return JSON.stringify(result);
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      } else {
        throw new Error(JSON.stringify(e));
      }
    }
  };

  findP2shUtxos = async (inscribeJsonStrings: string[]) => {
    try {
      const account = await this.getCurrentAccount();
      if (!account) throw new Error('no current account');
      const keyring = await this.getCurrentKeyring();
      if (!keyring) throw new Error('no current keyring');
      const addressType = keyring?.addressType;
      const publicKey = account.pubkey;
      const list: string[] = [];
      for (const inscribeJsonString of inscribeJsonStrings) {
        if (!list.includes(inscribeJsonString)) list.push(inscribeJsonString);
      }

      const commitAddressesMap = this.getCommitAddresses(list, publicKey, addressType);
      const keys = commitAddressesMap.keys();
      const commitAddresses = [...keys];
      const utxos = await openapiService.getKASUtxoEntryReferences(commitAddresses);
      const kasUtxos = utxos;

      if (kasUtxos.length == 0) return [];
      const result: IP2shOutput[] = [];
      for (let i = 0; i < kasUtxos.length; i++) {
        const obj = commitAddressesMap.get(kasUtxos[i].entry.address?.toString() || '');
        const res = JSON.stringify(kasUtxos[i], (key, value) => (typeof value === 'bigint' ? Number(value) : value));
        const utxoJson = JSON.parse(res);
        result.push({
          transaction_id: kasUtxos[i].entry.outpoint.transactionId,
          utxoJson,
          utxo_index: kasUtxos[i].entry.outpoint.index,
          script_public_key: kasUtxos[i].entry.scriptPublicKey.script,
          commitAddress: kasUtxos[i].entry.address?.toString() || '',
          balance: kasUtxos[i].entry.amount.toString(),
          inscribeJsonString: obj?.inscribeJsonString as string,
          redeemScript: obj?.redeemScript as string,
          scriptPublicKey: obj?.scriptPublicKey as string
        });
      }
      return result;
    } catch (e) {
      throw new Error((e as Error).message);
    }
  };
  getCommitAddresses = (inscribeJsonStrings: string[], publicKey: string, addressType: AddressType) => {
    try {
      const networkId = preferenceService.getNetworkId();
      return getCommitAddressesPure(inscribeJsonStrings, publicKey, addressType, networkId);
    } catch (e) {
      throw new Error((e as Error).message);
    }
  };
  getP2shAddress = (inscribeJsonString: string, publicKey: string, addressType: AddressType) => {
    try {
      const networkId = preferenceService.getNetworkId();
      return getP2shAddressPure(inscribeJsonString, publicKey, addressType, networkId);
    } catch (e) {
      throw new Error((e as Error).message);
    }
  };

  retrieveP2shUtxo = async (p2shOutputs: IP2shOutput[]) => {
    const revealResults: string[] = [];
    const networkId = preferenceService.getNetworkId();
    const account = await this.getCurrentAccount();
    if (!account) throw new Error('no current account');
    const currentAddress = account.address;
    const keyring = await this.getCurrentKeyring();
    if (!keyring) throw new Error('no current keyring');
    // const addressType = keyring?.addressType;
    const publicKey = account.pubkey;
    const scriptPubKey = payToAddressScript(account.address);
    let currentUtxos = await openapiService.rpc.getUtxosByAddresses([currentAddress]);
    if (currentUtxos.entries.length == 0) throw new Error('your kas balance is 0');
    let txs = currentUtxos.entries.map((utxo) => utxo.entry.outpoint.transactionId);
    for (let i = 0; i < p2shOutputs.length; i++) {
      let whileCount = 0;
      if (revealResults.length > 0) {
        while (!txs.includes(revealResults[revealResults.length - 1])) {
          whileCount += 1;
          if (whileCount > 50) throw new Error('timeout, please try again');
          await sleep(1000);
          currentUtxos = await openapiService.rpc.getUtxosByAddresses([currentAddress]);
          txs = currentUtxos.entries.map((utxo) => utxo.entry.outpoint.transactionId);
        }
      }
      const revealUtxoEntries = new UtxoEntries([p2shOutputs[i].utxoJson])?.items;
      const inputEntries = [currentUtxos.entries[0], revealUtxoEntries[0]];
      const { inputs, totalValue: value } = utxoEntryToTransactionInputs(inputEntries);
      const lowFeeRate = await openapiService.getLowFeeRate();
      const generator = await estimateTransactions({
        entries: inputEntries,
        feeRate: lowFeeRate,
        changeAddress: currentAddress,
        networkId
      } as IGeneratorSettingsObject);
      const redeemScript = p2shOutputs[i].redeemScript;
      const txFee =
        generator.fees +
        (BigInt(redeemScript.length) / BigInt(2) + BigInt(4)) *
          BigInt(inputEntries.length - 1) *
          BigInt(lowFeeRate.toFixed());
      log.debug('txFee', txFee);
      const finaloutputs = [new TransactionOutput(value - txFee, scriptPubKey)];
      let revealTransaction = this.newTransaction(inputs, finaloutputs);
      checkTransactionSum(revealTransaction, txFee);
      const toSignInputs2: ToSignInput[] = Array.from({ length: revealTransaction.inputs.length }, (_, i) => {
        return { index: i, publicKey, sighashTypes: [1] };
      });
      const signScriptIndexes: number[] = [];
      for (let i = 1; i < revealTransaction.inputs.length; i++) {
        signScriptIndexes.push(i);
      }
      revealTransaction = await this.signRevealTransaction(
        keyring,
        revealTransaction,
        toSignInputs2,
        false,
        redeemScript,
        signScriptIndexes
      );
      const revealResult = await openapiService.checkAndSubmitTransaction({
        transaction: revealTransaction,
        allowOrphan: false
      });
      revealResults.push(revealResult.transactionId);

      const sendAmount = Number(sompiToAmount(inputEntries[1].amount, 8));
      const motherAddress = account.address?.toString() as string;
      const sourceAddress = inputEntries[0].address?.toString() as string;
      await this.walletAddPendingTx(
        'retrieve',
        revealTransaction,
        sendAmount,
        motherAddress,
        sourceAddress,
        redeemScript,
        0,
        toSignInputs2
      );
    }
    return revealResults;
  };
  onSearchAndRetrieve = async (inscribeJsonStrings: string[]) => {
    try {
      const account = await this.getCurrentAccount();
      if (!account) throw new Error('no current account');
      const sourceAddress = account.address;
      const networkId = this.getNetworkId();
      log.debug('start search and retrieve...');
      await sleep(10000);
      const utxos: IP2shOutput[] = await this.findP2shUtxos(inscribeJsonStrings);
      if (utxos.length > 0) {
        const results = await this.retrieveP2shUtxo(utxos);
        log.debug('utxos and retrieve result', results);
      } else {
        log.debug('No UTXOs found for retrieve.');
      }
      await sleep(5000);
      const jsonStrs2 = preferenceService.getKrc20History(networkId, sourceAddress);
      const utxos2: IP2shOutput[] = await this.findP2shUtxos(jsonStrs2);
      if (utxos2.length > 0) {
        const results = await this.retrieveP2shUtxo(utxos2);
        log.debug('second utxos and retrieve result', results);
      } else {
        log.debug('No UTXOs found for second retrieve.');
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        log.debug(e.message);
      } else {
        log.debug('Caught an unexpected error:', e);
      }
    }
  };

  getToSignInputs = (account: Account) => {
    return getToSignInputsUtil(account);
  };

  /**
   * Batch transfer using payload mode (no commit/reveal split).
   * Directly sends KRC20 transfer operation embedded in transaction payload.
   */
  krc20BatchTransfer = async (orders: IBatchTransfer[], priorityFee = 0) => {
    if (orders.length <= 0) throw new Error('no items detected');
    const orderStrs = orders.map((order) => JSON.stringify(order));
    if (new Set(orderStrs).size !== orderStrs.length) throw new Error('duplicate items detected');
    const successResults: IBatchTransferResult[] = [];
    let errorResults = '';
    openapiService.setBatchMintStatus(true);
    const networkId = preferenceService.getNetworkId();
    const keyring = await this.getCurrentKeyring();
    if (!keyring) throw new Error('no current keyring');
    const account = await this.getCurrentAccount();
    if (!account) throw new Error('no current account');
    const sourceAddress = account.address;
    const publicKey = account.pubkey;
    const addressType = keyring.addressType;
    const priorityFeeSompi = priorityFee > 0 ? (kaspaToSompi(priorityFee.toString()) as bigint) : BigInt(0);
    const feeRate = await openapiService.getLowFeeRate();
    const listLength = 5;
    const utxoEntries = await openapiService.getKASUtxoEntryReferences([sourceAddress]);
    const totalBalanceSompi = utxoEntries.reduce((agg, curr) => {
      return curr.amount + agg;
    }, BigInt(0));
    if (totalBalanceSompi < (kaspaToSompi('30') as bigint)) throw new Error('balance needs to be at least 30 KAS');
    const groupList = chunkArray(orders, listLength);
    let progress = 0;
    let allUtxoIds = utxoEntries.map((entry) => entry.outpoint.transactionId);
    const tickDecs = new Map<string, IToken>();
    for (let j = 0; j < groupList.length; j++) {
      progress = j;
      const list = groupList[j];
      try {
        const rpcStatus = await this.getRpcStatus();
        if (rpcStatus == false) {
          console.error('network disconnected');
          openapiService.setBatchMintStatus(false);
          throw new Error('network disconnected');
        }
        const batchMintStatus = openapiService.getBatchMintStatus();
        if (!batchMintStatus) throw new Error('batch transfer cancelled');
        const currentNetworkId = preferenceService.getNetworkId();
        if (currentNetworkId !== networkId) {
          console.error('error: network type changed');
          openapiService.setBatchMintStatus(false);
          throw new Error('network type changed');
        }
        const currentAccount = await this.getCurrentAccount();
        if (!currentAccount) throw new Error('account changed');
        if (currentAccount.address !== sourceAddress) {
          openapiService.setBatchMintStatus(false);
          throw new Error('account changed');
        }

        // Pre-resolve decimals for all orders in this batch
        for (const addr of list) {
          if (!tickDecs.has(addr.tick)) {
            if (addr.dec) {
              tickDecs.set(addr.tick, { tick: addr.tick, decimals: addr.dec });
            } else {
              const decimal = await openapiService.getDecimal(addr.tick);
              tickDecs.set(addr.tick, { tick: addr.tick, decimals: decimal });
            }
          }
        }

        // Build and submit payload transactions sequentially to avoid UTXO double-spend
        const settledResults: PromiseSettledResult<{ txId: string }>[] = [];
        const spentUtxoIds = new Set<string>();
        for (let k = 0; k < list.length; k++) {
          const addr = list[k];
          try {
            const dec = tickDecs.get(addr.tick)?.decimals;
            const inscribeJsonString = constructKRC20TransferJsonStrLowerCase(
              addr.tick,
              addr.amount,
              addr.to,
              dec ?? '8'
            );
            preferenceService.updateKrc20History(networkId, sourceAddress, inscribeJsonString);
            const payloadHex = Buffer.from(inscribeJsonString).toString('hex');

            // Fetch fresh UTXOs and exclude ones already spent in this batch round
            const freshEntries = await openapiService.getKASUtxoEntryReferences([sourceAddress]);
            const entriesForTx = freshEntries.filter(
              (entry) => !spentUtxoIds.has(`${entry.outpoint.transactionId}:${entry.outpoint.index}`)
            );
            if (entriesForTx.length === 0) throw new Error('no available UTXOs for this transaction');

            const generator = new Generator({
              entries: entriesForTx,
              outputs: [],
              priorityFee: priorityFeeSompi,
              feeRate,
              changeAddress: sourceAddress,
              networkId,
              payload: payloadHex
            });

            let pending: PendingTransaction;
            let submitted = false;
            while ((pending = await generator.next())) {
              const transaction = pending.transaction;
              const txInputs = transaction.inputs;
              const utxoAddresses = txInputs.map((input) => input.utxo?.address?.toString());
              const isAllSourceUtxos = utxoAddresses.every(
                (address) => address === sourceAddress || address === undefined
              );
              if (!isAllSourceUtxos) continue;

              const toSignInputs: ToSignInput[] = Array.from({ length: transaction.inputs.length }, (_, i) => {
                return { index: i, publicKey, sighashTypes: [1] };
              });
              const verifySig = addressType !== AddressType.KASPA_TANGEM_44_111111;
              const signedTx = await this.walletSignTransaction(keyring, transaction, toSignInputs, verifySig);
              const submitResult = await openapiService.checkAndSubmitTransaction({
                transaction: signedTx,
                allowOrphan: false
              });

              // Track spent input UTXOs so subsequent transactions don't reuse them
              for (const input of transaction.inputs) {
                const outpoint = input.utxo?.entry?.outpoint;
                if (outpoint) spentUtxoIds.add(`${outpoint.transactionId}:${outpoint.index}`);
              }

              await this.walletAddPendingTx(
                'sendkas',
                signedTx,
                Number(sompiToAmount(pending.feeAmount, 8)),
                sourceAddress,
                sourceAddress,
                '',
                1,
                toSignInputs
              );

              settledResults.push({
                status: 'fulfilled',
                value: { txId: submitResult.transactionId } //{ commitId: submitResult.transactionId, revealId: submitResult.transactionId, commitTxStr: '', revealTxStr: '' }
              });
              submitted = true;
              break;
            }
            if (!submitted) throw new Error('failed to generate payload transaction');
          } catch (e) {
            settledResults.push({ status: 'rejected', reason: e });
          }
        }

        const resultsIds = settledResults;
        // Build result news for UI broadcast
        let resultNews = getKRC20BatchTransferResults(resultsIds, list);
        resultNews = resultNews.map((item) => {
          item.index = j * listLength + item.index;
          return item;
        });
        sessionService.broadcastEvent('krc20BatchTransferChanged', resultNews);

        const successfulPromises = resultsIds.filter((p) => p.status === 'fulfilled');
        if (successfulPromises.length === list.length) {
          // Collect successful results into successResults
          const successItems = resultNews.filter((r) => r.status === 'success');
          successResults.push(...successItems);

          list.forEach((item) => {
            const jsonString = constructKRC20TransferJsonStrLowerCase(
              item.tick,
              item.amount,
              item.to,
              item?.dec ?? '8'
            );
            preferenceService.removeKrc20History(networkId, sourceAddress, jsonString);
          });

          // Wait for new UTXOs to appear for the next batch round
          let newUtxoEntries = await openapiService.getKASUtxoEntryReferences([sourceAddress]);
          let newTxs = newUtxoEntries.filter((utxo) => !allUtxoIds.includes(utxo.entry.outpoint.transactionId));
          let waitTimes = 0;
          while (newTxs.length < list.length) {
            waitTimes++;
            if (waitTimes > 120) throw new Error('time out: cannot find payload tx');
            await sleep(1000);
            log.debug('try to find payload tx');
            const currentBatchMintStatus = openapiService.getBatchMintStatus();
            if (!currentBatchMintStatus) throw new Error('batch transfer cancelled');
            newUtxoEntries = await openapiService.getKASUtxoEntryReferences([sourceAddress]);
            newTxs = newUtxoEntries.filter((utxo) => !allUtxoIds.includes(utxo.entry.outpoint.transactionId));
          }
          allUtxoIds = newUtxoEntries.map((entry) => entry.outpoint.transactionId);
        } else {
          const errors = resultsIds
            .filter((p) => p.status === 'rejected')
            .map((p) => p.reason)
            .join(',');
          console.error(errors);
          const errorJsonStrings: string[] = [];
          this.onSearchAndRetrieve(errorJsonStrings);
          openapiService.setBatchMintStatus(false);
          errorResults = errors;
          break;
        }
      } catch (e) {
        const errorJsonStrings: string[] = [];
        this.onSearchAndRetrieve(errorJsonStrings);
        openapiService.setBatchMintStatus(false);
        throw new Error((e as Error).message);
      }
    }
    if (progress === groupList.length - 1) {
      return JSON.stringify({ successResults });
    } else {
      return JSON.stringify({ errorResults });
    }
  };

  /**
   * @description list op
   * @param tick
   * @param krc20Amount
   * @param priorityFee
   * @returns output utxo
   */
  signKRC20ListTx = async (tick: string, krc20Amount: number, priorityFee = 0) => {
    const decimal = await openapiService.getDecimal(tick);
    const listJsonString = constructKRC20ListJsonStrLowerCase(tick, krc20Amount, decimal);
    const account = await this.getCurrentAccount();
    if (!account) throw new Error('no current account');
    const keyring = await this.getCurrentKeyring();
    if (!keyring) throw new Error('no current keyring');
    const networkId = preferenceService.getNetworkId();
    const publicKey = account.pubkey;
    const addresses = [account.address];

    const addressType = keyring.addressType;
    const utxos = await openapiService.getUtxosByAddresses(addresses);
    const balanceSompi =
      utxos.entries.reduce((agg, curr) => {
        return curr.amount + agg;
      }, BigInt(0)) || BigInt(0);
    const balanceAmount = Number(sompiToAmount(balanceSompi, 8));
    const miniRequiredAmount = 5 + 2 * Number(priorityFee);
    if (balanceAmount < miniRequiredAmount) throw new Error(`KAS balance is less than ${miniRequiredAmount}`);

    const fourDigitNumber = getRandomFourDigitNumberWithoutZero();
    // Increased from 1 to 2 KAS to ensure sufficient commit value for KRC20 protocol fees
    const value = (kaspaToSompi('2') as bigint) + BigInt(fourDigitNumber);

    const { redeemScript, commitAddress } = this.getScriptInfo(listJsonString, publicKey, addressType, networkId);
    const lowFeeRate = await openapiService.getLowFeeRate();
    const generator = new Generator({
      entries: utxos.entries,
      outputs: [{ address: commitAddress, amount: value }],
      feeRate: lowFeeRate,
      priorityFee: priorityFee ? kaspaToSompi(priorityFee.toString()) : BigInt(0),
      changeAddress: account.address,
      networkId
    });

    let pending: PendingTransaction;
    while ((pending = await generator.next())) {
      const transaction = pending.transaction;
      const toSignInputs2: ToSignInput[] = Array.from({ length: transaction.inputs.length }, (_, i) => {
        return { index: i, publicKey, sighashTypes: [1] };
      });
      const verifySig = addressType !== AddressType.KASPA_TANGEM_44_111111;
      const signedTx = await this.walletSignTransaction(keyring, transaction, toSignInputs2, verifySig);
      await openapiService.checkAndSubmitTransaction({
        transaction: signedTx,
        allowOrphan: false
      });

      await this.walletAddPendingTx(
        'commit',
        signedTx,
        Number(sompiToAmount(value, 8)),
        account.address,
        account.address,
        redeemScript,
        1,
        toSignInputs2
      );
    }

    //reveal tx
    let checkRevealUtxosEntries = await openapiService.getKASUtxoEntryReferences([commitAddress]);
    let targetRevealUtxosEntries = checkRevealUtxosEntries.filter((utxo) => utxo.entry.amount == value);
    let hasAcceptedUtxo = targetRevealUtxosEntries.some((u) => u.blockDaaScore > BigInt(0));
    while (!(checkRevealUtxosEntries.length > 0 && targetRevealUtxosEntries.length > 0 && hasAcceptedUtxo)) {
      await sleep(1000);
      checkRevealUtxosEntries = await openapiService.getKASUtxoEntryReferences([commitAddress]);
      targetRevealUtxosEntries = checkRevealUtxosEntries.filter((utxo) => utxo.entry.amount == value);
      hasAcceptedUtxo = targetRevealUtxosEntries.some((u) => u.blockDaaScore > BigInt(0));
    }
    const sendJsonString = constructKRC20SendJsonStrLowerCase(tick);

    const { commitAddress: sendCommitAddress } = this.getScriptInfo(sendJsonString, publicKey, addressType, networkId);

    const motherUtxosEntries = await openapiService.getKASUtxoEntryReferences([account.address]);
    const { transactions: revealTransactions } = await createTransactions({
      priorityEntries: [targetRevealUtxosEntries[0]],
      entries: motherUtxosEntries,
      outputs: [{ address: sendCommitAddress, amount: value }],
      feeRate: lowFeeRate,
      changeAddress: account.address,
      priorityFee: priorityFee ? (kaspaToSompi(priorityFee.toString()) as bigint) : BigInt(0),
      networkId: networkId
    });
    const results: { txId: string; amount: bigint }[] = [];
    for (const revealPendingTransaction of revealTransactions) {
      let tx = revealPendingTransaction.transaction;
      const toSignInputs2: ToSignInput[] = Array.from({ length: tx.inputs.length }, (_, i) => {
        return { index: i, publicKey, sighashTypes: [1] };
      });
      const additionalFee =
        (BigInt(redeemScript.length) / BigInt(2) + BigInt(4)) *
        BigInt(tx.inputs.length - 1) *
        BigInt(lowFeeRate.toFixed());
      tx.outputs[1].value = tx.outputs[1].value - additionalFee;
      const fee = revealPendingTransaction.feeAmount;
      tx = this.newTransaction(tx.inputs, tx.outputs);
      checkTransactionSum(tx, fee + additionalFee);
      const txId = targetRevealUtxosEntries[0].entry.outpoint.transactionId;
      const txIndex = targetRevealUtxosEntries[0].entry.outpoint.index;
      const signScriptIndexes: number[] = [];
      for (let i = 0; i < tx.inputs.length; i++) {
        if (tx.inputs[i].utxo?.outpoint.transactionId == txId && tx.inputs[i].utxo?.outpoint.index == txIndex)
          signScriptIndexes.push(i);
      }
      const revealTx = await this.signRevealTransaction(
        keyring,
        tx,
        toSignInputs2,
        false,
        redeemScript,
        signScriptIndexes
      );
      const revealResult = await openapiService.checkAndSubmitTransaction({
        transaction: revealTx,
        allowOrphan: false
      });
      log.debug('reveal tx Result: ', revealResult);
      await this.walletAddPendingTx(
        'reveal',
        revealTx,
        Number(sompiToAmount(value, 8)),
        account.address,
        sendCommitAddress,
        redeemScript,
        1,
        toSignInputs2
      );
      results.push({ txId: revealResult.transactionId, amount: value });
    }
    log.debug('results: ', results);
    return results[0];
  };

  walletAddPendingTx = async (
    type: TPendingTxType,
    transaction: Transaction,
    amount: number,
    motherAddress: string,
    sourceAddress: string,
    redeemScript: string | Uint8Array<ArrayBuffer>,
    outputIndexOfFee = 1,
    toSignInputs: ToSignInput[]
  ) => {
    const txFee = getTxFeeFromTx(transaction);
    const txParam: ITxParam = {
      type,
      txFee,
      redeemScript,
      outputIndexOfFee,
      transaction: transaction.serializeToSafeJSON(),
      toSignInputs
    };

    const blueScore = await openapiService.getBlueScore();
    const commitInfo: ITxInfo = {
      motherAddress,
      sourceAddress,
      mode: type,
      isAccepted: false,
      status: 'submitted',
      amount: amount,
      usdValue: '0',
      txFee: txFee,
      block_time: new Date().getTime(),
      transaction_id: transaction.id,
      txDetail: {
        accepting_block_blue_score: blueScore
      }
    };
    eventBus.emit(KASPA_EVENTS.sendToUI, {
      method: 'pending-transaction-event',
      params: JSON.stringify({
        commitInfo: commitInfo
      })
    });
    openapiService.addPendingTxs(transaction.id, {
      txParam: txParam,
      txInfo: commitInfo
    });
  };
  getBlueScore = async () => {
    return openapiService.getBlueScore();
  };

  /**
   * Creates a KRC20 sell order on the marketplace.
   *
   * This method implements a two-phase KRC20 order creation process based on the Kasplex
   * inscription protocol:
   *
   * **Phase 1 - List inscription (commit-reveal):** Submits a KRC20 "list" operation
   * (`{"p":"krc-20","op":"list","tick":"...","amt":"..."}`) via commit-reveal transaction,
   * which locks the specified amount of KRC20 tokens for sale at the given KAS price.
   * See: https://docs-kasplex.gitbook.io/krc20/technical-overview/krc-20-ops/list
   *
   * **Phase 2 - Send PSKT construction:** After the list reveal UTXO is confirmed on-chain,
   * constructs a partially-signed Kaspa transaction (PSKT) containing a KRC20 "send" operation
   * (`{"p":"krc-20","op":"send","tick":"..."}`). The send op's first output is the KAS receiver
   * (payment to the seller), and the second output is the token receiver (KRC20 tokens to the buyer).
   * If the transaction has only one output, it is treated as an order cancellation.
   * See: https://docs-kasplex.gitbook.io/krc20/technical-overview/krc-20-ops/send
   *
   * The returned PSKT (`txJsonString`) is intended to be passed to {@link buyKRC20Token}
   * for a buyer to complete the purchase by adding their inputs and signature.
   *
   * @param krc20Tick - The KRC20 token ticker (4-6 characters, case-insensitive)
   * @param krc20Amount - The amount of KRC20 tokens to list for sale
   * @param kasAmount - The asking price in KAS for the listed tokens
   * @param psktExtraOutput - Optional additional outputs in the PSKT (e.g. 3rd party payment address and amount in KAS)
   * @param priorityFee - Optional priority fee in KAS for the list commit-reveal transaction (minimum 1 KAS tx fee required by protocol)
   * @returns An object containing:
   *   - `txJsonString` - The serialized PSKT JSON string for the send transaction, to be completed by a buyer via {@link buyKRC20Token}
   *   - `sendCommitTxId` - The transaction ID of the list reveal UTXO, serving as the on-chain identifier for this sell order
   * @throws {Error} If no current account or keyring is found
   */
  createKRC20Order = async ({
    krc20Tick,
    krc20Amount,
    kasAmount,
    psktExtraOutput,
    priorityFee
  }: {
    krc20Tick: string;
    krc20Amount: number;
    kasAmount: number;
    psktExtraOutput?: [{ address: string; amount: number }];
    priorityFee?: number;
  }) => {
    const { amount, txId } = await this.signKRC20ListTx(krc20Tick, krc20Amount, priorityFee);
    const account = await this.getCurrentAccount();
    if (!account) throw new Error('no current account');
    const keyring = await this.getCurrentKeyring();
    if (!keyring) throw new Error('no current keyring');
    const networkId = preferenceService.getNetworkId();
    const publicKey = account.pubkey;
    const addressType = keyring.addressType;
    const sendJsonString = constructKRC20SendJsonStrLowerCase(krc20Tick);
    const { commitAddress: sendCommitAddress } = this.getScriptInfo(sendJsonString, publicKey, addressType, networkId);

    //reveal tx
    let revealUtxos = await openapiService.getUtxosByAddresses([sendCommitAddress]);
    // why not txId of list op: rbf only impact changeAddress balance and txId
    let targetRevealUtxos = revealUtxos.entries.filter(
      // (utxo) => utxo.amount == amount && utxo.outpoint.transactionId === txId
      (utxo) => utxo.amount == amount
    );
    while (!(targetRevealUtxos.length > 0)) {
      log.debug('waiting for reveal tx for send op...');
      await sleep(2000);
      revealUtxos = await openapiService.getUtxosByAddresses([sendCommitAddress]);
      targetRevealUtxos = revealUtxos.entries.filter((utxo) => utxo.amount == amount);
    }

    const sendCommitTxId = targetRevealUtxos[0].outpoint.transactionId;

    const txJsonString = await this.constructKRC20PSKT({
      tick: krc20Tick,
      utxoEntries: targetRevealUtxos,
      // sendCommitTxId,
      kasAmount,
      extraOutput: psktExtraOutput
    });
    return { txJsonString, sendCommitTxId };
  };

  cancelKRC20Order = async ({
    krc20Tick,
    txJsonString,
    sendCommitTxId
  }: {
    krc20Tick: string;
    txJsonString?: string;
    sendCommitTxId?: string;
  }) => {
    if (!txJsonString && !sendCommitTxId) throw new Error('txJsonString or sendCommitTxId must be provided');
    const sendJsonStr = constructKRC20SendJsonStrLowerCase(krc20Tick);
    const utxoData: IP2shOutput[] = await this.findP2shUtxos([sendJsonStr]);

    let selectedUtxoData: IP2shOutput[] = [];
    if (txJsonString) {
      const pskt = Transaction.deserializeFromSafeJSON(txJsonString);
      if (!pskt) throw new Error('Failed to deserialize transaction from JSON');
      const inputUtxo = pskt.inputs[0].utxo;
      selectedUtxoData = utxoData.filter(
        (utxo) => inputUtxo && utxo.transaction_id === inputUtxo.outpoint.transactionId
      );
    } else if (sendCommitTxId) {
      selectedUtxoData = utxoData.filter((utxo) => utxo.transaction_id === sendCommitTxId);
    }

    if (selectedUtxoData.length === 0) {
      throw new Error('No UTXOs found for krc20 order.');
    }
    const results = await this.retrieveP2shUtxo(selectedUtxoData);
    log.debug('utxos and retrieve result', results);
    return results[0];
  };

  signCancelKRC20Order = async ({
    krc20Tick,
    txJsonString,
    sendCommitTxId
  }: {
    krc20Tick: string;
    txJsonString?: string;
    sendCommitTxId?: string;
  }) => {
    const networkId = preferenceService.getNetworkId();
    const account = await this.getCurrentAccount();
    if (!account) throw new Error('no current account');
    const currentAddress = account.address;
    const keyring = await this.getCurrentKeyring();
    if (!keyring) throw new Error('no current keyring');
    const publicKey = account.pubkey;
    const scriptPubKey = payToAddressScript(account.address);
    if (!txJsonString && !sendCommitTxId) throw new Error('txJsonString or sendCommitTxId must be provided');
    const sendJsonStr = constructKRC20SendJsonStrLowerCase(krc20Tick);
    const utxoData: IP2shOutput[] = await this.findP2shUtxos([sendJsonStr]);

    let selectedUtxoData: IP2shOutput[] = [];
    if (txJsonString) {
      const pskt = Transaction.deserializeFromSafeJSON(txJsonString);
      if (!pskt) throw new Error('Failed to deserialize transaction from JSON');
      const inputUtxo = pskt.inputs[0].utxo;
      selectedUtxoData = utxoData.filter(
        (utxo) => inputUtxo && utxo.transaction_id === inputUtxo.outpoint.transactionId
      );
    } else if (sendCommitTxId) {
      selectedUtxoData = utxoData.filter((utxo) => utxo.transaction_id === sendCommitTxId);
    }

    if (selectedUtxoData.length === 0) {
      throw new Error('No UTXOs found for krc20 order.');
    }
    const revealUtxoEntries = new UtxoEntries([selectedUtxoData[0].utxoJson])?.items;
    const currentUtxos = await openapiService.rpc.getUtxosByAddresses([currentAddress]);
    if (currentUtxos.entries.length == 0) throw new Error('your kas balance is 0');
    const inputEntries = [currentUtxos.entries[0], revealUtxoEntries[0]];
    const { inputs, totalValue: value } = utxoEntryToTransactionInputs(inputEntries);
    const lowFeeRate = await openapiService.getLowFeeRate();
    const generator = await estimateTransactions({
      entries: inputEntries,
      feeRate: lowFeeRate,
      changeAddress: currentAddress,
      networkId
    } as IGeneratorSettingsObject);
    const redeemScript = selectedUtxoData[0].redeemScript;
    const txFee =
      generator.fees +
      (BigInt(redeemScript.length) / BigInt(2) + BigInt(4)) *
        BigInt(inputEntries.length - 1) *
        BigInt(lowFeeRate.toFixed());
    log.debug('txFee', txFee);
    const finaloutputs = [new TransactionOutput(value - txFee, scriptPubKey)];
    let revealTransaction = this.newTransaction(inputs, finaloutputs);
    checkTransactionSum(revealTransaction, txFee);
    const toSignInputs2: ToSignInput[] = Array.from({ length: revealTransaction.inputs.length }, (_, i) => {
      return { index: i, publicKey, sighashTypes: [1] };
    });
    const signScriptIndexes: number[] = [];
    for (let i = 1; i < revealTransaction.inputs.length; i++) {
      signScriptIndexes.push(i);
    }
    revealTransaction = await this.signRevealTransaction(
      keyring,
      revealTransaction,
      toSignInputs2,
      false,
      redeemScript,
      signScriptIndexes
    );
    return revealTransaction.serializeToSafeJSON();
  };

  // TODO: feeRate
  constructKRC20PSKT = async ({
    tick,
    utxoEntries,
    // sendCommitTxId,
    kasAmount,
    extraOutput
  }: {
    tick: string;
    utxoEntries: UtxoEntryReference[];
    // sendCommitTxId: string;
    kasAmount: number;
    extraOutput?: [{ address: string; amount: number }];
  }) => {
    const account = await this.getCurrentAccount();
    if (!account) throw new Error('no current account');
    const keyring = await this.getCurrentKeyring();
    if (!keyring) throw new Error('no current keyring');
    const publicKey = account.pubkey;
    const addressType = keyring.addressType;

    const sendJsonString = constructKRC20SendJsonStrLowerCase(tick);
    const redeemScript = walletGetRedeemScript00(sendJsonString, publicKey, addressType);

    const revealInputs = utxoEntries.map((utxo) => {
      return new TransactionInput({
        previousOutpoint: utxo.entry.outpoint,
        signatureScript: '',
        // sequence: BigInt(0xFFFFFFFFFFFFFFFFn),
        sequence: BigInt(0),
        sigOpCount: 1,
        computeBudget: 0,
        utxo
      });
    });
    const psktInputAmount =
      utxoEntries.reduce((agg, curr) => {
        return curr.amount + agg;
      }, BigInt(0)) || BigInt(0);

    // const outputs1: TransactionOutput[] = [];
    // const outputs1Value = BigInt(0);
    // const outputs1Value = this.getKRC20TradeFee(Number(kasAmount));
    // if (outputs1Value > BigInt(0))
    //   outputs1 = [new TransactionOutput(outputs1Value, payToAddressScript(getKRC20TradeAddress(networkId)))];

    const outputs0Value = psktInputAmount + (kaspaToSompi(kasAmount.toString()) as bigint);
    const outputs0 = [new TransactionOutput(outputs0Value, payToAddressScript(account.address))];

    // const revealOutputs = [
    //   new TransactionOutput(
    //     psktInputAmount + (kaspaToSompi(kasAmount.toString()) as bigint) - outputs2Value,
    //     payToAddressScript(account.address)
    //   )
    // ];

    const outputs2: TransactionOutput[] = [];
    // let outputs2Value = BigInt(0);
    if (extraOutput && extraOutput.length > 0) {
      extraOutput.forEach((item) => {
        // outputs2Value += kaspaToSompi(item.amount.toString()) as bigint;
        outputs2.push(
          new TransactionOutput(kaspaToSompi(item.amount.toString()) as bigint, payToAddressScript(item.address))
        );
      });
    }
    const revealOutputs = [...outputs0, ...outputs2];
    const revealTransaction = this.newTransaction(revealInputs, revealOutputs);
    const toSignInputs2: ToSignInput[] = Array.from({ length: revealTransaction.inputs.length }, (_, i) => {
      return { index: i, publicKey, sighashTypes: [132] };
    });
    const signScriptIndexes: number[] = [];
    for (let i = 0; i < revealTransaction.inputs.length; i++) {
      signScriptIndexes.push(i);
    }
    const revealTx = await this.signRevealTransaction(
      keyring,
      revealTransaction,
      toSignInputs2,
      false,
      redeemScript,
      signScriptIndexes
    );
    return revealTx.serializeToSafeJSON();
  };
  /**
   * Prepares a partially-signed Kaspa transaction (PSKT) for buying a KRC20 token.
   *
   * Merges the seller's inputs from the provided PSKT with the buyer's UTXOs,
   * calculates the change output and network fee, then assembles the full
   * transaction and returns the data needed for the buyer to sign their inputs.
   *
   * @param txJsonString - JSON-serialized PSKT from the seller (contains seller inputs and KRC20 receive output)
   * @param extraOutput - Optional additional outputs (e.g. 3rd party payment address and amount in KAS)
   * @param priorityFee - Optional priority fee in KAS (converted to sompi internally)
   * @returns Object containing the assembled PSKT, inputs to sign, keyring, cost amount, and current account
   * @throws {Error} If no current account or keyring is found
   *
   * The JSON data MUST enforce byte-level consistency and MUST follow these rules:
   * - All key-value pairs MUST use a fixed order ( p , op , tick );
   * - All characters MUST be lowercase;
   * - Whitespace characters are not permitted;
   * - Duplicate keys are not permitted;
   * - Unknown fields are not permitted.
   * The transaction’s first output serves as the KAS receiver.
   * The transaction’s second output serves as the Token receiver.
   * If the transaction has only one output, it will be treated as an order cancellation.
   */
  private prepareBuyKRC20TokenTx = async ({
    txJsonString,
    extraOutput,
    priorityFee
  }: {
    txJsonString: string;
    extraOutput?: [{ address: string; amount: number }];
    priorityFee?: number;
  }) => {
    const networkId = preferenceService.getNetworkId();
    const account = await this.getCurrentAccount();
    if (!account) throw new Error('no current account');
    const keyring = await this.getCurrentKeyring();
    if (!keyring) throw new Error('no current keyring');
    const publicKey = account.pubkey;
    const pskt = Transaction.deserializeFromSafeJSON(txJsonString) as Transaction;
    const inputsOfSeller = pskt.inputs;
    const inputs0Value =
      inputsOfSeller.reduce((agg, curr) => {
        return ((curr.utxo?.amount as bigint) || BigInt(0)) + agg;
      }, BigInt(0)) || BigInt(0);

    const utxos = await openapiService.getUtxosByAddresses([account.address]);

    let inputs1Value = BigInt(0);
    const buyerEntries = utxos.entries;
    const inputsOfBuyer = buyerEntries.map((utxo, sequence) => {
      inputs1Value += utxo.amount;
      return new TransactionInput({
        previousOutpoint: utxo.entry.outpoint,
        signatureScript: '',
        sequence: BigInt(sequence + 1),
        sigOpCount: 1,
        utxo
      });
    });
    pskt.inputs = [...inputsOfSeller, ...inputsOfBuyer];
    // receive krc20 and change tx
    const outputs0 = [pskt.outputs[0]];
    const outputs0Value = pskt.outputs[0].value;
    const priorityFeeSompi = priorityFee ? (kaspaToSompi(priorityFee.toString()) as bigint) : BigInt(0);

    let outputs2: (ITransactionOutput | TransactionOutput)[] = [];
    if (pskt.outputs.length > 1) outputs2 = pskt.outputs.slice(1, pskt.outputs.length);
    const outputs2Value = outputs2?.reduce((agg, curr) => {
      return curr?.value + agg;
    }, BigInt(0));

    let outputs3: (ITransactionOutput | TransactionOutput)[] = [];
    if (extraOutput && extraOutput.length > 0)
      outputs3 = extraOutput.map((output) => {
        const amountSompi = kaspaToSompi(output.amount.toString()) as bigint;
        return new TransactionOutput(amountSompi, payToAddressScript(output.address));
      });
    const outputs3Value = outputs3?.reduce((agg, curr) => {
      return curr?.value + agg;
    }, BigInt(0));

    const outputs1Value =
      inputs0Value + inputs1Value - outputs0Value - outputs2Value - outputs3Value - priorityFeeSompi;

    const outputs1 = [new TransactionOutput(outputs1Value, payToAddressScript(account.address))];

    pskt.outputs = [...outputs0, ...outputs1, ...outputs2, ...outputs3];

    // Convert non-change outputs to Generator-compatible format (address + amount)
    const generatorOutputs: { address: string; amount: bigint }[] = [];
    const addr0 = addressFromScriptPublicKey(outputs0[0].scriptPublicKey, networkId)?.toString();
    if (addr0) generatorOutputs.push({ address: addr0, amount: outputs0[0].value });
    for (const out of outputs2) {
      const addr = addressFromScriptPublicKey(out.scriptPublicKey as ScriptPublicKey, networkId)?.toString();
      if (addr) generatorOutputs.push({ address: addr, amount: out.value });
    }
    if (extraOutput && extraOutput.length > 0) {
      for (const output of extraOutput) {
        generatorOutputs.push({ address: output.address, amount: kaspaToSompi(output.amount.toString()) as bigint });
      }
    }

    // Seller's net contribution: value flowing from seller side excluding fees
    const sellerNetContribution = inputs0Value - outputs0Value - outputs2Value - outputs3Value;

    return {
      pskt,
      keyring,
      account,
      publicKey,
      buyerEntries,
      outputs0,
      outputs2,
      outputs3,
      priorityFeeSompi,
      outputs1Value,
      networkId,
      generatorOutputs,
      sellerNetContribution,
      inputs1Value
    };
  };

  /**
   * Buys a KRC20 token from an existing sell order on the marketplace.
   *
   * This method completes the buyer side of a KRC20 marketplace order by merging the seller's
   * partially-signed Kaspa transaction (PSKT) with the buyer's UTXOs, signing the buyer's inputs,
   * and submitting the final transaction to the network.
   *
   * The seller's PSKT (obtained from {@link createKRC20Order}) contains a KRC20 "send" operation
   * (`{"p":"krc-20","op":"send","tick":"..."}`) with the seller's inputs already signed. This method
   * adds the buyer's KAS payment as additional inputs, constructs the outputs (KAS to seller,
   * KRC20 tokens to buyer), signs the buyer's inputs, and submits the completed transaction.
   *
   * Per the KRC20 protocol, the send op's first output is the KAS receiver (payment to seller)
   * and the second output is the token receiver (KRC20 tokens to the buyer). If the transaction
   * has only one output, it is treated as an order cancellation.
   * See: https://docs-kasplex.gitbook.io/krc20/technical-overview/krc-20-ops/send
   *
   * For a sign-only variant that returns the signed PSKT without submitting, see {@link signBuyKRC20Token}.
   *
   * @param txJsonString - JSON-serialized PSKT from the seller (obtained from {@link createKRC20Order}'s return value)
   * @param extraOutput - Optional additional outputs (e.g. 3rd party payment address and amount in KAS)
   * @param priorityFee - Optional priority fee in KAS (converted to sompi internally)
   * @returns The transaction ID of the submitted buy transaction
   * @throws {Error} If no current account or keyring is found
   * The JSON data MUST enforce byte-level consistency and MUST follow these rules:
   * - All key-value pairs MUST use a fixed order ( p , op , tick );
   * - All characters MUST be lowercase;
   * - Whitespace characters are not permitted;
   * - Duplicate keys are not permitted;
   * - Unknown fields are not permitted.
   * The transaction’s first output serves as the KAS receiver.
   * The transaction’s second output serves as the Token receiver.
   * If the transaction has only one output, it will be treated as an order cancellation.
   */
  buyKRC20Token = async ({
    txJsonString,
    extraOutput,
    priorityFee
  }: {
    txJsonString: string;
    extraOutput?: [{ address: string; amount: number }];
    priorityFee?: number;
  }) => {
    const prepared = await this.prepareBuyKRC20TokenTx({
      txJsonString,
      extraOutput,
      priorityFee
    });
    const {
      keyring,
      account,
      publicKey,
      buyerEntries,
      outputs0,
      outputs2,
      outputs3,
      priorityFeeSompi,
      networkId,
      generatorOutputs,
      sellerNetContribution
    } = prepared;

    const feeRate = await openapiService.getLowFeeRate();
    const generator = new Generator({
      entries: buyerEntries,
      outputs: generatorOutputs,
      priorityFee: priorityFeeSompi,
      feeRate,
      changeAddress: account.address,
      networkId
    } as IGeneratorSettingsObject);

    // Collect all pending transactions from Generator.
    // Batch consolidation transactions (non-final) only involve buyer UTXOs.
    // Seller inputs must only be merged into the final transaction to avoid double-spend.
    const allPending: PendingTransaction[] = [];
    let pending: PendingTransaction;
    while ((pending = await generator.next())) {
      allPending.push(pending);
    }

    let lastTxId = '';

    for (let idx = 0; idx < allPending.length; idx++) {
      const genPending = allPending[idx];
      const genTx = genPending.transaction;
      const isFinal = idx === allPending.length - 1;

      if (!isFinal) {
        // Batch consolidation: sign all buyer inputs and submit as-is (change goes to changeAddress)
        const toSignInputs: ToSignInput[] = Array.from({ length: genTx.inputs.length }, (_, i) => ({
          index: i,
          publicKey,
          sighashTypes: [1]
        }));

        const signedTx = await this.walletSignTransaction(keyring, genTx, toSignInputs, false);
        const result = await openapiService.checkAndSubmitTransaction({ transaction: signedTx, allowOrphan: false });
        lastTxId = result.transactionId;
        continue;
      }

      // Final transaction: merge seller inputs + full outputs, sign only buyer inputs
      const buyerInputCount = genTx.inputs.length;

      // Compute actual buyer inputs value from Generator-selected UTXOs
      const genBuyerInputsValue = genTx.inputs.reduce(
        (agg, inp) => agg + ((inp.utxo?.amount as bigint) || BigInt(0)),
        BigInt(0)
      );

      // Deserialize fresh PSKT to get seller inputs (with pre-existing signatures intact)
      const freshPskt = Transaction.deserializeFromSafeJSON(txJsonString) as Transaction;
      const inputsOfSeller = freshPskt.inputs;

      // Merge seller + buyer inputs
      genTx.inputs = [...inputsOfSeller, ...genTx.inputs];

      // Recalculate fee based on actual merged transaction mass (not Generator's buyer-only estimate)
      const estimatedChange = genBuyerInputsValue + sellerNetContribution - genPending.feeAmount;
      const tempOutputs = [
        ...outputs0,
        new TransactionOutput(estimatedChange, payToAddressScript(account.address)),
        ...outputs2,
        ...outputs3
      ];
      genTx.outputs = tempOutputs;
      const txMass = calculateTransactionMass(networkId, genTx);
      const actualFee = txMass * BigInt(Math.ceil(feeRate));

      // Build outputs with corrected fee
      const changeValue = genBuyerInputsValue + sellerNetContribution - actualFee;
      if (changeValue < BigInt(0)) {
        throw new Error(
          'Insufficient buyer funds: merged transaction fee exceeds estimate. Please add more KAS to your wallet or reduce the number of seller inputs.'
        );
      }
      const changeOutput = new TransactionOutput(changeValue, payToAddressScript(account.address));
      genTx.outputs = [...outputs0, changeOutput, ...outputs2, ...outputs3];

      // Sign buyer inputs (indices after seller inputs)
      const toSignInputs: ToSignInput[] = Array.from({ length: buyerInputCount }, (_, i) => ({
        index: inputsOfSeller.length + i,
        publicKey,
        sighashTypes: [1]
      }));

      const signedTx = await this.walletSignTransaction(keyring, genTx, toSignInputs, false);
      const result = await openapiService.checkAndSubmitTransaction({ transaction: signedTx, allowOrphan: false });
      lastTxId = result.transactionId;

      // Track pending transaction for UI
      const costAmount = genBuyerInputsValue - changeValue;
      await this.walletAddPendingTx(
        'buykrc20token',
        signedTx,
        Number(sompiToAmount(costAmount, 8)),
        account.address,
        account.address,
        '',
        1,
        toSignInputs
      );
    }

    return lastTxId;
  };
  /**
   * Sign a KRC-20 token buy transaction.
   * @see https://docs-kasplex.gitbook.io/krc20/technical-overview/krc-20-ops/send
   */
  signBuyKRC20Token = async ({
    txJsonString,
    extraOutput,
    priorityFee
  }: {
    txJsonString: string;
    extraOutput?: [{ address: string; amount: number }];
    priorityFee?: number;
  }) => {
    const prepared = await this.prepareBuyKRC20TokenTx({
      txJsonString,
      extraOutput,
      priorityFee
    });
    const {
      pskt,
      keyring,
      account,
      publicKey,
      buyerEntries,
      outputs0,
      outputs2,
      outputs3,
      priorityFeeSompi,
      outputs1Value,
      networkId,
      generatorOutputs
    } = prepared;

    let calFee = calculateTransactionFee(networkId, pskt);
    let finalOutputs1Value = outputs1Value;

    // if (!calFee || outputs1Value - (calFee as bigint) < BigInt(0)) {
    // calFee is undefined or insufficient change, use Generator to determine fee
    const feeRate = await openapiService.getLowFeeRate();
    const generator = new Generator({
      entries: buyerEntries,
      outputs: generatorOutputs,
      priorityFee: priorityFeeSompi,
      feeRate,
      changeAddress: account.address,
      networkId
    } as IGeneratorSettingsObject);

    let genTx: Transaction | undefined;
    let genFee: bigint = BigInt(0);
    let txCount = 0;
    let pending: PendingTransaction;
    while ((pending = await generator.next())) {
      genTx = pending.transaction;
      genFee = pending.feeAmount;
      txCount++;
    }

    // For sign-only mode, we can only handle single-transaction scenarios
    if (!calFee) throw new Error('the mass exceeds the maximum standard transaction mass');
    if (txCount > 1) {
      throw new Error(
        'UTXO fragmentation requires multiple transactions; use buyKRC20Token instead of signBuyKRC20Token'
      );
    }

    // Generator produces exactly one transaction; recalculate fee for the merged (seller+buyer) PSKT
    if (txCount === 1 && genTx) {
      const mergedMass = calculateTransactionMass(networkId, pskt);
      const mergedFee = mergedMass * BigInt(Math.ceil(feeRate));
      finalOutputs1Value = outputs1Value - mergedFee;
      calFee = mergedFee;
    }
    // } else {
    //   finalOutputs1Value = outputs1Value - (calFee as bigint);
    // }

    const outputs1 = [new TransactionOutput(finalOutputs1Value, payToAddressScript(account.address))];
    const finalOutputs = [...outputs0, ...outputs1, ...outputs2, ...outputs3];

    // Create a fresh Transaction to avoid WASM internal state corruption
    // from multiple inputs/outputs replacements on the deserialized PSKT
    const txToSign = this.newTransaction(pskt.inputs, finalOutputs);
    checkTransactionSum(txToSign, (calFee as bigint) + priorityFeeSompi);

    const sellerInputCount = pskt.inputs.length - buyerEntries.length;
    const toSignInputs2: ToSignInput[] = Array.from({ length: buyerEntries.length }, (_, i) => {
      return { index: sellerInputCount + i, publicKey, sighashTypes: [1] };
    });

    const finalPskt = await this.walletSignTransaction(keyring, txToSign, toSignInputs2, false);
    // const result = await openapiService.checkAndSubmitTransaction({ transaction: finalPskt, allowOrphan: false });
    // console.log(result, finalPskt.serializeToSafeJSON());
    return finalPskt.serializeToSafeJSON();
  };
  private prepareCommitTransactions = async ({
    priorityEntries,
    entries,
    outputs,
    changeAddress,
    priorityFee,
    feeRate,
    script,
    networkId
  }: ISubmitCommitParams) => {
    const account = await this.getCurrentAccount();
    if (!account) throw new Error('no current account');
    const keyring = await this.getCurrentKeyring();
    if (!keyring) throw new Error('no current keyring');
    const publicKey = account.pubkey;
    const scriptObj = ScriptBuilder.fromScript(script);
    const scriptPk = scriptObj.createPayToScriptHashScript();
    const p2shAddress = addressFromScriptPublicKey(
      scriptPk,
      networkId ? networkId : preferenceService.getNetworkId()
    )?.toString();
    if (!p2shAddress) throw new Error(`no p2sh address could be derived from the provided script`);
    const isScriptCorrect = outputs.find((output) => output.address == p2shAddress && p2shAddress !== undefined);
    if (isScriptCorrect == undefined) throw new Error('p2sh address is not included in outputs');
    const newEntriesRes = new UtxoEntries(entries);
    const newPriorityEntries = priorityEntries ? new UtxoEntries(priorityEntries) : priorityEntries;

    const realOutputs = outputs.map((output) => {
      return {
        address: output.address,
        amount: kaspaToSompi(output.amount.toString()) as bigint
      };
    });

    const lowFeeRate = await openapiService.getLowFeeRate();
    const { transactions } = await createTransactions({
      priorityEntries: newPriorityEntries?.items,
      entries: newEntriesRes?.items as UtxoEntryReference[],
      outputs: realOutputs,
      feeRate: feeRate ? Math.max(lowFeeRate, feeRate) : lowFeeRate,
      changeAddress: changeAddress ? changeAddress : account.address,
      priorityFee: priorityFee == undefined ? undefined : (kaspaToSompi(priorityFee.toString()) as bigint),
      networkId: networkId ? networkId : preferenceService.getNetworkId()
    });
    return { transactions, keyring, publicKey, account, script, outputs };
  };

  /**
   * Submit commit transactions for the Kaspa P2SH commit-reveal pattern.
   *
   * Prepares unsigned commit transactions from the given UTXO entries and outputs,
   * signs each transaction with the current keyring, submits them to the network,
   * and records each as a pending commit transaction.
   *
   * This is the commit phase of the commit-reveal workflow — it locks funds into
   * a P2SH address derived from the provided reveal script. The corresponding
   * reveal phase is handled by {@link submitReveal} or combined via {@link submitCommitReveal}.
   *
   * Called from:
   * - The dApp-facing API (`window.kasware.submitCommit`) through the provider controller
   *   with `CommitReveal` approval required.
   * - Internally by {@link submitCommitReveal} as the first step before reveal.
   *
   * @param params - The commit transaction parameters:
   *   - `priorityEntries` - Optional UTXO entries to spend first.
   *   - `entries` - UTXO entries to spend.
   *   - `outputs` - Destination outputs; must include the P2SH address derived from `script`.
   *   - `changeAddress` - Address for change output; defaults to current account address.
   *   - `priorityFee` - Optional priority fee for faster inclusion.
   *   - `script` - The reveal script used to derive the P2SH commit address.
   *   - `networkId` - Optional Kaspa network ID; defaults to user preference.
   * @returns Array of submitted transaction IDs.
   */
  submitCommit = async (params: ISubmitCommitParams): Promise<string[]> => {
    const { transactions, keyring, publicKey, account, script, outputs } = await this.prepareCommitTransactions(params);
    const txIds = [] as string[];
    for (const pending of transactions) {
      const tx = pending.transaction;
      const toSignInputs2: ToSignInput[] = Array.from({ length: tx.inputs.length }, (_, i) => {
        return { index: i, publicKey, sighashTypes: [1] };
      });
      const addressType = keyring?.addressType;
      const verifySig = addressType !== AddressType.KASPA_TANGEM_44_111111;
      const signedTx = await this.walletSignTransaction(keyring, tx, toSignInputs2, verifySig);
      const result = await openapiService.checkAndSubmitTransaction({
        transaction: signedTx,
        allowOrphan: false
      });
      txIds.push(result.transactionId);

      const totalOutputAmount = outputs.reduce((acc, output) => acc + output.amount, 0);
      await this.walletAddPendingTx(
        'commit',
        signedTx,
        totalOutputAmount,
        account.address,
        account.address,
        script,
        1,
        toSignInputs2
      );
    }
    return txIds;
  };

  signCommit = async (params: ISubmitCommitParams): Promise<string[]> => {
    const { transactions, keyring, publicKey } = await this.prepareCommitTransactions(params);
    const serializedTxs = [] as string[];
    for (const pending of transactions) {
      const tx = pending.transaction;
      const toSignInputs2: ToSignInput[] = Array.from({ length: tx.inputs.length }, (_, i) => {
        return { index: i, publicKey, sighashTypes: [1] };
      });
      const addressType = keyring?.addressType;
      const verifySig = addressType !== AddressType.KASPA_TANGEM_44_111111;
      const signedTx = await this.walletSignTransaction(keyring, tx, toSignInputs2, verifySig);
      serializedTxs.push(signedTx.serializeToSafeJSON());
    }
    return serializedTxs;
  };

  /**
   * Submit reveal transactions for the Kaspa P2SH commit-reveal pattern.
   *
   * This is the reveal phase that spends the UTXOs previously locked in the P2SH commit
   * address. It constructs reveal transactions, partially signs them with the keyring,
   * then appends the redeem script to the unsigned inputs' signature scripts via
   * {@link signRevealTransaction}, and submits the fully signed transactions to the network.
   *
   * The reveal script is length-prefixed according to Kaspa script push-data encoding
   * (OP_PUSHBYTES for lengths < 76, OP_PUSHDATA1 for 76-255, OP_PUSHDATA2 for 256-65535)
   * before being appended to each input's signature script.
   *
   * A minimum priority fee is automatically calculated based on the script size and
   * input count. If a custom `priorityFee` is provided, the effective fee is the maximum
   * of the calculated minimum and the custom value.
   *
   * Called from:
   * - The dApp-facing API (`window.kasware.submitReveal`) through the provider controller
   *   with `CommitReveal` approval required.
   * - Internally by {@link submitCommitReveal} as the second step after commit UTXOs
   *   are confirmed.
   *
   * @param params - The reveal transaction parameters (destructured from {@link ISubmitRevealParams}):
   *   - `priorityEntries` - UTXO entries subject to priority fees (typically the P2SH
   *     UTXOs from the prior commit).
   *   - `entries` - Regular UTXO entries for the reveal transaction.
   *   - `outputs` - Optional destination outputs; if omitted, all funds go to change.
   *   - `changeAddress` - Address for change output.
   *   - `priorityFee` - Optional additional priority fee in KAS; effective fee is
   *     max(calculated minimum, provided value).
   *   - `script` - Hex-encoded redeem script for the P2SH commit-reveal.
   *   - `networkId` - Optional Kaspa network ID.
   * @returns Array of submitted transaction IDs.
   * @throws Error if no current account or keyring is found.
   * @throws Error if no unsigned input is found in the partially signed transaction
   *   (i.e., no input requires the redeem script).
   * @throws Error if the redeem script length exceeds 65535 bytes (unsupported encoding).
   */
  submitReveal = async ({
    priorityEntries,
    entries,
    outputs,
    changeAddress,
    priorityFee,
    feeRate: customFeeRate,
    script,
    networkId
  }: ISubmitRevealParams) => {
    const account = await this.getCurrentAccount();
    if (!account) throw new Error('no current account');
    const keyring = await this.getCurrentKeyring();
    if (!keyring) throw new Error('no current keyring');
    const publicKey = account.pubkey;

    // const scriptObj = ScriptBuilder.fromScript(script);

    const realOutputs =
      outputs?.map((output) => {
        return {
          address: output.address,
          amount: kaspaToSompi(output.amount.toString()) as bigint
        };
      }) || [];
    const lowFeeRate = await openapiService.getLowFeeRate();
    const feeRate = customFeeRate ? Math.max(lowFeeRate, customFeeRate) : lowFeeRate;
    const defaultPriorityFee =
      (BigInt(script.length) / BigInt(2) + BigInt(4)) *
      BigInt((priorityEntries?.length || 0) + (entries?.length || 0)) *
      BigInt(Math.max(1, Math.ceil(feeRate)));
    const realPriorityFee =
      priorityFee != undefined
        ? max([defaultPriorityFee, kaspaToSompi(priorityFee.toString()) as bigint])
        : defaultPriorityFee;
    log.debug('realPriorityFee', realPriorityFee);
    const priorityEntriesArr = new UtxoEntries(priorityEntries)?.items;
    const entriesArr = new UtxoEntries(entries)?.items;
    const { transactions: revealTransactions } = await createTransactions({
      priorityEntries: priorityEntriesArr,
      entries: entriesArr,
      outputs: realOutputs,
      feeRate,
      changeAddress,
      priorityFee: realPriorityFee,
      networkId: networkId
    });
    const txIds = [] as string[];

    // Derive P2SH (commit) address from script for pending tx tracking
    const scriptObj = ScriptBuilder.fromScript(script);
    const scriptPk = scriptObj.createPayToScriptHashScript();
    const commitAddress =
      addressFromScriptPublicKey(scriptPk, networkId ? networkId : preferenceService.getNetworkId())?.toString() || '';
    const totalInputValue = entries.reduce((agg, e) => agg + BigInt(e.amount), BigInt(0));

    for (const transaction of revealTransactions) {
      const _keyring = keyringService.keyrings[keyring.index];
      const inputLength = transaction.transaction.inputs.length;

      const toSignInputs2: ToSignInput[] = Array.from({ length: inputLength }, (_, i) => {
        return { index: i, publicKey, sighashTypes: [1] };
      });
      const pTx: PendingTransaction = await keyringService.signPendingTransaction(
        _keyring,
        transaction,
        toSignInputs2,
        false
      );
      // const ourOutput = pTx.transaction.inputs.findIndex((input) => input.signatureScript === '');
      // if (ourOutput !== -1) {
      //   const signatures = keyringService.createInputSignature(_keyring, pTx, toSignInputs, ourOutput);
      //   pTx.fillInput(ourOutput, scriptObj.encodePayToScriptHashSignatureScript(signatures[0]));
      // } else {
      //   throw new Error('no input found');
      // }
      const condition = (input: ITransactionInput | TransactionInput) => input.signatureScript === '';
      const ourOutputs = pTx.transaction.inputs
        .map((element, index) => (condition(element) ? index : -1))
        .filter((index) => index !== -1);

      // if (ourOutputs.length > 0) {
      //   ourOutputs.forEach((ourOutput) => {
      //     const signatures = keyringService.createInputSignature(_keyring, pTx, toSignInputs, ourOutput);
      //     pTx.fillInput(ourOutput, scriptObj.encodePayToScriptHashSignatureScript(signatures[0]));
      //   });
      // } else {
      //   throw new Error('no input found');
      // }
      if (ourOutputs.length <= 0) throw new Error('no input found');

      let redeemScript = script;
      const halfLen = script.length / 2;
      let halfLenHex = halfLen.toString(16);
      if (halfLen < 76) {
        redeemScript = halfLenHex + redeemScript;
      } else if (halfLen >= 76 && halfLen <= 255) {
        redeemScript = '4c' + halfLenHex + redeemScript;
      } else if (halfLen > 255 && halfLen <= 65535) {
        const hexLen = halfLenHex.length;
        if (hexLen == 3) halfLenHex = '0' + halfLenHex;
        halfLenHex = halfLenHex.slice(-2) + halfLenHex.slice(0, 2);
        redeemScript = '4d' + halfLenHex + redeemScript;
      } else {
        throw new Error('invalid script length');
      }
      const signedTx = await this.signRevealTransaction(
        keyring,
        pTx.transaction,
        toSignInputs2,
        false,
        redeemScript,
        ourOutputs
      );
      const result = await openapiService.checkAndSubmitTransaction({
        transaction: signedTx,
        allowOrphan: false
      });
      txIds.push(result.transactionId);

      await this.walletAddPendingTx(
        'reveal',
        signedTx,
        Number(sompiToAmount(totalInputValue.toString(), 8)),
        changeAddress,
        commitAddress,
        redeemScript,
        0,
        toSignInputs2
      );
    }
    return txIds;
  };

  signReveal = async ({
    priorityEntries,
    entries,
    outputs,
    changeAddress,
    priorityFee,
    script,
    networkId
  }: ISubmitRevealParams) => {
    const account = await this.getCurrentAccount();
    if (!account) throw new Error('no current account');
    const keyring = await this.getCurrentKeyring();
    if (!keyring) throw new Error('no current keyring');
    const publicKey = account.pubkey;
    const index = account.index as number;
    const toSignInputs: ToSignInput[] = [{ index, publicKey }];
    const scriptObj = ScriptBuilder.fromScript(script);
    const realOutputs =
      outputs?.map((output) => {
        return {
          address: output.address,
          amount: kaspaToSompi(output.amount.toString()) as bigint
        };
      }) || [];
    const defaultPriorityFee =
      (BigInt(script.length) / BigInt(2) + BigInt(4)) * BigInt((priorityEntries?.length || 0) + (entries?.length || 0));
    let realPriorityFee = defaultPriorityFee;
    if (priorityFee != undefined)
      realPriorityFee = max([defaultPriorityFee, kaspaToSompi(priorityFee.toString()) as bigint]) as bigint;
    log.debug('realPriorityFee', realPriorityFee);
    const priorityEntriesArr = new UtxoEntries(priorityEntries)?.items;
    const entriesArr = new UtxoEntries(entries)?.items;
    const lowFeeRate = await openapiService.getLowFeeRate();
    const { transactions: revealTransactions } = await createTransactions({
      priorityEntries: priorityEntriesArr,
      entries: entriesArr,
      outputs: realOutputs,
      changeAddress,
      feeRate: lowFeeRate,
      priorityFee: realPriorityFee,
      networkId: networkId
    });
    const serializedTxs = [] as string[];
    for (const transaction of revealTransactions) {
      const _keyring = keyringService.keyrings[keyring.index];
      const pTx: PendingTransaction = await keyringService.signPendingTransaction(
        _keyring,
        transaction,
        toSignInputs,
        false
      );
      const condition = (input: ITransactionInput | TransactionInput) => input.signatureScript === '';
      const ourOutputs = pTx.transaction.inputs
        .map((element, index) => (condition(element) ? index : -1))
        .filter((index) => index !== -1);

      if (ourOutputs.length > 0) {
        ourOutputs.forEach((ourOutput) => {
          const signatures = keyringService.createInputSignature(_keyring, pTx, toSignInputs, ourOutput);
          pTx.fillInput(ourOutput, scriptObj.encodePayToScriptHashSignatureScript(signatures[0]));
        });
      } else {
        throw new Error('no input found');
      }
      const sTx = pTx.transaction.serializeToSafeJSON();
      serializedTxs.push(sTx);
    }
    return serializedTxs;
  };

  innerSubmitCommitReveal = async ({
    script,
    commitOutputs,
    revealOutputs
  }: {
    script: string;
    commitOutputs: { address: string; amount: number }[];
    revealOutputs: { address: string; amount: number }[];
  }): Promise<{ commitIds: string[]; revealIds: string[] }> => {
    const account = await this.getCurrentAccount();
    if (!account) throw new Error('no current account');
    const entries = await openapiService.getKASUtxoEntryReferences([account.address]);
    const networkId = preferenceService.getNetworkId();
    const commit = {
      priorityEntries: [], //necessary
      entries,
      outputs: commitOutputs,
      changeAddress: account.address,
      //transaction 6232eff152f1bf8642d8dd3ac216b1a818141efd04e7dd1faa15f1e13dd19d95 is not standard: transaction has 3154 fees which is under the required amount of 3734
      // priorityFee: 0.001
      priorityFee: 0 //necessary
    };
    const reveal = {
      outputs: revealOutputs,
      changeAddress: account.address,
      // priorityFee: 0.001
      priorityFee: 0
    };
    return this.submitCommitReveal(commit, reveal, script, networkId);
  };
  /**
   * Submit a combined commit-reveal transaction pair for the Kaspa P2SH commit-reveal pattern.
   *
   * This orchestrates the full two-phase workflow in a single call:
   * 1. **Commit phase** — locks funds into a P2SH address derived from the reveal script
   *    by calling {@link submitCommit}.
   * 2. **Polling** — waits for the commit UTXOs to appear at the P2SH address on-chain
   *    by polling at 1-second intervals until the total value meets or exceeds the commit
   *    output amount.
   * 3. **Reveal phase** — spends the committed P2SH UTXOs by calling {@link submitReveal},
   *    which reveals the script data on-chain (e.g., KRC-20 mint/transfer, bridge data).
   *
   * This is the primary entry point for dApps via `window.kasware.submitCommitReveal()`
   * and is also used internally by {@link innerSubmitCommitReveal} for the KRC-L2 bridge flow.
   * Requires `CommitReveal` approval when called from a dApp.
   *
   * @param commit - Commit transaction parameters (without `script` and `networkId`,
   *   which are provided as separate arguments):
   *   - `priorityEntries` - Optional UTXO entries to spend first.
   *   - `entries` - UTXO entries to spend.
   *   - `outputs` - Destination outputs; must include the P2SH address derived from `script`.
   *   - `changeAddress` - Address for change output.
   *   - `priorityFee` - Optional priority fee for faster inclusion.
   * @param reveal - Reveal transaction parameters (without `priorityEntries`, `entries`,
   *   `script`, and `networkId`, which are derived or provided separately):
   *   - `outputs` - Optional destination outputs; if omitted, all funds go to change.
   *   - `changeAddress` - Address for change output.
   *   - `priorityFee` - Optional additional priority fee; effective fee is the maximum
   *     of the calculated minimum and the provided value.
   * @param script - Hex-encoded reveal script used to derive the P2SH commit address
   *   and to unlock the committed UTXOs during the reveal phase.
   * @param networkId - Optional Kaspa network ID; defaults to user preference.
   * @returns Object containing `commitIds` (transaction IDs from the commit phase)
   *   and `revealIds` (transaction IDs from the reveal phase).
   * @throws Error if no P2SH address can be derived from the provided script.
   */
  submitCommitReveal = async (
    commit: Omit<ISubmitCommitParams, 'script' | 'networkId'>,
    reveal: Omit<ISubmitRevealParams, 'priorityEntries' | 'entries' | 'script' | 'networkId'>,
    script: string,
    networkId?: string
  ): Promise<{ commitIds: string[]; revealIds: string[] }> => {
    const commitIds = await this.submitCommit({
      priorityEntries: commit.priorityEntries,
      entries: commit.entries,
      outputs: commit.outputs,
      changeAddress: commit.changeAddress,
      priorityFee: commit.priorityFee,
      feeRate: commit.feeRate,
      networkId,
      script
    });
    const scriptObj = ScriptBuilder.fromScript(script);
    const scriptPk = scriptObj.createPayToScriptHashScript();
    const p2shAddress = addressFromScriptPublicKey(
      scriptPk,
      networkId ? networkId : preferenceService.getNetworkId()
    )?.toString();
    if (!p2shAddress) throw new Error(`no p2sh address could be derived from the provided script`);
    const p2shOutputs = commit.outputs.filter((output) => output.address == p2shAddress);
    if (p2shOutputs.length === 0) throw new Error('No P2SH output found in commit outputs');

    let checkRevealUtxosEntries = await openapiService.getKASUtxoEntryReferences([p2shAddress]);
    let commitAddressTotalValue = checkRevealUtxosEntries.reduce((agg, curr) => {
      return curr.amount + agg;
    }, BigInt(0));
    const p2shOutputAmountSompi = BigInt(amountToSompi(p2shOutputs[0].amount.toString(), 8));
    const COMMIT_UTXO_POLL_MAX_RETRIES = 120; // 2 minutes at 1-second intervals
    let retries = 0;
    while (!(checkRevealUtxosEntries.length > 0 && commitAddressTotalValue >= p2shOutputAmountSompi)) {
      if (++retries > COMMIT_UTXO_POLL_MAX_RETRIES) {
        throw new Error(
          'Commit UTXOs not confirmed within timeout (2 minutes). The commit transaction may have failed.'
        );
      }
      await sleep(1000);
      checkRevealUtxosEntries = await openapiService.getKASUtxoEntryReferences([p2shAddress]);
      commitAddressTotalValue = checkRevealUtxosEntries.reduce((agg, curr) => {
        return curr.amount + agg;
      }, BigInt(0));
    }

    // NOTE: must use Number() (not toString()) — UtxoEntries constructor requires numeric amount fields
    const checkRevealUtxosEntriesStr = JSON.stringify(checkRevealUtxosEntries, (key, value) =>
      typeof value === 'bigint' ? Number(value) : value
    );
    const jsonEntries = JSON.parse(checkRevealUtxosEntriesStr);

    const revealIds = await this.submitReveal({
      priorityEntries: [],
      entries: jsonEntries,
      outputs: reveal.outputs,
      changeAddress: reveal.changeAddress,
      priorityFee: reveal.priorityFee,
      feeRate: commit.feeRate,
      networkId,
      script
    });

    return { commitIds, revealIds };
  };
  getP2shAddressFromScriptBuilder = (script: string, networkId?: string) => {
    const currentNetworkId = networkId ? networkId : preferenceService.getNetworkId();
    return getP2shAddressFromScriptBuilderPure(script, currentNetworkId);
  };
  prepareCreateTransaction = async ({
    priorityEntries,
    entries,
    outputs,
    changeAddress,
    priorityFee,
    networkId,
    script
  }: {
    priorityEntries: IUtxoEntryJson[];
    entries: IUtxoEntryJson[];
    outputs: { address: string; amount: number }[];
    changeAddress: string;
    priorityFee: number | undefined;
    networkId: string;
    script: string;
  }) => {
    try {
      const account = await this.getCurrentAccount();
      if (!account) throw new Error('no current account');
      const currentAddress = account.address;
      const realOutputs = outputs.map((output) => {
        return {
          address: output.address,
          amount: kaspaToSompi(output.amount.toString()) as bigint
        };
      });
      const defaultPriorityFee = (BigInt(script.length) / BigInt(2) + BigInt(4)) * BigInt(priorityEntries?.length || 0);
      let realPriorityFee = defaultPriorityFee;
      if (priorityFee != undefined)
        realPriorityFee = max([defaultPriorityFee, kaspaToSompi(priorityFee.toString()) as bigint]) as bigint;
      const priorityEntriesArr = new UtxoEntries(priorityEntries)?.items as IUtxoEntry[];
      const entriesArr = new UtxoEntries(entries)?.items as IUtxoEntry[];
      const priorityEntriesAmountOthers = Number(
        sompiToAmount(
          priorityEntriesArr
            .filter((item) => item.address?.toString() !== currentAddress)
            .reduce((agg, curr) => {
              return curr.amount + agg;
            }, BigInt(0)),
          8
        )
      );
      const priorityEntriesAmountSelf = Number(
        sompiToAmount(
          priorityEntriesArr
            .filter((item) => item.address?.toString() == currentAddress)
            .reduce((agg, curr) => {
              return curr.amount + agg;
            }, BigInt(0)),
          8
        )
      );
      const entriesAmountOthers = Number(
        sompiToAmount(
          entriesArr
            .filter((item) => item.address?.toString() !== currentAddress)
            .reduce((agg, curr) => {
              return curr.amount + agg;
            }, BigInt(0)),
          8
        )
      );
      const entriesAmountSelf = Number(
        sompiToAmount(
          entriesArr
            .filter((item) => item.address?.toString() == currentAddress)
            .reduce((agg, curr) => {
              return curr.amount + agg;
            }, BigInt(0)),
          8
        )
      );

      const totalInputAmount =
        priorityEntriesAmountOthers + priorityEntriesAmountSelf + entriesAmountOthers + entriesAmountSelf;
      const { summary } = await createTransactions({
        priorityEntries: priorityEntriesArr,
        entries: entriesArr,
        outputs: realOutputs,
        feeRate: await openapiService.getLowFeeRate(),
        changeAddress,
        priorityFee: realPriorityFee,
        networkId: networkId
      });
      const txFee = Number(sompiToAmount(summary.fees, 8));
      const outputTotalAmount = outputs.reduce((agg, curr) => {
        return curr.amount + agg;
      }, 0);
      const changeAmount = totalInputAmount - outputTotalAmount - txFee;
      let returnOutputs = [...outputs, { address: changeAddress, amount: changeAmount }].filter(
        (item) => item.address !== currentAddress
      );
      if (returnOutputs.length == 0) {
        returnOutputs = [{ address: changeAddress, amount: priorityEntriesAmountOthers + entriesAmountOthers - txFee }];
      }
      return {
        toAddressInfos: returnOutputs,
        txFee: txFee
      };
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      } else {
        throw new Error(JSON.stringify(e));
      }
    }
  };
  addressFromScriptPublicKey = (script: string, networkId: string) =>
    addressFromScriptPublicKey(script, networkId)?.toString();

  // newTxFee: kas unit
  replaceTransaction = async (oldId: string, newTxFee: number) => {
    log.debug('newTxFee: ', newTxFee);
    if (newTxFee > 50) throw new Error('new txFee is more than 50 KAS');
    const res = openapiService.getPendingTx(oldId);
    const txParam = res?.txParam;
    const txInfo = res?.txInfo;
    if (!txParam || !txInfo) {
      console.error('no param found: ' + oldId);
      return { status: 'no param found' };
    }
    const oldTxFee = txParam.txFee;
    if (newTxFee <= oldTxFee) throw new Error('new txFee is less than current txFee');
    const deltaFee = (kaspaToSompi(newTxFee.toString()) as bigint) - (kaspaToSompi(oldTxFee.toString()) as bigint);
    const account = await this.getCurrentAccount();
    if (!account) throw new Error('no current account');
    const keyring = await this.getCurrentKeyring();
    if (!keyring) throw new Error('no current keyring');

    let transaction = Transaction.deserializeFromSafeJSON(txParam.transaction);
    const redeemScript = txParam.redeemScript;
    const outputIndexOfFee = txParam.outputIndexOfFee;
    transaction.outputs[outputIndexOfFee].value = transaction.outputs[outputIndexOfFee].value - deltaFee;

    if (txParam.type === 'commit' || txParam.type === 'sendkas' || txParam.type === 'compound') {
      const toSignInputs2 = txParam.toSignInputs;
      const verifySig = keyring.addressType !== AddressType.KASPA_TANGEM_44_111111;
      transaction = await this.walletSignTransaction(keyring, transaction, toSignInputs2, verifySig);
    } else if (txParam.type === 'reveal' || txParam.type === 'retrieve') {
      const toSignInputs2 = txParam.toSignInputs;

      const signScriptIndexes: number[] = [];
      for (let i = 0; i < transaction.inputs.length; i++) {
        if (transaction.inputs[i].signatureScript?.includes(redeemScript)) signScriptIndexes.push(i);
      }
      transaction = await this.signRevealTransaction(
        keyring,
        transaction,
        toSignInputs2,
        false,
        redeemScript,
        signScriptIndexes
      );
    } else if (txParam.type === 'buykrc20token') {
      log.debug('buykrc20token');
      const toSignInputs2 = txParam.toSignInputs;
      transaction = await this.walletSignTransaction(keyring, transaction, toSignInputs2, false);
    }
    try {
      const response = await openapiService.checkAndSubmitTransactionReplacement({
        transaction
      });
      const newId = response.transactionId.toString();
      openapiService.removePendingTx(oldId);
      const block_time = new Date().getTime();
      openapiService.addPendingTxs(newId, {
        txParam: { ...txParam, txFee: newTxFee },
        txInfo: { ...txInfo, txFee: newTxFee, transaction_id: newId, block_time }
      });
      return {
        id: newId,
        txFee: newTxFee,
        block_time: new Date().getTime(),
        status: 'submitted'
      };
    } catch (e) {
      const str = String(e);
      if (str.includes('replace by fee found no double')) {
        openapiService.removePendingTx(oldId);
        return { status: 'replace by fee found no double' };
      } else {
        throw new Error(str);
      }
    }
  };
  removePendingTx = async (id: string) => {
    openapiService.removePendingTx(id);
  };

  signRevealTransaction = async (
    keyring: WalletKeyring,
    transaction: Transaction,
    toSignInputs: ToSignInput[],
    verifySig: boolean,
    redeemScript: string,
    sigScriptIndexes: number[]
  ) => {
    const revealTransaction = await this.walletSignTransaction(keyring, transaction, toSignInputs, verifySig);
    sigScriptIndexes.forEach((i) => {
      revealTransaction.inputs[i].signatureScript = revealTransaction.inputs[i].signatureScript + redeemScript;
    });
    return revealTransaction;
  };

  optimalInputUtxoEntries = async (
    sourceAddress: string,
    destinationAddress: string,
    changeAddress: string,
    payment: bigint,
    priorityFee?: bigint,
    sendAll?: boolean,
    feeRate = 1
  ) => {
    const generator = await openapiService.createGenerator(
      sourceAddress,
      destinationAddress,
      changeAddress,
      payment,
      priorityFee,
      sendAll,
      undefined,
      undefined,
      feeRate
    );
    let pending;
    const results: {
      feeAmount: bigint;
      inputUtxoEntries: UtxoEntryReference[];
    }[] = [];
    while ((pending = await generator.next())) {
      const feeAmount: bigint = pending.feeAmount;
      const transaction = pending.transaction as Transaction;
      const inputUtxoEntries = (transaction.inputs as TransactionInput[]).map((input) => {
        return input.utxo as UtxoEntryReference;
      });
      const result = { feeAmount, inputUtxoEntries };
      results.push(result);
    }
    return results;
  };
  /**
   * @returns kaspa unit at feeRate=1
   */
  getTxFee = async (
    sourceAddress: string,
    destinationAddress: string,
    changeAddress: string,
    paymentAmount: number,
    priorityFeeAmount?: number,
    sendAll?: boolean,
    feeRate = 1
  ) => {
    const payment = kaspaToSompi(paymentAmount.toString()) as bigint;
    const priorityFee = kaspaToSompi(priorityFeeAmount?.toString() || '0');
    const res = await this.optimalInputUtxoEntries(
      sourceAddress,
      destinationAddress,
      changeAddress,
      payment,
      priorityFee,
      sendAll,
      feeRate
    );
    return Number(sompiToAmount(res[0].feeAmount, 8));
  };

  getScriptInfo = (
    inscribeJsonString: string,
    publicKey: string,
    addressType: number,
    networkId: string,
    protocol = KASPLEX as TProtocol
  ) => {
    return getScriptInfoUtil(inscribeJsonString, publicKey, addressType, networkId, protocol);
  };

  walletSignTransaction = async (
    keyring: WalletKeyring,
    tx: Transaction,
    toSignInputs: ToSignInput[],
    verifySig = true
  ) => {
    const _keyring = keyringService.keyrings[keyring.index];
    const addressType = keyring.addressType;
    if (addressType && addressType == AddressType.KASPA_TANGEM_44_111111) {
      const revealTransaction = await keyringService.signEcdsaTransaction(_keyring, tx, toSignInputs, verifySig);

      return revealTransaction;
    } else {
      const revealTransaction = await keyringService.signSchnorrTransaction(_keyring, tx, toSignInputs, verifySig);
      return revealTransaction;
    }
  };

  /**
   * @see https://docs-kasplex.gitbook.io/l2-network/build/app-developer/create-transactions
   */
  sendPayloadToKaspaChain = async (sTx: Uint8Array<ArrayBufferLike>) => {
    const payload = Buffer.concat([
      Buffer.from('kasplex'),
      Buffer.from('01', 'hex'),
      Buffer.from(sTx)
    ] as unknown as Uint8Array[]);

    const account = await this.getCurrentAccount();
    if (!account) throw new Error('no current account');

    const sendJson = {
      to: account.address,
      amount: 2,
      priorityFee: 0
    };
    const res = await this.sendKaspa(JSON.stringify(sendJson), false, undefined, { payload });
    const txObj = JSON.parse(res);
    return txObj.id;
  };
  /**
   * @returns  txSeralizedJSON
   */
  sendKaspa = async (
    rawtx: string,
    isRBF = false,
    inputEntries?: UtxoEntryReference[],
    option?: {
      payload?: string | Buffer;
    }
  ): Promise<string> => {
    const result: IResultPsbtHex = JSON.parse(rawtx);
    // if (result?.payload !== option?.payload) throw new Error('payload not match');
    const toAddress = result.to;
    const toAmountSompi = BigInt(amountToSompi(result.amount, 8));
    const priorityFeeSompi = BigInt(amountToSompi(result.priorityFee, 8));
    const lowFeeRate = await openapiService.getLowFeeRate();
    const usedFeeRate = Math.max(result.feeRate || lowFeeRate, lowFeeRate);
    const account = await this.getCurrentAccount();
    if (!account) throw new Error('no current account');
    const keyring = await this.getCurrentKeyring();
    if (!keyring) throw new Error('no current keyring');
    const sourceAddress = account.address;
    const destinationAddress = toAddress;
    const publicKey = account.pubkey;

    const addressType = keyring.addressType;
    let entries: UtxoEntryReference[] = [];
    if (inputEntries && inputEntries.length > 0) {
      entries = inputEntries;
    } else {
      entries = await openapiService.getKASUtxoEntryReferences([sourceAddress]);
    }
    if (!entries.length) {
      throw new Error(`No UTXOs found for address ${sourceAddress}`);
    }
    entries.sort((a, b) => (a.amount > b.amount ? 1 : a.amount < b.amount ? -1 : 0));
    // 1. create
    const total = entries.reduce((agg, curr) => {
      return curr.amount + agg;
    }, BigInt(0));
    let generator = undefined as unknown as Generator;
    const networkId = preferenceService.getNetworkId();
    const payloadHex = option?.payload
      ? (Buffer.isBuffer(option.payload) ? option.payload : Buffer.from(option.payload)).toString('hex')
      : undefined;
    /**
     * should use payload length, but we sue payloadHex length for safety margin.
     *  */
    const payloadFee = BigInt(payloadHex?.length || 0) * BigInt(Math.ceil(usedFeeRate));
    if (total == toAmountSompi + priorityFeeSompi) {
      generator = new Generator({
        entries,
        outputs: [{ address: destinationAddress, amount: total }],
        feeRate: usedFeeRate,
        priorityFee: { amount: priorityFeeSompi + payloadFee, source: FeeSource.ReceiverPays },
        changeAddress: sourceAddress,
        networkId,
        payload: payloadHex
      });
      // }
    } else {
      const index = indexGreaterThanSum(entries, toAmountSompi + priorityFeeSompi);
      entries = entries.slice(0, index + 1);
      generator = new Generator({
        entries,
        outputs: [{ address: destinationAddress, amount: toAmountSompi }],
        feeRate: usedFeeRate,
        priorityFee: priorityFeeSompi + payloadFee,
        changeAddress: sourceAddress,
        networkId,
        payload: payloadHex
      });
    }
    let pending;
    const txSeralizedJSONs: string[] = [];
    while ((pending = await generator.next())) {
      let transaction: Transaction = pending.transaction;
      const txInputs = transaction.inputs;
      const utxoAddresses = txInputs.map((input) => input.utxo?.address?.toString());
      const isAllSourceUtxos = utxoAddresses.every((address) => address === sourceAddress || address === undefined);
      if (!isAllSourceUtxos) continue;

      const tx = transaction.serializeToSafeJSON();
      const txFee = pending.feeAmount as bigint;
      // KRC20 Deploy OP is embeded in payload and it needs txFee >= 1000 KAS
      if (txFee >= toAmountSompi && !(option?.payload && txFee >= BigInt(amountToSompi(KRC20_DEPLOY_TX_FEE, 8))))
        throw new Error('tx fee is larger than transfer amount');

      const toSignInputs: ToSignInput[] = Array.from({ length: transaction.inputs.length }, (_, i) => {
        return { index: i, publicKey, sighashTypes: [1] };
      });
      const verifySig = addressType != AddressType.KASPA_TANGEM_44_111111;
      transaction = await this.walletSignTransaction(keyring, transaction, toSignInputs, verifySig);
      transaction = await this.signAndSubmitTransaction(transaction, isRBF);

      const outputIndexOfFee = transaction.outputs.length == 1 ? 0 : 1;
      await this.walletAddPendingTx(
        'sendkas',
        transaction,
        result.amount,
        account.address,
        account.address,
        '',
        outputIndexOfFee,
        toSignInputs
      );
      txSeralizedJSONs.push(tx);
    }
    const len = txSeralizedJSONs.length;
    return txSeralizedJSONs[len > 0 ? len - 1 : 0];
  };

  updateApprovalHistory = async ({ origin, fnName, params }: { origin: string; fnName: string; params: string }) => {
    try {
      const networkId = preferenceService.getNetworkId();
      const account = await this.getCurrentAccount();
      if (!account) throw new Error('no current account');
      const address = account.address;
      const time = Date.now();
      const jsonData = { time, origin, fnName, params: params?.slice(0, 512) };
      preferenceService.updateApprovalHistory(networkId, address, jsonData);
    } catch (error) {
      console.error('Error updating approval history:', error);
    }
  };
  getApprovalHistory = (networkId: string, address: string) => preferenceService.getApprovalHistory(networkId, address);

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
      const { pubkey, index, deriveType, evmAddress } = displayedKeyring.accounts[j];
      const accountIndex = Number('1' + deriveType.toString() + index.toString());
      const pubkeyMap = {};
      const addressMap = {};
      const address = keyringService.publicKeyToAddress(pubkey, addressType, networkType);
      // for (let i = 0; i < activeChains.length; i++) {
      // switch (activeChains[i]) {
      //   case KASPA_CHAINS_ENUM.KASPA_MAINNET:
      // case KASPA_CHAINS_ENUM.KASPA_TN10:
      // case KASPA_CHAINS_ENUM.KASPA_TN11:
      // addressMap[activeChains[i]] = keyringService.publicKeyToAddress(pubkey, addressType, networkType);
      // pubkeyMap[activeChains[i]] = pubkey;
      // break;
      // case KASPA_CHAINS_ENUM.KASPLEX_MAINNET:
      // case KASPA_CHAINS_ENUM.ETH_MAINNET:
      // case KASPA_CHAINS_ENUM.KASPLEX_TN10:
      // case KASPA_CHAINS_ENUM.KASPLEX_TN11:
      // addressMap[activeChains[i]] = evmAddress || '';
      // pubkeyMap[activeChains[i]] = evmAddress;
      // break;
      // }
      // }
      // const accountKey = key + '#' + j;
      const accountKey = pubkey.slice(0, 10);
      const defaultName = this.getAlianName(pubkey) || this._generateAlianName(type, j + 1);
      const alianName = preferenceService.getAccountAlianName(accountKey, defaultName);
      const flag = preferenceService.getAddressFlag(address);
      accounts.push({
        type,
        pubkey,
        pubkeyMap,
        address,
        evmAddress: toChecksumHexAddress(evmAddress || ''),
        addressMap,
        alianName,
        index: accountIndex,
        deriveType,
        key: accountKey,
        flag
      });
    }
    const hdPath = type === KEYRING_TYPE.HdKeyring ? displayedKeyring.keyring.hdPath : '';
    // const hdPathMap = type === KEYRING_TYPE.HdKeyring ? displayedKeyring.keyring.hdPathMap : new Map<KASPA_CHAINS_ENUM, string>();

    const alianName = preferenceService.getKeyringAlianName(
      key,
      initName ? `${KEYRING_TYPES[type].alianName} ${index + 1}` : ''
    );
    // const balanceMap = {};
    // for (const chain of activeChains) {
    //   balanceMap[chain] = 0;
    // }
    const keyring: WalletKeyring = {
      index,
      key,
      type,
      addressType,
      accounts,
      alianName,
      hdPath,
      // hdPathMap,
      balanceKas: 0
      // balanceMap
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
    // log.debug('preference account', account);
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

  setEditingKeyring = (index: number) => preferenceService.setEditingKeyringIndex(index);

  getEditingAccount = () => preferenceService.getEditingAccount();

  setEditingAccount = (account: Account) => preferenceService.setEditingAccount(account);

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
      log.debug(e);
      return appTab.summary;
    }
  };

  fetchNotice = (jsonFile: ConfigJSON) => openapiService.fetchNotice(jsonFile);

  readTab = () => preferenceService.setReadTabTime(Date.now());

  readApp = (appid: number) => preferenceService.setReadAppTime(appid, Date.now());

  getConnectedSite = (key: string) => permissionService.getConnectedSite(key);

  getSite = (origin: string) => permissionService.getSite(origin);

  getConnectedSites = () => permissionService.getConnectedSites();

  setRecentConnectedSites = (sites: ConnectedSite[]) => permissionService.setRecentConnectedSites(sites);

  getRecentConnectedSites = () => permissionService.getRecentConnectedSites();

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
      chain: KASPA_CHAINS_ENUM.KASPA_MAINNET,
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
    preferenceService.setAccountAlianName(account.pubkey.slice(0, 10), name);
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

  getFeeSummary = () => openapiService.getFeeSummary();

  decodePsbt = async (psbtHex: string) => {
    const currentAccount = preferenceService.getCurrentAccount();
    return openapiService.decodePsbt(psbtHex, currentAccount?.address);
  };

  decodePskt = (psktJsonString: string, options?: SignPsktOptions) =>
    openapiService.decodePskt(psktJsonString, options);

  getSkippedVersion = () => preferenceService.getSkippedVersion();

  setSkippedVersion = (version: string) => preferenceService.setSkippedVersion(version);

  setIsResolver = (arg0: boolean, networkId: string) => preferenceService.setRpcLinksIsResolver(arg0, networkId);

  getIsResolver = (networkId: string) => preferenceService.getRpcLinksIsResolver(networkId);

  setResolverUrls = (urls: string[], networkId: string) => preferenceService.setRpcLinksResolverUrls(urls, networkId);

  getResolverUrls = (networkId: string) => preferenceService.getRpcLinksResolverUrls(networkId);

  checkWebsite = (website: string) => openapiService.checkWebsite(website);

  // it's used for ori. ---from shawn
  getAddressSummary = async (address: string) => {
    const data = await openapiService.getAddressSummary(address);
    // preferenceService.updateAddressBalance(address, data);
    return data;
  };

  getShowSafeNotice = () => preferenceService.getShowSafeNotice();

  setShowSafeNotice = (show: boolean) => preferenceService.setShowSafeNotice(show);

  getVersionDetail = (version: string) => openapiService.getVersionDetail(version);

  isValidKaspaAddr = (addr: string) => {
    try {
      const bool = Address.validate(addr);
      return bool;
    } catch (e) {
      log.debug(e);
      return false;
    }
  };
  fetchKRC20TokenPrice = async () => {
    const lastTime = preferenceService.getLastUpdateTime();
    const now = new Date().getTime();
    const differenceMinute = (now - lastTime) / (1000 * 60);
    let tokenPrice = [] as IKRC20TokenPrice[];
    if (differenceMinute > 60) {
      const res = await openapiService.fetchKRC20TokenPrice();
      if (res && res.length > 0) {
        tokenPrice = res;
        preferenceService.updateKrc20TokenPrice(tokenPrice);
      } else {
        tokenPrice = preferenceService.getKRC20TokenPrice();
      }
    } else {
      tokenPrice = preferenceService.getKRC20TokenPrice();
    }
    return tokenPrice;
  };
  fetchOrderStatus = (orderId: string) => openapiService.fetchOrderStatus(orderId);

  updateRecentSendToAddressKaspa = (networkId: string, address: string, sendToAddress: string) =>
    preferenceService.updateRecentSendToAddressKaspa(networkId, address, sendToAddress);
  getRecentSendToAddressKaspa = (networkId: string, address: string) =>
    preferenceService.getRecentSendToAddressKaspa(networkId, address);

  estimateKaspaTransactionFee = async (outputs: [string, string][]) => {
    const account = preferenceService.getCurrentAccount();
    if (!account) throw new Error('no current account');
    const networkId = preferenceService.getNetworkId();
    const entries = await openapiService.getKASUtxoEntryReferences([account.address]);
    const preparedTxn = {
      entries,
      outputs: outputs.map((output) => ({
        address: account.address,
        amount: kaspaToSompi(output[1]) as bigint
      })),
      changeAddress: account.address,
      priorityFee: BigInt(0),
      feeRate: await openapiService.getLowFeeRate(),
      networkId
    };

    const estimate = await estimateTransactions(preparedTxn);

    return sompiToKaspaString(estimate.fees);
  };
  estimateKRC20TransactionFee = async (inscribeJsonString: string): Promise<string> => {
    const account = preferenceService.getCurrentAccount();
    if (!account) throw new Error('no current account');
    const publicKey = account.pubkey;
    const networkId = preferenceService.getNetworkId();
    const keyring = await this.getCurrentKeyring();
    if (!keyring) throw new Error('no current keyring');
    const addressType = keyring.addressType;
    const { redeemScript, commitAddress } = this.getScriptInfo(inscribeJsonString, publicKey, addressType, networkId);

    const entries = await openapiService.getKASUtxoEntryReferences([account.address]);

    const commitSettings: IGeneratorSettingsObject = {
      priorityEntries: [],
      entries,
      outputs: [
        {
          address: commitAddress,
          amount: kaspaToSompi(COMMIT_AMOUNT) as bigint
        }
      ],
      changeAddress: account.address,
      priorityFee: BigInt(0),
      networkId
    };

    const commitResult = await createTransactions(commitSettings);
    const commitTxn = commitResult.transactions[commitResult.transactions.length - 1];
    const commitSummary = commitResult.summary;

    const scriptFee = calculateScriptExtraFee(redeemScript, 1);

    const revealSettings: IGeneratorSettingsObject = {
      priorityEntries: [
        {
          address: new Address(commitAddress),
          outpoint: { transactionId: commitTxn.id, index: 0 },
          amount: commitTxn.transaction.outputs[0].value,
          scriptPublicKey: commitTxn.transaction.outputs[0].scriptPublicKey,
          blockDaaScore: BigInt(0),
          isCoinbase: false
        } as IUtxoEntry
      ],
      entries,
      outputs: [],
      changeAddress: account.address,
      priorityFee: scriptFee,
      feeRate: await openapiService.getLowFeeRate(),
      networkId
    };

    const revealEstimateResult = await estimateTransactions(revealSettings);
    const totalFee = commitSummary.fees + revealEstimateResult.fees;

    return sompiToKaspaString(totalFee);
  };

  // getKNSAssets = async (address: string, currentPage: number, pageSize: number) => {
  //   const size = pageSize;
  //   const res = await openapiService.getKNSAssets(address, currentPage, size);
  //   const list = res.assets;
  //   const total = res.pagination.totalItems;
  //   return {
  //     currentPage,
  //     pageSize,
  //     total,
  //     list
  //   };
  // };
  queryDomainInfo = (domain: string) => openapiService.getKNSDomainInfo(domain);
  updateKRC20History = (networkId: TNetworkId, fromAddress: string, inscribeJsonStr: string) =>
    preferenceService.updateKrc20History(networkId, fromAddress, inscribeJsonStr);
  getAllVisibleAccounts: () => Promise<DisplayedKeyring[]> = async () => {
    const typedAccounts = await keyringService.getAllTypedVisibleAccounts();
    return typedAccounts;
    // return typedAccounts.map((account) => ({
    //   ...account,
    //   keyring: new DisplayKeyring(account.keyring)
    // }));
  };
  bridgeForIgra = async ({
    l1ReceiveAddress,
    l2ToAddress,
    amount,
    isRBF = false,
    chainId
  }: {
    l1ReceiveAddress: string;
    l2ToAddress: string;
    amount: string;
    isRBF?: boolean;
    chainId: number;
  }) => {
    const idPrefix = chainId === 38833 ? [151, 177] : [151, 180];
    const keyring = await this.getCurrentKeyring();
    if (!keyring) throw new Error('no current keyring');
    const addressType = keyring.addressType;

    const currentAccount = preferenceService.getCurrentAccount();
    if (!currentAccount) throw new Error('no current account');
    const currentAddress = currentAccount.address;
    const publicKey = currentAccount.pubkey;
    const utxos = await openapiService.rpc.getUtxosByAddresses([currentAddress]);
    if (!utxos) {
      throw new Error('fetch utxo failed');
    }
    const toSompi = BigInt(amountToSompi(amount, 8));

    const output0 = new PaymentOutput(new Address(l1ReceiveAddress), toSompi);
    const baseSetting: IGeneratorSettingsObject = {
      outputs: [output0],
      changeAddress: currentAddress,
      entries: utxos.entries,
      networkId: preferenceService.getNetworkId(),
      priorityFee: BigInt(100000)
    };

    const maxIterations = 10000000;
    const startNonce = Math.floor(Math.random() * 100000);
    let foundNonce: number | null = null;
    const deadline = Date.now() + 30000;

    for (let i = 0; i < maxIterations; i++) {
      if (Date.now() > deadline) {
        log.debug('bridgeForIgra: nonce search timed out after 30s');
        break;
      }
      const nonce = (startNonce + i) % maxIterations;
      const bufferData = buildIgraEntryPayload({ l2AddressHex: l2ToAddress, amount: toSompi, nonce });
      baseSetting.payload = new Uint8Array(bufferData);
      const generator = new Generator(baseSetting);
      const id = (await generator.estimate()).finalTransactionId;
      if (!id) continue;

      log.debug('bridgeForIgra id', i, id, nonce, 'target prefix : 0x97b4');
      const buffer = Buffer.from(id, 'hex');
      const idBytes = Uint8Array.from(buffer);
      if (idBytes && idBytes[0] === idPrefix?.[0] && idBytes[1] === idPrefix?.[1]) {
        foundNonce = nonce;
        break;
      }
    }

    if (foundNonce === null) {
      return {
        success: false,
        txSeralizedJSON: '',
        error: 'No valid nonce found this time. Please try again.'
      };
    }

    const bufferData = buildIgraEntryPayload({
      l2AddressHex: l2ToAddress,
      amount: toSompi,
      nonce: foundNonce
    });

    baseSetting.payload = new Uint8Array(bufferData);
    const generator = new Generator(baseSetting);
    const _keyring = keyringService.keyrings[keyring.index];
    let pending;
    const txSeralizedJSONs: string[] = [];
    while ((pending = await generator.next())) {
      let transaction: Transaction = pending.transaction;
      const txInputs = transaction.inputs;
      const utxoAddresses = txInputs.map((input) => input.utxo?.address?.toString());
      const isAllSourceUtxos = utxoAddresses.every((address) => address === currentAddress || address === undefined);
      if (!isAllSourceUtxos) continue;

      const tx = transaction.serializeToSafeJSON();
      const txFee = pending.feeAmount as bigint;
      if (txFee >= toSompi) throw new Error('Tx fee is larger than transfer amount, please check your balance.');

      const toSignInputs: ToSignInput[] = Array.from({ length: transaction.inputs.length }, (_, i) => {
        return { index: i, publicKey, sighashTypes: [1] };
      });
      const verifySig = addressType != AddressType.KASPA_TANGEM_44_111111;
      transaction = await this.walletSignTransaction(keyring, transaction, toSignInputs, verifySig);
      transaction = await this.signAndSubmitTransaction(transaction, isRBF);

      // disable RBF feature for igra entry tx to avoid mutate transaction ID
      // const outputIndexOfFee = transaction.outputs.length == 1 ? 0 : 1;
      // await this.walletAddPendingTx(
      //   'sendkas',
      //   transaction,
      //   Number(amount),
      //   currentAddress,
      //   currentAddress,
      //   '',
      //   outputIndexOfFee,
      //   toSignInputs
      // );
      txSeralizedJSONs.push(tx);
    }
    const len = txSeralizedJSONs.length;
    return {
      success: true,
      txSeralizedJSON: txSeralizedJSONs[len > 0 ? len - 1 : 0]
    };
  };
  private newTransaction = (
    inputs: (ITransactionInput | TransactionInput)[],
    outputs: (ITransactionOutput | TransactionOutput)[],
    payload?: HexString
  ) => {
    const transaction = new Transaction({
      inputs,
      outputs,
      lockTime: BigInt(0),
      subnetworkId: '0000000000000000000000000000000000000000',
      version: 0,
      gas: BigInt(0),
      payload: payload || ''
    });
    return transaction;
  };
}

export default new WalletController();
