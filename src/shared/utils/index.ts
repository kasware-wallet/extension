import { keyBy } from 'lodash';

import browser from '@/background/webapi/browser';
import { AddressFlagType, CHAINS } from '@/shared/constant';

import { Address, UtxoEntryReference } from 'kaspa-wasm';
import { IKaspaUTXOWithoutBigint } from '../types';
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

export const getKaspaUTXOWithoutBigint = (utxos: UtxoEntryReference[]) => {
  const newUtxos: IKaspaUTXOWithoutBigint[] = utxos.map((v) => {
    return {
      amount: v.amount.toString(),
      blockDaaScore: v.blockDaaScore.toString(),
      entry: {
        address: v.entry?.address?.toString(),
        amount: v.entry.amount.toString(),
        blockDaaScore: v.entry.blockDaaScore.toString(),
        isCoinbase: v.entry.isCoinbase,
        outpoint: v.entry.outpoint,
        scriptPublicKey: v.entry.scriptPublicKey
      },
      isCoinbase: v.isCoinbase
    } as IKaspaUTXOWithoutBigint;
  });
  return newUtxos;
};
export const getKaspaUTXOWithBigint = (utxos: IKaspaUTXOWithoutBigint[]) => {
  const newUtxos: UtxoEntryReference[] = utxos.map((v) => {
    if (v.entry.address) {
      return {
        amount: BigInt(v.amount),
        blockDaaScore: BigInt(v.blockDaaScore),
        entry: {
          address: new Address(v.entry.address),
          amount: BigInt(v.entry.amount),
          blockDaaScore: BigInt(v.entry.blockDaaScore.toString()),
          isCoinbase: v.entry.isCoinbase,
          outpoint: v.entry.outpoint,
          scriptPublicKey: v.entry.scriptPublicKey
        },
        isCoinbase: v.isCoinbase
      };
    } else {
      return {
        amount: BigInt(v.amount),
        blockDaaScore: BigInt(v.blockDaaScore),
        entry: {
          // address: new Address(v.entry.address),
          amount: BigInt(v.entry.amount),
          blockDaaScore: BigInt(v.entry.blockDaaScore.toString()),
          isCoinbase: v.entry.isCoinbase,
          outpoint: v.entry.outpoint,
          scriptPublicKey: v.entry.scriptPublicKey
        },
        isCoinbase: v.isCoinbase
      };
    }
  });
  return newUtxos;
};
