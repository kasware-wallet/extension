import { kaspaToSompi } from 'kaspa-wasm';

import { KRC20_TRADE_FEE } from '@/shared/constant';
import { TxType } from '@/shared/types';
import { getChargeFee } from '@/shared/utils';

/**
 * Pure fee calculation for a given transaction type.
 * Does NOT include the mint count side effect — callers must handle that separately.
 *
 * For TxType.SIGN_KRC20_MINT, the mint count must be passed in:
 * - If mintCount % 10 !== 0, returns 0 (no additional charge)
 * - If mintCount % 10 === 0, returns the base charge fee
 */
export const calculateChargeFee = (txType: TxType, mintCount?: number): bigint => {
  let chargeFee = kaspaToSompi(getChargeFee(txType)) as unknown as bigint;
  if (txType === TxType.SIGN_KRC20_MINT) {
    if (mintCount !== undefined && mintCount % 10 !== 0) {
      chargeFee = BigInt(0);
    }
  }
  return chargeFee;
};

/**
 * Pure KRC20 trade fee calculation.
 * Given the previous and new trade counts, compute the fee.
 *
 * Known issue: the current wallet.ts implementation reads/writes openapiService
 * trade count non-atomically, which can cause race conditions under concurrency.
 * This pure function makes the dependency explicit — callers must provide the counts.
 */
export const calculateKRC20TradeFee = (count: number, previousTradeCount: number, newTradeCount: number): bigint => {
  if (count <= 0) return BigInt(0);
  const chargeFee = kaspaToSompi(KRC20_TRADE_FEE) as bigint;
  const ctm = Math.floor(previousTradeCount / 1000);
  const ct2m = Math.floor(newTradeCount / 1000);
  if (ct2m - ctm > 0) return chargeFee * BigInt(ct2m - ctm);
  return BigInt(0);
};
