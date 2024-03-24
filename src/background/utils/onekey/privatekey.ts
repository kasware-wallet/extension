import { PrivateKey } from '@brucelei/kaspacore';
import { bytesToHex } from '@noble/hashes/utils';

import { tapTweakHash } from './bip340';

import { Buffer } from 'buffer';
import ecc from './nobleSecp256k1Wrapper';

export function privateKeyFromOriginPrivateKey(
  pri: Buffer,
  pub: Buffer,
): PrivateKey {
  let privateKey: Uint8Array | null = new Uint8Array(pri);
  const publicKey = pub;

  if (publicKey[0] === 3) {
    privateKey = ecc.privateNegate(privateKey);
  }

  if (!privateKey) {
    throw new Error('Private key is required for tweaking signer!');
  }

  const tweakedPrivateKey = ecc.privateAdd(
    privateKey,
    tapTweakHash(publicKey.slice(1), undefined),
  );

  return new PrivateKey(bytesToHex(tweakedPrivateKey));
}
