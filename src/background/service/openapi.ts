import { Buffer } from 'buffer';
import compareVersions from 'compare-versions';
import type {
  IBalanceEvent,
  IFeeEstimate,
  IGeneratorSettingsObject,
  IGetUtxosByAddressesResponse,
  IUtxoEntry,
  PendingTransaction,
  UtxoEntryReference,
  UtxoProcessorEvent
} from 'kaspa-wasm';
import {
  addressFromScriptPublicKey,
  Encoding,
  Generator,
  isScriptPayToScriptHash,
  Resolver,
  RpcClient,
  sha256FromText,
  Transaction,
  UtxoContext,
  UtxoProcessor
} from 'kaspa-wasm';
import log from 'loglevel';
import { nanoid } from 'nanoid';

import { createPersistStore, getTxFeeFromTx, sleep } from '@/background/utils';
import {
  DEFAULT_FEE_SUMMARY,
  KASPA_EVENTS,
  KASPLEX_DEVNET,
  KASPLEX_MAINNET,
  KASPLEX_TESTNET_10,
  KASPLEX_TESTNET_11,
  KASPLEX_TESTNET_12,
  KASWARE_IO_KRC20_PRICE,
  KRC20OTC_API_TESTNET_10,
  OPENAPI_URL_DEVNET,
  OPENAPI_URL_MAINNET,
  OPENAPI_URL_TESTNET_10,
  OPENAPI_URL_TESTNET_11,
  OPENAPI_URL_TESTNET_12,
  VERSION
} from '@/shared/constant';
import eventBus from '@/shared/eventBus';
import type {
  AddressSummary,
  AppSummary,
  ConfigJSON,
  DecodedPsbt,
  DecodedPskt,
  IKNSDomain,
  IKRC20ByAddress,
  IKRC20History,
  IKRC20TokenInfo,
  IKRC20TokenInfoIssue,
  IKRC20TokenPrice,
  Inscription,
  InscriptionSummary,
  IResultPsbtHex,
  IScannedGroup,
  ITxInfo,
  ITxParam,
  KaspaBalance,
  KatBridgeTokenPair,
  OrderStatusResponse,
  SignPsktOptions,
  TFeeSummary,
  TNetworkId,
  VersionDetail,
  WalletConfig
} from '@/shared/types';
import { NetworkType, SighashBiType } from '@/shared/types';
import { getKnsApi } from '@/shared/utils';

import { formatLocaleString, sompiToAmount } from '@/shared/utils/format';
import { keyringService, preferenceService, sessionService } from '.';
import { storage } from '../webapi';

interface OpenApiStore {
  host: string;
  rpchost: string | undefined;
  kasplexhost: string;
  deviceId: string;
  config?: WalletConfig;
  isResolverV2?: boolean;
  resolverUrls?: string[];
  mintCount?: number;
  krc20TradeCount?: number;
}

export class OpenApiService {
  store!: OpenApiStore;
  clientAddress = '';
  addressFlag = 0;
  encoding!: number;
  networkId!: string;
  rpc!: RpcClient;
  pendingTxs = {} as {
    [networkId: string]: Map<
      string,
      {
        txParam: ITxParam;
        txInfo: ITxInfo;
      }
    >;
  };
  inscriptions = [] as Inscription[];
  context = undefined as unknown as UtxoContext;
  contexts = new Map<string, UtxoContext>();
  hexIdToAddr = new Map<string, string>();
  processor = undefined as unknown as UtxoProcessor;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  closeRpctimeID = undefined as unknown as any;
  batchMintStatus = false;
  batchMintPriorityFee = 0;
  private feeSummary: TFeeSummary = [];
  // Track last RPC status to avoid duplicate notifications
  private lastRpcStatus: 'connected' | 'disconnected' | null = null;

  private emitRpcStatus(status: 'connected' | 'disconnected') {
    if (this.lastRpcStatus === status) return;
    this.lastRpcStatus = status;
    eventBus.emit(KASPA_EVENTS.sendToUI, {
      method: 'rpcstatus',
      params: status
    });
  }

  setHost = async (host: string) => {
    this.store.host = host;
    // await this.init();
  };
  setKasplexHost = async (host: string) => {
    this.store.kasplexhost = host;
  };
  setBatchMintPriorityFee = (fee: number) => {
    this.batchMintPriorityFee = fee;
  };
  getBatchMintPriorityFee = () => {
    return this.batchMintPriorityFee;
  };
  setFeeSummary = (fee: TFeeSummary) => {
    this.feeSummary = fee;
  };
  getLowFeeRate = async (): Promise<number> => {
    if (!this.feeSummary[0]?.feeRate) await this.getFeeSummary();
    return this.feeSummary[0]?.feeRate ?? 1;
  };
  setRpcHost = async (rpchost: string | undefined) => {
    if (rpchost && rpchost?.length > 0) {
      this.store.rpchost = rpchost;
    } else {
      const networkId = preferenceService.getNetworkId();
      const rpcurl = preferenceService.getRpcLinksUrl(networkId);
      this.store.rpchost = rpcurl;
    }
    // await this.init();
    // await this.disconnectRpc();
  };
  getBlueScore = async () => {
    const res = await this.rpc?.getSinkBlueScore();
    if (!res) return 300000000;
    const bs = Number(res.blueScore);
    return bs;
  };

  increaseMintCount = () => {
    if (this.store.mintCount == undefined) {
      this.store.mintCount = 0;
    } else {
      this.store.mintCount += 1;
    }
  };
  getMintCount = () => {
    if (this.store.mintCount == undefined) {
      this.store.mintCount = 0;
    }
    return this.store.mintCount;
  };
  increaseKRC20TradeCount = (count: number) => {
    if (this.store.krc20TradeCount == undefined) {
      this.store.krc20TradeCount = count;
    } else {
      this.store.krc20TradeCount += count;
    }
  };
  getKRC20TradeCount = () => {
    if (this.store.krc20TradeCount == undefined) {
      this.store.krc20TradeCount = 0;
    }
    return this.store.krc20TradeCount;
  };
  resetKRC20TradeCount = () => {
    this.store.krc20TradeCount = 0;
  };
  addUtxoContext = async (addr: string) => {
    const id = sha256FromText(addr);
    this.hexIdToAddr.set(id, addr);
    const context = new UtxoContext({ processor: this.processor, id });
    this.contexts.set(addr, context);
    await context.trackAddresses([addr]);
  };
  addPendingTxs = (
    id: string,
    arg0: {
      txParam: ITxParam;
      txInfo: ITxInfo;
    }
  ) => {
    const networkId = preferenceService.getNetworkId();
    if (this.pendingTxs[networkId]) {
      this.pendingTxs[networkId].set(id, arg0);
    } else {
      const map = new Map();
      map.set(id, arg0);
      this.pendingTxs = { ...this.pendingTxs, [networkId]: map };
    }
  };
  removePendingTx = (id: string) => {
    let keysToDelete = [] as string[];
    const networkId = preferenceService.getNetworkId();
    if (this.pendingTxs[networkId]) {
      const res = this.pendingTxs[networkId].delete(id);
      if (res) {
        keysToDelete.push(id);
      } else {
        keysToDelete = Array.from(this.pendingTxs[networkId].keys()).filter((key) => {
          const obj = this.pendingTxs[networkId].get(key);
          const tx = obj?.txParam.transaction;
          if (!tx) return false;
          const txObj = Transaction.deserializeFromSafeJSON(tx);
          return txObj.inputs.some((input) => input.utxo?.outpoint.transactionId === id);
        });
        keysToDelete.forEach((key) => {
          this.pendingTxs[networkId].delete(key);
        });
      }
    }
    if (keysToDelete.length > 0) {
      eventBus.emit(KASPA_EVENTS.sendToUI, {
        method: 'remove-pending-tx',
        params: keysToDelete
      });
    }
  };
  getPendingTx = (id: string): { txInfo: ITxInfo; txParam: ITxParam } | undefined => {
    const networkId = preferenceService.getNetworkId();
    if (networkId && this.pendingTxs[networkId]) {
      return this.pendingTxs[networkId].get(id);
    } else {
      return undefined;
    }
  };
  getPendingTxs = (): Map<
    string,
    {
      txParam: ITxParam;
      txInfo: ITxInfo;
    }
  > | null => {
    const networkId = preferenceService.getNetworkId();
    if (networkId && this.pendingTxs[networkId]) return this.pendingTxs[networkId];
    return null;
  };
  getInscriptions = async () => {
    if (this.inscriptions && this.inscriptions?.length > 0) return this.inscriptions;
    return [] as Inscription[];
  };
  setInscriptions = (inscriptions: Inscription[]) => {
    this.inscriptions = inscriptions;
  };
  getDecimal = async (tick: string) => {
    let decimal = '8';
    const index = this.inscriptions?.findIndex((item) => item.tick?.toLowerCase() === tick?.toLowerCase());
    if (index !== -1) {
      const krc20Token = this.inscriptions[index];
      decimal = krc20Token.dec;
    } else {
      const tokenInfos = await this.getKRC20TokenInfo(tick).catch((e) => {
        throw new Error(`cannot get decimal of ${tick}:`, e);
      });
      if (tokenInfos && Array.isArray(tokenInfos) && tokenInfos.length > 0) {
        decimal = tokenInfos[0]?.dec;
      }
    }
    return decimal;
  };
  setBatchMintStatus = (arg0: boolean) => {
    this.batchMintStatus = arg0;
  };
  getBatchMintStatus = () => {
    return this.batchMintStatus;
  };

  getHost = () => {
    return this.store.host;
  };
  getKasplexHost = () => {
    return this.store.kasplexhost;
  };
  getRpcStatus = async () => {
    try {
      if (!this.rpc) return false;
      if (this.rpc && this.rpc.isConnected == false) return false;
      await this.rpc?.ping();
      if (this.rpc && this.rpc.isConnected == true) {
        return true;
      }
    } catch (e) {
      log.debug(e);
    }
    return false;
  };

  getRpcUrl = async () => {
    return Promise.resolve(this.rpc?.url);
  };

  init = async (resetStorage = false) => {
    this.batchMintStatus = false;
    // if (this.rpc !== null && this.rpc !== undefined) {
    //   await this.rpc?.disconnect();
    // }
    // await this.disconnectRpc();
    // this.rpc = null as unknown as RpcClient;
    this.encoding = Encoding.Borsh;
    this.store = await createPersistStore({
      name: 'openapi',
      template: {
        host: OPENAPI_URL_MAINNET,
        rpchost: '',
        networkId: 'mainnet',
        deviceId: nanoid(12),
        kasplexhost: KASPLEX_MAINNET,
        isResolverV2: true,
        resolverUrls: [],
        mintCount: 0,
        krc20TradeCount: 0
      },
      fromStorage: !resetStorage
    });

    const networkType = preferenceService.getNetworkType();
    const networkId = preferenceService.getNetworkId();
    const rpcUrl = preferenceService.getRpcLinksUrl(networkId);
    this.setRpcHost(rpcUrl);
    if (networkType === NetworkType.Mainnet) {
      this.setHost(OPENAPI_URL_MAINNET);
      this.setKasplexHost(KASPLEX_MAINNET);
    } else if (networkType === NetworkType.Testnet) {
      if (networkId === 'testnet-11') {
        this.setHost(OPENAPI_URL_TESTNET_11);
        this.setKasplexHost(KASPLEX_TESTNET_11);
      } else if (networkId === 'testnet-12') {
        this.setHost(OPENAPI_URL_TESTNET_12);
        this.setKasplexHost(KASPLEX_TESTNET_12);
      } else {
        this.setHost(OPENAPI_URL_TESTNET_10);
        this.setKasplexHost(KASPLEX_TESTNET_10);
      }
    } else {
      this.setHost(OPENAPI_URL_DEVNET);
      this.setKasplexHost(KASPLEX_DEVNET);
    }

    if (!this.store.deviceId) {
      this.store.deviceId = nanoid(12);
    }
    this.getFeeSummary();
    this.handleRpcConnect('init');
  };

  clearOpenApi = async () => {
    await storage.remove('openapi');
    await this.init(true);
  };

  // token is address
  setClientAddress = async (token: string, flag: number) => {
    if (this.rpc == null || this.rpc == undefined || this.rpc.isConnected == false) return;
    if (this.clientAddress.length > 0 && this.clientAddress == token) return;
    // clientAddress  exists
    this.clientAddress = token;
    this.addressFlag = flag;
    if (!this.contexts.has(token)) {
      await this.addUtxoContext(token);
    } else {
      try {
        const context = this.contexts.get(token);
        if (!context || !context.balance) await this.addUtxoContext(token);
      } catch (e) {
        log.debug(e);
        await this.addUtxoContext(token);
      }
    }
  };

  subscribeUtxosChanged = async () => {
    // RPC connect/disconnect are the authoritative source for connection status
    this.rpc.addEventListener('connect', async () => {
      log.debug('rpc connected, processor networkid', this.processor.networkId);
      this.emitRpcStatus('connected');
    });
    this.rpc.addEventListener('disconnect', () => {
      log.debug('rpc disconnected');
      this.emitRpcStatus('disconnected');
    });
    this.processor.addEventListener('utxo-proc-start', () => {
      handleUtxoProcStart();
    });
    this.processor.addEventListener('connect', () => {
      handleConnect();
    });
    this.processor.addEventListener('disconnect', () => {
      handleDisconnect();
    });
    this.processor.addEventListener('balance', (e: UtxoProcessorEvent<'balance'>) => {
      handleBalance(e.data);
    });
    this.processor.addEventListener('discovery', (e: UtxoProcessorEvent<'discovery'>) => {
      handleUtxoProcChange(e);
    });
    this.processor.addEventListener('pending', (e: UtxoProcessorEvent<'pending'>) => {
      handleUtxoProcChange(e);
    });
    this.processor.addEventListener('maturity', (e: UtxoProcessorEvent<'maturity'>) => {
      handleUtxoProcChange(e);
    });

    const handleUtxoProcChange = async (e: UtxoProcessorEvent<'pending' | 'maturity' | 'discovery'>) => {
      const data = e.data.serialize();
      eventBus.emit(KASPA_EVENTS.sendToUI, {
        method: 'processor-utxo-change',
        params: { type: e.type, data }
      });
      if (e.type == 'maturity' || e.type == 'pending') {
        this.removePendingTx(data.id);
      }
    };
    const handleUtxoProcStart = async () => {
      log.debug('utxo-proc-start');
      // Re-register UTXO contexts when processor starts
      for (const key of this.contexts.keys()) {
        await this.addUtxoContext(key);
      }
      const currentAccount = preferenceService.getCurrentAccount();
      if (currentAccount?.address && !this.contexts.has(currentAccount?.address)) {
        await this.addUtxoContext(currentAccount?.address);
      }
    };
    const handleConnect = async () => {
      log.debug('processor connect');
      // Optional: make sure RPC is connected.
      if (this.lastRpcStatus !== 'connected') {
        log.warn('processor connected but RPC status is', this.lastRpcStatus);
      }
      // Re-track addresses when processor reconnects
      for (const [address, ctxt] of this.contexts) {
        await ctxt.clear();
        await ctxt.trackAddresses([address]);
      }
    };
    const handleDisconnect = () => {
      log.debug('processor disconnected');
      // Status notification is handled by rpc disconnect event
    };
    const handleBalance = (data: IBalanceEvent) => {
      const address = this.hexIdToAddr.get(data.id);
      eventBus.emit(KASPA_EVENTS.sendToUI, {
        method: 'processor-balance-event',
        params: { balance: data.balance, address }
      });
      const currentAccount = preferenceService.getCurrentAccount();
      if (currentAccount?.address === address) {
        eventBus.emit(KASPA_EVENTS.sendToUI, {
          method: 'utxosChangedNotification',
          params: 'utxochanged'
        });
        sessionService.broadcastEvent('balanceChanged', {
          address: address,
          balance: {
            mature: Number(data?.balance?.mature),
            pending: Number(data?.balance?.pending),
            outgoing: Number(data?.balance?.outgoing),
            matureUtxoCount: data?.balance?.matureUtxoCount,
            pendingUtxoCount: data?.balance?.pendingUtxoCount,
            stasisUtxoCount: data?.balance?.stasisUtxoCount,
            confirmed: Number(data?.balance?.mature),
            unconfirmed: Number(data?.balance?.pending) - Number(data?.balance?.outgoing),
            total: Number(data?.balance?.mature) + Number(data?.balance?.pending) - Number(data?.balance?.outgoing)
          }
        });
      }
    };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getRespData = async (res: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // let jsonRes: { code: number; msg: string; data: any };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let jsonRes: { message: string; result: any[]; next?: string; prev?: string };

    if (!res) throw new Error('Network error, no response');
    if (res.status !== 200) throw new Error('Network error with status: ' + res.status);
    try {
      jsonRes = await res.json();
    } catch (e) {
      console.error(e);
      throw new Error('Network error, json parse error');
    }
    if (!jsonRes) throw new Error('Network error,no response data');
    // if (jsonRes.code === API_STATUS.FAILED) {
    //   throw new Error(jsonRes.msg);
    // }
    // return jsonRes.data;
    return jsonRes;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  httpGet = async (route: string, params: any) => {
    let url = this.getHost() + route;
    let c = 0;
    for (const id in params) {
      if (c == 0) {
        url += '?';
      } else {
        url += '&';
      }
      url += `${id}=${params[id]}`;
      c++;
    }
    const headers = new Headers();
    let res: Response;
    try {
      res = await fetch(new Request(url), { method: 'GET', headers, mode: 'cors', cache: 'default' });
    } catch (e) {
      throw new Error('Network error: ' + e && (e as Error).message);
    }

    return this.getRespData(res);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  httpPost = async (route: string, params: any) => {
    const url = this.getHost() + route;
    const headers = new Headers();
    let res: Response;
    try {
      res = await fetch(new Request(url), {
        method: 'POST',
        headers,
        mode: 'cors',
        cache: 'default',
        body: JSON.stringify(params)
      });
    } catch (e) {
      throw new Error('Network error: ' + e && (e as Error).message);
    }

    return this.getRespData(res);
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  httpGetKasplex = async (route: string, params: any) => {
    let url = this.getKasplexHost() + route;
    let c = 0;
    for (const id in params) {
      if (c == 0) {
        url += '?';
      } else {
        url += '&';
      }
      url += `${id}=${params[id]}`;
      c++;
    }
    const headers = new Headers();
    let res: Response;
    try {
      res = await fetch(new Request(url), { method: 'GET', headers, mode: 'cors', cache: 'default' });
    } catch (e) {
      if (e instanceof Error) {
        throw new Error('Network error: ' + e && e.message);
      } else {
        throw new Error('Network error: ' + e);
      }
    }

    return this.getRespData(res);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  httpPostKasplex = async (route: string, params: any) => {
    const url = this.getKasplexHost() + route;
    const headers = new Headers();
    let res: Response;
    try {
      res = await fetch(new Request(url), {
        method: 'POST',
        headers,
        mode: 'cors',
        cache: 'default',
        body: JSON.stringify(params)
      });
    } catch (e) {
      throw new Error('Network error: ' + e && (e as Error).message);
    }

    return this.getRespData(res);
  };

  // it's used for oridnals. ---from shawn
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  async getAddressSummary(address: string): Promise<AddressSummary> {
    const addressSummary = {
      totalSompi: 0,
      kasSompi: 0,
      assetSompi: 0,
      loading: false
    };

    return Promise.resolve(addressSummary);
  }

  async getKasPrice(): Promise<number> {
    let kaspaPrice = await fetch('https://api.kaspa.org/info/price').then((res) => res?.price);
    if (!kaspaPrice) {
      kaspaPrice = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=Kaspa&vs_currencies=USD'
      ).then((res) => res?.kaspa?.usd);
    }
    return kaspaPrice;
  }
  // unit is kaspa
  async getAddressBalance(address: string): Promise<KaspaBalance> {
    const { total, confirmed, unconfirmed } = await this.getAddressBalanceOfKas(address);
    const kaspaBalance: KaspaBalance = {
      confirm_amount: sompiToAmount(confirmed, 8),
      pending_amount: sompiToAmount(unconfirmed, 8),
      amount: sompiToAmount(total, 8),
      confirm_kas_amount: sompiToAmount(confirmed, 8),
      pending_kas_amount: sompiToAmount(unconfirmed, 8),
      kas_amount: sompiToAmount(total, 8),
      usd_value: '0'
    };
    return kaspaBalance;
  }
  async getAddressesBalance(addresses: string[]): Promise<KaspaBalance[]> {
    const balanceInfo = await this.rpc.getBalancesByAddresses({
      addresses
    });
    const kaspaBalanceArray: KaspaBalance[] = [] as KaspaBalance[];
    balanceInfo.entries.forEach((entry) => {
      const amount = sompiToAmount(Number(entry.balance), 8);
      kaspaBalanceArray.push({
        confirm_amount: '0',
        pending_amount: '0',
        outgoing: '0',
        amount,
        confirm_kas_amount: '0',
        pending_kas_amount: '0',
        kas_amount: amount,
        usd_value: '0'
      });
    });

    return kaspaBalanceArray;
  }
  async getAddressInscriptions(address: string): Promise<Inscription[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: { message: string; prev?: string; next?: string; result: any[] };
    data = await this.httpGetKasplex(`/krc20/address/${address}/tokenlist`, {});
    const results = data.result;
    while (data && data?.result?.length >= 50 && data?.next && data?.next?.length > 0) {
      data = await this.httpGetKasplex(`/krc20/address/${address}/tokenlist?next=${data?.next}`, {});
      if (data && data?.result?.length > 0) {
        // data.result.forEach((item) => {
        results.push(...data.result);
        // });
      }
    }
    for (let i = 0; i < results.length; i++) {
      const ca = results[i]?.ca;
      if (ca && ca.length > 0) {
        const name = preferenceService.getKrc20CaToName(ca);
        if (name && name.length > 0) {
          results[i].tick = name;
        } else {
          try {
            const info = await this.getKRC20TokenInfo(ca);
            if (info && info.length > 0 && (info[0] as IKRC20TokenInfoIssue)?.name) {
              results[i].tick = (info[0] as IKRC20TokenInfoIssue).name;
              preferenceService.updateKrc20CaToName(ca, (info[0] as IKRC20TokenInfoIssue).name);
            }
          } catch (error) {
            log.debug(error);
          }
        }
      }
    }

    this.setInscriptions(results);
    return results;
  }
  async disconnectRpc() {
    if (this.rpc == null || this.rpc == undefined) {
      return;
    }
    // await this.processor.stop();
    log.debug('disconnect rpc');
    for (const ctxt of this.contexts.values()) {
      await ctxt.clear();
    }
    this.contexts.clear();
    this.processor.removeEventListener('*');
    await this.processor.stop();
    this.processor = null as unknown as UtxoProcessor;
    // if (this.rpc.isConnected == true)
    await this.rpc.disconnect();
    this.rpc = null as unknown as RpcClient;
  }
  // gradually close rpc when popup window is closed --shwan
  countDownToCloseRpc() {
    this.closeRpctimeID = setTimeout(() => {
      if (this.batchMintStatus == false) {
        log.debug('start to shot down rpc');
        this.disconnectRpc();
      }
    }, 60000 * 20);
  }
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  async handleRpcConnect(source?: string) {
    // const currentAccount = preferenceService.getCurrentAccount();
    const networkId = preferenceService.getNetworkId();
    // if (currentAccount == null || currentAccount.address == undefined) throw new Error('current account is null');
    if (this.closeRpctimeID != undefined) {
      clearTimeout(this.closeRpctimeID);
      this.closeRpctimeID = undefined;
    }
    if (
      this.rpc != null &&
      this.rpc != undefined &&
      this.rpc.isConnected == true &&
      this.processor?.networkId == networkId
    ) {
      return;
    }
    if (
      this.rpc != null &&
      this.rpc != undefined &&
      this.processor?.networkId == networkId &&
      this.rpc.isConnected == false
    ) {
      // await this.rpc.connect();
      return;
    }
    if (this.rpc != null && this.rpc != undefined && this.rpc.isConnected == true) {
      await this.disconnectRpc();
    }
    if (this.rpc != null && this.rpc != undefined && this.rpc.isConnected == false) {
      this.rpc = null as unknown as RpcClient;
    }
    if (networkId === 'devnet') {
      if (this.store.rpchost) {
        this.rpc = new RpcClient({
          url: this.store.rpchost,
          encoding: this.encoding,
          networkId: 'devnet'
        });
      } else {
        this.rpc = new RpcClient({
          url: '127.0.0.1',
          encoding: this.encoding,
          networkId: 'devnet'
        });
      }
    } else {
      const isResolver = preferenceService.getRpcLinksIsResolver(networkId);
      if (isResolver != false) {
        const urls = this.store.resolverUrls;
        if (this.store.resolverUrls && this.store.resolverUrls.length > 0) {
          this.rpc = new RpcClient({
            resolver: new Resolver({ urls }),
            networkId
          });
        } else {
          this.rpc = new RpcClient({
            resolver: new Resolver(),
            networkId
          });
        }
      } else {
        if (this.store.rpchost?.trim()?.length == 0 || this.store.rpchost == undefined || this.store.rpchost == null) {
          const networkId = preferenceService.getNetworkId();
          const rpcUrl = preferenceService.getRpcLinksUrl(networkId);
          this.setRpcHost(rpcUrl);
        }
        log.debug('rpchost', this.store.rpchost);

        this.rpc = new RpcClient({
          url: this.store.rpchost,
          encoding: this.encoding,
          networkId
        });
      }
    }
    this.processor = new UtxoProcessor({ rpc: this.rpc, networkId });
    await this.processor.start();
    log.debug('this.processor networkId', this.processor.networkId);
    // 3) Create one of more UtxoContext, passing UtxoProcessor to it
    // you can create UtxoContext objects as needed to monitor different
    // address sets.
    // const currentAccount = preferenceService.getCurrentAccount();
    // const id = sha256FromText(currentAccount?.address as string);
    // this.hexIdToAddr.set(id, currentAccount?.address as string);
    // this.context = new UtxoContext({ processor: this.processor, id });
    // this.rpc = new RpcClient(this.store.rpchost, this.encoding, this.networkId);
    //works in popup, not in background.
    // const rpc = new RpcClient('wss://kaspa.aspectron.com:443/mainnet', encoding, 0);
    this.subscribeUtxosChanged();
    await this.rpc.connect({});
    // if (this.rpc.isConnected == true && currentAccount?.address) {
    // }
    // this.subscribeUtxosChanged();
  }
  //  the balance unit is sompi
  async getAddressBalanceOfKas(address: string) {
    await this.handleRpcConnect('getAddressBalanceOfKas');
    const { isSynced } = await this.rpc.getServerInfo();
    if (!isSynced) {
      console.error('Please wait for the node to sync');
      this.rpc.disconnect();
      return {
        total: BigInt(0),
        confirmed: BigInt(0),
        unconfirmed: BigInt(0)
      };
    }
    if (this.contexts.has(address) && this.contexts.get(address)?.balance) {
      const balance = this.contexts.get(address)?.balance;
      const mature = balance?.mature || BigInt(0);
      const outgoing = balance?.outgoing || BigInt(0);
      const pending = balance?.pending || BigInt(0);
      if (mature + outgoing + pending > BigInt(0))
        return {
          total: mature - outgoing + pending,
          confirmed: mature,
          unconfirmed: pending - outgoing
        };
    }
    const balanceInfo = await this.rpc.getBalancesByAddresses({
      addresses: [address]
    });
    const totalBigInt: bigint = balanceInfo?.entries[0].balance;
    return {
      total: totalBigInt,
      confirmed: totalBigInt,
      unconfirmed: BigInt(0)
    };
  }

  async getMultiAddressAssets(addresses: string): Promise<AddressSummary[]> {
    const length = addresses.length;
    const addressSummary = [] as AddressSummary[];
    for (let i = 0; i < length; i++) {
      addressSummary.push({
        totalSompi: 0,
        kasSompi: 0,
        assetSompi: 0,
        loading: false
      });
    }

    return Promise.resolve(addressSummary);
  }

  async findGroupAssets(groups: IScannedGroup[]): Promise<IScannedGroup[]> {
    const groupsResult: IScannedGroup[] = [];
    if (groups.length === 0) return groupsResult;
    const group = groups[0];
    const addresses = group.address_arr;
    await this.handleRpcConnect('findGroupAssets');
    const { isSynced } = await this.rpc.getServerInfo();
    if (!isSynced) {
      console.error('Please wait for the node to sync');
      this.rpc.disconnect();
      return [];
    }
    const balanceInfo = await this.rpc.getBalancesByAddresses({
      addresses
    });
    const entriesBalance = balanceInfo.entries.map((entry) => Number(entry.balance));
    const fetchKRC20Promises = addresses.map((address) => this.getKRC20ByAddress(address));
    const krc20Results = await Promise.allSettled(fetchKRC20Promises);
    const krc20Exists = krc20Results.map(
      (res) => res.status === 'fulfilled' && res.value != null && res.value != undefined && res.value.length > 0
    );

    const address_arr = addresses.filter((_, index) => krc20Exists[index] || entriesBalance[index] > 0);
    const dtype_arr = group.dtype_arr.filter((_, index) => krc20Exists[index] || entriesBalance[index] > 0);
    const index_arr = group.index_arr.filter((_, index) => krc20Exists[index] || entriesBalance[index] > 0);
    const krc20_arr = krc20Exists.filter((_, index) => krc20Exists[index] || entriesBalance[index] > 0);
    const sompi_arr = entriesBalance.filter((_, index) => krc20Exists[index] || entriesBalance[index] > 0);
    if (sompi_arr.length > 0) {
      groupsResult.push({
        type: group.type,
        address_arr,
        krc20_arr,
        sompi_arr,
        dtype_arr,
        index_arr
      });
    }
    return groupsResult;
  }

  async getKASUtxoEntryReferences(addresses: string[]): Promise<UtxoEntryReference[]> {
    if (addresses.length == 1 && this.contexts.has(addresses[0]) && this.contexts.get(addresses[0])?.balance) {
      const contxt = this.contexts.get(addresses[0]);
      const length = contxt?.matureLength;
      const pendingLength = contxt?.getPending().length;
      let count = 0;
      while (length != undefined && pendingLength != undefined && length == 0 && pendingLength > 0 && count < 3) {
        count++;
        await sleep(500);
      }
      if (length) {
        const uer = this.contexts.get(addresses[0])?.getMatureRange(0, length);
        // if (!uer) return [];
        if (uer && uer.length > 0) {
          return uer as UtxoEntryReference[];
        }
      }
    }
    // log.debug('utxos from rpc method');
    // rpc method
    const { entries } = await this.rpc.getUtxosByAddresses(addresses);
    if (entries.length === 0) {
      // console.info('Send some kaspa to', addresses[0], '');
      return [];
    }
    return entries as unknown as UtxoEntryReference[];
  }

  async getUtxosByAddresses(addresses: string[]): Promise<IGetUtxosByAddressesResponse> {
    if (addresses.length == 1 && this.context && this.context.balance && this.context.balance?.mature > BigInt(0)) {
      const length = this.context?.matureLength;
      let uer = this.context?.getMatureRange(0, length);
      uer = uer.filter((item) =>
        addresses.includes(item?.entry?.address?.toString() ? item?.entry?.address?.toString() : '')
      );
      if (uer.length > 0) return { entries: uer } as unknown as IGetUtxosByAddressesResponse;
    }
    const utxos = await this.rpc.getUtxosByAddresses(addresses);
    if (utxos.entries.length === 0) {
      console.info('Send some kaspa to', addresses[0], '');
      return { entries: [] };
    }
    return utxos;
  }

  async getKRC20ByAddress(address: string): Promise<IKRC20ByAddress[] | null> {
    const API = this.store.kasplexhost;

    const response = await fetch(`${API}/krc20/address/${address}/tokenlist`);
    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }
    const data = await response.json();
    const result = data?.result;
    return result;
  }
  async getKRC20TokenInfo(
    tick: string,
    includeHolders = false
  ): Promise<(IKRC20TokenInfo | IKRC20TokenInfoIssue)[] | null> {
    try {
      const host = this.getKasplexHost();
      let url = `${host}/krc20/token/${tick}`;
      if (includeHolders) url = `${url}?holder=true`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      const data = await response.json();
      return data.result;
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      } else {
        throw new Error(JSON.stringify(e));
      }
    }
  }
  // async getKRC20History(addr: string, tick?: string): Promise<IKRC20History[] | null> {
  //   const host = this.getKasplexHost();
  //   let url = `${host}/krc20/oplist?address=${addr}`;
  //   if (tick) url = `${url}&tick=${tick}`;
  //   const response = await fetch(url);
  //   if (!response.ok) {
  //     throw new Error('Network response was not ok ' + response.statusText);
  //   }
  //   const data = await response.json();
  //   return data.result;
  // }
  async getKRC20HistoryFromID(id: string): Promise<IKRC20History | null> {
    const host = this.getKasplexHost();
    const url = `${host}/krc20/op/${id}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }
    const data = await response.json();
    if (data?.result && data?.result.length > 0) return data.result[0];
    return null;
  }

  // async getKNSAssets(owner: string, currentPageNumber: number, size: number): Promise<IKNSAssetsResponseData> {
  //   try {
  //     const networkId = preferenceService.getNetworkId();
  //     const host = getKnsApi(networkId as TNetworkId);
  //     // const response = await axios.get<IKNSAssetsResponseData, IKNSAssetsResponse>(
  //     //   // 'https://api.knsdomains.org/tn10/api/v1/assets',
  //     //   `${host}/assets`,
  //     //   {
  //     //     params: { owner, page: currentPageNumber, pageSize: size }
  //     //   }
  //     // );
  //     // log.debug(response, response.data);
  //     const url = new URL(`${host}/assets`);
  //     url.searchParams.append('owner', owner);
  //     url.searchParams.append('page', currentPageNumber.toString());
  //     url.searchParams.append('pageSize', size.toString());

  //     const response = await fetch(url.toString());

  //     if (!response.ok) {
  //       throw new Error(`HTTP error! Status: ${response.status}`);
  //     }

  //     const responseData = await response.json();
  //     return responseData.data;
  //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   } catch (error: any) {
  //     throw new Error(error?.message || 'Error from KNS');
  //   }
  // }

  async createGenerator(
    sourceAddress: string,
    destinationAddress: string,
    changeAddress: string,
    moneySompi: bigint,
    priorityFee = BigInt(0),
    sendAll = false,
    payload?: string,
    kasUtxos?: IUtxoEntry[],
    feeRate?: number
  ) {
    if (this.contexts.has(sourceAddress) && this.contexts.get(sourceAddress)?.balance) {
      try {
        const context = this.contexts.get(sourceAddress);
        if (!context) throw new Error(`context of ${sourceAddress} is not found`);
        const mature = context?.balance?.mature;
        const pending = context?.balance?.pending;
        let count = 0;
        while (
          mature != undefined &&
          pending != undefined &&
          mature + pending > moneySompi &&
          mature < moneySompi &&
          count < 6
        ) {
          count++;
          log.debug('waiting for balance in context');
          await sleep(500);
        }
        if (mature != undefined && mature > moneySompi) {
          if (sendAll == true) {
            const networkId = preferenceService.getNetworkId();
            const generator = new Generator({
              entries: context,
              // priorityFee,//or GeneratorFeesInSweepTransaction error
              feeRate,
              changeAddress: destinationAddress,
              networkId
            } as IGeneratorSettingsObject);
            return generator;
          }
          const generator = new Generator({
            entries: context,
            outputs: [{ address: destinationAddress, amount: moneySompi }],
            feeRate,
            priorityFee: priorityFee,
            changeAddress,
            payload
            // networkId: this.networkId
          });
          return generator;
        }
      } catch (e) {
        log.debug(e);
      }
    }

    let entries: IUtxoEntry[] | UtxoEntryReference[];
    if (kasUtxos && kasUtxos.length > 0) {
      entries = kasUtxos;
    } else {
      const result = await this.rpc.getUtxosByAddresses([sourceAddress]);
      entries = result.entries;
    }
    if (!entries.length) {
      throw new Error(`No UTXOs found for address ${sourceAddress}`);
    }
    entries.sort((a, b) => (a.amount > b.amount ? 1 : a.amount < b.amount ? -1 : 0));
    const networkId = preferenceService.getNetworkId();
    if (sendAll == true) {
      const generator = new Generator({
        entries,
        // priorityFee,
        feeRate,
        changeAddress: sourceAddress,
        networkId
      } as IGeneratorSettingsObject);
      return generator;
    } else {
      const generator = new Generator({
        entries,
        outputs: [{ address: destinationAddress, amount: moneySompi }],
        feeRate,
        priorityFee,
        changeAddress,
        networkId
      });
      return generator;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async submitPendingTransaction(preSubmitPending: PendingTransaction) {
    await this.handleRpcConnect('submitTransaction');
    const { isSynced } = await this.rpc.getServerInfo();
    if (!isSynced) {
      this.rpc.disconnect();
      throw new Error('Please wait for the node to sync');
    }
    const txid: string = await preSubmitPending.submit(this.rpc);
    return txid;
  }
  async checkAndSubmitTransaction({ transaction, allowOrphan }: { transaction: Transaction; allowOrphan: boolean }) {
    const res = await this.rpc.submitTransaction({ transaction, allowOrphan });
    return res;
  }
  /**
   * Submits a transaction replacement (RBF - Replace-By-Fee) to the Kaspa network.
   *
   * This method replaces an existing unconfirmed transaction with a new one that typically
   * has a higher fee rate. It's used for accelerating or canceling pending transactions.
   *
   * After successful submission, broadcasts a 'transactionReplacementResponse' event to
   * all connected sessions with the new transaction ID and the replaced transaction ID.
   *
   * @param params - The transaction parameters
   * @param params.transaction - The new transaction to submit (must be a replacement of an existing pending tx)
   * @param isKRC20Deploy - Unused parameter, previously used for KRC20 deploy fee validation
   * @returns Promise resolving to the submission result containing the new transaction ID and replaced transaction details
   * @see signAndSubmitTransaction in wallet.ts for usage context
   */
  async checkAndSubmitTransactionReplacement({ transaction }: { transaction: Transaction }) {
    const res = await this.rpc.submitTransactionReplacement({ transaction });
    sessionService.broadcastEvent('transactionReplacementResponse', {
      transactionId: res.transactionId.toString(),
      replacedTransactionId: res.replacedTransaction.id
    });
    return res;
  }
  async getInscriptionSummary(): Promise<InscriptionSummary> {
    // const data = await this.httpGet('/v1/inscription-summary', {});
    // if (data.status == API_STATUS.FAILED) {
    //   throw new Error(data.message);
    // }
    // return data.result;
    return undefined as unknown as InscriptionSummary;
  }

  async getAppSummary(): Promise<AppSummary> {
    // return this.httpGet('/default/app-summary-v2', {});
    const appInfo = [
      {
        logo: '',
        title: 'KRC20 Swap',
        desc: '',
        url: '/krc20/createswap',
        time: 0,
        id: 'krc20swap'
      },
      {
        logo: '',
        title: 'KRC20 Mint/Deploy',
        desc: '',
        url: '/krc20/mintdeploy',
        time: 0,
        id: 'krc20mintdeploy'
        // tag?: 'string',
        // readtime?: 1,
        // new?: boolean;
        // tagColor?: string;
      }
    ];
    const appSummary = {
      apps: appInfo
      // readTabTime?: 1,
    };
    return Promise.resolve(appSummary);
  }
  // async getKRC20LaunchStatus(): Promise<IKRC20LaunchStatus> {
  //   let testnet = true;
  //   let mainnet = true;
  //   try {
  //     const response = await fetch(process.env.KASWARE_IO_CONFIG as string);
  //     // const response = await fetch('https://main.kasware-io-mainnet.pages.dev/config.json');
  //     const data = await response.json();
  //     const content = data.content;
  //     const decoded = Buffer.from(content, 'base64');
  //     const str = decoded.toString();
  //     const jsonFile = JSON.parse(str);
  //     if (jsonFile && jsonFile?.testnet) {
  //       testnet = false;
  //     }
  //     if (jsonFile && jsonFile?.mainnet) {
  //       mainnet = false;
  //     }
  //     return Promise.resolve({
  //       testnet,
  //       mainnet
  //     });
  //   } catch (e) {
  //     log.debug(e);
  //     return Promise.resolve({
  //       testnet,
  //       mainnet
  //     });
  //   }
  // }

  async fetchNotice(jsonFile: ConfigJSON): Promise<string | undefined> {
    try {
      if (jsonFile && jsonFile?.notice && jsonFile?.notice?.showsafenotice) {
        const notice: string = jsonFile?.notice?.notice;
        const currentContent = preferenceService.getSafeNoticeContent();
        const currentShowNotice = preferenceService.getShowSafeNotice();
        if (notice !== undefined && notice?.length > 0 && (notice !== currentContent || currentShowNotice)) {
          preferenceService.setSafeNoticeContent(notice);
          await sleep(1001);
          if (jsonFile?.notice?.versions == undefined) {
            preferenceService.setShowSafeNotice(true);
          } else {
            const lowerLimitVersion = jsonFile?.notice?.versions[0];
            const upperLimitVersion = jsonFile?.notice?.versions[1];
            if (compareVersions(VERSION, lowerLimitVersion) >= 0 && compareVersions(VERSION, upperLimitVersion) <= 0) {
              preferenceService.setShowSafeNotice(true);
            }
          }
          return notice;
        }
      }
    } catch (e) {
      log.debug((e as Error).message);
    }
  }

  async fetchKRC20TokenPrice(): Promise<IKRC20TokenPrice[] | undefined> {
    try {
      // const response = await fetch('https://cf-worker-kasplex.bruce-lei.workers.dev/');
      const response = await fetch(KASWARE_IO_KRC20_PRICE);
      if (!response.ok) {
        // throw new Error('Network response issue: ' + response?.statusText);
        log.error('fetch token price error: ', response?.statusText);
        return undefined;
      }
      const data = await response?.json();
      return data;
    } catch (e) {
      log.error('fetch token price error: ', (e as Error).message);
      return undefined;
    }
  }

  async getFeeSummary(): Promise<TFeeSummary> {
    // return this.httpGet('/default/fee-summary', {});
    const fee = [] as TFeeSummary;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data = null as unknown as IFeeEstimate;
    try {
      const rpcData = await this.rpc.getFeeEstimate({});
      data = rpcData?.estimate;
      log.debug('getFeeEstimate', data);
    } catch (e) {
      log.debug((e as Error).message);
      const API = this.store.host;
      const response = await fetch(`${API}/info/fee-estimate`);
      data = await response?.json();
      if (!response.ok) {
        console.error('Network response was not ok ' + response.statusText);
        return this.feeSummary?.length > 0 ? this.feeSummary : DEFAULT_FEE_SUMMARY;
      }
      log.debug('getFeeEstimate by API ', data);
    }
    let low = data?.lowBuckets;
    if (low && low?.length > 0) {
      const feeRate = low[0].feerate;
      const t = low[0]?.estimatedSeconds;
      const f = {
        title: 'Slow',
        desc: Number(t) >= 1 ? `< ${Math.round(t)} s` : '< 1 s',
        feeRate
      };
      fee.push(f);
    } else {
      fee.push({ title: 'Slow', desc: '< 1 s', feeRate: 1 });
    }
    low = data?.normalBuckets;
    if (low && low?.length > 0) {
      const feeRate2 = low[0].feerate;
      const t2 = low[0]?.estimatedSeconds;
      const f2 = {
        title: 'Avg',
        desc: Number(t2) >= 1 ? `< ${Math.round(t2)} s` : '< 1 s',
        feeRate: feeRate2
      };
      fee.push(f2);
      if (low?.length > 1) {
        const feeRate2 = low[1].feerate;
        const t2 = low[1]?.estimatedSeconds;
        const f2 = {
          title: 'Slow',
          desc: Number(t2) >= 1 ? `< ${Math.round(t2)} s` : '< 1 s',
          feeRate: feeRate2
        };
        fee.shift();
        fee.unshift(f2);
      }
    } else {
      fee.push({ title: 'Avg', desc: '< 1 s', feeRate: 1 });
    }
    const priorityBucket = data?.priorityBucket;
    if (low) {
      const feeRate = priorityBucket.feerate;
      const t = priorityBucket?.estimatedSeconds;
      const f2 = {
        title: 'Fast',
        desc: Number(t) >= 1 ? `< ${Math.round(t)} s` : '< 1 s',
        feeRate: feeRate
      };
      fee.push(f2);
    } else {
      fee.push({ title: 'Fast', desc: '< 1 s', feeRate: 1 });
    }
    this.setFeeSummary(fee);
    return Promise.resolve(fee);
  }

  async fetchOrderStatus(orderId: string): Promise<OrderStatusResponse> {
    try {
      const URL = 'https://api2.chainge.finance/fun/checkSwap';
      const response = await axios.get<OrderStatusResponse>(URL, {
        params: { id: orderId }
      });
      return response.data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      throw new Error(error?.response?.data?.msg || 'Error checking swap order status from Chainge');
    }
  }

  async decodePsbt(psbtHex: string, accountAddress?: string): Promise<DecodedPsbt> {
    const result: IResultPsbtHex = JSON.parse(psbtHex);
    const outputAddress = result.to || '';

    // --- Input infos ---
    // If the result contains actual inputs from the transaction, use them.
    // Otherwise, fall back to a synthetic single-input entry (consolidated estimate).
    let inputInfos: DecodedPsbt['inputInfos'];
    if (result.inputs && result.inputs.length > 0) {
      inputInfos = result.inputs.map((input) => ({
        txid: input.txid,
        vout: input.vout,
        address: input.address,
        value: input.value,
        sighashType: input.sighashType
      }));
    } else {
      // The simplified PSBT payload (IResultPsbtHex) does not carry UTXO data —
      // the SDK constructs the full transaction internally and only exposes the
      // high-level intent (to/amount/fee). For wallet-initiated sends, all
      // input UTXOs come from the current account's address, so we use that for
      // the inputInfos entry. The value is estimated as output + fee (consolidated
      // single-UTXO approximation) and is mainly used for display / canChanged logic.
      const estimatedInputValue = result.amount + result.fee;
      inputInfos = [
        {
          txid: '',
          vout: 0,
          address: accountAddress || '',
          value: estimatedInputValue,
          sighashType: 1
        }
      ];
    }

    // --- Change detection ---
    // In the simplified flow there is only one output (the recipient); the
    // change output is handled internally by the SDK and is not visible here.
    // An output is classified as "change" only when it returns to the current
    // account — a legitimate user-initiated send never flags as change.
    const isChange = !!(accountAddress && outputAddress && outputAddress === accountAddress);

    const risks: DecodedPsbt['risks'] = [];

    // --- Spoofing detection (limited) ---
    // The simplified payload cannot expose the change output, so change-address
    // spoofing is not detectable at this layer; the authoritative detection
    // lives in decodePskt() where the full Transaction object is available.
    // Only a sanity check on the amount is possible here.
    if (result.amount < 0) {
      risks.push({
        level: 'high',
        desc: 'Warning: The transaction amount is negative. Verify the transaction details before signing.'
      });
    }

    // --- Output infos ---
    // If the result contains actual outputs from the transaction, use them.
    // Otherwise, fall back to a single output entry (the recipient).
    let outputInfos: DecodedPsbt['outputInfos'];
    if (result.outputs && result.outputs.length > 0) {
      outputInfos = result.outputs.map((output) => ({
        address: output.address,
        value: output.value,
        // Recompute isChange from accountAddress — never trust the parsed JSON value,
        // as a malicious dApp could mark an attacker's output as change to bypass spoofing detection.
        isChange: !!(accountAddress && output.address && output.address === accountAddress)
      }));
    } else {
      outputInfos = [
        {
          address: outputAddress,
          // value: sompi unit (matches result.amount in IResultPsbtHex)
          value: result.amount,
          isChange
        }
      ];
      // NOTE: the change output is built by the SDK and is not part of this payload, so it is
      // deliberately NOT synthesized here — inventing an output addressed to the current account
      // would render as "Change (returning to you)" for an output we cannot verify exists.
      // The UI must therefore use the authoritative `fee` below instead of Inputs − Outputs.
    }

    const decodedPsbt = {
      inputInfos,
      outputInfos,
      feeRate: result.feeRate,
      priorityFee: result.priorityFee ?? 0,
      fee: Number(result.fee),
      features: {
        rbf: false
      },
      risks: risks.length > 0 ? risks : [],
      payload: result?.payload
    };

    return Promise.resolve(decodedPsbt);
  }

  /**
   * Verify that every input a dApp asks us to sign is a real unspent output on the network the wallet is
   * connected to, with the same outpoint, amount and script the PSKT commits to.
   *
   * why: a Kaspa signature does not commit to a network id and one key controls the same scripts on every
   * network, so a dApp approved on a testnet can present a PSKT spending the user's coin on another
   * network and get a signature that is valid there while the window shows the testnet. Asking the active
   * network's node whether the outpoint is actually unspent here is the only check that closes that gap.
   *
   * Scoped to non-mainnet on purpose: draining mainnet requires the wallet to sit on a testnet while
   * signing a mainnet UTXO, so verifying only the non-mainnet case kills the mainnet-loss vector and
   * leaves mainnet signing offline and unchanged. Fails OPEN when the node is unreachable or errors, so a
   * node hiccup does not brick dev/test signing; a reachable node that does not report the outpoint as
   * unspent here is a refusal, not a pass.
   *
   * `signIndices` are the input indices the wallet will sign (a dApp's `signInputs`, or every input when
   * it named none). Counterparty inputs of an ANYONECANPAY PSKT are not ours to verify and are excluded.
   */
  async verifyPsktInputsOnActiveNetwork(
    pskt: Transaction,
    signIndices: number[]
  ): Promise<{
    ok: boolean;
    reasons: string[];
    verified: Map<number, { amountSompi: string; scriptHex: string; address: string }>;
  }> {
    const verified = new Map<number, { amountSompi: string; scriptHex: string; address: string }>();
    const networkId = preferenceService.getNetworkId();
    // Mainnet is out of scope by design (see the method note): pass through untouched.
    if (networkId === 'mainnet' || signIndices.length === 0) return { ok: true, reasons: [], verified };
    if (!this.rpc || this.rpc.isConnected !== true) {
      log.warn('[verifyPsktInputs] RPC not connected - failing open');
      return { ok: true, reasons: [], verified };
    }

    const scriptToHex = (spk: any): string => {
      const raw = spk?.script ?? spk;
      if (!raw) return '';
      if (typeof raw === 'string') return raw.startsWith('0x') ? raw.slice(2).toLowerCase() : raw.toLowerCase();
      if (raw instanceof Uint8Array) return Buffer.from(raw).toString('hex').toLowerCase();
      return '';
    };

    try {
      const targets: { index: number; key: string; amount: bigint; scriptHex: string; address: string }[] = [];
      for (const index of signIndices) {
        const input = pskt.inputs[index] as any;
        const utxo = input?.utxo;
        const outpoint = utxo?.entry?.outpoint ?? utxo?.outpoint ?? input?.previousOutpoint;
        const txid = outpoint?.transactionId ?? '';
        const vout = Number(outpoint?.index ?? 0);
        const spk = utxo?.scriptPublicKey;
        const address = spk ? addressFromScriptPublicKey(spk, networkId)?.toString() ?? '' : '';
        // No derivable script/address cannot be looked up - and cannot yield a valid signature either - so
        // it is skipped rather than refused, which keeps covenant/P2SH dev flows working.
        if (!txid || !address) continue;
        targets.push({
          index,
          key: `${txid}:${vout}`,
          amount: BigInt(utxo?.amount ?? 0),
          scriptHex: scriptToHex(spk),
          address
        });
      }
      if (targets.length === 0) return { ok: true, reasons: [], verified };

      const addresses = Array.from(new Set(targets.map((t) => t.address)));
      const { entries } = await this.rpc.getUtxosByAddresses(addresses);
      const confirmed = new Map<string, { amount: bigint; scriptHex: string }>();
      ((entries ?? []) as any[]).forEach((e) => {
        const op = e?.entry?.outpoint ?? e?.outpoint;
        if (!op) return;
        confirmed.set(`${op.transactionId}:${Number(op.index ?? 0)}`, {
          amount: BigInt(e?.amount ?? e?.entry?.amount ?? 0),
          scriptHex: scriptToHex(e?.scriptPublicKey ?? e?.entry?.scriptPublicKey)
        });
      });

      const reasons: string[] = [];
      const unresolved: typeof targets = [];
      for (const t of targets) {
        const hit = confirmed.get(t.key);
        if (!hit) {
          unresolved.push(t);
        } else if (hit.amount === t.amount && hit.scriptHex === t.scriptHex) {
          verified.set(t.index, { amountSompi: hit.amount.toString(), scriptHex: hit.scriptHex, address: t.address });
        } else {
          // A confirmed output at this outpoint that disagrees with the PSKT is a definite tamper signal.
          reasons.push(
            `Input #${t.index} (${t.key}) does not match an unspent output on this network (amount or script differs).`
          );
        }
      }

      // Chained spends: an input may reference the output of a not-yet-confirmed transaction. Accept it
      // only if a pending tx to the same address produces that exact outpoint and no pending tx already
      // spends it (double-spend guard).
      if (unresolved.length > 0) {
        try {
          const mempool = await this.rpc.getMempoolEntriesByAddresses({
            addresses,
            includeOrphanPool: false,
            // Keep the transaction pool: a chained spend's creator and any pending tx that already spends
            // the outpoint both live there, and both are what this check reads.
            filterTransactionPool: false
          });
          // The SDK types this as IMempoolEntry[], but the node returns one { address, sending, receiving }
          // object per address - read it defensively as that shape.
          const pendingSpent = new Set<string>();
          const pendingOutputs = new Map<string, { amount: bigint; scriptHex: string }>();
          let sawPendingTx = false;
          let pendingIdComputed = false;
          for (const group of (mempool?.entries ?? []) as any[]) {
            for (const me of [...((group?.sending ?? []) as any[]), ...((group?.receiving ?? []) as any[])]) {
              const tx = me?.transaction;
              if (!tx) continue;
              sawPendingTx = true;
              ((tx.inputs ?? []) as any[]).forEach((inp) => {
                const op = inp?.previousOutpoint;
                if (op) pendingSpent.add(`${op.transactionId}:${Number(op.index ?? 0)}`);
              });
              let txid = '';
              try {
                txid = new Transaction(tx).id;
                if (txid) pendingIdComputed = true;
              } catch {
                txid = '';
              }
              if (!txid) continue;
              ((tx.outputs ?? []) as any[]).forEach((out, oi) => {
                pendingOutputs.set(`${txid}:${oi}`, {
                  amount: BigInt(out?.value ?? 0),
                  scriptHex: scriptToHex(out?.scriptPublicKey)
                });
              });
            }
          }
          for (const t of unresolved) {
            if (pendingSpent.has(t.key)) {
              reasons.push(`Input #${t.index} (${t.key}) is already spent by a pending transaction on this network.`);
              continue;
            }
            const hit = pendingOutputs.get(t.key);
            if (hit && hit.amount === t.amount && hit.scriptHex === t.scriptHex) {
              verified.set(t.index, {
                amountSompi: hit.amount.toString(),
                scriptHex: hit.scriptHex,
                address: t.address
              });
            } else if (sawPendingTx && !pendingIdComputed) {
              // There were pending transactions but not one tx id could be computed: that is our wasm
              // tooling failing, not evidence the input is bogus, so fail open rather than block a
              // legitimate chained spend. An *empty* mempool is not this case - see the else below.
              log.warn('[verifyPsktInputs] could not compute pending tx ids - failing open for unresolved inputs');
            } else {
              // The node is reachable and answered both queries: this outpoint is neither a confirmed
              // unspent output nor one produced by a pending transaction here, so it does not exist on
              // this network. That is the cross-network case (#1) - a reachable node's silence is the
              // answer, not a reason to fail open.
              reasons.push(`Input #${t.index} (${t.key}) is not an unspent output on this network.`);
            }
          }
        } catch (e) {
          // The node answered the UTXO query but not the mempool query: fail open for the unresolved inputs.
          log.warn('[verifyPsktInputs] mempool query failed - failing open for unresolved inputs:', e);
          unresolved.forEach((t) => {
            if (!reasons.some((r) => r.includes(t.key))) {
              log.warn(`[verifyPsktInputs] input #${t.index} (${t.key}) unverified (mempool unavailable)`);
            }
          });
        }
      }

      return { ok: reasons.length === 0, reasons, verified };
    } catch (e) {
      // Any RPC/shape error fails open: a node problem must not brick signing (see the method note).
      log.warn('[verifyPsktInputs] verification errored - failing open:', e);
      return { ok: true, reasons: [], verified };
    }
  }

  async decodePskt(psktJsonString: string, options?: SignPsktOptions): Promise<DecodedPskt> {
    const pskt = Transaction.deserializeFromSafeJSON(psktJsonString) as Transaction;

    // Build the set of input indices this wallet should sign.
    // When options.signInputs is provided, only those indices are marked for signing.
    // When not provided, all inputs are assumed to need signing.
    const hasSignInputOptions = options && options.signInputs?.length > 0;
    const signInputMap = new Map<number, number>();
    if (hasSignInputOptions) {
      options.signInputs!.forEach((si) => signInputMap.set(si.index, si.sighashType));
    }

    const networkId = preferenceService.getNetworkId();

    // Include ALL inputs for full transaction visibility, marking each
    // with isToSign to indicate whether this wallet needs to sign it.
    // For P2SH (covenant) UTXOs, utxo.address is empty — fall back to
    // deriving the address from scriptPublicKey.
    const inputInfos = pskt.inputs.map((input, index) => {
      const txid = input.utxo?.entry.outpoint.transactionId || '';
      const vout = 0;
      const address =
        input.utxo?.address?.toString() ||
        (input.utxo?.scriptPublicKey
          ? addressFromScriptPublicKey(input.utxo.scriptPublicKey, networkId)?.toString()
          : '') ||
        '';
      const value = Number(sompiToAmount(input.utxo?.amount || BigInt(0), 8));
      const isToSign = !hasSignInputOptions || signInputMap.has(index);
      const sighashType = signInputMap.get(index) ?? 0;

      // Detect script type for risk-display purposes.
      // P2SH (covenant) scriptPubKeys encode differently from standard P2PK.
      let scriptType: 'p2pk' | 'p2sh' | 'unknown' = 'unknown';
      try {
        const spk = input.utxo?.scriptPublicKey;
        if (spk) {
          // Extract the raw script bytes/hex from the ScriptPublicKey object
          const scriptData = (spk as any).script;
          if (scriptData) {
            const scriptHex =
              typeof scriptData === 'string'
                ? scriptData.startsWith('0x')
                  ? scriptData.slice(2)
                  : scriptData
                : scriptData instanceof Uint8Array
                ? Buffer.from(scriptData).toString('hex')
                : null;
            if (scriptHex) {
              scriptType = isScriptPayToScriptHash(scriptHex) ? 'p2sh' : 'p2pk';
            }
          }
        }
      } catch {
        // ScriptPublicKey detection failed — leave as 'unknown'
      }

      return {
        txid,
        vout,
        address,
        value,
        // The chain-exact figure the approval port carries: `value` above is KAS through a float for the
        // legacy UI, and a sompi string is what a confirmation screen on a money path must answer with.
        valueSompi: String(input.utxo?.amount ?? BigInt(0)),
        sighashType,
        isToSign,
        scriptType
      };
    });

    // Verify the inputs we will sign against the active network's node (non-mainnet only; fails open when
    // the node is unreachable). A failure raises a 'high' risk below, which hides Sign in the approval
    // screen; a success lets the window show the node's own amount/address per input rather than the
    // site's (#3), so a doctored `utxo.amount` cannot understate what the signature actually spends.
    const signIndices = hasSignInputOptions ? Array.from(signInputMap.keys()) : pskt.inputs.map((_, i) => i);
    const netVerify = await this.verifyPsktInputsOnActiveNetwork(pskt, signIndices);
    netVerify.verified.forEach((v, index) => {
      const info = inputInfos[index];
      if (!info) return;
      info.address = v.address || info.address;
      info.valueSompi = v.amountSompi;
      info.value = Number(sompiToAmount(v.amountSompi, 8));
    });

    // Collect the addresses the user actually controls, for change-output detection.
    // Using *all* input addresses is wrong: in a multi-party PSKT the counterparty's
    // inputs would land in this set, so an output paying the counterparty would be
    // shown as green "Change (returning to you)" and would also suppress the
    // spoofed-change-address warning below.
    const ownedAddresses = new Set<string>();

    // The current account's active address — change often returns here in simple
    // transactions.
    const currentAccount = preferenceService.getCurrentAccount();
    if (currentAccount?.address) {
      ownedAddresses.add(currentAccount.address);
    }

    // Every address the keyrings can derive is ours too, so change returning to another of the
    // wallet's own receive addresses is not mistaken for a spoofed change output. Failing here
    // (e.g. the wallet is locked) only narrows the set back to the current account.
    try {
      const walletAddresses = await keyringService.getAccounts();
      walletAddresses.forEach((walletAddress) => {
        if (walletAddress) ownedAddresses.add(walletAddress);
      });
    } catch (e) {
      log.debug('[decodePskt] could not list wallet addresses for change detection:', e);
    }

    // When the dApp explicitly listed which inputs we must sign, those inputs are
    // ours, so their addresses are owned too (covers UTXO consolidation across the
    // wallet's own addresses). Without an explicit list every input is marked
    // to-sign, which tells us nothing about ownership — stay conservative there.
    if (hasSignInputOptions) {
      inputInfos.forEach((input) => {
        if (input?.isToSign && input.address) ownedAddresses.add(input.address);
      });
    }

    let outputIndexes = [] as number[];
    if (options && options.signInputs) {
      const indexes = new Set<number>();
      options.signInputs.forEach((signInput) => {
        switch (signInput.sighashType) {
          case SighashBiType.All:
            pskt.outputs.forEach((output, index) => {
              indexes.add(index);
            });
            break;
          case SighashBiType.None:
            break;
          case SighashBiType.Single:
            pskt.outputs.forEach((output, outIndex) => {
              if (outIndex == signInput.index) indexes.add(outIndex);
            });
            break;
          case SighashBiType.AllAnyOneCanPay:
            pskt.outputs.forEach((output, index) => {
              indexes.add(index);
            });
            break;
          case SighashBiType.NoneAnyOneCanPay:
            break;
          case SighashBiType.SingleAnyOneCanPay:
            pskt.outputs.forEach((output, outIndex) => {
              if (outIndex == signInput.index) indexes.add(outIndex);
            });
            break;
        }
      });
      outputIndexes = Array.from(indexes);
    } else {
      outputIndexes = pskt.outputs.map((_, index) => index);
    }

    // Decode outputs and classify each as change or spend.
    // An output is "change" only when it pays an address we established as owned
    // above — never merely because some input in the transaction used it.
    const outputInfos = pskt.outputs
      .map((output, index) => {
        if (outputIndexes.includes(index)) {
          const address = addressFromScriptPublicKey(output.scriptPublicKey, networkId)?.toString() || '';
          const value = Number(sompiToAmount(output.value, 8));
          const isChange = ownedAddresses.has(address);
          return {
            address,
            value,
            // See the matching note on the inputs: the port's money path takes the integer string.
            valueSompi: String(output.value),
            isChange
          };
        }
      })
      // The predicate is explicit: this tsconfig's TypeScript does not narrow `.filter(o => o !== undefined)`
      // on its own, and the approval type has no room for `undefined` outputs.
      .filter((output): output is NonNullable<typeof output> => output !== undefined);

    // --- Partial-transaction detection ---
    // Collect the inputs we are asked to sign with a sighash type other than
    // SIGHASH_ALL (1), the only type that fully locks inputs and outputs.
    const SIGHASH_ALL = SighashBiType.All; // 1
    const nonStandardSighashInputs = inputInfos
      .map((inp, idx) => ({ ...inp, inputIndex: idx }))
      .filter((inp) => inp.isToSign && inp.sighashType !== 0 && inp.sighashType !== SIGHASH_ALL);

    // A PSKT signed with a non-standard sighash is deliberately incomplete: the
    // counterparty adds their own inputs (ANYONECANPAY) and/or outputs (SINGLE, NONE)
    // before broadcasting. This is normal business for marketplace flows — e.g. listing
    // an NFT with SIGHASH_SINGLE | ANYONECANPAY, where a small covenant input sits
    // against a large sale output.
    //
    // For such a PSKT `inputs - outputs` is NOT the network fee: the sums are
    // intentionally unbalanced (and usually negative), and the outputs decoded above are
    // only the subset this signature commits to. The real fee is only known once the
    // counterparty completes the transaction, so report it as unknown (0) instead of
    // surfacing a bogus negative number.
    const isPartial = nonStandardSighashInputs.length > 0;
    const fee = isPartial ? 0 : getTxFeeFromTx(pskt);
    // The same fee as an exact sompi string for the approval port — `getTxFeeFromTx` hands back a KAS
    // float, which is the boundary a signing screen's totals must not cross. `''` for a partial PSKT:
    // the counterparty completes the balance, so inputs minus outputs is not a fee anyone sets.
    const feeSompi = isPartial
      ? ''
      : String(
          pskt.inputs.reduce((sum, i) => sum + (i.utxo?.amount ?? BigInt(0)), BigInt(0)) -
            pskt.outputs.reduce((sum, o) => sum + BigInt(o.value), BigInt(0))
        );

    // --- Spoofing detection ---
    // Detect "change address spoofing" attacks where a malicious dApp
    // redirects the change output to an attacker-controlled address.
    //
    // Strategy: Calculate the expected change amount (remainder after
    // subtracting spending outputs and fees from total inputs), then verify
    // that this amount is being returned to user-controlled addresses.
    const risks: DecodedPskt['risks'] = [];
    // A network-verification failure is the cross-network/tamper signal (#1): 'high' hides Sign, so the
    // user cannot approve a signature over an output that is not unspent on the network they are on.
    netVerify.reasons.forEach((reason) => risks.push({ level: 'high', desc: reason }));
    const nonChangeOutputs = outputInfos.filter((o) => o && !o.isChange && o.value > 0);
    const changeOutputs = outputInfos.filter((o) => o && o.isChange);

    // Skipped for partial PSKTs: the heuristic needs a balanced transaction
    // (total inputs cover all outputs plus the fee), which is exactly what a
    // non-standard-sighash PSKT is not.
    if (!isPartial && outputInfos.length >= 2) {
      const totalInputValue = inputInfos.reduce((sum, i) => sum + (i?.value || 0), 0);
      const nonChangeSum = nonChangeOutputs.reduce((sum, o) => sum + (o?.value || 0), 0);
      const changeSum = changeOutputs.reduce((sum, o) => sum + (o?.value || 0), 0);

      // The expected change is the remainder: what should return to the user
      // after paying fees and sending non-change (spend) outputs.
      const expectedChangeAmount = totalInputValue - fee - nonChangeSum;

      // If expectedChangeAmount is positive and there are NO change outputs,
      // the entire remainder is going to non-user-controlled addresses.
      // This is the classic change-address-spoofing pattern.
      if (expectedChangeAmount > 0 && changeOutputs.length === 0 && nonChangeOutputs.length > 0) {
        // Only flag if the expected change is significant (more than dust)
        if (expectedChangeAmount > 0.0001) {
          risks.push({
            level: 'medium',
            desc:
              'Warning: This transaction may contain a spoofed change address. An estimated ' +
              `${formatLocaleString(expectedChangeAmount)} KAS in change appears to be routed to ` +
              'an address you do not control. Verify all output addresses before signing.'
          });
        }
      }

      // If the expected change doesn't match the actual change outputs,
      // some portion of the change is being redirected to non-user addresses.
      if (expectedChangeAmount > 0 && changeOutputs.length > 0) {
        const changeMismatch = Math.abs(expectedChangeAmount - changeSum);
        // Allow small tolerance (0.01% of expected change or dust amount)
        const tolerance = Math.max(expectedChangeAmount * 0.0001, 0.00001);
        if (changeMismatch > tolerance && nonChangeOutputs.length > 0) {
          // Only surface warning if there is a meaningful discrepancy
          if (changeMismatch > 0.001) {
            risks.push({
              level: 'medium',
              desc: `Warning: Change output mismatch detected. The expected change amount (${formatLocaleString(
                expectedChangeAmount
              )} KAS) does not match the output returning to your address (${formatLocaleString(
                changeSum
              )} KAS). The difference (${formatLocaleString(changeMismatch)} KAS) may be going to an attacker.`
            });
          }
        }
      }
    }

    // No risk is raised for non-standard sighash or covenant (P2SH/SmartScript) inputs.
    // Both are the normal shape of a marketplace PSKT — an NFT listing signs with
    // SIGHASH_SINGLE | ANYONECANPAY over a covenant input — so flagging them as 'high'
    // hid the Sign button and blocked legitimate listings. The approval screen already
    // carries a disclaimer about assets from unknown protocols, the partial-transaction
    // note in the fee summary, and the full input/output breakdown. What stays here are
    // the checks that indicate an actual attack: change-address spoofing above.

    const decodedPsbt = {
      inputInfos,
      outputInfos,
      feeRate: 1,
      priorityFee: 0,
      fee: fee,
      feeSompi,
      isPartial,
      features: {
        rbf: false
      },
      risks: risks.length > 0 ? risks : [],
      payload: pskt.payload
    };

    return Promise.resolve(decodedPsbt);
  }

  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  async checkWebsite(website: string): Promise<{ isScammer: boolean; warning: string | null }> {
    return Promise.resolve({
      isScammer: false,
      warning: null
    });
  }

  async getVersionDetail(version: string): Promise<VersionDetail> {
    log.debug('getVersionDetail', version);
    return {
      version: '0.0.0',
      title: 'please update your wallet',
      changelogs: []
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async patchKRC20ToMultiSigAddr(body: any) {
    const response = await fetch(KRC20OTC_API_TESTNET_10, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    log.debug('result: ', response);
    if (!response.ok) {
      throw new Error(`Network response was not ok  + ${response.statusText}`);
    }
    const result = await response.json();
    log.debug('data: ', result);
    log.debug('data.data: ', result.data);
    return result.data.order;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async postKASToMultiSigAddr(body: any) {
    const response = await fetch(KRC20OTC_API_TESTNET_10, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw new Error(`Network response was not ok  + ${response.statusText}`);
    }
    const result = await response.json();
    log.debug('data.data: ', result.data);
    return result.data.order;
  }
  // async getChaingeSupportedChains() {
  //   const { data } = await axios.get<IChaingeResponse<{ version: number; list: ChainChainge[] }>>(
  //     'https://api2.chainge.finance/v1/getChain'
  //   );
  //   return data.data.list;
  // }
  async getKNSDomainInfo(domain: string): Promise<IKNSDomain> {
    const networkId = preferenceService.getNetworkId();
    const host = getKnsApi(networkId as TNetworkId);
    const url = `${host}/${domain}/owner`;
    // const response = await axios.get<IKNSDomain, IKNSDomainResponse>(url);
    // return response.data.data;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const responseData = await response.json();
    return responseData.data;
  }
  async getKatBridgeTokenPairs(): Promise<KatBridgeTokenPair[]> {
    const res = await fetchWithCache('https://katbridge.com/api/token-pair');
    return res?.success ? res.result : [];
  }
}

export default new OpenApiService();
