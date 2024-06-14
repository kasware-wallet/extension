/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import randomstring from 'randomstring';

import { createPersistStore } from '@/background/utils';
import { CHANNEL, EVENTS, OPENAPI_RPC_MAINNET, OPENAPI_URL_MAINNET, VERSION } from '@/shared/constant';
import {
  AddressSummary,
  AddressType,
  IResultPsbtHex,
  IScannedGroup,
  ITransactionInfo,
  KaspaBalance,
  NetworkType,
  WalletConfig
} from '@/shared/types';
import {
  Encoding,
  Generator,
  Resolver,
  RpcClient,
  RpcEventMap,
  TransactionRecord,
  UtxoContext,
  UtxoEntryReference,
  UtxoProcessor,
  UtxoProcessorEventMap
} from 'kaspa-wasm';

import eventBus from '@/shared/eventBus';
import { handleTransactions, sompiToAmount } from '@/ui/utils';
import { preferenceService } from '.';

interface OpenApiStore {
  host: string;
  rpchost: string | undefined;
  deviceId: string;
  config?: WalletConfig;
}

// eslint-disable-next-line no-unused-vars
enum API_STATUS {
  // eslint-disable-next-line no-unused-vars
  FAILED = -1,
  // eslint-disable-next-line no-unused-vars
  SUCCESS = 0
}

export class OpenApiService {
  store!: OpenApiStore;
  clientAddress = '';
  addressFlag = 0;
  encoding!: number;
  // networkId!: 'mainnet' | 'testnet-10' | 'testnet-11' | 'devnet';
  networkId!: string;
  rpc!: RpcClient;
  shouldFireBlueScore: boolean | undefined;
  context = undefined as unknown as UtxoContext;
  processor = undefined as unknown as UtxoProcessor;
  closeRpctimeID = undefined as unknown as any;

  setHost = async (host: string) => {
    this.store.host = host;
    // await this.init();
  };
  setRpcHost = async (rpchost: string | undefined) => {
    this.store.rpchost = rpchost;
    await this.init();
    await this.disconnectRpc();
  };
  setNetworkId = (networkId: string) => {
    this.networkId = networkId;
  };
  getNetworkId = () => {
    return this.networkId;
  };

  getHost = () => {
    return this.store.host;
  };
  getRpcStatus = () => {
    if (this.rpc && this.rpc.isConnected == true) {
      return true;
    }
    return false;
  };

  init = async () => {
    this.shouldFireBlueScore = true;
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
        rpchost: OPENAPI_RPC_MAINNET,
        deviceId: randomstring.generate(12)
      }
    });

    // if (![OPENAPI_URL_MAINNET, OPENAPI_URL_DEVNET, OPENAPI_URL_TESTNET].includes(this.store.host)) {
    //   const networkType = preferenceService.getNetworkType();
    //   if (networkType === NetworkType.Mainnet) {
    //     this.store.host = OPENAPI_URL_MAINNET;
    //   } else if (networkType === NetworkType.Devnet) {
    //     this.store.host = OPENAPI_URL_DEVNET;
    //   } else {
    //     this.store.host = OPENAPI_URL_TESTNET;
    //   }
    // }
    const networkType = preferenceService.getNetworkType();
    if (networkType === NetworkType.Mainnet) {
      this.networkId = 'mainnet';
    } else if (networkType === NetworkType.Testnet) {
      this.networkId = 'testnet-11';
    } else {
      this.networkId = 'devnet';
    }
    // if (![OPENAPI_RPC_MAINNET, OPENAPI_RPC_TESTNET, OPENAPI_RPC_DEVNET].includes(this.store.rpchost)) {
    //   const networkType = preferenceService.getNetworkType();
    //   if (networkType === NetworkType.Mainnet) {
    //     this.networkId = NetworkType.Mainnet;
    //     this.store.rpchost = OPENAPI_RPC_MAINNET;
    //   } else if (networkType === NetworkType.Testnet) {
    //     this.networkId = NetworkType.Mainnet;
    //     this.store.rpchost = OPENAPI_RPC_TESTNET;
    //   } else if (networkType === NetworkType.Devnet) {
    //     this.networkId = NetworkType.Devnet;
    //     this.store.rpchost = OPENAPI_RPC_DEVNET;
    //   }
    // }

    if (!this.store.deviceId) {
      this.store.deviceId = randomstring.generate(12);
    }

    const getConfig = async () => {
      try {
        this.store.config = await this.getWalletConfig();
      } catch (e) {
        this.store.config = {
          version: '0.0.0',
          moonPayEnabled: false,
          statusMessage: (e as any).message
        };
      }
    };
    getConfig();
  };

  rpc_connect = async () => {
    const networkType = preferenceService.getNetworkType();
    if (networkType == NetworkType.Devnet) {
      this.rpc = new RpcClient({
        url: '127.0.0.1',
        encoding: this.encoding,
        networkId: 'devnet'
      });
    } else {
      this.rpc = new RpcClient({
        resolver: new Resolver(),
        networkId: networkType === NetworkType.Mainnet ? 'mainnet' : 'testnet-11'
      });
    }
    this.processor = new UtxoProcessor({ rpc: this.rpc, networkId: this.networkId });
    await this.processor.start();
    this.context = await new UtxoContext({ processor: this.processor });
    await this.rpc.connect({});
  };
  // token is address
  setClientAddress = async (token: string, flag: number) => {
    if (this.rpc == null || this.rpc == undefined || this.rpc.isConnected == false) return;
    await this.handleRpcConnect('setClientAddress');
    // current clientAddress equals to new clientAddress
    if (this.clientAddress.length > 0 && this.clientAddress == token) return;
    // clientAddress  exists
    if (this.clientAddress.length > 0) {
      await this.rpc.unsubscribeUtxosChanged([this.clientAddress]);
      // await this.context.unregisterAddresses([new Address(this.clientAddress)]);
      await this.context.clear();
      await this.rpc.unsubscribeSinkBlueScoreChanged();
    }
    this.clientAddress = token;
    this.addressFlag = flag;
    this.rpc.subscribeUtxosChanged([token]);
    if (this.context) {
      await this.context.trackAddresses([token]);
      // await this.context.unregisterAddresses([token]);
    }
  };

  subscribeUtxosChanged = async (address: string) => {
    const currentAccount = preferenceService.getCurrentAccount();
    this.rpc.addEventListener('*' as keyof RpcEventMap, async (event) => {
      if (event && event.type == 'open') {
        if (currentAccount?.address) {
          await this.rpc.subscribeUtxosChanged([currentAccount.address]);
        }
        await this.rpc.subscribeBlockAdded();
        await this.rpc.subscribeFinalityConflict();
        await this.rpc.subscribeFinalityConflictResolved();
        await this.rpc.subscribeVirtualDaaScoreChanged();
      }
    });
    this.rpc.addEventListener('utxos-changed', (event) => {
      if (event && event.data) {
        eventBus.emit(EVENTS.broadcastToUI, {
          method: 'utxosChangedNotification',
          params: 'utxochanged'
        });
      }
    });
    this.rpc.addEventListener('sink-blue-score-changed', (event) => {
      if (event.data) {
        if (this.shouldFireBlueScore) {
          eventBus.emit(EVENTS.broadcastToUI, {
            method: 'eventbus-sink-blue-score-changed',
            params: Number(event.data.sinkBlueScore)
          });
          this.shouldFireBlueScore = false;
          setTimeout(() => {
            this.shouldFireBlueScore = true;
          }, 1000);
        }
      }
    });
    this.processor.addEventListener('*' as keyof UtxoProcessorEventMap, (e: any) => {
      if (e?.type && e.type !== 'daa-score-change') {
        // console.log('p:', e.type, e.data);
      }
    });
    this.processor.addEventListener('utxo-proc-start', async () => {
      // console.log('utxo-proc-start', e);
      if (currentAccount?.address) await this.context.trackAddresses([currentAccount?.address]);
    });
    // utxo-proc-stop
    this.processor.addEventListener('utxo-proc-stop', async () => {
      // console.log('utxo-proc-start', e);
    });
    // daa-score-change
    this.processor.addEventListener('connect', async () => {
      // console.log('connect', this.processor, e.data);
    });
    this.processor.addEventListener('disconnect', async () => {
      // console.log('disconnect', this.processor, e);
    });
    this.processor.addEventListener('balance', async (event) => {
      eventBus.emit(EVENTS.broadcastToUI, {
        method: 'processor-balance-event',
        params: event
      });
      // IBalanceEvent
      // await this.context.trackAddresses([address]);
    });
    this.processor.addEventListener('error', async () => {
      // console.log('error', e.data);
    });
    this.processor.addEventListener('server-status', async () => {
      // console.log('server-status', e.data);
    });
    this.processor.addEventListener('sync-state', async () => {
      // console.log('sync-state', e.data);
    });
    this.processor.addEventListener('discovery', async ({ type, data }: { type: string; data: TransactionRecord }) => {
      // const addr = currentAccount?.address;
      // if (addr) {
      //   const addrObj = new Address(addr);
      //   const hasAddr = data.hasAddress(addrObj);
      //   if (hasAddr) {
      //     const a = data.toJSON();
      //     // console.log('a', a);
      //   }
      // }
    });
    // await this.rpc.subscribeUtxosChanged([address]);
    await this.rpc.subscribeSinkBlueScoreChanged();
  };

  getRespData = async (res: any) => {
    let jsonRes: { code: number; msg: string; data: any };

    if (!res) throw new Error('Network error, no response');
    if (res.status !== 200) throw new Error('Network error with status: ' + res.status);
    try {
      jsonRes = await res.json();
    } catch (e) {
      throw new Error('Network error, json parse error');
    }
    if (!jsonRes) throw new Error('Network error,no response data');
    if (jsonRes.code === API_STATUS.FAILED) {
      throw new Error(jsonRes.msg);
    }
    return jsonRes.data;
  };

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
    headers.append('X-Client', 'KasWare Wallet');
    headers.append('X-Version', VERSION);
    headers.append('x-address', this.clientAddress);
    headers.append('x-flag', this.addressFlag + '');
    headers.append('x-channel', CHANNEL);
    headers.append('x-udid', this.store.deviceId);
    let res: Response;
    try {
      res = await fetch(new Request(url), { method: 'GET', headers, mode: 'cors', cache: 'default' });
    } catch (e: any) {
      throw new Error('Network error: ' + e && e.message);
    }

    return this.getRespData(res);
  };

  httpPost = async (route: string, params: any) => {
    const url = this.getHost() + route;
    const headers = new Headers();
    headers.append('X-Client', 'KasWare Wallet');
    headers.append('X-Version', VERSION);
    headers.append('x-address', this.clientAddress);
    headers.append('x-flag', this.addressFlag + '');
    headers.append('x-channel', CHANNEL);
    headers.append('x-udid', this.store.deviceId);
    headers.append('Content-Type', 'application/json;charset=utf-8');
    let res: Response;
    try {
      res = await fetch(new Request(url), {
        method: 'POST',
        headers,
        mode: 'cors',
        cache: 'default',
        body: JSON.stringify(params)
      });
    } catch (e: any) {
      throw new Error('Network error: ' + e && e.message);
    }

    return this.getRespData(res);
  };

  async getWalletConfig(): Promise<WalletConfig> {
    // return this.httpGet('/default/config', {});
    return Promise.resolve({
      version: '0.1.0',
      moonPayEnabled: false,
      statusMessage: ''
    });
  }

  // it's used for oridnals. ---from shawn
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  async getAddressSummary(address: string): Promise<AddressSummary> {
    // return this.httpGet('/address/summary', {
    //   address
    // });
    const addressSummary = {
      totalSompi: 0,
      kasSompi: 0,
      assetSompi: 0,
      loading: false
    };

    return Promise.resolve(addressSummary);
  }

  async getAddressBalance(address: string): Promise<KaspaBalance> {
    const totalBalance = await this.getAddressBalanceOfKas(address);
    const kaspaBalance: KaspaBalance = {
      confirm_amount: '0',
      pending_amount: '0',
      amount: '0',
      confirm_kas_amount: '0',
      pending_kas_amount: '0',
      kas_amount: '0',
      usd_value: '0'
    };
    let t = 0;
    if (totalBalance != undefined) t = totalBalance / 100000000;
    kaspaBalance.amount = t.toString();
    return kaspaBalance;
  }
  async getAddressesBalance(addresses: string[]): Promise<KaspaBalance[]> {
    const balanceInfo = await this.rpc.getBalancesByAddresses({
      addresses
    });
    const kaspaBalanceArray: KaspaBalance[] = [] as KaspaBalance[];
    balanceInfo.entries.forEach((entry) => {
      const amount = sompiToAmount(Number(entry.balance));
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
  async disconnectRpc() {
    if (this.rpc == null || this.rpc == undefined) {
      return;
    }
    console.log('disconnect rpc');
    await this.context.clear();
    this.processor.removeEventListener('*', async () => {});
    await this.processor.stop();
    if (this.rpc.isConnected == true) await this.rpc.disconnect();
    this.rpc = null as unknown as RpcClient;
  }
  // gradually close rpc when popup window is closed --shwan
  countDownToCloseRpc() {
    this.closeRpctimeID = setTimeout(() => {
      this.disconnectRpc();
    }, 1000 * 5);
  }
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  async handleRpcConnect(source?: string) {
    // console.log('handleRpcConnect source', source);
    if (this.closeRpctimeID != undefined) {
      clearTimeout(this.closeRpctimeID);
      this.closeRpctimeID = undefined;
    }
    if (
      this.rpc != null &&
      this.rpc != undefined &&
      this.rpc.isConnected == true &&
      this.processor.networkId == this.networkId
    ) {
      return;
    }
    if (
      this.rpc != null &&
      this.rpc != undefined &&
      this.processor.networkId == this.networkId &&
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
    const networkType = preferenceService.getNetworkType();
    if (networkType == NetworkType.Devnet) {
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
      if (this.store.rpchost) {
        this.rpc = new RpcClient({
          url: this.store.rpchost,
          encoding: this.encoding,
          networkId: this.networkId
        });
      } else {
        this.rpc = new RpcClient({
          resolver: new Resolver(),
          // networkId: networkType === NetworkType.Mainnet ? 'mainnet' : 'testnet-11'
          networkId: this.networkId
        });
      }
    }
    this.processor = new UtxoProcessor({ rpc: this.rpc, networkId: this.networkId });
    await this.processor.start();
    // 3) Create one of more UtxoContext, passing UtxoProcessor to it
    // you can create UtxoContext objects as needed to monitor different
    // address sets.
    this.context = await new UtxoContext({ processor: this.processor });
    // this.rpc = new RpcClient(this.store.rpchost, this.encoding, this.networkId);
    //works in popup, not in background.
    // const rpc = new RpcClient('wss://kaspa.aspectron.com:443/mainnet', encoding, 0);
    await this.rpc.connect({});
    const currentAccount = preferenceService.getCurrentAccount();
    if (this.rpc.isConnected == true && currentAccount?.address) {
      this.subscribeUtxosChanged(currentAccount.address);
    }
    // this.subscribeUtxosChanged();
  }
  //  the balance unit is sompi
  async getAddressBalanceOfKas(address: string) {
    await this.handleRpcConnect('getAddressBalanceOfKas');
    const { isSynced } = await this.rpc.getServerInfo();
    if (!isSynced) {
      console.error('Please wait for the node to sync');
      this.rpc.disconnect();
      return 0;
    }
    const balanceInfo = await this.rpc.getBalancesByAddresses({
      addresses: [address]
    });
    const totalBigInt: bigint = balanceInfo?.entries[0].balance;
    const total = Number(totalBigInt);
    // this.subscribeUtxosChanged(address)
    return total;
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
    // return this.httpPost('/address/find-group-assets', {
    //   groups
    // });
    const groupsResult: {
      type: AddressType;
      address_arr: string[];
      sompi_arr: number[];
      dtype_arr: number[];
      index_arr: number[];
    }[] = [];

    // groups.forEach(async (group) => {
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
    const sompiArr: number[] = [];
    balanceInfo.entries.forEach((entry) => {
      sompiArr.push(Number(entry.balance));
    });
    const balanceSompiArr = sompiArr as number[];

    const address_arr = group.address_arr;
    const sompi_arr = balanceSompiArr;
    const dtype_arr = group.dtype_arr;
    const index_arr = group.index_arr;
    for (let i = 0; i < address_arr.length; ) {
      if (sompi_arr[i] == 0) {
        address_arr.splice(i, 1);
        sompi_arr.splice(i, 1);
        dtype_arr.splice(i, 1);
        index_arr.splice(i, 1);
      } else {
        i++;
      }
    }
    if (sompi_arr.length > 0) {
      groupsResult.push({
        type: group.type,
        address_arr,
        sompi_arr,
        dtype_arr,
        index_arr
      });
    }
    return groupsResult;
  }

  // async getKASUtxos(address: string): Promise<UTXO[]> {
  async getKASUtxos(address: string[]): Promise<UtxoEntryReference[]> {
    // return this.httpGet('/address/btc-utxo', {
    //   address,
    // });
    // await this.handleRpcConnect('getKASUtxos');
    const { entries } = await this.rpc.getUtxosByAddresses(address);
    if (entries.length === 0) {
      console.info('Send some kaspa to', address, 'before proceeding with the demo');
      return [];
    }
    return entries as any as UtxoEntryReference[];
  }

  async getTxActivities(address: string): Promise<ITransactionInfo[] | null> {
    // return this.httpGet('/address/btc-utxo', {
    //   address,
    // });
    let API = 'https://api.kaspa.org'
    if (this.networkId =='testnet') API = 'https://explorer-tn11.kaspa.org';
      const response = await   fetch(
        `${API}/addresses/${address}/full-transactions?limit=10&resolve_previous_outpoints=light`
      )
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      const data = await response.json();
      const trans = handleTransactions(data, address);
      return trans;
  }

  async createGenerator(
    sourceAddress: string,
    destinationAddress: string,
    changeAddress: string,
    moneySompi: bigint,
    priorityFee = BigInt(0)
  ) {
    // const entries = await this.getKASUtxos([sourceAddress]);
    // entries.sort((a, b) => (a.amount > b.amount ? 1 : -1));
    const generator = new Generator({
      entries: this.context,
      outputs: [{ address: destinationAddress, amount: moneySompi }],
      priorityFee: priorityFee,
      changeAddress
    });
    // const summary = await generator.estimate();
    // console.log('summary', summary);
    // return {summary };
    return generator;
  }

  async submitTransaction(preSubmitPending: any) {
    await this.handleRpcConnect('submitTransaction');
    const { isSynced } = await this.rpc.getServerInfo();
    if (!isSynced) {
      this.rpc.disconnect();
      throw new Error('Please wait for the node to sync');
    }
    const txid = await preSubmitPending.submit(this.rpc);
    return txid;
  }

  async getAppSummary(): Promise<AppSummary> {
    // return this.httpGet('/default/app-summary-v2', {});
    const appInfo = [
      {
        logo: 'string',
        title: 'string',
        desc: 'string',
        url: 'string',
        time: 0,
        id: 1
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

  async getFeeSummary(): Promise<FeeSummary> {
    // return this.httpGet('/default/fee-summary', {});
    const fee = [
      // {
      //   title: 'Slow',
      //   desc: 'About 1 hour',
      //   feeRate: 0
      // },
      {
        title: 'None',
        desc: 'About 5 sec',
        feeRate: 0
      },
      {
        title: 'Avg',
        desc: 'About 5 sec',
        feeRate: 10
      },
      {
        title: 'Fast',
        desc: 'About 5 sec',
        feeRate: 20
      }
    ];

    return Promise.resolve({ list: fee });
  }

  async decodePsbt(psbtHex: string): Promise<DecodedPsbt> {
    // return this.httpPost('/tx/decode', { psbtHex });
    // const estimate = await psbtHex.estimate()
    // const afee = estimate.fees
    const result: IResultPsbtHex = JSON.parse(psbtHex);
    // const afee = 1;
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
          value: result.amountSompi
        }
      ],
      feeRate: result.feeRate,
      fee: Number(result.fee),
      features: {
        rbf: false
      },
      risks: []
    };

    return Promise.resolve(decodedPsbt);
  }

  async createMoonpayUrl(address: string): Promise<string> {
    return this.httpPost('/moonpay/create', { address });
  }

  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  async checkWebsite(website: string): Promise<{ isScammer: boolean; warning: string | null }> {
    // return this.httpPost('/default/check-website', { website });
    return Promise.resolve({
      isScammer: false,
      warning: null
    });
  }

  async getVersionDetail(version: string): Promise<VersionDetail> {
    return this.httpGet('/version/detail', {
      version
    });
  }
}

export default new OpenApiService();
