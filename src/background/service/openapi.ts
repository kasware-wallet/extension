import compareVersions from 'compare-versions';
import { formatUnits } from 'ethers/lib/utils';
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

import { sompiToAmount } from '@/shared/utils/format';
import { preferenceService, sessionService } from '.';
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

  async decodePsbt(psbtHex: string): Promise<DecodedPsbt> {
    const result: IResultPsbtHex = JSON.parse(psbtHex);
    const decodedPsbt = {
      inputInfos: [
        {
          txid: 'string',
          vout: 0,
          address: 'kaspadev:55555555555t550x8st82m73nujqe52j8plx2p',
          value: 0,
          sighashType: 1
        }
      ],
      outputInfos: [
        {
          address: 'string',
          // value:sompi unit
          value: result.amount
        }
      ],
      feeRate: result.feeRate,
      priorityFee: result.priorityFee,
      fee: Number(result.fee),
      features: {
        rbf: false
      },
      risks: [],
      payload: result?.payload
    };

    return Promise.resolve(decodedPsbt);
  }

  async decodePskt(psktJsonString: string, options?: SignPsktOptions): Promise<DecodedPskt> {
    const pskt = Transaction.deserializeFromSafeJSON(psktJsonString) as Transaction;
    let signInputs = pskt.inputs.map((input, index) => {
      return { index: index, sighashType: 0 };
    });
    if (options && options.signInputs?.length > 0) signInputs = options.signInputs;

    const inputInfos = pskt.inputs
      .map((input, index) => {
        const txid = input.utxo?.entry.outpoint.transactionId || '';
        const vout = 0;
        const address = input.utxo?.address?.toString() || '';
        const value = Number(formatUnits(input.utxo?.amount || BigInt(0), 8));
        const signInput = signInputs.find((input) => input.index == index);
        if (signInput) {
          const sighashType = signInput.sighashType;
          return {
            txid,
            vout,
            address,
            value,
            sighashType
          };
        }
      })
      .filter((input) => input !== undefined);
    const networkId = preferenceService.getNetworkId();

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

    const outputInfos = pskt.outputs
      .map((output, index) => {
        if (outputIndexes.includes(index)) {
          const address = addressFromScriptPublicKey(output.scriptPublicKey, networkId)?.toString() || '';
          const value = Number(formatUnits(output.value, 8));
          return {
            address,
            value
          };
        }
      })
      .filter((output) => output !== undefined);

    const fee = getTxFeeFromTx(pskt);
    const decodedPsbt = {
      inputInfos,
      outputInfos,
      feeRate: 1,
      priorityFee: 0,
      fee: fee,
      features: {
        rbf: false
      },
      risks: [],
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
