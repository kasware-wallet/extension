/* eslint-disable @typescript-eslint/no-explicit-any */

// this script is injected into webpage's context
import { ethErrors, serializeError } from 'eth-rpc-errors';
import { EventEmitter } from 'events';
import log from 'loglevel';
import { evmProvider } from 'node_modules/@kasware-wallet/page-provider/dist/index.js';

import type {
  BuildScriptType,
  ISubmitCommitParams,
  ISubmitRevealParams,
  SighashBiType,
  TSignMessage
} from '@/shared/types';
import { TxType } from '@/shared/types';
import BroadcastChannelMessage from '@/shared/utils/message/broadcastChannelMessage';

import { sompiToAmount } from '@/shared/utils/format';
import PushEventHandlers from './pushEventHandlers';
import ReadyPromise from './readyPromise';
import { $, domReadyCall } from './utils';

const script = document.currentScript;
const channelName = script?.getAttribute('channel') || 'KASWARE';

export interface Interceptor {
  onRequest?: (data: any) => any;
  onResponse?: (res: any, data: any) => any;
}

interface StateProvider {
  accounts: string[] | null;
  isConnected: boolean;
  isUnlocked: boolean;
  initialized: boolean;
  isPermanentlyDisconnected: boolean;
}
export class KaswareProvider extends EventEmitter {
  _selectedAddress: string | null = null;
  _network: string | null = null;
  _isConnected = false;
  _initialized = false;
  _isUnlocked = false;
  ethereum: typeof evmProvider | null = null;

  _state: StateProvider = {
    accounts: null,
    isConnected: false,
    isUnlocked: false,
    initialized: false,
    isPermanentlyDisconnected: false
  };

  private _pushEventHandlers: PushEventHandlers;
  private _requestPromise = new ReadyPromise(0);

  private _bcm = new BroadcastChannelMessage(channelName);

  constructor({ maxListeners = 100 } = {}) {
    super();
    this.setMaxListeners(maxListeners);
    this.initialize();
    this._pushEventHandlers = new PushEventHandlers(this);
    this.ethereum = evmProvider;
  }

  initialize = async () => {
    document.addEventListener('visibilitychange', this._requestPromiseCheckVisibility);

    this._bcm.connect().on('message', this._handleBackgroundMessage);
    domReadyCall(() => {
      const origin = window.top?.location.origin;
      const icon =
        ($('head > link[rel~="icon"]') as HTMLLinkElement)?.href ||
        ($('head > meta[itemprop="image"]') as HTMLMetaElement)?.content;

      const name = document.title || ($('head > meta[name="title"]') as HTMLMetaElement)?.content || origin;

      this._bcm.request({
        method: 'tabCheckin',
        params: { icon, name, origin }
      });

      // Do not force to tabCheckin
      // this._requestPromise.check(2);
    });

    try {
      const { network, accounts, isUnlocked }: any = await this._request({
        method: 'getProviderState'
      });
      if (isUnlocked) {
        this._isUnlocked = true;
        this._state.isUnlocked = true;
      }
      this.emit('connect', {});
      this._pushEventHandlers.networkChanged({
        network
      });

      this._pushEventHandlers.accountsChanged(accounts);
    } catch {
      //
    } finally {
      this._initialized = true;
      this._state.initialized = true;
      this.emit('_initialized');
    }

    this.keepAlive();
  };

  /**
   * Sending a message to the extension to receive will keep the service worker alive.
   */
  private keepAlive = () => {
    this._request({
      method: 'keepAlive',
      params: {}
    }).then((v) => {
      setTimeout(() => {
        this.keepAlive();
      }, 1000);
    });
  };

  private _requestPromiseCheckVisibility = () => {
    if (document.visibilityState === 'visible') {
      this._requestPromise.check(1);
    } else {
      this._requestPromise.uncheck(1);
    }
  };

  private _handleBackgroundMessage = ({ event, data }) => {
    log.debug('[push event]', event, data);
    if (this._pushEventHandlers[event]) {
      return this._pushEventHandlers[event](data);
    }

    this.emit(event, data);
  };

  _request = async (data) => {
    if (!data) {
      throw ethErrors.rpc.invalidRequest();
    }

    this._requestPromiseCheckVisibility();

    return this._requestPromise.call(() => {
      const request = JSON.stringify(data, null, 2);
      if (!request.toLocaleLowerCase().includes('keepalive')) log.debug('[request]', request);
      return this._bcm
        .request(data)
        .then((res) => {
          if (data.method !== 'keepAlive') log.debug('[request: success]', data.method, res);
          return res;
        })
        .catch((err) => {
          log.debug('[request: error]', data.method, serializeError(err));
          throw serializeError(err);
        });
    });
  };

  // public methods
  requestAccounts = async () => {
    return this._request({
      method: 'requestAccounts'
    });
  };

  getNetwork = async () => {
    return this._request({
      method: 'getNetwork'
    });
  };

  switchNetwork = async (network: string) => {
    return this._request({
      method: 'switchNetwork',
      params: {
        network
      }
    });
  };

  getAccounts = async () => {
    return this._request({
      method: 'getAccounts'
    });
  };

  getPublicKey = async () => {
    return this._request({
      method: 'getPublicKey'
    });
  };

  getBalance = async () => {
    return this._request({
      method: 'getBalance'
    });
  };

  getKRC20Balance = async () => {
    return this._request({
      method: 'getKRC20Balance'
    });
  };

  getUtxoEntries = async (address: string) => {
    return this._request({
      method: 'getUtxoEntries',
      params: {
        address
      }
    });
  };

  getP2shAddress = async (inscribeJsonString: string) => {
    return this._request({
      method: 'getP2shAddress',
      params: {
        inscribeJsonString
      }
    });
  };

  createKRC20Order = async (arg0: {
    krc20Tick: string;
    krc20Amount: number;
    kasAmount: number;
    psktExtraOutput?: [{ address: string; amount: number }];
    priorityFee?: number;
  }) => {
    const tickLength = arg0?.krc20Tick?.length;
    if (tickLength == null || tickLength < 4 || tickLength > 6) {
      throw new Error(`Invalid krc20Tick length: ${tickLength}. Must be between 4 and 6 characters`);
    }
    return this._request({
      method: 'createKRC20Order',
      params: {
        krc20Tick: arg0.krc20Tick,
        krc20Amount: arg0.krc20Amount,
        kasAmount: arg0.kasAmount,
        psktExtraOutput: arg0.psktExtraOutput,
        priorityFee: arg0.priorityFee,
        type: 'createKRC20Order'
      }
    });
  };
  cancelKRC20Order = async (arg0: { krc20Tick: string; txJsonString: string; sendCommitTxId: string }) => {
    return this._request({
      method: 'cancelKRC20Order',
      params: {
        krc20Tick: arg0.krc20Tick,
        txJsonString: arg0.txJsonString,
        sendCommitTxId: arg0.sendCommitTxId,
        type: 'cancelKRC20Order'
      }
    });
  };
  signCancelKRC20Order = async (arg0: { krc20Tick: string; txJsonString: string; sendCommitTxId: string }) => {
    return this._request({
      method: 'signCancelKRC20Order',
      params: {
        krc20Tick: arg0.krc20Tick,
        txJsonString: arg0.txJsonString,
        sendCommitTxId: arg0.sendCommitTxId,
        type: 'signCancelKRC20Order'
      }
    });
  };
  buyKRC20Token = async (arg0: {
    txJsonString: string;
    extraOutput?: [{ address: string; amount: number }];
    priorityFee?: number;
  }) => {
    return this._request({
      method: 'buyKRC20Token',
      params: {
        txJsonString: arg0.txJsonString,
        extraOutput: arg0.extraOutput,
        priorityFee: arg0.priorityFee,
        type: 'buyKRC20Token'
      }
    });
  };

  signBuyKRC20Token = async (arg0: {
    txJsonString: string;
    extraOutput?: [{ address: string; amount: number }];
    priorityFee?: number;
  }) => {
    return this._request({
      method: 'signBuyKRC20Token',
      params: {
        txJsonString: arg0.txJsonString,
        extraOutput: arg0.extraOutput,
        priorityFee: arg0.priorityFee,
        type: 'signBuyKRC20Token'
      }
    });
  };

  submitCommit = async (arg0: ISubmitCommitParams) => {
    return this._request({
      method: 'submitCommit',
      params: {
        priorityEntries: arg0.priorityEntries,
        entries: arg0.entries,
        outputs: arg0.outputs,
        changeAddress: arg0.changeAddress,
        priorityFee: arg0.priorityFee,
        networkId: arg0.networkId,
        script: arg0.script,
        type: 'Commit'
      }
    });
  };

  submitReveal = async (arg0: ISubmitRevealParams) => {
    return this._request({
      method: 'submitReveal',
      params: {
        priorityEntries: arg0.priorityEntries,
        entries: arg0.entries,
        outputs: arg0.outputs,
        changeAddress: arg0.changeAddress,
        priorityFee: arg0.priorityFee,
        networkId: arg0.networkId,
        script: arg0.script,
        type: 'Reveal'
      }
    });
  };

  submitCommitReveal = async (
    commit: Omit<ISubmitCommitParams, 'script' | 'networkId'>,
    reveal: Omit<ISubmitRevealParams, 'priorityEntries' | 'entries' | 'script' | 'networkId'>,
    script: string,
    networkId?: string
  ) => {
    return this._request({
      method: 'submitCommitReveal',
      params: {
        commit,
        reveal,
        script,
        networkId,
        type: 'Commit & Reveal'
      }
    });
  };

  signMessage = async (text: string, params?: { noAuxRand?: boolean; type?: TSignMessage } | TSignMessage) => {
    const isStringParam = typeof params === 'string';
    const type = isStringParam ? params : params?.type || 'auto';
    const noAuxRand = isStringParam ? undefined : params?.noAuxRand;

    return this._request({
      method: 'signMessage',
      params: {
        text,
        noAuxRand,
        type
      }
    });
  };

  verifyMessage = async (pubkey: string, message: string, sig: string) => {
    return this._request({
      method: 'verifyMessage',
      params: {
        pubkey,
        message,
        sig
      }
    });
  };
  verifyMessageECDSA = async (pubkey: string, message: string, sig: string) => {
    return this._request({
      method: 'verifyMessageECDSA',
      params: {
        pubkey,
        message,
        sig
      }
    });
  };

  buildScript = async (arg0: { type: BuildScriptType; data: string }) => {
    return this._request({
      method: 'buildScript',
      params: {
        type: arg0.type,
        data: arg0.data
      }
    });
  };

  sendKaspa = async (toAddress: string, sompi: number, options?: { priorityFee: number; payload?: string }) => {
    return this._request({
      method: 'sendKaspa',
      params: {
        toAddress,
        sompi,
        priorityFee: Number(sompiToAmount(options?.priorityFee, 8)),
        type: TxType.SEND_KASPA,
        payload: options?.payload
      }
    });
  };
  signKRC20Transaction = async (inscribeJsonString: string, type: TxType, destAddr?: string, priorityFee?: number) => {
    return this._request({
      method: 'signKRC20Transaction',
      params: {
        inscribeJsonString,
        type,
        destAddr,
        priorityFee
      }
    });
  };
  signKRC20BatchTransferTransaction = async (
    inscribeJsonString: string,
    type: TxType,
    destAddr?: string[],
    priorityFee?: number
  ) => {
    throw new Error('deprecated. please use krc20BatchTransferTransaction() instead');
    return this._request({
      method: 'signKRC20BatchTransferTransaction',
      params: {
        inscribeJsonString,
        type,
        destAddr,
        priorityFee
      }
    });
  };
  krc20BatchTransferTransaction = async (
    list: { tick: string; to: string; amount: number }[],
    priorityFee?: number
  ) => {
    return this._request({
      method: 'krc20BatchTransferTransaction',
      params: {
        list,
        type: TxType.SIGN_KRC20_TRANSFER_BATCH,
        priorityFee
      }
    });
  };

  cancelKRC20BatchTransfer = async () => {
    return this._request({
      method: 'cancelKRC20BatchTransfer'
    });
  };

  /**
   * push transaction
   */
  pushTx = async (rawtx: string) => {
    return this._request({
      method: 'pushTx',
      params: {
        rawtx
      }
    });
  };

  disconnect = async (origin: string) => {
    return this._request({
      method: 'disconnect',
      params: {
        origin
      }
    });
  };

  signPskt = async (param: {
    txJsonString: string;
    options?: {
      signInputs: {
        index: number;
        sighashType: SighashBiType;
      }[];
    };
  }) => {
    return this._request({
      method: 'signPskt',
      params: {
        psktJsonString: param.txJsonString,
        psktOptions: param.options,
        type: TxType.SIGN_TX
      }
    });
  };

  getVersion = async () => {
    return this._request({
      method: 'getVersion'
    });
  };
}

declare global {
  interface Window {
    kasware: KaswareProvider & { ethereum?: any };
  }
}

const provider = new KaswareProvider();

if (!window.kasware) {
  window.kasware = new Proxy(provider, {
    deleteProperty: () => true
  });
}

Object.defineProperty(window, 'kasware', {
  value: new Proxy(provider, {
    deleteProperty: () => true
  }),
  writable: false,
  configurable: false
});

window.dispatchEvent(new Event('kasware#initialized'));
