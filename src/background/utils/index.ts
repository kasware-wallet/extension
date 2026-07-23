import { COIN_DUST, KASPLEX } from '@/shared/constant';
import type { TProtocol } from '@/shared/types';
import { AddressType, BuildScriptType } from '@/shared/types';
import { sompiToAmount } from '@/shared/utils/format';
import { sleep } from '@/shared/utils';
import { Buffer } from 'buffer';
export { default as createPersistStore } from './persisitStore';
export { default as PromiseFlow } from './promiseFlow';
export { sleep };

import { Opcodes, ScriptBuilder, type Transaction, TransactionInput, payToAddressScript } from 'kaspa-wasm';
import type { UtxoEntryReference } from 'kaspa-wasm';
import log from 'loglevel';
import util from 'util';
export function convKPubToP2sh(kPub, testnet) {
  const lenKey = kPub.length;
  if (lenKey !== 64) {
    // script hash
    return '';
  }
  kPub = '08' + kPub;
  const decoded = Buffer.from(kPub, 'hex');
  kPub = decoded.toString('binary');

  let addr = encodeBech32(kPub, testnet);
  if (testnet) {
    addr = 'kaspatest:' + addr;
  } else {
    addr = 'kaspa:' + addr;
  }
  return addr;
}

function encodeBech32(data, testnet) {
  const pMod = (list) => {
    const g = [0x98f2bc8e61, 0x79b76d99e2, 0xf33e5fb3c4, 0xae2eabe2a8, 0x1e4f43e470];
    let cs = BigInt(1);
    for (const v of list) {
      const b = Number(BigInt(cs) >> BigInt(35));
      // let b = cs >> 31;

      cs = ((BigInt(cs) & BigInt(0x07ffffffff)) << BigInt(5)) ^ BigInt(v);
      for (let i = 0; i < g.length; i++) {
        if (((b >> i) & 1) === 1) {
          cs ^= BigInt(g[i]);
        }
      }
    }
    return Number(cs ^ BigInt(1));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b8 = Array.from(data) as any[];
  const b8Len = b8.length;
  let nLast = 0;
  let bLast = 0;
  const b5: number[] = [];
  for (let i = 0; i < b8Len; i++) {
    const rMove = 3 + nLast;
    let b = (b8[i].charCodeAt(0) >> rMove) & 31;
    if (nLast > 0) {
      b |= bLast;
    }
    b5.push(b);
    nLast = rMove;
    if (rMove >= 5) {
      b5.push(((b8[i].charCodeAt(0) << (8 - rMove)) >> 3) & 31);
      nLast = rMove - 5;
    }
    if (nLast > 0) {
      bLast = ((b8[i].charCodeAt(0) << (8 - nLast)) >> 3) & 31;
    }
  }
  // log.debug('b5',b5)
  if (nLast > 0) {
    b5.push(bLast);
  }
  // log.debug('b5-2',b5)
  let b5ex = [11, 1, 19, 16, 1, 0];
  if (testnet) {
    b5ex = [11, 1, 19, 16, 1, 20, 5, 19, 20, 0];
  }
  b5ex = b5ex.concat(b5);
  // log.debug('b5ex',b5ex)
  b5ex = b5ex.concat([0, 0, 0, 0, 0, 0, 0, 0]);
  // log.debug('b5ex-2',b5ex)
  const p = pMod(b5ex);
  // log.debug('p',p)
  const c = [
    'q',
    'p',
    'z',
    'r',
    'y',
    '9',
    'x',
    '8',
    'g',
    'f',
    '2',
    't',
    'v',
    'd',
    'w',
    '0',
    's',
    '3',
    'j',
    'n',
    '5',
    '4',
    'k',
    'h',
    'c',
    'e',
    '6',
    'm',
    'u',
    'a',
    '7',
    'l'
  ];
  for (let i = 0; i < 8; i++) {
    b5.push(Number((BigInt(p) >> BigInt(5 * (7 - i))) & BigInt(31)));
  }
  // log.debug('b5-3',b5)
  let result = '';
  for (let i = 0; i < b5.length; i++) {
    result += c[b5[i]];
    // log.debug(i,b5[i],c[b5[i]])
    // log.debug('result',i,result)
  }
  return result;
}

export function getRedeemScript(jsonString: string, publicKey: string, protocol = KASPLEX as TProtocol) {
  const inscribeJsonHex = Buffer.from(jsonString, 'utf-8').toString('hex');
  const protocolHex = Buffer.from(protocol, 'utf-8').toString('hex');
  let protocolLen = (protocolHex.length / 2).toString(16);
  if (protocolLen.length % 2 === 1) protocolLen = '0' + protocolLen;
  let redeemScript =
    '20' +
    publicKey.slice(2) +
    'ac0063' +
    protocolLen +
    protocolHex +
    '51010000' +
    scriptLength(inscribeJsonHex) +
    inscribeJsonHex +
    '68';
  redeemScript = scriptLength(redeemScript) + redeemScript;
  return redeemScript;
}

export function getRedeemScript00(jsonString: string, publicKey: string, protocol = KASPLEX as TProtocol) {
  const inscribeJsonHex = Buffer.from(jsonString, 'utf-8').toString('hex');
  const protocolHex = Buffer.from(protocol, 'utf-8').toString('hex');
  let protocolLen = (protocolHex.length / 2).toString(16);
  if (protocolLen.length % 2 === 1) protocolLen = '0' + protocolLen;

  let redeemScript =
    '20' +
    publicKey.slice(2) +
    // 'ac0063076b6173706c657800' +
    'ac0063' +
    protocolLen +
    protocolHex +
    '00' +
    scriptLength(inscribeJsonHex) +
    inscribeJsonHex +
    '68';
  redeemScript = scriptLength(redeemScript) + redeemScript;
  return redeemScript;
}

export function getRedeemScript51(jsonString: string, publicKey: string, protocol = KASPLEX as TProtocol) {
  const inscribeJsonHex = Buffer.from(jsonString, 'utf-8').toString('hex');
  const protocolHex = Buffer.from(protocol, 'utf-8').toString('hex');
  let protocolLen = (protocolHex.length / 2).toString(16);
  if (protocolLen.length % 2 === 1) protocolLen = '0' + protocolLen;
  let redeemScript =
    '20' +
    publicKey.slice(2) +
    'ac0063' +
    protocolLen +
    protocolHex +
    '510000' +
    scriptLength(inscribeJsonHex) +
    inscribeJsonHex +
    '68';
  redeemScript = scriptLength(redeemScript) + redeemScript;
  return redeemScript;
}

export function getRedeemScriptForEcdsa(jsonString: string, publicKey: string, protocol = KASPLEX as TProtocol) {
  const inscribeJsonHex = Buffer.from(jsonString, 'utf-8').toString('hex');
  const protocolHex = Buffer.from(protocol, 'utf-8').toString('hex');
  let protocolLen = (protocolHex.length / 2).toString(16);
  if (protocolLen.length % 2 === 1) protocolLen = '0' + protocolLen;

  const scriptPublicKey = '21' + publicKey + 'ab';
  let redeemScript =
    scriptPublicKey +
    // '0063076b6173706c657851010000' +
    '0063' +
    protocolLen +
    protocolHex +
    '51010000' +
    scriptLength(inscribeJsonHex) +
    inscribeJsonHex +
    '68';
  redeemScript = scriptLength(redeemScript) + redeemScript;
  return redeemScript;
}

export function getRedeemScriptForEcdsa51(jsonString: string, publicKey: string, protocol = KASPLEX as TProtocol) {
  const inscribeJsonHex = Buffer.from(jsonString, 'utf-8').toString('hex');
  const protocolHex = Buffer.from(protocol, 'utf-8').toString('hex');
  let protocolLen = (protocolHex.length / 2).toString(16);
  if (protocolLen.length % 2 === 1) protocolLen = '0' + protocolLen;
  const scriptPublicKey = '21' + publicKey + 'ab';
  let redeemScript =
    scriptPublicKey +
    '0063' +
    protocolLen +
    protocolHex +
    '510000' +
    scriptLength(inscribeJsonHex) +
    inscribeJsonHex +
    '68';
  redeemScript = scriptLength(redeemScript) + redeemScript;
  return redeemScript;
}

export function getRedeemScriptForEcdsa00(jsonString: string, publicKey: string, protocol = KASPLEX as TProtocol) {
  const inscribeJsonHex = Buffer.from(jsonString, 'utf-8').toString('hex');
  const protocolHex = Buffer.from(protocol, 'utf-8').toString('hex');
  let protocolLen = (protocolHex.length / 2).toString(16);
  if (protocolLen.length % 2 === 1) protocolLen = '0' + protocolLen;
  const scriptPublicKey = '21' + publicKey + 'ab';
  let redeemScript =
    scriptPublicKey +
    // '0063076b6173706c657800' +
    '0063' +
    protocolLen +
    protocolHex +
    '00' +
    scriptLength(inscribeJsonHex) +
    inscribeJsonHex +
    '68';
  redeemScript = scriptLength(redeemScript) + redeemScript;
  return redeemScript;
}

export function walletGetRedeemScript(
  inscribeJsonString: string,
  publicKey: string,
  addressType: AddressType,
  protocol = KASPLEX as TProtocol
) {
  let redeemScript = getRedeemScript(inscribeJsonString, publicKey, protocol);
  if (addressType && addressType == AddressType.KASPA_TANGEM_44_111111) {
    redeemScript = getRedeemScriptForEcdsa(inscribeJsonString, publicKey, protocol);
  }
  return redeemScript;
}

export function walletGetRedeemScript51(
  inscribeJsonString: string,
  publicKey: string,
  addressType: AddressType,
  protocol = KASPLEX as TProtocol
) {
  let redeemScript = getRedeemScript51(inscribeJsonString, publicKey, protocol);
  if (addressType && addressType == AddressType.KASPA_TANGEM_44_111111) {
    redeemScript = getRedeemScriptForEcdsa51(inscribeJsonString, publicKey, protocol);
  }
  return redeemScript;
}

export function walletGetRedeemScript00(
  inscribeJsonString: string,
  publicKey: string,
  addressType: AddressType,
  protocol = KASPLEX as TProtocol
) {
  let redeemScript = getRedeemScript00(inscribeJsonString, publicKey, protocol);
  if (addressType && addressType == AddressType.KASPA_TANGEM_44_111111) {
    redeemScript = getRedeemScriptForEcdsa00(inscribeJsonString, publicKey, protocol);
  }
  return redeemScript;
}

export function dec2hexN(value, n) {
  return value.toString(16).toUpperCase().padStart(n, 0);
}

export function inspectObject(obj) {
  return util.inspect(obj, { showHidden: false, depth: null, colors: true });
}
// to do check address type
export function addressToPublicKey(address) {
  // incorrect. somtetimes it's 02, somtimes it's 03
  return '02' + payToAddressScript(address).script.slice(2).slice(0, -2);
}

export function indexGreaterThanSum(array: UtxoEntryReference[], threshold: bigint) {
  let sum = BigInt(0);
  const coinDust = BigInt(COIN_DUST);
  return array.findIndex((value) => {
    sum += value.amount;
    return sum > threshold + coinDust;
  });
}

export function getTransferFromMultiSigAddrRedeemScript(
  jsonString: string,
  publicKey: string,
  protocol = KASPLEX as TProtocol
) {
  const inscribeJsonHex = Buffer.from(jsonString, 'utf-8').toString('hex');
  const protocolHex = Buffer.from(protocol, 'utf-8').toString('hex');
  let protocolLen = (protocolHex.length / 2).toString(16);
  if (protocolLen.length % 2 === 1) protocolLen = '0' + protocolLen;
  log.debug('inscribeJsonHex.length ', inscribeJsonHex.length);
  let redeemScript =
    publicKey +
    // '0063076b6173706c657851010000' +
    '0063' +
    protocolLen +
    protocolHex +
    '51010000' +
    scriptLength(inscribeJsonHex) +
    inscribeJsonHex +
    '68';

  redeemScript = scriptLength(redeemScript) + redeemScript;
  log.debug(redeemScript.length);
  return redeemScript;
}

export const utxoEntryToTransactionInputs = (utxosEntries: UtxoEntryReference[], sigOpCount = 1) => {
  let totalValue = BigInt(0);
  const inputs = utxosEntries.map((utxo, sequence) => {
    totalValue += utxo.amount;
    return new TransactionInput({
      previousOutpoint: utxo.entry.outpoint,
      signatureScript: '',
      sequence: BigInt(sequence),
      sigOpCount,
      // computeBudget: sigOpCount * 10,
      utxo
    });
  });

  return { inputs, totalValue };
};
/**
 *
 * @param tx is Transaction Type
 * @returns Number, kas unit
 */
export const getTxFeeFromTx = (tx: Transaction) => {
  const inputValue = tx.inputs.reduce(
    (accumulator, b) => accumulator + (b.utxo?.amount ? b.utxo?.amount : BigInt(0)),
    BigInt(0)
  );
  const outputValue = tx.outputs.reduce((accumulator, b) => accumulator + BigInt(b.value), BigInt(0));
  const txFeeSompi = inputValue - outputValue;
  return Number(sompiToAmount(txFeeSompi, 8));
};

export const checkTransactionSum = (tx: Transaction, txFee: bigint) => {
  const checkInputsValue = tx.inputs.reduce((agg, curr) => {
    return (curr.utxo?.amount || BigInt(0)) + agg;
  }, BigInt(0));

  const checkOutputsValue = tx.outputs.reduce((agg, curr) => {
    return curr.value + agg;
  }, BigInt(0));

  if (checkOutputsValue + txFee !== checkInputsValue) {
    throw new Error('inputs value is not equal to outputs value');
  }

  return true;
};
export const walletBuildScript = ({
  type,
  data,
  pubkey,
  addressType
}: {
  type: BuildScriptType;
  data: string;
  pubkey: string;
  addressType: AddressType;
}) => {
  let xOnlyPublicKey = pubkey.slice(2);
  let checkSig = Opcodes.OpCheckSig;
  if (addressType == AddressType.KASPA_TANGEM_44_111111) {
    xOnlyPublicKey = pubkey;
    checkSig = Opcodes.OpCheckSigECDSA;
  }
  // const buf = Buffer.from(JSON.stringify(data, null, 0));
  const buf = Buffer.from(data);
  if (type == BuildScriptType.KNS) {
    const script = new ScriptBuilder()
      .addData(xOnlyPublicKey)
      .addOp(checkSig)
      .addOp(Opcodes.OpFalse)
      .addOp(Opcodes.OpIf)
      .addData(Buffer.from('kns'))
      .addI64(BigInt(0))
      .addData(buf)
      .addOp(Opcodes.OpEndIf);
    return script.toString();
  } else if (type == BuildScriptType.KRC20) {
    const script = new ScriptBuilder()
      .addData(xOnlyPublicKey)
      .addOp(checkSig)
      .addOp(Opcodes.OpFalse)
      .addOp(Opcodes.OpIf)
      .addData(Buffer.from('kasplex'))
      .addI64(BigInt(0))
      .addData(buf)
      .addOp(Opcodes.OpEndIf);
    return script.toString();
  } else if (type == BuildScriptType.KSPR_KRC721) {
    const script = new ScriptBuilder()
      .addData(xOnlyPublicKey)
      .addOp(checkSig)
      .addOp(Opcodes.OpFalse)
      .addOp(Opcodes.OpIf)
      .addData(Buffer.from('kspr'))
      .addI64(BigInt(0))
      .addData(buf)
      .addOp(Opcodes.OpEndIf);
    return script.toString();
  } else {
    throw new Error('type not supported');
  }
};
export function reverseHexPairs(hexStr: string): string {
  //Handle odd length situations : make up for zeros in front
  const str = hexStr.length % 2 === 1 ? `0${hexStr}` : hexStr;
  //Divide in groups of two and arrange all groups in reverse order
  const pairs = str.match(/.{2}/g) || [];
  return pairs.reverse().join('');
}
export function scriptLength(hexScript: string) {
  let length = (hexScript.length / 2).toString(16);
  if (length.length % 2 !== 0) {
    length = '0' + length;
  }
  return scriptLengthType(hexScript) + reverseHexPairs(length);
}
export function scriptLengthType(hexScript: string) {
  if (!hexScript || typeof hexScript !== 'string') {
    throw new Error('Invalid hexScript input: must be a valid hexadecimal string with even length');
  }

  const byteLength = hexScript.length / 2;

  if (byteLength > 2 ** 16 - 1) {
    return '4e';
  } else if (byteLength > 2 ** 8 - 1) {
    return '4d';
  } else if (byteLength > 75) {
    return '4c';
  } else {
    return '';
  }
}
export function removeLengthPrefix(redeemScript: string) {
  if (redeemScript.startsWith('4c')) {
    redeemScript = redeemScript.slice(4);
  } else if (redeemScript.startsWith('4d')) {
    redeemScript = redeemScript.slice(6);
  } else if (redeemScript.startsWith('4e')) {
    redeemScript = redeemScript.slice(10);
  }
  return redeemScript;
}

export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  if (chunkSize <= 0) {
    throw new Error('Chunk size must be greater than 0');
  }

  const result: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}
