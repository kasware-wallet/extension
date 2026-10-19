/**
 * The Kaspa payment URI our receive screens hand to a camera.
 *
 * Shared rather than UI-local because three surfaces need the identical string: the React receive
 * screen, and the Android and iOS native receive screens, which reach it through
 * `walletController.buildKaspaPaymentUri` (D076 — a native host never re-implements a rule the
 * background owns, and a Kotlin/Swift copy of this regex is exactly that).
 *
 * The format is `<address>?amount=<decimal KAS>`, BIP-21 in shape but not in name: there is no
 * `kaspa:` scheme prefix to add because a Kaspa address already carries one. `scannedPayment.ts`
 * holds the parser that reads it back.
 */
import BigNumber from 'bignumber.js';

/**
 * A plain decimal with at most Kaspa's eight places. Deliberately not a general number pattern:
 * `1e3`, `-1`, `0x10` and `1.123456789` all have to fail here rather than reach `amountToSompi`,
 * which was never given them before — and an amount asking for more precision than the chain has
 * cannot be paid as written.
 */
export const KASPA_AMOUNT = /^\d+(?:\.\d{1,8})?$/;

/**
 * `amount` is passed through as the string the user typed, never via `Number`: the whole point of
 * keeping it textual is that `90071992.54740994` survives the trip. An empty or non-positive amount
 * yields the bare address, which is what every wallet scans happily.
 */
export function buildKaspaPaymentUri(address: string, amount?: string): string {
  if (!address) return '';
  if (!amount || !KASPA_AMOUNT.test(amount) || !new BigNumber(amount).isGreaterThan(0)) return address;

  return `${address}?amount=${amount}`;
}
