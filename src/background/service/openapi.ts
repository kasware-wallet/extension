/* eslint-disable @typescript-eslint/no-explicit-any */
import randomstring from 'randomstring';

import { createPersistStore } from '@/background/utils';
import {
  CHANNEL,
  EVENTS,
  OPENAPI_RPC_MAINNET,
  OPENAPI_URL_DEVNET,
  OPENAPI_URL_MAINNET,
  OPENAPI_URL_TESTNET,
  VERSION
} from '@/shared/constant';
import {
  AddressSummary,
  AddressTokenSummary,
  AddressType,
  AppSummary,
  BitcoinBalance,
  DecodedPsbt,
  FeeSummary,
  IKaspaUTXO,
  IResultPsbtHex,
  IScannedGroup,
  Inscription,
  InscriptionSummary,
  NetworkType,
  TokenTransfer,
  UTXO,
  VersionDetail,
  WalletConfig
} from '@/shared/types';
import { Encoding, RpcClient } from 'kaspa-wasm';

import eventBus from '@/shared/eventBus';
import { satoshisToAmount } from '@/ui/utils';
import { preferenceService } from '.';

interface OpenApiStore {
  host: string;
  rpchost: string;
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
  networkId!: number;
  rpc!: RpcClient;

  setHost = async (host: string) => {
    this.store.host = host;
    // await this.init();
  };
  setRpcHost = async (rpchost: string) => {
    this.store.rpchost = rpchost;
    await this.init();
    // await this.disconnectRpc()
  };
  setNetworkId = (networkId: number) => {
    this.networkId = networkId;
  };

  getHost = () => {
    return this.store.host;
  };
  getRpcStatus = () => {
    if (this.rpc && this.rpc.open == true) {
      return true;
    }
    return false;
  };

  init = async () => {
    // if (this.rpc !== null && this.rpc !== undefined) {
    //   await this.rpc?.disconnect();
    // }
    await this.disconnectRpc();
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

    if (![OPENAPI_URL_MAINNET, OPENAPI_URL_DEVNET, OPENAPI_URL_TESTNET].includes(this.store.host)) {
      const networkType = preferenceService.getNetworkType();
      if (networkType === NetworkType.Mainnet) {
        this.store.host = OPENAPI_URL_MAINNET;
      } else if (networkType === NetworkType.Devnet) {
        this.store.host = OPENAPI_URL_DEVNET;
      } else {
        this.store.host = OPENAPI_URL_TESTNET;
      }
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
    this.rpc = new RpcClient(this.store.rpchost, this.encoding, this.networkId); //works in popup, not in background.
    // const rpc = new RpcClient('wss://kaspa.aspectron.com:443/mainnet', encoding, 0);
    await this.rpc.connect({});
    // .then(() => {
    //   // console.log('rpc connected', this.rpc);
    // })
    // .catch((e) => {
    //   console.log('rpc catch error', e);
    // });
  };
  // token is address
  setClientAddress = async (token: string, flag: number) => {
    if (this.rpc == null || this.rpc == undefined || this.rpc.open == false) return;
    await this.handleRpcConnect('setClientAddress');
    const { isSynced } = await this.rpc.getServerInfo();
    if (!isSynced) {
      console.error('Please wait for the node to sync');
      this.rpc.disconnect();
      return 0;
    }
    // current clientAddress equals to new clientAddress
    if (this.clientAddress.length > 0 && this.clientAddress == token) return;
    // clientAddress  exists
    if (this.clientAddress.length > 0) {
      await this.rpc.unsubscribeUtxosChanged([this.clientAddress]);
    }

    this.clientAddress = token;
    this.addressFlag = flag;
    this.subscribeUtxosChanged(token);
  };

  subscribeUtxosChanged = async (address: string) => {
    await this.rpc.notify(async (op, payload) => {
      // TODO test
      if (op == 'utxosChangedNotification') {
        eventBus.emit(EVENTS.broadcastToUI, {
          method: 'utxosChangedNotification',
          params: payload
        });
      }
    });
    await this.rpc.subscribeUtxosChanged([address]);
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
    // console.log('httpGet', route, params);
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
    // console.log('httpPost', route, params);
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
      totalSatoshis: 0,
      btcSatoshis: 0,
      assetSatoshis: 0,
      inscriptionCount: 0,
      atomicalsCount: 0,
      brc20Count: 0,
      arc20Count: 0,
      loading: false
    };

    return Promise.resolve(addressSummary);
  }

  async getAddressBalance(address: string): Promise<BitcoinBalance> {
    // return this.httpGet('/address/balance', {
    //   address,
    // });
    // console.log('openapi get address balance');
    const totalBalance = await this.getAddressBalanceOfKas(address);
    const bitcoinBalance: BitcoinBalance = {
      confirm_amount: '0',
      pending_amount: '0',
      amount: '0',
      confirm_btc_amount: '0',
      pending_btc_amount: '0',
      btc_amount: '0',
      confirm_inscription_amount: '0',
      pending_inscription_amount: '0',
      inscription_amount: '0',
      usd_value: '0'
    };
    let t = 0;
    if (totalBalance != undefined) t = totalBalance / 100000000;
    bitcoinBalance.amount = t.toString();
    // return Promise.all(return bitcoinBalance)
    return bitcoinBalance;
  }
  async getAddressesBalance(addresses: string[]): Promise<BitcoinBalance[]> {
    const balance: { entries: { address: string; balance: bigint }[] } = await this.rpc.getBalancesByAddresses({
      addresses
    });
    const bitcoinBalanceArray: BitcoinBalance[] = [] as BitcoinBalance[];
    balance.entries.forEach((entry) => {
      const amount = satoshisToAmount(Number(entry.balance));
      bitcoinBalanceArray.push({
        confirm_amount: '0',
        pending_amount: '0',
        amount,
        confirm_btc_amount: '0',
        pending_btc_amount: '0',
        btc_amount: '0',
        confirm_inscription_amount: '0',
        pending_inscription_amount: '0',
        inscription_amount: '0',
        usd_value: '0'
      });
    });

    return bitcoinBalanceArray;
  }
  async disconnectRpc() {
    if (this.rpc == null || this.rpc == undefined) {
      return;
    }
    await this.rpc.disconnect();
    this.rpc = null as unknown as RpcClient;
  }
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  async handleRpcConnect(source?: string) {
    // console.log('source', source);
    if (this.rpc != null && this.rpc != undefined && this.rpc.open == true && this.rpc.url == this.store.rpchost) {
      return;
    }
    if (this.rpc != null && this.rpc != undefined && this.rpc.open == true && this.rpc.url != this.store.rpchost) {
      await this.rpc.disconnect();
      this.rpc = null as unknown as RpcClient;
    }
    if (this.rpc != null && this.rpc != undefined && this.rpc.open == false) {
      await this.rpc.disconnect();
      this.rpc = null as unknown as RpcClient;
    }
    this.rpc = new RpcClient(this.store.rpchost, this.encoding, this.networkId); //works in popup, not in background.
    // const rpc = new RpcClient('wss://kaspa.aspectron.com:443/mainnet', encoding, 0);
    await this.rpc.connect({});
    const currentAccount = preferenceService.getCurrentAccount();
    if (this.rpc.open == true && currentAccount?.address) {
      this.subscribeUtxosChanged(currentAccount.address);
    }
    // const info = await this.rpc.getServerInfo();
  }
  async getAddressBalanceOfKas(address: string) {
    await this.handleRpcConnect('getAddressBalanceOfKas');
    const { isSynced } = await this.rpc.getServerInfo();
    if (!isSynced) {
      console.error('Please wait for the node to sync');
      this.rpc.disconnect();
      return 0;
    }
    const balance: { entries: { address: string; balance: bigint }[] } = await this.rpc.getBalancesByAddresses({
      addresses: [address]
    });
    const totalBigInt: bigint = balance?.entries[0].balance;
    const total = Number(totalBigInt);
    // this.subscribeUtxosChanged(address)
    return total;
  }

  async getMultiAddressAssets(addresses: string): Promise<AddressSummary[]> {
    // return this.httpGet('/address/multi-assets', {
    //   addresses
    // });
    const length = addresses.length;
    const addressSummary = [] as AddressSummary[];
    for (let i = 0; i < length; i++) {
      addressSummary.push({
        totalSatoshis: 0,
        btcSatoshis: 0,
        assetSatoshis: 0,
        inscriptionCount: 0,
        atomicalsCount: 0,
        brc20Count: 0,
        arc20Count: 0,
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
      satoshis_arr: number[];
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
    const balance: { entries: { address: string; balance: bigint }[] } = await this.rpc.getBalancesByAddresses({
      addresses
    });
    const sompiArr: number[] = [];
    balance.entries.forEach((entry) => {
      sompiArr.push(Number(entry.balance));
    });
    const balanceSompiArr = sompiArr as number[];

    const address_arr = group.address_arr;
    const satoshis_arr = balanceSompiArr;
    const dtype_arr = group.dtype_arr;
    const index_arr = group.index_arr;
    for (let i = 0; i < address_arr.length; ) {
      if (satoshis_arr[i] == 0) {
        address_arr.splice(i, 1);
        satoshis_arr.splice(i, 1);
        dtype_arr.splice(i, 1);
        index_arr.splice(i, 1);
      } else {
        i++;
      }
    }
    if (satoshis_arr.length > 0) {
      groupsResult.push({
        type: group.type,
        address_arr,
        satoshis_arr,
        dtype_arr,
        index_arr
      });
    }
    return groupsResult;
  }

  // async getKASUtxos(address: string): Promise<UTXO[]> {
  async getKASUtxos(address: string): Promise<IKaspaUTXO[]> {
    // return this.httpGet('/address/btc-utxo', {
    //   address,
    // });
    await this.handleRpcConnect('getKASUtxos');
    const { isSynced } = await this.rpc.getServerInfo();
    if (!isSynced) {
      console.error('Please wait for the node to sync');
      this.rpc.disconnect();
      return [];
    }
    const utxos = await this.rpc.getUtxosByAddresses([address]);
    if (utxos.length === 0) {
      console.info('Send some kaspa to', address, 'before proceeding with the demo');
      return [];
    }
    return utxos;
  }

  async submitTransaction(preSubmitPending:any){
    await this.handleRpcConnect('submitTransaction');
    const { isSynced } = await this.rpc.getServerInfo();
    if (!isSynced) {
      this.rpc.disconnect();
      throw new Error('Please wait for the node to sync');
    }
    const txid = await preSubmitPending.submit(this.rpc);
    return txid;

  }

  async getInscriptionUtxo(inscriptionId: string): Promise<UTXO> {
    return this.httpGet('/inscription/utxo', {
      inscriptionId
    });
  }

  async getInscriptionUtxos(inscriptionIds: string[]): Promise<UTXO[]> {
    return this.httpPost('/inscription/utxos', {
      inscriptionIds
    });
  }

  async getAddressInscriptions(
    address: string,
    cursor: number,
    size: number
  ): Promise<{ list: Inscription[]; total: number }> {
    return this.httpGet('/address/inscriptions', {
      address,
      cursor,
      size
    });
  }

  async getInscriptionSummary(): Promise<InscriptionSummary> {
    // return this.httpGet('/default/inscription-summary', {});
    return Promise.resolve({
      mintedList: []
    });
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
  // 3. submit a transaction to node
  // async pushTx(rawTxInfo: RawTxInfo, inputAmount: number): Promise<string> {
  //   // return this.httpPost('/tx/broadcast', {
  //   //   rawtx,
  //   // });
  //   const privateKey_str = 'ee9463c1a7bced9fb055ed49eb484ab6543ddcc407ea11d487e3687604036f15';
  //   const privateKey = new PrivateKey(privateKey_str);
  //   const generator = psbtHex;
  //   let pending;
  //   const a = await generator.next();
  //   while ((pending = await generator.next())) {
  //     await pending.sign([privateKey]);
  //     const txid = await pending.submit(rpc);
  //   }

  //   return txid;
  // }

  async getFeeSummary(): Promise<FeeSummary> {
    // return this.httpGet('/default/fee-summary', {});
    const fee = [
      // {
      //   title: 'Slow',
      //   desc: 'About 1 hour',
      //   feeRate: 0
      // },
      {
        title: 'Avg',
        desc: 'About 5 sec',
        feeRate: 0
      }
      // {
      //   title: 'Fast',
      //   desc: 'About 10 minutes',
      //   feeRate: 56
      // }
    ];

    return Promise.resolve({ list: fee });
  }

  async getDomainInfo(domain: string): Promise<Inscription> {
    return this.httpGet('/address/search', { domain });
  }

  async getAddressTokenSummary(address: string, ticker: string): Promise<AddressTokenSummary> {
    return this.httpGet('/brc20/token-summary', { address, ticker: encodeURIComponent(ticker) });
  }

  async getTokenTransferableList(
    address: string,
    ticker: string,
    cursor: number,
    size: number
  ): Promise<{ list: TokenTransfer[]; total: number }> {
    return this.httpGet('/brc20/transferable-list', {
      address,
      ticker: encodeURIComponent(ticker),
      cursor,
      size
    });
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
          inscriptions: [],
          atomicals: [],
          sighashType: 1
        }
      ],
      outputInfos: [
        {
          address: 'string',
          // value:satoshi unit
          value: result.amountSompi,
          inscriptions: [],
          atomicals: []
        }
      ],
      // inscriptions: { [key: string]: Inscription };
      inscriptions: {},
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

  async getAtomicalsNFT(
    address: string,
    cursor: number,
    size: number
  ): Promise<{ list: Inscription[]; total: number }> {
    return this.httpGet('/atomicals/nft', {
      address,
      cursor,
      size
    });
  }

  async getArc20Utxos(address: string, ticker: string): Promise<UTXO[]> {
    return this.httpGet('/arc20/utxos', {
      address,
      ticker
    });
  }

  async getVersionDetail(version: string): Promise<VersionDetail> {
    return this.httpGet('/version/detail', {
      version
    });
  }
}

export default new OpenApiService();
