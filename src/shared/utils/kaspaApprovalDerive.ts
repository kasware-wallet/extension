import BigNumber from 'bignumber.js';

import type {
  KaspaApprovalOverrides,
  KaspaCommitRevealType,
  KaspaDerivedApproval,
  KaspaKRC20InscribeType,
  KaspaKRC20OrderType
} from '../types/kaspa-approval';
import { TxType } from '../types/kaspa-tx';
import { amountToSompi } from './format';

/**
 * The arithmetic and the rules behind `walletController.deriveKaspaApproval` /
 * `submitKaspaApproval` — everything that must give the same answer on every surface (D084).
 *
 * Pure on purpose: no service imports, so `test/kaspaApprovalDerive.vitest.ts` can cover the parts a
 * confirmation screen is judged on without a background. Kaspa is 8 decimals and sompi is the base
 * unit, so every figure here is a decimal string over `BigNumber` and never a `number` (AGENTS.md
 * section 4).
 */

/** Kaspa's decimals. Not configurable: KAS has eight, and a parameter here would invite a wrong one. */
export const KASPA_DECIMALS = 8;

/** The `SignPsbt` methods this port derives. The batch transfer and the deprecated batch method are not. */
export const KASPA_DERIVED_SIGN_PSBT_METHOD = 'sendKaspa';
export const KASPA_DERIVED_SIGN_PSKT_METHOD = 'signPskt';
export const KASPA_DERIVED_SIGN_KRC20_METHOD = 'signKRC20Transaction';

/**
 * A sompi amount as it arrives from a dapp, validated into an integer decimal string.
 *
 * A dapp sends `sompi` as a JSON number, so it has already been through a float: values above 2^53
 * arrived rounded and nothing downstream can recover them. Rejected rather than rendered, because the
 * number on a confirmation screen has to be the number that will be paid — `9007199254740993` sompi
 * silently becoming `...992` is the failure this guard exists for. Throws with the field name.
 */
export function kaspaSompiFromDapp(value: unknown, field = 'sompi'): string {
  if (typeof value !== 'number' && typeof value !== 'string' && typeof value !== 'bigint') {
    throw new Error(`${field} is missing or not a number`);
  }
  // Order matters: a fraction is a malformed request, while a whole number past 2^53 is a request that
  // arrived already rounded. Two different faults, so two different messages.
  if (typeof value === 'number' && Number.isInteger(value) && !Number.isSafeInteger(value)) {
    throw new Error(
      `${field} ${value} is not an exact integer: a sompi amount past Number.MAX_SAFE_INTEGER has already lost precision`
    );
  }
  const amount = new BigNumber(value.toString());
  if (!amount.isFinite() || !amount.isInteger() || amount.isNegative()) {
    throw new Error(`${field} ${String(value)} is not a non-negative integer number of sompi`);
  }
  return amount.toFixed(0);
}

/** KAS to sompi, integer string. */
export function kaspaSompiFromAmount(amount: string): string {
  return amountToSompi(amount, KASPA_DECIMALS);
}

/** Integer sompi addition. Both sides are decimal strings, and so is the answer. */
export function addSompi(a: string, b: string): string {
  return new BigNumber(a || '0').plus(new BigNumber(b || '0')).toFixed(0);
}

/**
 * Integer sompi subtraction, `a − b`. Both sides are decimal strings, and so is the answer — which may
 * be negative, because a raw PSKT's balance change is the account's own outputs minus its own inputs.
 */
export function subSompi(a: string, b: string): string {
  return new BigNumber(a || '0').minus(new BigNumber(b || '0')).toFixed(0);
}

/**
 * Sum an ordered list of integer sompi decimal strings — the total behind a raw PSKT's input and
 * output rows. One fold over `addSompi` rather than a second reduce, so the empty and blank rules
 * have a single implementation.
 */
export function sumSompiList(values: Array<string | undefined>): string {
  return values.reduce<string>((total, value) => addSompi(total, value || ''), '0');
}

/**
 * Whether the balance covers what leaves the wallet.
 *
 * An unknown balance (`''`) reports **affordable**, exactly as EVM's `canAffordFee` does: the wallet
 * decides what it will sign, and a balance read that failed is not evidence of an empty account. A
 * screen that blocked Confirm on it would refuse a valid payment whenever the indexer blinked.
 */
export function kaspaCanAffordTotal(totalSompi: string, balanceSompi: string): boolean {
  if (!balanceSompi) return true;
  return new BigNumber(totalSompi || '0').lte(new BigNumber(balanceSompi));
}

/**
 * The overrides a caller may pin, validated.
 *
 * Both are money-shaped, both arrive over a bridge from a host, and both are handed to a transaction
 * builder — so a non-numeric or negative value is refused here rather than turned into `NaN` sompi
 * three layers down. An omitted field stays omitted: that is what asks the background to use the
 * dapp's own figure.
 */
export function normalizeKaspaApprovalOverrides(overrides?: KaspaApprovalOverrides): KaspaApprovalOverrides {
  const clean: KaspaApprovalOverrides = {};
  for (const field of ['priorityFee', 'feeRate'] as const) {
    const raw = overrides?.[field];
    if (raw === undefined || raw === null || raw === '') continue;
    const value = new BigNumber(String(raw).trim());
    if (!value.isFinite() || value.isNegative()) {
      throw new Error(`${field} ${String(raw)} is not a non-negative number`);
    }
    clean[field] = value.toString();
  }
  return clean;
}

/**
 * The single float boundary in this port, named so it is reviewable.
 *
 * `prepareSendKAS` and `sendKaspa` take `priorityFee` and `feeRate` as `number` — a port-wide type
 * that predates this work and that converging is a separate change on a live signing path. Everything
 * on the screen and everything crossing the bridge stays a string; the conversion happens here, once,
 * immediately before the builder call. `undefined` in means "the dapp's own value", not zero.
 */
export function kaspaFeeNumber(value: string | number | undefined): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = new BigNumber(String(value));
  if (!parsed.isFinite() || parsed.isNegative()) return undefined;
  return parsed.toNumber();
}

/**
 * A KAS figure as `prepareCreateTransaction` returns it — a `number` — rounded to Kaspa's eight decimals
 * and rendered to the decimal string a screen shows and the bridge carries.
 *
 * The display side of the same float boundary `kaspaFeeNumber` is the input side of: the builder hands
 * back KAS as a `number` (a port-wide type that predates this work), and the derived payload must not
 * widen it, so the value is stringified here rather than left as a float for a host to format. A
 * non-finite value is `''`, never `NaN` on a confirmation screen.
 */
export function kaspaAmountDecimalString(value: number | string): string {
  const parsed = new BigNumber(String(value));
  if (!parsed.isFinite()) return '';
  return parsed.decimalPlaces(KASPA_DECIMALS).toString();
}

/**
 * May this caller answer the pending approval? The message to throw, or `undefined`.
 *
 * Same contract as `evmApprovalAnswerableMessage`, and for the same reason: a tap meant for one request
 * must not answer the next one to reach the queue. Kaspa holds one approval at a time and *overwrites*
 * the slot when a new request arrives (`notificationService.requestApproval`), which makes the check
 * more load-bearing here, not less — the entry a screen was drawn from can be replaced without the
 * screen hearing about it.
 */
export function kaspaApprovalAnswerableMessage(
  expectedApprovalId: string,
  pendingApprovalId?: string
): string | undefined {
  if (!expectedApprovalId) {
    return 'approvalId is required: refusing to answer whichever approval happens to be pending';
  }
  if (!pendingApprovalId) {
    return 'no pending Kaspa approval';
  }
  if (pendingApprovalId !== expectedApprovalId) {
    return `stale approvalId ${expectedApprovalId}: the pending approval is ${pendingApprovalId}`;
  }
  return undefined;
}

/**
 * May this derived approval be submitted? The message to throw, or `undefined`.
 *
 * `unsupported` may be **rejected** but never submitted — that is how a surface clears a request it
 * cannot describe instead of leaving the dapp's promise hanging. `progress` may be neither: it is
 * already being answered.
 */
export function kaspaApprovalSubmitRefusalMessage(
  expectedApprovalId: string,
  derived: KaspaDerivedApproval
): string | undefined {
  switch (derived.kind) {
    case 'none':
      return 'no pending Kaspa approval';
    case 'unsupported':
      return `approval ${derived.approvalId} is ${derived.approvalComponent} (${derived.method}), which this port does not derive: ${derived.reason}`;
    case 'progress':
      return `approval ${derived.approvalId} is ${derived.approvalComponent}, which is already being answered: wait for it rather than submitting it again`;
    default:
      return derived.approvalId === expectedApprovalId
        ? undefined
        : `stale approvalId ${expectedApprovalId}: the pending approval is ${derived.approvalId}`;
  }
}

/**
 * May this entry be rejected? The message to throw, or `undefined`.
 *
 * The rule D084's amendment names, expressed against the derived view rather than the queue entry: a
 * `progress` slot that reports `cancelable: false` is one the wallet resolves itself, and rejecting it
 * from a surface would cancel work the user already authorised. Kaspa's only progress slot today is the
 * unlock, which *is* cancelable — declining to unlock is a real decision — so this guard is here for
 * the next one rather than for a case that exists, which is exactly when it is cheap to add.
 */
export function kaspaApprovalRejectRefusalMessage(
  expectedApprovalId: string,
  derived: Pick<KaspaDerivedApproval, 'kind'> & { cancelable?: boolean; approvalComponent?: string }
): string | undefined {
  if (derived.kind === 'progress' && derived.cancelable === false) {
    return `approval ${expectedApprovalId} is ${derived.approvalComponent} and is already being answered by the wallet: rejecting it here would cancel work the user authorised`;
  }
  return undefined;
}

/** The English reason an `unsupported` member carries. A host renders its own localized refusal. */
export function kaspaUnsupportedReason(component: string, method: string): string {
  return `${component} (${method}) has no derived view on this surface: its payload is a list of inputs, outputs or inscriptions that a single confirmation line cannot describe truthfully`;
}

/** The five `KRC20Order` methods, as a set, so the discriminator is validated rather than trusted. */
const KASPA_KRC20_ORDER_TYPES: readonly KaspaKRC20OrderType[] = [
  'createKRC20Order',
  'buyKRC20Token',
  'signBuyKRC20Token',
  'cancelKRC20Order',
  'signCancelKRC20Order'
];

/**
 * The `KRC20Order` discriminator, or `undefined` for anything else.
 *
 * `data.type` is dapp-supplied, so it is matched against the five known methods rather than cast: an
 * unrecognised one falls through to the `unsupported` refusal, which is the honest answer for a method
 * this port has no screen for, and never to a half-derived order screen.
 */
export function kaspaKRC20OrderType(value: unknown): KaspaKRC20OrderType | undefined {
  return KASPA_KRC20_ORDER_TYPES.find((type) => type === value);
}

/**
 * Whether the confirm button reads "Sign" rather than "Sign & Submit".
 *
 * The two `sign*` methods sign a transaction the dapp built and hand it back, so nothing is broadcast
 * by the wallet; the other three submit. The React screen sets exactly this label, and a host that got
 * it wrong would tell a user it is sending something it is only signing.
 */
export function kaspaKRC20IsSignOnly(orderType: KaspaKRC20OrderType): boolean {
  return orderType === 'signBuyKRC20Token' || orderType === 'signCancelKRC20Order';
}

/** The three `CommitReveal` shapes, as a set, so the discriminator is validated rather than trusted. */
const KASPA_COMMIT_REVEAL_TYPES: readonly KaspaCommitRevealType[] = ['Commit', 'Reveal', 'Commit & Reveal'];

/**
 * The `CommitReveal` discriminator, or `undefined` for anything else.
 *
 * `data.type` is dapp-supplied, so it is matched against the three known shapes rather than cast: an
 * unrecognised one falls through to the `unsupported` refusal — the honest answer for a shape this port
 * has no screen for — and never to a half-derived commit the wallet could not describe.
 */
export function kaspaCommitRevealType(value: unknown): KaspaCommitRevealType | undefined {
  return KASPA_COMMIT_REVEAL_TYPES.find((type) => type === value);
}

/**
 * The `signKRC20Transaction` discriminator: the dapp's numeric `TxType` mapped to the inscribe shape
 * this port derives, or `undefined` for anything else.
 *
 * `data.type` is dapp-supplied and arrives as the `TxType` enum number, so it is matched against the
 * three inscribe values rather than cast: a KNS or KSPRNFT transfer — which the React screen shares this
 * branch with but which needs an asset preview this port has no screen for — and any unrecognised value
 * fall through to the `unsupported` refusal rather than to a half-derived inscription. `Number()` folds
 * the string form a JSON bridge may carry onto the same three cases.
 */
export function kaspaKRC20InscribeType(value: unknown): KaspaKRC20InscribeType | undefined {
  switch (Number(value)) {
    case TxType.SIGN_KRC20_DEPLOY:
      return 'deploy';
    case TxType.SIGN_KRC20_MINT:
      return 'mint';
    case TxType.SIGN_KRC20_TRANSFER:
      return 'transfer';
    default:
      return undefined;
  }
}

/**
 * The inscription JSON, pretty-printed for a read-only card — or `''` when it will not parse.
 *
 * The builders return a compact string; the React screen `JSON.parse`s and re-stringifies it at two
 * spaces so a user can actually read what the inscription commits to. A string that does not parse is
 * shown as nothing rather than thrown: the inscription is context for the decision, and the submit
 * resolves with the dapp's own fields either way.
 */
export function kaspaPrettyInscription(jsonString: string): string {
  if (!jsonString) return '';
  try {
    return JSON.stringify(JSON.parse(jsonString), null, 2);
  } catch {
    return '';
  }
}

/**
 * The inscription content as the `CommitReveal` screen shows it: pretty-printed when it parses as JSON,
 * the raw string when it does not, `''` when there is none.
 *
 * Unlike `kaspaPrettyInscription`, which drops a non-JSON string, this keeps it: a commit's `Data` is
 * whatever bytes the inscription carries, and the React screen falls back to the raw content rather than
 * showing nothing — a user still has to see what a non-JSON inscription commits to.
 */
export function kaspaInscriptionContent(content: string): string {
  if (!content) return '';
  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return content;
  }
}

/**
 * Whether the unlock slot may be rejected from a surface. True, and deliberately a named constant: the
 * lock entry's only other exit is the keyring's `unlock` event, so a user who declines to unlock would
 * otherwise leave the dapp waiting for something that is not coming. Kept here rather than inline in
 * the controller so the derived payload's `cancelable` and `rejectKaspaApproval`'s guard cannot drift.
 */
export const KASPA_LOCK_SLOT_CANCELABLE = true;
