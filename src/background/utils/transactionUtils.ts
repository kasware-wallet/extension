import type { IUtxoEntry } from 'kaspa-wasm';

import { BRAND_ALIAN_TYPE_TEXT, NETWORK_TYPES } from '@/shared/constant';
import type { Account, IKaspaUtxoEntryReference, ToSignInput } from '@/shared/types';

/**
 * Convert Kaspa UTXO entry references to IUtxoEntry format.
 * Pure function — no side effects or service dependencies.
 */
export const kaspaUtxosToIUtxoEntries = (kasUtxos: IKaspaUtxoEntryReference[]): IUtxoEntry[] => {
  return kasUtxos.map((ref) => {
    const e = ref.entry;
    const spk =
      typeof e.scriptPublicKey === 'string'
        ? { version: 0, script: e.scriptPublicKey }
        : (e.scriptPublicKey as unknown as { version: number; script: string });
    return {
      outpoint: { transactionId: e.outpoint.transactionId, index: e.outpoint.index },
      amount: BigInt(e.amount),
      scriptPublicKey: { version: spk.version, script: spk.script },
      blockDaaScore: BigInt(e.blockDaaScore),
      isCoinbase: e.isCoinbase
    };
  });
};

/**
 * Build to-sign inputs from an account.
 * Pure function — no side effects or service dependencies.
 */
export const getToSignInputs = (account: Account): ToSignInput[] => {
  const publicKey = account.pubkey;
  const index = account.index as number;
  return [{ index, publicKey }];
};

/**
 * Generate an alias name for a keyring account.
 * Falls back to "Wallet" for unknown keyring types.
 */
export const generateAlianName = (type: string, index: number): string => {
  const label = BRAND_ALIAN_TYPE_TEXT[type] ?? 'Wallet';
  return `${label} ${index}`;
};

/**
 * Get network display name by network ID.
 * Returns the networkId itself as fallback for unknown networks.
 */
export const getNetworkNameById = (networkId: string): string => {
  const networkType = NETWORK_TYPES[networkId as keyof typeof NETWORK_TYPES];
  return networkType?.name ?? networkId;
};
