import compareVersions from 'compare-versions';
import dayjs from 'dayjs';
import cloneDeep from 'lodash/cloneDeep';
import log from 'loglevel';

import { createPersistStore } from '@/background/utils';
import type { AddressFlagType } from '@/shared/constant';
import { KASPA_EVENTS, NETWORK_TYPES } from '@/shared/constant';
import { SUPPORT_LOCALES } from '@/shared/constant/i18n';
import eventBus from '@/shared/eventBus';
import type {
  Account,
  AppSummary,
  CURRENCIES,
  IApprovalHistoryItem,
  IKRC20OTCOrder,
  IKRC20TokenIntro,
  IKRC20TokenPrice,
  INetworkType,
  IOrder,
  KaspaBalance,
  TNetworkId,
  TxHistoryItem
} from '@/shared/types';
import { AddressType, NetworkType } from '@/shared/types';
import type { ChainGas, GasCache } from '@/shared/types/gas';
import type { IHighlightedAddress, Token } from '@/shared/types/preference';
import { isSameAddress } from '@/shared/utils/address';

import type { addedToken } from '@/shared/types/preference';
import browser from '../../shared/webapi/browser';
import { storage } from '../webapi';
import { i18n, sessionService } from './index';

// eslint-disable-next-line no-undef
const version = process.env.release || '0';
export interface AddressSortStore {
  search: string;
  sortType: 'usd' | 'addressType' | 'alphabet';
  lastScrollOffset?: number;
  lastCurrentRecordTime?: number;
}

const defaultAddressSortStore: AddressSortStore = {
  search: '',
  sortType: 'usd'
};

export interface PreferenceStore {
  currentKeyringIndex: number;
  currentAccount: Account | undefined | null;
  externalLinkAck: boolean;
  hiddenAddresses: Account[];
  balanceMap: {
    [address: string]: KaspaBalance;
  };
  krc20OtcMap: {
    [networkId: string]: { [address: string]: { [id: string]: IKRC20OTCOrder } };
  };
  krc20History: {
    [networkId: string]: { [address: string]: string[] };
  };
  krc20DecName: {
    [networkId: string]: { [contractAddress: string]: { dec: string; name: string } };
  };
  krc20CaToName: {
    [ca: string]: string;
  };
  krc20TokenDec: {
    [tick: string]: string;
  };
  recentSendToAddressKaspa: {
    [networkId: string]: {
      [address: string]: {
        address: string;
        time: number;
      }[];
    };
  };
  chaingeSwapOrder: {
    [networkId: string]: { [address: string]: IOrder[] };
  };
  hibitSwapOrder: {
    [networkId: string]: { [address: string]: IOrder[] };
  };
  approvalHistory: {
    [networkId: string]: { [address: string]: string[] };
  };
  krc20TokenPrice: IKRC20TokenPrice[];
  /**
   * @deprecated
   */
  krc20TokenIntros: {
    [tick: string]: IKRC20TokenIntro;
  };
  lastUpdateTime: number;
  /**
   * @deprecated
   */
  lastUpdateTimeTokenIntros: number;
  historyMap: {
    [address: string]: TxHistoryItem[];
  };
  /**
   * @deprecated
   */
  useLedgerLive: boolean;
  locale: string;
  mintCount: number;
  watchAddressPreference: Record<string, number>;
  isDefaultWallet: boolean;
  highligtedAddresses: IHighlightedAddress[];
  walletSavedList: [];
  alianNames?: Record<string, string>;
  initAlianNames: boolean;
  gasCache: GasCache;
  currentVersion: string;
  firstOpen: boolean;
  currency: keyof typeof CURRENCIES;
  addressType: AddressType;
  // /**
  //  * @deprecated
  //  */
  // tabsStatus: Record<TTabKey, boolean>;
  networkType: NetworkType;
  networkId: TNetworkId;
  // activeChains: KASPA_CHAINS_ENUM[];
  // tn10ActiveChains: KASPA_CHAINS_ENUM[];
  autoLockMinutes: number;
  rpcLinks: {
    [networkId: string]: INetworkType;
  };
  keyringAlianNames: {
    [key: string]: string;
  };
  accountAlianNames: {
    [key: string]: string;
  };
  editingKeyringIndex: number;
  editingAccount: Account | undefined | null;
  skippedVersion: string;
  appTab: {
    summary: AppSummary;
    readTabTime: number;
    readAppTime: { [key: string]: number };
  };
  showSafeNotice: boolean;
  safeNoticeContent?: string;
  addressFlags: { [key: string]: number };
  pinnedChain: string[];
  /**
   * @deprecated
   */
  addedToken: addedToken;
  sendLogTime?: number;
  needSwitchWalletCheck?: boolean;
  sendEnableTime?: number;
  customizedToken?: Token[];
  blockedToken?: Token[];
  collectionStarred?: Token[];
  hiddenBalance?: boolean;
  isShowTestnet?: boolean;
  addressSortStore: AddressSortStore;
  safeSelfHostConfirm?: Record<string, boolean>;
  /** @deprecated */
  reserveGasOnSendToken?: boolean;
  isHideEcologyNoticeDict?: Record<string | number, boolean>;
  sendTxToKaspa: boolean;
}

const initialStore: PreferenceStore = {
  currentKeyringIndex: 0,
  currentAccount: undefined,
  externalLinkAck: false,
  hiddenAddresses: [],
  editingKeyringIndex: 0,
  // activeChains: [KASPA_CHAINS_ENUM.KASPA_MAINNET],
  // tn10ActiveChains: [],
  editingAccount: undefined,
  balanceMap: {},
  krc20OtcMap: {},
  krc20History: {},
  krc20DecName: {},
  krc20CaToName: {},
  krc20TokenDec: {},
  recentSendToAddressKaspa: {},
  chaingeSwapOrder: {},
  hibitSwapOrder: {},
  approvalHistory: {},
  krc20TokenPrice: [],
  krc20TokenIntros: {},
  lastUpdateTime: 0,
  lastUpdateTimeTokenIntros: 0,
  historyMap: {},
  useLedgerLive: false,
  locale: 'en',
  mintCount: 0,
  watchAddressPreference: {},
  isDefaultWallet: false,
  highligtedAddresses: [],
  walletSavedList: [],
  alianNames: {},
  initAlianNames: false,
  gasCache: {},
  currentVersion: '0',
  firstOpen: false,
  currency: 'USD',
  addressType: AddressType.KASPA_44_111111,
  networkType: NetworkType.Mainnet,
  // tabsStatus: initialTabsStatus,
  networkId: 'mainnet',
  autoLockMinutes: 5,
  rpcLinks: NETWORK_TYPES,
  keyringAlianNames: {},
  accountAlianNames: {},
  skippedVersion: '',
  appTab: {
    summary: { apps: [] },
    readAppTime: {},
    readTabTime: 1
  },
  showSafeNotice: false,
  safeNoticeContent: undefined,
  addressFlags: {},
  pinnedChain: [],
  addedToken: {},
  sendLogTime: 0,
  needSwitchWalletCheck: true,
  sendEnableTime: 0,
  customizedToken: [],
  blockedToken: [],
  collectionStarred: [],
  hiddenBalance: false,
  isShowTestnet: true,
  addressSortStore: {
    ...defaultAddressSortStore
  },
  reserveGasOnSendToken: false,
  isHideEcologyNoticeDict: {},
  safeSelfHostConfirm: {},
  sendTxToKaspa: true
};

class PreferenceService {
  store!: PreferenceStore;
  popupOpen = false;
  hasOtherProvider = false;

  init = async (resetStorage = false) => {
    const defaultLang = 'en';
    this.store = await createPersistStore<PreferenceStore>({
      name: 'preference',
      template: initialStore,
      fromStorage: !resetStorage
    });
    if (!this.store.locale || !SUPPORT_LOCALES.includes(this.store.locale)) {
      this.store.locale = defaultLang;
    }
    i18n.changeLanguage(this.store.locale);
    if (this.store.isDefaultWallet === undefined || this.store.isDefaultWallet === null) {
      this.store.isDefaultWallet = false;
    }
    if (!this.store.highligtedAddresses) {
      this.store.highligtedAddresses = [];
    }

    if (this.store.mintCount != 0) {
      this.store.mintCount = 0;
    }

    if (!this.store.currency) {
      this.store.currency = 'USD';
    }

    if (!this.store.initAlianNames) {
      this.store.initAlianNames = false;
    }
    if (!this.store.gasCache) {
      this.store.gasCache = {};
    }
    if (!this.store.externalLinkAck) {
      this.store.externalLinkAck = false;
    }
    if (!this.store.hiddenAddresses) {
      this.store.hiddenAddresses = [];
    }
    if (!this.store.balanceMap) {
      this.store.balanceMap = {};
    }

    if (!this.store.krc20OtcMap) {
      this.store.krc20OtcMap = {};
    }
    if (!this.store.krc20History) {
      this.store.krc20History = {};
    }
    if (!this.store.krc20DecName) {
      this.store.krc20DecName = {};
    }
    if (!this.store.krc20CaToName) {
      this.store.krc20CaToName = {};
    }
    if (!this.store.krc20TokenDec) {
      this.store.krc20TokenDec = {};
    }
    if (!this.store.recentSendToAddressKaspa) {
      this.store['recentSendToAddressKaspa'] = {};
    }
    if (!this.store.chaingeSwapOrder) {
      this.store.chaingeSwapOrder = {};
    }
    if (!this.store.hibitSwapOrder) {
      this.store.hibitSwapOrder = {};
    }
    if (!this.store.approvalHistory) {
      this.store.approvalHistory = {};
    }
    if (!this.store.krc20TokenPrice) {
      this.store.krc20TokenPrice = [];
    }
    if (!this.store.krc20TokenIntros) {
      this.store.krc20TokenIntros = {};
    }
    if (!this.store.lastUpdateTime) {
      this.store.lastUpdateTime = 0;
    }
    if (!this.store.lastUpdateTimeTokenIntros) {
      this.store.lastUpdateTimeTokenIntros = 0;
    }

    if (!this.store.historyMap) {
      this.store.historyMap = {};
    }

    if (!this.store.walletSavedList) {
      this.store.walletSavedList = [];
    }

    if (this.store.addressType === undefined || this.store.addressType === null) {
      this.store.addressType = AddressType.KASPA_44_111111;
    }

    if (!this.store.networkType) {
      this.store.networkType = NetworkType.Mainnet;
      this.store.networkId = 'mainnet';
    }
    // if (!this.store.activeChains) this.store.activeChains = [KASPA_CHAINS_ENUM.KASPA_MAINNET, KASPA_CHAINS_ENUM.KASPLEX_MAINNET];
    // if (!this.store.tn10ActiveChains) this.store.tn10ActiveChains = [KASPA_CHAINS_ENUM.KASPA_TN10, KASPA_CHAINS_ENUM.KASPLEX_TN10];
    if (!this.store.autoLockMinutes) this.store.autoLockMinutes = 5;
    if (!this.store.networkId) {
      const currentNetworkType = this.store.networkType;
      switch (currentNetworkType) {
        case NetworkType.Testnet:
          this.store.networkId = 'testnet-10';
          break;
        case NetworkType.Mainnet:
          this.store.networkId = 'mainnet';
          break;
        case NetworkType.Devnet:
          this.store.networkId = 'devnet';
          break;
        case NetworkType.Simnet:
          this.store.networkId = 'simnet';
          break;
        default:
          break;
      }
    }
    if (!this.store.rpcLinks || Array.isArray(this.store.rpcLinks)) {
      this.store.rpcLinks = NETWORK_TYPES;
    }
    if (!this.store.rpcLinks['mainnet']) this.store.rpcLinks['mainnet'] = NETWORK_TYPES['mainnet'];
    if (!this.store.rpcLinks['testnet-12']) this.store.rpcLinks['testnet-12'] = NETWORK_TYPES['testnet-12'];
    if (!this.store.rpcLinks['testnet-11']) this.store.rpcLinks['testnet-11'] = NETWORK_TYPES['testnet-11'];
    if (!this.store.rpcLinks['testnet-10']) this.store.rpcLinks['testnet-10'] = NETWORK_TYPES['testnet-10'];
    if (!this.store.rpcLinks['devnet']) this.store.rpcLinks['devnet'] = NETWORK_TYPES['devnet'];
    if (this.store.currentAccount) {
      if (!this.store.currentAccount.pubkey) {
        // old version.
        this.store.currentAccount = undefined; // will restored to new version
      }
    }

    if (!this.store.keyringAlianNames) {
      this.store.keyringAlianNames = {};
    }

    if (!this.store.accountAlianNames) {
      this.store.accountAlianNames = {};
    }

    if (!this.store.skippedVersion) {
      this.store.skippedVersion = '';
    }

    if (!this.store.appTab) {
      this.store.appTab = { summary: { apps: [] }, readTabTime: 1, readAppTime: {} };
    }

    if (!this.store.appTab.readAppTime) {
      this.store.appTab.readAppTime = {};
    }

    if (typeof this.store.showSafeNotice !== 'boolean') {
      this.store.showSafeNotice = false;
    }
    if (!this.store.addressFlags) {
      this.store.addressFlags = {};
    }
    if (!this.store.pinnedChain) {
      this.store.pinnedChain = [];
    }
    if (!this.store.addedToken) {
      this.store.addedToken = {};
    }
    if (!this.store.sendLogTime) {
      this.store.sendLogTime = 0;
    }
    if (this.store.needSwitchWalletCheck == null) {
      this.store.needSwitchWalletCheck = true;
    }
    if (!this.store.sendEnableTime) {
      this.store.sendEnableTime = 0;
    }
    if (!this.store.customizedToken) {
      this.store.customizedToken = [];
    }
    if (!this.store.blockedToken) {
      this.store.blockedToken = [];
    }
    if (!this.store.collectionStarred) {
      this.store.collectionStarred = [];
    }
    if (!this.store.hiddenBalance) {
      this.store.hiddenBalance = false;
    }
    if (!this.store.isShowTestnet) {
      this.store.isShowTestnet = true;
    }
    if (!this.store.addressSortStore) {
      this.store.addressSortStore = {
        ...defaultAddressSortStore
      };
    }
    if (!this.store.isHideEcologyNoticeDict) {
      this.store.isHideEcologyNoticeDict = {};
    }
    if (!this.store.safeSelfHostConfirm) {
      this.store.safeSelfHostConfirm = {};
    }
    if (this.store.sendTxToKaspa == undefined) {
      this.store.sendTxToKaspa = true;
    }
  };

  clearPreference = async () => {
    await storage.remove('preference');
    await this.init(true);
  };

  getAcceptLanguages = async () => {
    let langs = await browser.i18n.getAcceptLanguages();
    if (!langs) langs = [];
    return langs.map((lang) => lang.replace(/-/g, '_')).filter((lang) => SUPPORT_LOCALES.includes(lang));
  };
  getCurrentAccount = () => {
    return cloneDeep(this.store.currentAccount);
  };

  setCurrentAccount = (account?: Account | null) => {
    this.store.currentAccount = account;
    if (account) {
      sessionService.broadcastEvent('accountsChanged', [account.address]);
      eventBus.emit(KASPA_EVENTS.broadcastToUI, {
        method: 'accountsChanged',
        params: account
      });
    }
  };

  // popupOpen
  setPopupOpen = (isOpen: boolean) => {
    this.popupOpen = isOpen;
  };

  getPopupOpen = () => {
    return this.popupOpen;
  };

  // addressBalance
  updateAddressBalance = (address: string, data: KaspaBalance) => {
    const balanceMap = this.store.balanceMap || {};
    this.store.balanceMap = {
      ...balanceMap,
      [address]: data
    };
  };

  updateAddressKrc20Otc = (networkId: string, address: string, data: IKRC20OTCOrder) => {
    const krc20OtcMap = this.store.krc20OtcMap || {};
    const networkIdkrc20Otc = this.store.krc20OtcMap[networkId] || {};
    const addresskrc20Otc = networkIdkrc20Otc[address] || {};
    if (data.id) {
      const id = Number(data.id);
      const dataMap = { ...addresskrc20Otc, [id]: data };
      this.store.krc20OtcMap = {
        ...krc20OtcMap,
        [networkId]: { ...networkIdkrc20Otc, [address]: dataMap }
      };
    }
  };
  updateKrc20DecName = (networkId: string, contractAddress: string, dec: string, name: string) => {
    if (!networkId || !contractAddress || !dec || !name) return;
    const map = this.store.krc20DecName || {};
    const networkIdMap = map[networkId] || {};
    this.store.krc20DecName = {
      ...map,
      [networkId]: { ...networkIdMap, [contractAddress]: { dec, name } }
    };
  };
  updateKrc20CaToName = (ca: string, name: string) => {
    const map = this.store.krc20CaToName || {};
    if (ca?.length > 0 && name?.length > 0) {
      this.store.krc20CaToName = {
        ...map,
        [ca]: name
      };
    }
  };
  /**
   * @param contractAddress - tick for mint mode and ca for issue mode
   */
  updateKrc20TokenDec = (contractAddress: string, dec: string) => {
    const map = this.store.krc20TokenDec || {};
    if (contractAddress?.length > 0 && dec?.length > 0) {
      this.store.krc20TokenDec = {
        ...map,
        [contractAddress]: dec
      };
    }
  };
  updateRecentSendToAddressKaspa = (networkId: string, address: string, sendToAddress: string) => {
    const networkAddresses = this.store.recentSendToAddressKaspa[networkId] || {};
    const array = (networkAddresses[address] || []).filter((item) => item.address !== sendToAddress);
    array.unshift({
      address: sendToAddress,
      time: new Date().getTime()
    });
    this.store.recentSendToAddressKaspa = {
      ...this.store.recentSendToAddressKaspa,
      [networkId]: { ...networkAddresses, [address]: array.slice(0, 5) }
    };
  };
  getRecentSendToAddressKaspa = (networkId: string, address: string): { address: string; time: number }[] => {
    const networkAddresses = this.store.recentSendToAddressKaspa[networkId] || {};
    const array = networkAddresses[address] || [];
    return array;
  };

  /**
   * @param contractAddress - tick for mint mode and ca for krc20 issue mode
   */
  getKrc20DecName = (networkId: string, contractAddress: string): { dec: string; name: string } | undefined => {
    const map = this.store.krc20DecName || {};
    const networkMap = map[networkId] || {};
    return networkMap[contractAddress] || undefined;
  };
  /**
   * @param ca - ca for krc20 issue mode
   */
  getKrc20CaToName = (ca: string) => {
    const map = this.store.krc20CaToName || {};
    return map[ca] || undefined;
  };
  /**
   * @param contractAddress - tick for mint mode and ca for issue mode
   */
  getKrc20TokenDec = (contractAddress: string) => {
    const map = this.store.krc20TokenDec || {};
    return map[contractAddress] || undefined;
  };

  updateKrc20History = (networkId: string, address: string, jsonString: string) => {
    const networkIdkrc20History = this.store.krc20History[networkId] || {};
    let array = networkIdkrc20History[address] || [];
    if (!array.includes(jsonString)) {
      array = [jsonString, ...array];
      this.store.krc20History = {
        ...this.store.krc20History,
        [networkId]: { ...networkIdkrc20History, [address]: array.slice(0, 30) }
      };
    }
  };

  updateChaingeSwapOrder = (networkId: string, address: string, order: IOrder) => {
    const networkSwapOrder = this.store.chaingeSwapOrder[networkId] || {};
    let array = networkSwapOrder[address] || [];
    const index = array.findIndex((item) => item.orderId === order.orderId);
    if (index !== -1) {
      // array.splice(index, 1);
      // array = [order, ...array];
      array = array.map((item) => {
        if (item.orderId === order.orderId) {
          return order;
        } else {
          return item;
        }
      });
    }
    if (index === -1) {
      array = [order, ...array];
    }
    this.store.chaingeSwapOrder = {
      ...this.store.chaingeSwapOrder,
      [networkId]: { ...networkSwapOrder, [address]: array.slice(0, 50) }
    };
  };
  getHibitSwapOrder = (networkId: string, address: string): IOrder[] => {
    const networkSwapOrder = this.store.hibitSwapOrder[networkId] || {};
    let array = networkSwapOrder[address] || [];

    array = array.filter((item) => {
      const now = new Date().getTime();
      const differenceDay = (now - item.time) / (1000 * 60 * 60 * 24);
      return differenceDay < 100;
    });

    this.store.hibitSwapOrder = {
      ...this.store.hibitSwapOrder,
      [networkId]: { ...networkSwapOrder, [address]: array }
    };

    return this.store.hibitSwapOrder?.[networkId]?.[address] || [];
  };
  updateHibitSwapOrder = (networkId: string, address: string, order: IOrder) => {
    const networkSwapOrder = this.store.hibitSwapOrder[networkId] || {};
    let array = networkSwapOrder[address] || [];
    const index = array.findIndex((item) => item.orderId === order.orderId);
    if (index !== -1) {
      array = array.map((item) => {
        if (item.orderId === order.orderId) {
          return order;
        } else {
          return item;
        }
      });
    }
    if (index === -1) {
      array = [order, ...array];
    }
    this.store.hibitSwapOrder = {
      ...this.store.hibitSwapOrder,
      [networkId]: { ...networkSwapOrder, [address]: array.slice(0, 50) }
    };
  };
  removeKrc20History = (networkId: string, address: string, jsonString: string) => {
    const networkIdkrc20History = this.store.krc20History[networkId] || {};
    let array = networkIdkrc20History[address] || [];
    if (array.includes(jsonString)) {
      array = array.filter((item) => item !== jsonString);
      this.store.krc20History = {
        ...this.store.krc20History,
        [networkId]: { ...networkIdkrc20History, [address]: array }
      };
    }
    // log.debug('this.store.krc20History', this.store.krc20History[networkId][address]);
  };

  getKrc20History = (networkId: string, address: string): string[] => {
    return this.store.krc20History?.[networkId]?.[address] || [];
  };

  getChaingeSwapOrder = (networkId: string, address: string): IOrder[] => {
    const networkSwapOrder = this.store.chaingeSwapOrder[networkId] || {};
    let array = networkSwapOrder[address] || [];

    array = array.filter((item) => {
      const now = new Date().getTime();
      const differenceDay = (now - item.time) / (1000 * 60 * 60 * 24);
      return differenceDay < 100;
    });

    this.store.chaingeSwapOrder = {
      ...this.store.chaingeSwapOrder,
      [networkId]: { ...networkSwapOrder, [address]: array }
    };

    return this.store.chaingeSwapOrder?.[networkId]?.[address] || [];
  };

  getApprovalHistory = (networkId: string, address: string): IApprovalHistoryItem[] => {
    const data = this.store.approvalHistory?.[networkId]?.[address] || [];
    if (data && data.length > 0) {
      const jsonData = data.map((item) => JSON.parse(item) as IApprovalHistoryItem);
      return jsonData;
    }
    return [];
  };

  updateApprovalHistory = (networkId: string, address: string, jsonData: IApprovalHistoryItem) => {
    const networkIdkrc20History = this.store.approvalHistory[networkId] || {};
    let array = networkIdkrc20History[address] || [];
    const jsonString = JSON.stringify(jsonData);
    if (!array.includes(jsonString)) {
      array = [jsonString, ...array];
    }

    // Filter records within 3 months and keep max 20
    const APPROVAL_HISTORY_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
    const APPROVAL_HISTORY_MAX_ITEMS = 20;
    const threeMonthsAgo = Date.now() - APPROVAL_HISTORY_MAX_AGE_MS;
    const filteredArray = array
      .map((item) => {
        try {
          return JSON.parse(item) as IApprovalHistoryItem;
        } catch {
          return null; // Filter out corrupted entries
        }
      })
      .filter((item): item is IApprovalHistoryItem => item !== null && item.time >= threeMonthsAgo)
      .slice(0, APPROVAL_HISTORY_MAX_ITEMS)
      .map((item) => JSON.stringify(item));

    this.store.approvalHistory = {
      ...this.store.approvalHistory,
      [networkId]: { ...networkIdkrc20History, [address]: filteredArray }
    };
  };

  updateKrc20TokenPrice = (data: IKRC20TokenPrice[]) => {
    this.store.krc20TokenPrice = data;
    this.store.lastUpdateTime = new Date().getTime();
  };

  getKRC20TokenPrice = (): IKRC20TokenPrice[] => {
    return this.store.krc20TokenPrice || [];
  };
  /**
   * @deprecated
   */
  updateKrc20TokenIntros = (data: { [tick: string]: IKRC20TokenIntro }) => {
    this.store.krc20TokenIntros = data;
    this.store.lastUpdateTimeTokenIntros = new Date().getTime();
  };
  /**
   * @deprecated
   */
  getKRC20TokenIntros = (): {
    [tick: string]: IKRC20TokenIntro;
  } => {
    return this.store.krc20TokenIntros || {};
  };

  getLastUpdateTime = (): number => {
    return this.store.lastUpdateTime || 0;
  };
  /**
   * @deprecated
   */
  getLastUpdateTimeTokenIntros = (): number => {
    return this.store.lastUpdateTimeTokenIntros || 0;
  };

  removeAddressBalance = (address: string) => {
    const key = address;
    if (key in this.store.balanceMap) {
      const map = this.store.balanceMap;
      delete map[key];
      this.store.balanceMap = map;
    }
  };

  removeAddressKrc20Otc = (networkId: string, address: string) => {
    const key = address;
    const networkIdkrc20Otc = this.store.krc20OtcMap[networkId] || {};
    if (networkIdkrc20Otc[key]) {
      const map = networkIdkrc20Otc;
      delete map[key];
      this.store.krc20OtcMap[networkId] = map;
    }
  };

  getAddressBalance = (address: string): KaspaBalance | null => {
    const balanceMap = this.store.balanceMap || {};
    return balanceMap[address] || null;
  };

  getAddressKrc20OtcOrder = (
    networkId: string,
    address: string,
    id?: string
  ): IKRC20OTCOrder[] | IKRC20OTCOrder | null => {
    const networkIdkrc20Otc = this.store.krc20OtcMap[networkId] || {};
    const krc20OtcMap = networkIdkrc20Otc[address] || {};
    if (id) return krc20OtcMap[id] || null;
    return Object.values(krc20OtcMap) || null;
  };

  // addressHistory
  updateAddressHistory = (address: string, data: TxHistoryItem[]) => {
    const historyMap = this.store.historyMap || {};
    this.store.historyMap = {
      ...historyMap,
      [address]: data
    };
  };

  removeAddressHistory = (address: string) => {
    const key = address;
    if (key in this.store.historyMap) {
      const map = this.store.historyMap;
      delete map[key];
      this.store.historyMap = map;
    }
  };

  getAddressHistory = (address: string): TxHistoryItem[] => {
    const historyMap = this.store.historyMap || {};
    return historyMap[address] || [];
  };

  getExternalLinkAck = (): boolean => {
    return this.store.externalLinkAck;
  };

  setExternalLinkAck = (ack = false) => {
    this.store.externalLinkAck = ack;
  };

  // locale
  getLocale = () => {
    return this.store.locale;
  };

  setLocale = (locale: string) => {
    this.store.locale = locale;
    i18n.changeLanguage(locale);
  };
  resetAddressSortStoreExpiredValue = () => {
    if (
      !this.store.addressSortStore.lastCurrentRecordTime ||
      (this.store.addressSortStore.lastCurrentRecordTime &&
        dayjs().isAfter(dayjs.unix(this.store.addressSortStore.lastCurrentRecordTime).add(15, 'minute')))
    ) {
      this.store.addressSortStore = {
        ...this.store.addressSortStore,
        search: '',
        lastScrollOffset: undefined,
        lastCurrentRecordTime: undefined
      };
    }
  };
  getAddressSortStoreValue = (key: keyof AddressSortStore) => {
    if (['search', 'lastScrollOffset'].includes(key)) {
      this.resetAddressSortStoreExpiredValue();
    }
    return this.store.addressSortStore[key];
  };

  setAddressSortStoreValue = <K extends keyof AddressSortStore>(key: K, value: AddressSortStore[K]) => {
    if (['search', 'lastCurrent'].includes(key)) {
      this.store.addressSortStore = {
        ...this.store.addressSortStore,
        lastCurrentRecordTime: dayjs().unix()
      };
    }
    this.store.addressSortStore = {
      ...this.store.addressSortStore,
      [key]: value
    };
  };

  getMintCount = () => {
    return this.store.mintCount;
  };

  setMintCount = (mt: number) => {
    this.store.mintCount = mt;
  };

  // currency
  getCurrency = () => {
    return this.store.currency;
  };

  setCurrency = (currency: keyof typeof CURRENCIES) => {
    this.store.currency = currency;
  };
  setIsDefaultWallet = (val: boolean) => {
    this.store.isDefaultWallet = val;
    // todo: check if this is needed
    eventBus.emit(KASPA_EVENTS.broadcastToUI, {
      method: 'isDefaultWalletChanged',
      params: val
    });
  };

  getHasOtherProvider = () => {
    return this.hasOtherProvider;
  };

  setHasOtherProvider = (val: boolean) => {
    this.hasOtherProvider = val;
  };
  /** @deprecated */
  isReserveGasOnSendToken = () => {
    return this.store.reserveGasOnSendToken;
  };
  getHighlightedAddresses = () => {
    return (this.store.highligtedAddresses || []).filter((item) => !!item.brandName && !!item.address);
  };
  updateHighlightedAddresses = (list: IHighlightedAddress[]) => {
    this.store.highligtedAddresses = list;
  };

  removeHighlightedAddress = (item: IHighlightedAddress) => {
    this.store.highligtedAddresses = this.store.highligtedAddresses.filter(
      (highlighted) => !(isSameAddress(highlighted.address, item.address) && highlighted.brandName === item.brandName)
    );
  };

  getWalletSavedList = () => {
    return this.store.walletSavedList || [];
  };

  updateWalletSavedList = (list: []) => {
    this.store.walletSavedList = list;
  };

  getInitAlianNameStatus = () => {
    return this.store.initAlianNames;
  };

  changeInitAlianNameStatus = () => {
    this.store.initAlianNames = true;
  };
  getLastTimeGasSelection = (chainId: keyof GasCache): ChainGas | null => {
    const cache = this.store.gasCache[chainId];
    if (cache && cache.lastTimeSelect === 'gasPrice') {
      if (Date.now() <= (cache.expireAt || 0)) {
        return cache;
      } else if (cache.gasLevel) {
        return {
          lastTimeSelect: 'gasLevel',
          gasLevel: cache.gasLevel
        };
      } else {
        return null;
      }
    } else {
      return cache;
    }
  };

  updateLastTimeGasSelection = (chainId: keyof GasCache, gas: ChainGas) => {
    if (gas.lastTimeSelect === 'gasPrice') {
      this.store.gasCache = {
        ...this.store.gasCache,
        [chainId]: {
          ...this.store.gasCache[chainId],
          ...gas,
          expireAt: Date.now() + 3600000 // custom gasPrice will expire at 1h later
        }
      };
    } else {
      this.store.gasCache = {
        ...this.store.gasCache,
        [chainId]: {
          ...this.store.gasCache[chainId],
          ...gas
        }
      };
    }
  };

  // isFirstOpen
  getIsFirstOpen = () => {
    if (!this.store.currentVersion || compareVersions(version, this.store.currentVersion)) {
      this.store.currentVersion = version;
      this.store.firstOpen = true;
    }
    return this.store.firstOpen;
  };

  updateIsFirstOpen = () => {
    this.store.firstOpen = false;
  };

  // deprecate
  getAddressType = () => {
    return this.store.addressType;
  };

  // network type
  getNetworkType = () => {
    return this.store.networkType;
  };
  // getActiveChains = () => {
  //   const networkId = this.store.networkId;
  //   if (networkId == 'mainnet') return this.store.activeChains;
  //   else if (networkId == 'testnet-10') this.store.tn10ActiveChains;
  //   return this.store.activeChains;
  // };

  getNetworkId = () => {
    return this.store.networkId;
  };
  getAutoLockMinutes = () => {
    return this.store.autoLockMinutes;
  };

  getRpcLinks = () => {
    return this.store.rpcLinks;
  };

  setNetworkType = (networkType: NetworkType) => {
    this.store.networkType = networkType;
  };
  setNetworkId = (networkId: TNetworkId) => {
    this.store.networkId = networkId;
  };
  setAutoLockMinutes = (arg0: number) => {
    this.store.autoLockMinutes = arg0;
  };
  setRpcLinks = (rpcLinks: { [key: string]: INetworkType }) => {
    this.store.rpcLinks = rpcLinks;
  };
  setRpcLinksUrl = (rpcLinksUrl: string, networkId: string) => {
    const rpcLink = this.store.rpcLinks[networkId];
    const newRpcLink = { ...rpcLink, url: rpcLinksUrl };
    this.setRpcLinks({ ...this.store.rpcLinks, [networkId]: newRpcLink });
  };
  getRpcLinksUrl = (networkId: string) => {
    const rpcLinks = this.getRpcLinks();
    // const link = rpcLinks.find((r) => r.id == networkId);
    const link = rpcLinks[networkId];
    return link ? link.url : '';
  };

  getRpcLinksIsResolver = (networkId: string) => {
    const rpcLinks = this.getRpcLinks();
    const link = rpcLinks[networkId];
    return link?.isResolver !== undefined ? link.isResolver : true;
  };

  setRpcLinksIsResolver = (isResolver: boolean, networkId: string) => {
    const rpcLink = this.store.rpcLinks[networkId];
    const newRpcLink: INetworkType = { ...rpcLink, isResolver };
    this.setRpcLinks({ ...this.store.rpcLinks, [networkId]: newRpcLink });
  };

  getRpcLinksResolverUrls = (networkId: string) => {
    const rpcLinks = this.getRpcLinks();
    const link = rpcLinks[networkId];
    return link?.resolverUrls !== undefined ? link.resolverUrls : [];
  };

  setRpcLinksResolverUrls = (resolverUrls: string[], networkId: string) => {
    const rpcLink = this.store.rpcLinks[networkId];
    const newRpcLink: INetworkType = { ...rpcLink, resolverUrls };
    this.setRpcLinks({ ...this.store.rpcLinks, [networkId]: newRpcLink });
  };

  // currentKeyringIndex
  getCurrentKeyringIndex = () => {
    return this.store.currentKeyringIndex;
  };

  setCurrentKeyringIndex = (keyringIndex: number) => {
    this.store.currentKeyringIndex = keyringIndex;
  };

  // keyringAlianNames
  setKeyringAlianName = (keyringKey: string, name: string) => {
    this.store.keyringAlianNames = Object.assign({}, this.store.keyringAlianNames, { [keyringKey]: name });
  };

  removeKeyringAlianName = (keyringKey: string) => {
    const { [keyringKey]: _, ...rest } = this.store.keyringAlianNames;
    this.store.keyringAlianNames = rest;
  };

  getKeyringAlianName = (keyringKey: string, defaultName?: string) => {
    const name = this.store.keyringAlianNames[keyringKey];
    if (!name && defaultName) {
      this.store.keyringAlianNames[keyringKey] = defaultName;
    }
    return this.store.keyringAlianNames[keyringKey];
  };

  // accountAlianNames
  setAccountAlianName = (accountKey: string, name: string) => {
    this.store.accountAlianNames = Object.assign({}, this.store.accountAlianNames, { [accountKey]: name });
  };

  removeAccountAlianName = (accountKey: string) => {
    if (accountKey && accountKey?.length > 0) {
      const { [accountKey]: _, ...rest } = this.store.accountAlianNames;
      this.store.accountAlianNames = rest;
    }
  };

  getAccountAlianName = (accountKey: string, defaultName?: string) => {
    const name = this.store.accountAlianNames[accountKey];
    if (!name && defaultName) {
      this.store.accountAlianNames[accountKey] = defaultName;
    }
    return this.store.accountAlianNames[accountKey];
  };

  // get address flag
  getAddressFlag = (address: string) => {
    return this.store.addressFlags[address] || 0;
  };
  setAddressFlag = (address: string, flag: number) => {
    this.store.addressFlags = Object.assign({}, this.store.addressFlags, { [address]: flag });
  };

  // Add address flag
  addAddressFlag = (address: string, flag: AddressFlagType) => {
    const finalFlag = (this.store.addressFlags[address] || 0) | flag;
    this.store.addressFlags = Object.assign({}, this.store.addressFlags, { [address]: finalFlag });
    return finalFlag;
  };

  // Remove address flag
  removeAddressFlag = (address: string, flag: AddressFlagType) => {
    const finalFlag = (this.store.addressFlags[address] || 0) & ~flag;
    this.store.addressFlags = Object.assign({}, this.store.addressFlags, { [address]: finalFlag });
    return finalFlag;
  };

  // editingKeyringIndex
  getEditingKeyringIndex = () => {
    return this.store.editingKeyringIndex;
  };

  setEditingKeyringIndex = (keyringIndex: number) => {
    this.store.editingKeyringIndex = keyringIndex;
  };

  // editingAccount
  getEditingAccount = () => {
    return cloneDeep(this.store.editingAccount);
  };

  setEditingAccount = (account?: Account | null) => {
    this.store.editingAccount = account;
  };

  getSkippedVersion = () => {
    return this.store.skippedVersion;
  };

  setSkippedVersion = (version: string) => {
    this.store.skippedVersion = version;
  };

  getAppTab = () => {
    return this.store.appTab;
  };

  setAppSummary = (appSummary: AppSummary) => {
    this.store.appTab.summary = appSummary;
  };

  setReadTabTime = (timestamp: number) => {
    this.store.appTab.readTabTime = timestamp;
  };

  setReadAppTime = (appid: number, timestamp: number) => {
    this.store.appTab.readAppTime[appid] = timestamp;
  };

  getShowSafeNotice = () => {
    return this.store.showSafeNotice;
  };
  getSafeNoticeContent = () => {
    if (this.store?.safeNoticeContent !== undefined && this.store?.safeNoticeContent.length > 0) {
      return this.store.safeNoticeContent;
    } else {
      this.store.safeNoticeContent = undefined;
      return undefined;
    }
  };
  setShowSafeNotice = (showSafeNotice: boolean) => {
    this.store.showSafeNotice = showSafeNotice;
  };
  setSafeNoticeContent = (arg0: string) => {
    this.store.safeNoticeContent = arg0;
  };
  hasConfirmSafeSelfHost = (networkId: string) => {
    if (this.store.safeSelfHostConfirm?.[networkId]) {
      return true;
    }
    return false;
  };

  setConfirmSafeSelfHost = (networkId: string) => {
    if (!this.store.safeSelfHostConfirm) {
      this.store.safeSelfHostConfirm = {
        [networkId]: true
      };
    } else {
      this.store.safeSelfHostConfirm[networkId] = true;
    }
  };
  getPreference = (key?: string) => {
    if (!key || ['search', 'lastCurrent'].includes(key)) {
      this.resetAddressSortStoreExpiredValue();
    }
    if (key === 'isShowTestnet') {
      return true;
    }
    return key ? this.store[key] : { ...this.store, isShowTestnet: true };
  };
  setPreferencePartials = (data: Partial<PreferenceStore>) => {
    Object.keys(data).forEach((k) => {
      if (k in this.store) {
        this.store[k] = data[k];
      } else {
        const err = `Preference key ${k} not found`;
        if (process.env.DEBUG) {
          throw new Error(err);
        } else {
          console.error(err);
        }
      }
    });
  };
  getSavedChains = () => {
    return this.store.pinnedChain;
  };
  saveChain = (name: string) => {
    this.store.pinnedChain = [...this.store.pinnedChain, name];
  };
  updateChain = (list: string[]) => (this.store.pinnedChain = list);

  /**
   * @deprecated
   */
  getAddedToken = (address: string) => {
    const key = address.toLowerCase();
    return this.store.addedToken[key] || [];
  };
  /**
   * @deprecated
   */
  updateAddedToken = (address: string, tokenList: string[]) => {
    const key = address.toLowerCase();
    this.store.addedToken[key] = tokenList;
  };

  getSendLogTime = () => {
    return this.store.sendLogTime || 0;
  };
  updateSendLogTime = (time: number) => {
    this.store.sendLogTime = time;
  };
  getSendEnableTime = () => {
    return this.store?.sendEnableTime || 0;
  };
  updateSendEnableTime = (time: number) => {
    if (!this.store) {
      log.warn('updateSendEnableTime: store is not initialized');
      return;
    }
    log.debug('updateSendEnableTime', this.store.sendEnableTime, time);
    this.store.sendEnableTime = time;
  };
  getNeedSwitchWalletCheck = () => {
    if (this.store.needSwitchWalletCheck == null) {
      return true;
    }
    return this.store.needSwitchWalletCheck;
  };
  updateNeedSwitchWalletCheck = (value: boolean) => {
    this.store.needSwitchWalletCheck = value;
  };
  setHiddenBalance = (value: boolean) => {
    this.store.hiddenBalance = value;
  };
  getIsShowTestnet = () => {
    // return this.store.isShowTestnet;
    return true;
  };
  setIsShowTestnet = (value: boolean) => {
    this.store.isShowTestnet = value;
  };
  getCustomizedToken = () => {
    return this.store.customizedToken || [];
  };
  hasCustomizedToken = (token: Token) => {
    return !!this.store.customizedToken?.find(
      (item) => isSameAddress(item.address, token.address) && item.chain === token.chain
    );
  };
  addCustomizedToken = (token: Token) => {
    if (this.hasCustomizedToken(token)) {
      throw new Error('Token already added');
    }

    this.store.customizedToken = [...(this.store.customizedToken || []), token];
  };
  removeCustomizedToken = (token: Token) => {
    this.store.customizedToken = this.store.customizedToken?.filter(
      (item) => !(isSameAddress(item.address, token.address) && item.chain === token.chain)
    );
  };
  getBlockedToken = () => {
    return this.store.blockedToken || [];
  };
  addBlockedToken = (token: Token) => {
    if (
      !this.store.blockedToken?.find((item) => isSameAddress(item.address, token.address) && item.chain === token.chain)
    ) {
      this.store.blockedToken = [...(this.store.blockedToken || []), token];
    }
  };
  isBlockedToken = (token: Token) => {
    return this.store.blockedToken?.some(
      (item) => isSameAddress(item.address, token.address) && item.chain === token.chain
    );
  };
  removeBlockedToken = (token: Token) => {
    this.store.blockedToken = this.store.blockedToken?.filter(
      (item) => !(isSameAddress(item.address, token.address) && item.chain === token.chain)
    );
  };
  getCollectionStarred = () => {
    return this.store.collectionStarred || [];
  };
  addCollectionStarred = (token: Token) => {
    if (
      !this.store.collectionStarred?.find(
        (item) => isSameAddress(item.address, token.address) && item.chain === token.chain
      )
    ) {
      this.store.collectionStarred = [...(this.store.collectionStarred || []), token];
    }
  };
  removeCollectionStarred = (token: Token) => {
    this.store.collectionStarred = this.store.collectionStarred?.filter(
      (item) => !(isSameAddress(item.address, token.address) && item.chain === token.chain)
    );
  };
  setIsHideEcologyNoticeDict = (v: Record<string | number, boolean>) => {
    this.store.isHideEcologyNoticeDict = v;
  };
  getSendTxToKaspa = () => {
    return this.store.sendTxToKaspa || false;
  };
  setSendTxToKaspa = (v: boolean) => {
    this.store.sendTxToKaspa = v;
  };
}

export default new PreferenceService();
