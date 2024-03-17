import { keyBy } from 'lodash';

import browser from '@/background/webapi/browser';
import { AddressFlagType, CHAINS } from '@/shared/constant';

import { IKaspaUTXO, IKaspaUTXOWithoutBigint } from '../types';
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

export { Message, format, t };

const chainsDict = keyBy(CHAINS, 'serverId');
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

export const getKaspaUTXOWithoutBigint = (utxos: IKaspaUTXO[]) => {
  const newUtxos: IKaspaUTXOWithoutBigint[] = utxos.map((v) => {
    return {
      address: v.address,
      outpoint: v.outpoint,
      utxoEntry: {
        amount: v.utxoEntry.amount.toString(),
        blockDaaScore: v.utxoEntry.blockDaaScore.toString(),
        isCoinbase: v.utxoEntry.isCoinbase,
        scriptPublicKey: v.utxoEntry.scriptPublicKey
      }
    } as IKaspaUTXOWithoutBigint;
  });
  return newUtxos;
};
export const getKaspaUTXOs = (utxos: IKaspaUTXOWithoutBigint[]) => {
  const newUtxos: IKaspaUTXO[] = utxos.map((v) => {
    return {
      address: v.address,
      outpoint: v.outpoint,
      utxoEntry: {
        amount: BigInt(v.utxoEntry.amount),
        blockDaaScore: BigInt(v.utxoEntry.blockDaaScore),
        isCoinbase: v.utxoEntry.isCoinbase,
        scriptPublicKey: v.utxoEntry.scriptPublicKey
      }
    } as IKaspaUTXO;
  });
  return newUtxos;
};
