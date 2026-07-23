import blake2b from 'blake2b-wasm';
import { Buffer } from 'buffer';
import { ScriptBuilder, addressFromScriptPublicKey } from 'kaspa-wasm';

import { KASPLEX } from '@/shared/constant';
import type { AddressType, TProtocol } from '@/shared/types';

import {
  convKPubToP2sh,
  removeLengthPrefix,
  walletGetRedeemScript,
  walletGetRedeemScript00,
  walletGetRedeemScript51
} from './index';

/**
 * Get script info (redeem script + commit address) for an inscribe JSON string.
 * Pure function — all dependencies are passed as parameters.
 *
 * NOTE: Requires blake2b WASM to be initialized before calling.
 */
export const getScriptInfo = (
  inscribeJsonString: string,
  publicKey: string,
  addressType: number,
  networkId: string,
  protocol = KASPLEX as TProtocol
) => {
  const redeemScript = walletGetRedeemScript00(inscribeJsonString, publicKey, addressType, protocol);
  const scriptPublicKey = blake2b()
    .update(Buffer.from(removeLengthPrefix(redeemScript), 'hex'))
    .digest('hex');
  const commitAddress = convKPubToP2sh(scriptPublicKey, networkId !== 'mainnet');

  return { redeemScript, commitAddress };
};

/**
 * Get commit addresses for multiple inscribe JSON strings across all protocols.
 * Pure function — all dependencies are passed as parameters.
 *
 * NOTE: Requires blake2b WASM to be initialized before calling.
 */
export const getCommitAddressesPure = (
  inscribeJsonStrings: string[],
  publicKey: string,
  addressType: AddressType,
  networkId: string
) => {
  const commitAddressMap = new Map<
    string,
    { commitAddress: string; inscribeJsonString: string; redeemScript: string; scriptPublicKey: string }
  >();
  for (const inscribeJsonString of inscribeJsonStrings) {
    for (const protocol of ['kasplex', 'kns', 'kspr'] as TProtocol[]) {
      const redeemScript = walletGetRedeemScript(inscribeJsonString, publicKey, addressType, protocol);
      const scriptPublicKey = blake2b()
        .update(Buffer.from(removeLengthPrefix(redeemScript), 'hex'))
        .digest('hex');
      const commitAddress = convKPubToP2sh(scriptPublicKey, networkId !== 'mainnet');
      commitAddressMap.set(commitAddress, { commitAddress, inscribeJsonString, redeemScript, scriptPublicKey });
      const redeemScript2 = walletGetRedeemScript51(inscribeJsonString, publicKey, addressType, protocol);
      const scriptPublicKey2 = blake2b()
        .update(Buffer.from(removeLengthPrefix(redeemScript2), 'hex'))
        .digest('hex');
      const commitAddress2 = convKPubToP2sh(scriptPublicKey2, networkId !== 'mainnet');
      commitAddressMap.set(commitAddress2, {
        commitAddress: commitAddress2,
        inscribeJsonString,
        redeemScript: redeemScript2,
        scriptPublicKey: scriptPublicKey2
      });

      const redeemScript3 = walletGetRedeemScript00(inscribeJsonString, publicKey, addressType, protocol);
      const scriptPublicKey3 = blake2b()
        .update(Buffer.from(removeLengthPrefix(redeemScript3), 'hex'))
        .digest('hex');
      const commitAddress3 = convKPubToP2sh(scriptPublicKey3, networkId !== 'mainnet');
      commitAddressMap.set(commitAddress3, {
        commitAddress: commitAddress3,
        inscribeJsonString,
        redeemScript: redeemScript3,
        scriptPublicKey: scriptPublicKey3
      });
    }
  }
  return commitAddressMap;
};

/**
 * Get P2SH address for an inscribe JSON string.
 * Pure function — all dependencies are passed as parameters.
 *
 * NOTE: Requires blake2b WASM to be initialized before calling.
 */
export const getP2shAddressPure = (
  inscribeJsonString: string,
  publicKey: string,
  addressType: AddressType,
  networkId: string
) => {
  const { commitAddress } = getScriptInfo(inscribeJsonString, publicKey, addressType, networkId);
  return commitAddress;
};

/**
 * Get P2SH address from a script builder script.
 * Pure function — all dependencies are passed as parameters.
 */
export const getP2shAddressFromScriptBuilderPure = (script: string, networkId: string) => {
  const scriptObj = ScriptBuilder.fromScript(script);
  const scriptPk = scriptObj.createPayToScriptHashScript();
  const p2shAddress = addressFromScriptPublicKey(scriptPk, networkId)?.toString();
  return p2shAddress;
};
