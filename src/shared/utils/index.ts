import assert from 'assert';
import BigNumber from 'bignumber.js';
import { Buffer } from 'buffer';
import type { HexString } from 'kaspa-wasm';
import { Opcodes, ScriptBuilder } from 'kaspa-wasm';
import { keyBy } from 'lodash-es';
import log from 'loglevel';

import type { AddressFlagType } from '@/shared/constant';
import {
  CHAINS,
  CHARGE_FEE_ADDRESS,
  CHARGE_FEE_ADDRESS2,
  CHARGE_FEE_ADDRESS3,
  CHARGE_FEE_ADDRESS4,
  CHARGE_FEE_ADDRESS5,
  CHARGE_FEE_ADDRESS6,
  CHARGE_FEE_ADDRESS_TESTNET,
  CHARGE_FEE_ADDRESS_TESTNET2,
  CHARGE_FEE_ADDRESS_TESTNET3,
  CHARGE_FEE_ADDRESS_TESTNET4,
  CHARGE_FEE_ADDRESS_TESTNET5,
  CHARGE_FEE_ADDRESS_TESTNET6,
  CHARGE_FEE_DEPLOY,
  CHARGE_FEE_MINT,
  KNS_API_MAINNET,
  KNS_API_TESTNET_10,
  KNS_API_TESTNET_11,
  KNS_API_TESTNET_12,
  KNS_WEBSITE_MAINNET_APP,
  KNS_WEBSITE_TESTNET_10,
  KRC20_TRADE_FEE_ADDRESS,
  KRC20_TRADE_FEE_ADDRESS2,
  KRC20_TRADE_FEE_ADDRESS3,
  KRC20_TRADE_FEE_ADDRESS4,
  KRC20_TRADE_FEE_ADDRESS5,
  KRC20_TRADE_FEE_ADDRESS_TEST,
  KRC20_TRADE_FEE_ADDRESS_TEST2,
  KRC20_TRADE_FEE_ADDRESS_TEST3,
  KRC20_TRADE_FEE_ADDRESS_TEST4,
  KRC20_TRADE_FEE_ADDRESS_TEST5,
  REQUIRED_VALUE_KRC20_DEPLOY,
  REQUIRED_VALUE_KRC20_MINT
} from '@/shared/constant';
import browser from '@/shared/webapi/browser';

import type {
  IBatchTransfer,
  IBatchTransferResult,
  KasplexData,
  TBatchTransferStatus,
  TKasplexOp,
  TNetworkId
} from '../types';
import { TxType } from '../types';
import type { KsprTransfer } from '../types/kspr';
import BroadcastChannelMessage from './message/broadcastChannelMessage';
import PortMessage from './message/portMessage';

const Message = {
  BroadcastChannelMessage,
  PortMessage
};

declare global {
  const langLocales: Record<string, Record<'message', string>>;
}

const t = (name) => browser.i18n.getMessage(name);

const format = (str, ...args) => {
  return args.reduce((m, n) => m.replace('_s_', n), str);
};

export { format, Message, t };

const chainsDict = keyBy(CHAINS, 'id');
export const getChain = (chainId?: string) => {
  if (!chainId) {
    return null;
  }
  return chainsDict[chainId];
};

// Check if address flag is enabled
export const checkAddressFlag = (currentFlag: number, flag: AddressFlagType): boolean => {
  return Boolean(currentFlag & flag);
};

export const getChargeFee = (txType: TxType) => {
  let chargeFee = '0'; //1 for mint,1000 for deploy,0 for others
  if (txType == TxType.SIGN_KRC20_DEPLOY) {
    chargeFee = CHARGE_FEE_DEPLOY;
  }
  if (txType == TxType.SIGN_KRC20_MINT) {
    chargeFee = CHARGE_FEE_MINT;
  }
  return chargeFee;
};

export const getKRC20TradeAddress = (networkId: string) => {
  try {
    if (networkId !== 'mainnet') {
      const addresses = [
        KRC20_TRADE_FEE_ADDRESS_TEST,
        KRC20_TRADE_FEE_ADDRESS_TEST2,
        KRC20_TRADE_FEE_ADDRESS_TEST3,
        KRC20_TRADE_FEE_ADDRESS_TEST4,
        KRC20_TRADE_FEE_ADDRESS_TEST5
      ];
      const index = Math.floor(Math.random() * 5);
      return addresses[index];
    }
  } catch (e) {
    log.debug(e);
    return KRC20_TRADE_FEE_ADDRESS_TEST;
  }
  try {
    const addresses = [
      KRC20_TRADE_FEE_ADDRESS,
      KRC20_TRADE_FEE_ADDRESS2,
      KRC20_TRADE_FEE_ADDRESS3,
      KRC20_TRADE_FEE_ADDRESS4,
      KRC20_TRADE_FEE_ADDRESS5
    ];
    const index = Math.floor(Math.random() * 5);
    return addresses[index];
  } catch (e) {
    log.debug(e);
    return KRC20_TRADE_FEE_ADDRESS;
  }
};

export const getChargeAddress = (networkId: string) => {
  try {
    if (networkId !== 'mainnet') {
      const addresses = [
        CHARGE_FEE_ADDRESS_TESTNET,
        CHARGE_FEE_ADDRESS_TESTNET2,
        CHARGE_FEE_ADDRESS_TESTNET3,
        CHARGE_FEE_ADDRESS_TESTNET4,
        CHARGE_FEE_ADDRESS_TESTNET5,
        CHARGE_FEE_ADDRESS_TESTNET6
      ];
      const index = Math.floor(Math.random() * 6);
      return addresses[index];
    }
  } catch (e) {
    log.debug(e);
    return CHARGE_FEE_ADDRESS_TESTNET;
  }
  try {
    const addresses = [
      CHARGE_FEE_ADDRESS,
      CHARGE_FEE_ADDRESS2,
      CHARGE_FEE_ADDRESS3,
      CHARGE_FEE_ADDRESS4,
      CHARGE_FEE_ADDRESS5,
      CHARGE_FEE_ADDRESS6
    ];
    const index = Math.floor(Math.random() * 6);
    return addresses[index];
  } catch (e) {
    log.debug(e);
    return CHARGE_FEE_ADDRESS;
  }
};

export const getRequireProtocolFee = (txType: TxType) => {
  let requiredProtocolFee = '0'; //1 for mint,1000 for deploy,0 for others
  if (txType == TxType.SIGN_KRC20_DEPLOY) {
    requiredProtocolFee = REQUIRED_VALUE_KRC20_DEPLOY;
  }
  if (txType == TxType.SIGN_KRC20_MINT) {
    requiredProtocolFee = REQUIRED_VALUE_KRC20_MINT;
  }
  return requiredProtocolFee;
};
export const calculateScriptExtraFee = (script: HexString, feeRate: number) => {
  const scriptBytes = ScriptBuilder.canonicalDataSize(script);
  return BigInt(Math.ceil((scriptBytes + 1) * feeRate));
};

export function createSameArray(m, length: number) {
  return Array.from({ length }, () => m);
}

export function createSequentialArray(m, n) {
  if (m > n) throw new Error('m must be smaller than or equal to n');
  return Array.from({ length: n }, (_, i) => m + i);
}

export const parseKRC20Json = (inscribeJsonString: string) => {
  let deploy = undefined as unknown as string;
  let mint = undefined as unknown as string;
  let transfer = undefined as unknown as string;
  let list = undefined as unknown as string;
  let send = undefined as unknown as string;
  const inscribeJson = JSON.parse(inscribeJsonString);
  switch (inscribeJson?.op?.toLowerCase() as TKasplexOp) {
    case 'deploy':
      deploy = inscribeJsonString;
      break;
    case 'mint':
      mint = inscribeJsonString;
      break;
    case 'transfer':
      transfer = inscribeJsonString;
      break;
    case 'list':
      list = inscribeJsonString;
      break;
    case 'send':
      send = inscribeJsonString;
      break;
    default:
  }
  return { mint, transfer, deploy, list, send };
};

export const constructKRC20MintJsonStr = (ticker: string) => {
  const obj = {
    p: 'KRC-20',
    op: 'mint',
    tick: ticker.trim()?.toUpperCase()
  };
  const jsonStr = JSON.stringify(obj);
  return jsonStr;
};

export const constructKRC20DeployJsonStr = (
  ticker: string,
  supply: number,
  lim: number,
  pre?: number,
  dec?: number
) => {
  const decimal = dec !== undefined ? dec : 8;
  const multiplier = new BigNumber(10).pow(decimal);
  let deployObj: KasplexData<'deploy'> = {
    p: 'KRC-20',
    op: 'deploy',
    tick: ticker.trim()?.toUpperCase(),
    max: new BigNumber(supply).multipliedBy(multiplier).toFixed(0).toString(),
    lim: new BigNumber(lim).multipliedBy(multiplier).toFixed(0).toString()
  };
  if (pre !== undefined) {
    const preAllocate = new BigNumber(pre).multipliedBy(multiplier).toFixed(0).toString();
    deployObj = { ...deployObj, pre: preAllocate };
  }
  if (dec !== undefined) deployObj = { ...deployObj, dec: dec.toFixed(0).toString() };
  const jsonStr = JSON.stringify(deployObj);
  return jsonStr;
};

export const constructKRC20TransferJsonStr = (tick: string, amt: number | string, to: string, dec = '8') => {
  const transferObj = {
    p: 'KRC-20',
    op: 'transfer',
    tick: tick.trim()?.toUpperCase(),
    amt: new BigNumber(amt)
      .multipliedBy(10 ** Number(dec))
      .toFixed(0)
      .toString(),
    to: to.trim()
  };
  const jsonStr = JSON.stringify(transferObj);
  return jsonStr;
};

export const constructKRC20ListJsonStrLowerCase = (tick: string, amt: number | string, dec: number | string) => {
  // const listJsonString = '{"p":"krc-20","op":"list","tick":"ware","amt":"1000000000"}';
  const decimal = dec ?? '8';
  const multiplier = new BigNumber(10).pow(decimal);
  const transferObj = {
    p: 'krc-20',
    op: 'list',
    tick: tick.trim()?.toLowerCase(),
    amt: new BigNumber(amt).multipliedBy(multiplier).toFixed(0).toString()
  };
  const jsonStr = JSON.stringify(transferObj);
  return jsonStr;
};

export const constructKRC20SendJsonStrLowerCase = (tick: string) => {
  // const sendJsonString = '{"p":"krc-20","op":"send","tick":"ware"}';
  const transferObj = {
    p: 'krc-20',
    op: 'send',
    tick: tick.trim()?.toLowerCase()
  };
  const jsonStr = JSON.stringify(transferObj);
  return jsonStr;
};

export const constructKRC20MintJsonStrLowerCase = (ticker: string) => {
  const obj = {
    p: 'krc-20',
    op: 'mint',
    tick: ticker.trim()?.toLowerCase()
  };
  const jsonStr = JSON.stringify(obj);
  return jsonStr;
};

export const constructKRC20DeployJsonStrLowerCase = (
  ticker: string,
  supply: number,
  lim: number,
  pre?: number,
  dec?: number
) => {
  const decimal = dec !== undefined ? dec : 8;
  const multiplier = new BigNumber(10).pow(decimal);
  let deployObj: KasplexData<'deploy'> = {
    p: 'krc-20',
    op: 'deploy',
    tick: ticker.trim()?.toLowerCase(),
    max: new BigNumber(supply).multipliedBy(multiplier).toFixed(0).toString(),
    lim: new BigNumber(lim).multipliedBy(multiplier).toFixed(0).toString()
  };
  if (pre !== undefined) {
    const preAllocate = new BigNumber(pre).multipliedBy(multiplier).toFixed(0).toString();
    deployObj = { ...deployObj, pre: preAllocate };
  }
  if (dec !== undefined) deployObj = { ...deployObj, dec: dec.toFixed(0).toString() };
  const jsonStr = JSON.stringify(deployObj);
  return jsonStr;
};
export const constructKRC20DeployJsonStrLowerCase2 = (
  ticker: string,
  supply: number,
  lim: number,
  pre: string | undefined
) => {
  if (pre === undefined) {
    const deployOjj = {
      p: 'KRC-20',
      op: 'deploy',
      tick: ticker.trim()?.toUpperCase(),
      max: new BigNumber(supply).multipliedBy(100000000).toFixed(0).toString(),
      lim: new BigNumber(lim).multipliedBy(100000000).toFixed(0).toString()
    };
    const jsonStr = JSON.stringify(deployOjj);
    return jsonStr;
  } else {
    const deployOjj = {
      p: 'KRC-20',
      op: 'deploy',
      tick: ticker.trim()?.toUpperCase(),
      max: new BigNumber(supply).multipliedBy(100000000).toFixed(0).toString(),
      lim: new BigNumber(lim).multipliedBy(100000000).toFixed(0).toString(),
      pre
    };
    const jsonStr = JSON.stringify(deployOjj);
    return jsonStr;
  }
};

export const constructKRC20DeployJsonStr2 = (ticker: string, supply: number, lim: number, pre: string) => {
  if (pre === undefined) {
    const deployOjj = {
      p: 'KRC-20',
      op: 'deploy',
      tick: ticker.trim()?.toUpperCase(),
      max: new BigNumber(supply).multipliedBy(100000000).toFixed(0).toString(),
      lim: new BigNumber(lim).multipliedBy(100000000).toFixed(0).toString()
    };
    const jsonStr = JSON.stringify(deployOjj);
    return jsonStr;
  } else {
    const deployOjj = {
      p: 'KRC-20',
      op: 'deploy',
      tick: ticker.trim()?.toUpperCase(),
      max: new BigNumber(supply).multipliedBy(100000000).toFixed(0).toString(),
      lim: new BigNumber(lim).multipliedBy(100000000).toFixed(0).toString(),
      pre
    };
    const jsonStr = JSON.stringify(deployOjj);
    return jsonStr;
  }
};

export const constructKRC20TransferIssueJsonStrLowerCase = (
  ca: string,
  amt: number | string,
  to: string,
  dec = '8'
) => {
  const transferObj = {
    p: 'krc-20',
    op: 'transfer',
    ca: ca.trim()?.toLowerCase(),
    amt: new BigNumber(amt)
      .multipliedBy(10 ** Number(dec))
      .toFixed(0)
      .toString(),
    to: to.trim()
  };
  const jsonStr = JSON.stringify(transferObj);
  return jsonStr;
};

export const constructKRC20TransferJsonStrLowerCase = (tick: string, amt: number | string, to: string, dec = '8') => {
  const transferObj = {
    p: 'krc-20',
    op: 'transfer',
    tick: tick.trim()?.toLowerCase(),
    amt: new BigNumber(amt)
      .multipliedBy(10 ** Number(dec))
      .toFixed(0)
      .toString(),
    to: to.trim()
  };
  const jsonStr = JSON.stringify(transferObj);
  return jsonStr;
};
export const constructKNSTransferJsonStr = (assetId: string, to: string, isDomain = true) => {
  const transferObj = {
    op: 'transfer',
    p: 'domain' as string | undefined,
    id: assetId.trim(),
    to: to.trim()
  };
  if (isDomain !== true) delete transferObj.p;
  const jsonStr = JSON.stringify(transferObj, null, 0);
  return jsonStr;
};

export const constructKsprNftTransferJsonStr = (tick: string, id: string, to: string) => {
  const transferObj: KsprTransfer = {
    p: 'krc-721',
    op: 'transfer',
    tick: tick.trim()?.toLowerCase(),
    tokenId: id,
    to // Kaspa recipient address
  };
  const jsonStr = JSON.stringify(transferObj, null, 0);
  return jsonStr;
};

export const parseKNSJsonString = (jsonStr: string) => {
  const json = JSON.parse(jsonStr);
  if (!json) return undefined;
  return { id: json?.id, op: json?.op };
};
export const parseKRC20JsonString = (jsonStr: string) => {
  const json = JSON.parse(jsonStr);
  if (!json) return undefined;
  return { tick: json?.tick, op: json?.op };
};

export const getKRC20BatchTransferResults = (
  resultsIds: PromiseSettledResult<{
    txId: string;
  }>[],
  list: IBatchTransfer[]
) => {
  const resultNews = [] as IBatchTransferResult[];
  for (let x = 0; x < resultsIds.length; x++) {
    const addr = list[x];
    const result = resultsIds[x];
    const index = x;
    const tick = addr.tick;
    const to = addr.to;
    const amount = addr.amount;
    let status = 'failed' as TBatchTransferStatus;
    let errorMsg = undefined as string | undefined;
    let txId = undefined as unknown as { commitId: string; revealId: string; id: string };
    if (result.status === 'rejected') {
      status = 'failed';
      errorMsg = result.reason?.toString();
    }
    if (result.status === 'fulfilled') {
      const resObj = result.value;
      status = 'success';
      txId = { commitId: resObj.txId, revealId: resObj.txId, id: resObj.txId };
    }
    resultNews.push({
      index,
      status,
      tick,
      to,
      amount,
      errorMsg,
      txId
    });
  }
  return resultNews;
};

export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
export function parseScriptLegacy(script: string) {
  script = script.toLowerCase();
  let nextIndex = 0;
  const pubKeyLength = script.slice(nextIndex, (nextIndex += 2));
  assert.equal(pubKeyLength, '20');
  const XOnlyPublicKey = script.slice(nextIndex, (nextIndex += parseInt(pubKeyLength, 16) * 2));
  const OpCheckSig = script.slice(nextIndex, (nextIndex += 2));
  const OpFalse = script.slice(nextIndex, (nextIndex += 2));
  const OpIf = script.slice(nextIndex, (nextIndex += 2));
  const protocolLength = script.slice(nextIndex, (nextIndex += 2));
  const protocolHex = script.slice(nextIndex, (nextIndex += parseInt(protocolLength, 16) * 2));
  const protocol = Buffer.from(protocolHex, 'hex').toString('utf-8');
  const DataPrefix = script.slice(nextIndex, (nextIndex += 2));
  if (DataPrefix === '51') {
    const zeroOrOne = script.slice(nextIndex, (nextIndex += 2));
    if (zeroOrOne === '00') {
      assert.equal(script.slice(nextIndex, (nextIndex += 2)), '00');
    } else if (zeroOrOne === '01') {
      assert.equal(script.slice(nextIndex, (nextIndex += 4)), '0000');
    }
    // assert.match(zero, '/(0000|0100)/')
  } else if (DataPrefix === '00') {
    //
  } else {
    // return {}
    assert.fail();
  }
  let DataLength = script.slice(nextIndex, (nextIndex += 2));
  let Data = '';
  if (DataLength === '4c') {
    DataLength = script.slice(nextIndex, (nextIndex += 2));
  } else if (DataLength === '4d') {
    DataLength = script.slice(nextIndex, (nextIndex += 4));
  } else if (DataLength > '4d') {
    // return {}
    assert.fail();
  }
  Data = script.slice(nextIndex, (nextIndex += parseInt(DataLength, 16) * 2));
  Data = Buffer.from(Data, 'hex').toString('utf-8');
  const OpEndIf = script.slice(nextIndex, (nextIndex += 2));
  assert.equal(OpEndIf, '68');
  return { XOnlyPublicKey, OpCheckSig, OpFalse, OpIf, protocol, Data };
}

export function parseScript(script: string) {
  script = script.toLowerCase();
  let nextIndex = 0;
  const pubKeyLength = script.slice(nextIndex, (nextIndex += 2));
  // assert.equal(pubKeyLength, '20');
  assert.match(pubKeyLength, /["20","21"]/);
  const XOnlyPublicKey = script.slice(nextIndex, (nextIndex += parseInt(pubKeyLength, 16) * 2));
  const OpCheckSig = script.slice(nextIndex, (nextIndex += 2));
  // assert.equal(parseInt(OpCheckSig, "16"), Opcodes.OpCheckSig); //only support schnorr
  const opCheckSigReg = new RegExp(`[${Opcodes.OpCheckSig},${Opcodes.OpCheckSigECDSA}]`);
  assert.match(parseInt(OpCheckSig, 16).toString(), opCheckSigReg);
  const OpFalse = script.slice(nextIndex, (nextIndex += 2));
  assert.equal(parseInt(OpFalse, 16), Opcodes.OpFalse);
  const OpIf = script.slice(nextIndex, (nextIndex += 2));
  assert.equal(parseInt(OpIf, 16), Opcodes.OpIf);
  const protocolLength = script.slice(nextIndex, (nextIndex += 2));
  const protocolHex = script.slice(nextIndex, (nextIndex += parseInt(protocolLength, 16) * 2));
  const protocol = Buffer.from(protocolHex, 'hex').toString('utf-8');
  const DataPrefix = script.slice(nextIndex, (nextIndex += 2));
  let mime;
  let unknown;
  if (DataPrefix === '51') {
    const zeroOrOne = script.slice(nextIndex, (nextIndex += 2));
    if (zeroOrOne === '00') {
      assert.equal(script.slice(nextIndex, (nextIndex += 2)), '00');
    } else if (zeroOrOne === '01') {
      assert.equal(script.slice(nextIndex, (nextIndex += 4)), '0000');
    } else if (['4c', '4d'].includes(zeroOrOne)) {
      // kat bridge
      let unknownDataLength = zeroOrOne;
      if (zeroOrOne === '4c') {
        unknownDataLength = script.slice(nextIndex, (nextIndex += 2));
      } else if (zeroOrOne === '4d') {
        unknownDataLength = script.slice(nextIndex, (nextIndex += 2));
        unknownDataLength = script.slice(nextIndex, (nextIndex += 2)) + unknownDataLength;
      }
      unknown = script.slice(nextIndex, (nextIndex += parseInt(unknownDataLength, 16) * 2));
      const _zeroOrOne = script.slice(nextIndex, (nextIndex += 2));
      if (!['00', '01'].includes(_zeroOrOne)) {
        nextIndex -= 2;
      }
    } else {
      assert.fail();
    }
    // assert.match(zero, '/(0000|0100)/')
  } else if (DataPrefix === '00') {
    /* empty */
  } else if (DataPrefix === '01') {
    assert.equal(script.slice(nextIndex, (nextIndex += 2)), '01');
    const mimeTypeLength = script.slice(nextIndex, (nextIndex += 2));
    const mimeData = script.slice(nextIndex, (nextIndex += parseInt(mimeTypeLength, 16) * 2));
    mime = Buffer.from(mimeData, 'hex').toString('utf-8');
    assert.equal(script.slice(nextIndex, (nextIndex += 2)), '00');
  } else {
    // return {}
    assert.fail();
  }
  let DataLength = script.slice(nextIndex, (nextIndex += 2));
  let Data = '';
  if (DataLength === '4c') {
    DataLength = script.slice(nextIndex, (nextIndex += 2));
  } else if (DataLength === '4d') {
    DataLength = script.slice(nextIndex, (nextIndex += 2));
    DataLength = script.slice(nextIndex, (nextIndex += 2)) + DataLength;
  } else if (DataLength > '4d') {
    // return {}
    assert.fail();
  }
  Data = script.slice(nextIndex, (nextIndex += parseInt(DataLength, 16) * 2));
  if (!mime) {
    Data = Buffer.from(Data, 'hex').toString('utf-8');
  }
  const OpEndIf = script.slice(nextIndex, (nextIndex += 2));
  assert.equal(parseInt(OpEndIf, 16), Opcodes.OpEndIf);
  return { XOnlyPublicKey, protocol, mime, Data, unknown };
}

export function getRandomFourDigitNumberWithoutZero() {
  const digits = '123456789'.split('');
  let numStr = '';
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * digits.length);
    numStr += digits[randomIndex];
  }
  return parseInt(numStr, 10);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sortParams(params: Record<string, any>, evmAddress: string) {
  let keys = Object.keys(params);
  if (!keys.length) return undefined;
  keys = keys.sort();
  const keyValList: string[] = [];
  for (const key of keys) {
    const val = params[key];
    if (val) {
      keyValList.push(`${key}=${val}`);
    }
  }
  const data = keyValList.join('&');
  return `Address=${evmAddress}&${data}`;
}

export function getKnsApi(networkId: TNetworkId) {
  if (networkId === 'mainnet') {
    return KNS_API_MAINNET;
  } else if (networkId == 'testnet-12') {
    return KNS_API_TESTNET_12;
  } else if (networkId == 'testnet-11') {
    return KNS_API_TESTNET_11;
  } else if (networkId == 'testnet-10') {
    return KNS_API_TESTNET_10;
  } else {
    return KNS_API_TESTNET_10;
  }
}

export function getKnsWebsite(networkId: TNetworkId) {
  if (networkId === 'mainnet') {
    return KNS_WEBSITE_MAINNET_APP;
  } else if (networkId == 'testnet-10') {
    return KNS_WEBSITE_TESTNET_10;
  } else {
    return KNS_WEBSITE_TESTNET_10;
  }
}

export function getNetworkShortLabel(networkId: TNetworkId): string | null {
  const labels: Partial<Record<TNetworkId, string>> = {
    'testnet-10': 'TN10',
    'testnet-11': 'TN11',
    'testnet-12': 'TN12',
    devnet: 'DEV'
  };
  return labels[networkId] ?? null;
}

export const truncateToDecimals = (numeric: number | string, maxDecimals = 8) => {
  const digitsAfterDecimal = numeric.toString().split('.')[1] || '';

  const maxPossibleDecimals = maxDecimals;
  if (digitsAfterDecimal.length <= maxDecimals) return numeric.toString();

  const digitsCutoff = Math.min(digitsAfterDecimal.length, maxPossibleDecimals);

  return Number(numeric).toFixed(digitsCutoff);
};

export const underline2Camelcase = (str: string) => {
  return str.replace(/_(.)/g, (m, p1) => p1.toUpperCase());
};

export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export * from './clipboard';
export * from './helper';

