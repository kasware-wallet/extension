import BigNumber from 'bignumber.js';

/**
 * Format a number with locale-aware thousand separators.
 * Shared between background services (openapi.ts) and UI components.
 */
export function formatLocaleString(num: number | string | BigNumber) {
  const bn = new BigNumber(num);
  // An unparsable input is "unknown", not zero — rendering 0 would misreport a real amount.
  if (bn.isNaN()) return '-';
  // BigNumber.toFormat() natively handles both integer and decimal cases
  // (including very small values that would otherwise render as scientific notation).
  return bn.toFormat();
}

/**
 * Base units to a decimal amount, as a plain decimal string — **never scientific notation**.
 *
 * why `toFixed()` rather than `toString()`: BigNumber's `EXPONENTIAL_AT` is `[-7, 21]`, so `toString()`
 * printed one sompi as `1e-8`, and 1e21 base units and up as `1e+21`. Both ends are the same defect, and
 * it is a defect rather than an interface — this is a money helper whose output is rendered beside a
 * token tick, concatenated into messages, and stored in Redux as a balance, and `1e-8 KAS` is an amount
 * a user cannot reconcile against anything.
 */
export function sompiToAmount(val: number | string | bigint | BigNumber | undefined, dec: string | number) {
  if (val === undefined || val == null) return '0';
  const num = new BigNumber(val.toString());
  const multipler = Math.pow(10, Number(dec));
  return num.dividedBy(multipler).toFixed();
}

export function amountToSompi(val: string | number | undefined, dec: string | number) {
  if (val === undefined || val == null) return '0';
  const num = new BigNumber(val);
  const factor = Math.pow(10, Number(dec));
  return num.multipliedBy(factor).toFixed(0).toString();
}

/**
 * Add same-token decimal amounts exactly, returning the sum as a decimal string.
 *
 * why: the summation happens in base units (`BigInt`), never as a JS float add — `0.1 + 0.2` is
 * `0.30000000000000004`, and an amount-plus-fee figure rendered on an approval screen is still a
 * money figure.
 */
export function sumAmounts(dec: string | number, ...amounts: Array<string | number | undefined>): string {
  const total = amounts.reduce<bigint>((acc, amount) => acc + BigInt(amountToSompi(amount, dec)), BigInt(0));
  return sompiToAmount(total, dec);
}

/**
 * The KAS a send will pay, as the text it was typed as — or a throw naming why there is none.
 */
export function kaspaSendAmountKas(amount: string | number | undefined): string {
  const text = amount === undefined || amount === null ? '' : String(amount).trim();
  const parsed = new BigNumber(text);
  if (!text || !parsed.isFinite() || !parsed.isGreaterThan(0)) {
    throw new Error('amount is required when sendAll is false');
  }
  // Above zero is not the same as above one sompi: `amountToSompi` floors, so 0.000000001 KAS becomes
  // `'0'` and the transaction pays nothing at a real fee.
  if (BigInt(amountToSompi(text, KASPA_SEND_DECIMALS)) <= BigInt(0)) {
    throw new Error(`amount ${text} is below one sompi, which would send nothing`);
  }
  return text;
}

/** KAS's own width, for the amount check above. The builders pass `8` literally today. */
const KASPA_SEND_DECIMALS = 8;

/**
 * Decimal width for an amount field, from a token's `dec` as it arrives from an API or Redux.
 *
 * why: the send screen used `Number(uiState.decimals) ?? 8`, whose fallback can never fire —
 * `Number('')` is 0 and `Number('abc')` is NaN, and neither is nullish.
 */
export function resolveDecimalPlaces(dec: string | number | undefined | null, fallback = 8): number {
  // `Number(null)` and `Number('')` are both 0, so emptiness has to be rejected before parsing.
  if (dec === undefined || dec === null || (typeof dec === 'string' && dec.trim() === '')) return fallback;
  const parsed = Number(dec);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}
