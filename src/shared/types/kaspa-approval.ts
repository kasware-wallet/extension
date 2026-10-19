import type { TNetworkId } from './network';
import type { TxRisk } from './kaspa-tx';

/**
 * The Kaspa approval queue as a surface sees it: what `notificationService` is holding
 * (`src/background/service/notification.ts`) and the display-ready view of it that
 * `walletController.deriveKaspaApproval` answers.
 *
 * Kaspa's queue is not EVM's, and the differences are why this file exists rather than a generic
 * approval type:
 *
 * - Six components raise approvals, not twelve: `Connect`, `SwitchNetwork`, `SignText`, `SignPsbt`,
 *   `KRC20Order` and `CommitReveal` — plus the `lock: true` pseudo-entry, which has no component.
 *   `SignPsbt` alone covers five provider methods (`sendKaspa`, `signPskt`, `signKRC20Transaction`,
 *   `signKRC20BatchTransferTransaction`, `krc20BatchTransferTransaction`), so the component name is
 *   not enough to know what is being asked: `method` is what tells those apart.
 * - The screen, not the background, *builds the transaction*. `SignPsbt` for `sendKaspa` arrives as a
 *   recipient and an amount in sompi, and the React component calls `prepareSendKAS` to turn that into
 *   a psbt before resolving with it. That is the derivation this port takes over (D084's rule): a host
 *   cannot call a React hook, and must not build a psbt of its own.
 * - There is no `PrivatekeyWaiting` equivalent — Kaspa's provider methods sign inline — so the only
 *   queue entry that is progress rather than a question is the unlock slot. `progress` is a member
 *   anyway; see `KaspaDerivedProgressApproval`.
 *
 * Every amount is a decimal string. Kaspa is sompi at 8 decimals, the supply is 2.9e15 sompi — past
 * `Number.MAX_SAFE_INTEGER` — and the existing float path is exactly the boundary this port is meant
 * to stop widening (AGENTS.md section 4).
 */

/** The dapp session `rpcFlow` stamps onto every component approval. */
export interface KaspaApprovalSession {
  origin: string;
  name: string;
  icon: string;
}

/** Every component name the Kaspa queue can carry. The unlock slot has none. */
export type KaspaApprovalComponentName =
  | 'Connect'
  | 'SwitchNetwork'
  | 'SignText'
  | 'SignPsbt'
  | 'KRC20Order'
  | 'CommitReveal'
  | 'BatchSignPsbt'
  | 'MultiSignPsbt';

/** What a caller may pin instead of letting the background derive it. */
export interface KaspaApprovalOverrides {
  /**
   * Priority fee in **KAS**, decimal string — the unit `prepareSendKAS` takes and the unit the dapp
   * sends. Not sompi: converting here would double-apply `amountToSompi` downstream.
   */
  priorityFee?: string;
  /** Fee rate in sompi per gram, decimal string. */
  feeRate?: string;
}

/**
 * A pending `sendKaspa`, fully derived: the psbt is built, so every figure is one the wallet would
 * actually broadcast.
 */
export interface KaspaDerivedSendApproval {
  kind: 'sendKaspa';
  /** `notificationService`'s queue id; pass it back to `submitKaspaApproval`/`rejectKaspaApproval`. */
  approvalId: string;
  approvalComponent: 'SignPsbt';
  /** The provider method that raised it, which is what tells the five `SignPsbt` cases apart. */
  method: string;
  origin: string;
  dappName: string;
  dappIcon: string;
  /** `checkWebsite`'s verdict for this origin. A screen says so; it does not decide on it. */
  isScammer: boolean;

  networkId: TNetworkId;
  /** The network the payment lands on, as the wallet names it. */
  networkName: string;
  /**
   * The ticker to render beside every amount on this screen: `KAS` on mainnet, `TKAS` elsewhere.
   *
   * Derived here rather than assumed by the surface, because a host that hardcoded `KAS` would label
   * testnet coins as the real thing on the one screen where that matters.
   */
  tick: string;

  from: string;
  recipient: string;

  /** Base units, integer string. */
  amountSompi: string;
  /** The same figure in KAS, decimal string. */
  amount: string;
  /** The built transaction's fee: sompi, and the same figure in KAS. */
  feeSompi: string;
  fee: string;
  /** `amountSompi + feeSompi`, and the same in KAS — what leaves the wallet. */
  totalSompi: string;
  total: string;
  /**
   * The sending address's spendable balance: sompi and KAS. Both `''` when the read failed, which
   * `canAffordTotal` then reports as affordable on purpose — the wallet decides what it will sign, and
   * a failed balance read is not evidence of an empty account.
   */
  balanceSompi: string;
  balance: string;
  /** `totalSompi <= balanceSompi`. True when the balance is unknown — see above. */
  canAffordTotal: boolean;

  /** Fee rate the transaction was built at, sompi per gram. `''` when the builder chose it. */
  feeRate: string;
  /** Priority fee in KAS, as the dapp sent it or the caller pinned it. */
  priorityFee: string;
  /** Transaction mass, integer string; `''` when the builder did not report one. */
  mass: string;
  /** The payload the dapp attached, verbatim. `''` when there is none. */
  payload: string;
}

/**
 * A pending `signMessage`.
 *
 * Its own member rather than `unsupported` because a message signature is a decision with exactly two
 * answers and nothing to compute — refusing it would refuse the cheapest honest screen in the set. The
 * text crosses as the dapp sent it: a wallet that prettifies what it is about to sign is signing
 * something the user did not read.
 */
export interface KaspaDerivedSignTextApproval {
  kind: 'signText';
  approvalId: string;
  approvalComponent: 'SignText';
  method: string;
  origin: string;
  dappName: string;
  dappIcon: string;
  isScammer: boolean;
  /** The address that would sign. */
  address: string;
  accountName: string;
  /** The message, verbatim. */
  text: string;
  /** `ecdsa` when the dapp asked for that variant, else `''` (Schnorr, the default). */
  textType: string;
  /**
   * True when `text` is a SIWK-style message whose claimed sign-in domain does not belong to `origin`'s
   * registrable domain — the phishing shape the React screen flags. Derived here so the native hosts
   * render the same verdict from one rule (D076/D084) rather than each re-parsing the message.
   */
  domainMismatch: boolean;
}

/**
 * A pending `Connect`: the permission grant, not a transaction.
 *
 * The same reasoning as EVM's (D084, third amendment) and the same load-bearing consequence: Kaspa's
 * `rpcFlow` runs its connect stage *before* a method's own `APPROVAL` metadata, so a surface that
 * cannot render this one cannot reach any of the others. Unlike EVM there is no refusal of its own —
 * every account in this wallet has a Kaspa address, so a grant here always exposes something.
 *
 * What the member carries is what a truthful grant screen needs: the origin (the only field the site
 * does not choose — on native the host stamps it, D085), the site's self-declared name and icon
 * *labelled as claims*, the account that would be exposed, and whether this is a re-grant.
 */
export interface KaspaDerivedConnectApproval {
  kind: 'connect';
  approvalId: string;
  approvalComponent: 'Connect';
  origin: string;
  /** What the page *says* it is called, and the icon it *says* it has. Neither is evidence. */
  dappName: string;
  dappIcon: string;
  isScammer: boolean;
  accountName: string;
  /** The address `requestAccounts` will answer with for this origin. */
  address: string;
  networkId: TNetworkId;
  networkName: string;
  /** True when this origin already holds a permission, i.e. a re-grant rather than a first connect. */
  isConnected: boolean;
}

/**
 * A pending `switchNetwork`.
 *
 * Derived rather than refused because the request *is* two facts — the network the wallet is on and the
 * one the dapp wants — and both are already in the background. It is also the refusal that would hurt
 * most on this chain: `switchNetwork` is how a Kaspa dapp moves a user between mainnet and testnet, so
 * a surface that cannot answer it hangs the dapp one step before everything else.
 */
export interface KaspaDerivedSwitchNetworkApproval {
  kind: 'switchNetwork';
  approvalId: string;
  approvalComponent: 'SwitchNetwork';
  method: string;
  origin: string;
  dappName: string;
  dappIcon: string;
  isScammer: boolean;
  fromNetworkId: TNetworkId;
  fromNetworkName: string;
  /** The network asked for: `rpcFlow`'s own condition already mapped the dapp's name onto an id. */
  toNetworkId: TNetworkId;
  toNetworkName: string;
  /** The wallet is already there, so granting changes nothing. A screen may say so. */
  isSameNetwork: boolean;
}

/**
 * One input of a pending raw `signPskt`, decoded in the background.
 *
 * `valueSompi` is the chain-exact integer; `value` is its KAS display form, divided once
 * (`sompiToAmount`) by the background so no host does money arithmetic or invents a ticker.
 * `isToSign` says whether *this wallet's* key commits to the input — a counterparty input in a
 * partial PSKT is shown, not signed.
 */
export interface KaspaDerivedPsktInput {
  address: string;
  /** Base units, integer string. */
  valueSompi: string;
  /** The same figure in KAS, decimal string. */
  value: string;
  isToSign: boolean;
  sighashType: number;
}

/** One output of a pending raw `signPskt`; `isChange` classifies an output that returns to the wallet. */
export interface KaspaDerivedPsktOutput {
  address: string;
  /** Base units, integer string. */
  valueSompi: string;
  /** The same figure in KAS, decimal string. */
  value: string;
  isChange: boolean;
}

/**
 * A pending raw `signPskt` (provider method `signPskt`, `TxType.SIGN_TX`): a transaction the dapp
 * built itself, decoded in the background into the exact inputs, outputs, fee and risks a truthful
 * confirmation screen is made of.
 *
 * This is the one non-`sendKaspa` `SignPsbt` method the port derives: unlike the KRC20 inscribe,
 * order and batch flows, a PSKT needs no tick lookup, no inscription decoding and no second network
 * call to describe — the wasm transaction already says who pays whom. `isPartial` covers the
 * marketplace shape (ANYONECANPAY / SINGLE / NONE): the counterparty still adds inputs or outputs,
 * so there is no fee this wallet sets. A high `risks` entry is the decoder's verdict that signing
 * must be withheld entirely; medium/low are warnings the user reads and decides on.
 *
 * The surface signs nothing itself: `submitKaspaApproval` re-decodes and resolves with the dapp's
 * own `psktJsonString`/`psktOptions`, exactly as the React `SignPsbt` screen does.
 */
export interface KaspaDerivedSignPsktApproval {
  kind: 'signPskt';
  approvalId: string;
  approvalComponent: 'SignPsbt';
  method: string;
  origin: string;
  dappName: string;
  dappIcon: string;
  isScammer: boolean;

  networkId: TNetworkId;
  networkName: string;
  /** `KAS` on mainnet, `TKAS` elsewhere — derived, never assumed by the surface. */
  tick: string;

  inputs: KaspaDerivedPsktInput[];
  outputs: KaspaDerivedPsktOutput[];

  /** Sum of every input, sompi and KAS. */
  totalInSompi: string;
  totalIn: string;
  /** Sum of every output shown, sompi and KAS. */
  totalOutSompi: string;
  totalOut: string;
  /**
   * The network fee, sompi and KAS. Both `''` for a partial PSKT: the other party completes the
   * transaction, so a figure here would be inputs-minus-outputs nonsense rather than a fee.
   */
  feeSompi: string;
  fee: string;
  isPartial: boolean;

  /**
   * What the transaction does to *this account's* balance: its own outputs minus its own inputs, the
   * rows filtered by the account address exactly as the React `SignPsbt` screen filters them. Signed —
   * negative is a net spend, positive a net receipt — and sompi/KAS like every other figure here, so a
   * host renders the headline the React screen leads with rather than recomputing it from the rows.
   */
  balanceChangeSompi: string;
  balanceChange: string;

  /** The decoder's risk findings verbatim; a `high` one hides the Sign affordance on the surface. */
  risks: TxRisk[];
  /** The payload the transaction carries, verbatim. `''` when there is none. */
  payload: string;
}

/**
 * The five provider methods the `KRC20Order` component raises. The component name is not enough to
 * know what is on screen — a create locks a token, a buy spends KAS, a cancel unwinds an order — so
 * `orderType` is what picks the screen, exactly as `method` does for the five `SignPsbt` cases.
 */
export type KaspaKRC20OrderType =
  | 'createKRC20Order'
  | 'buyKRC20Token'
  | 'signBuyKRC20Token'
  | 'cancelKRC20Order'
  | 'signCancelKRC20Order';

/** One spend row on a buy or cancel screen: an output address and its KAS amount, decimal string. */
export interface KaspaDerivedKRC20Output {
  address: string;
  amount: string;
}

/**
 * A pending `KRC20Order`, derived: the token lookup, the inscription JSON and the spend rows the
 * React screen computes in effects are computed here instead, so a native host renders figures rather
 * than calling an indexer or a wasm builder of its own (D084/D086).
 *
 * One member covers all five methods because they share a frame — who asks, the tick, the inscription
 * and a confirm — and differ in the rows: `create` shows a lock address and a KAS amount, `buy` and
 * `cancel` show spend [outputs]. Every amount is a decimal string; the token's own [decimal] is what
 * divides its base-unit amount, and [tick] is the KAS/TKAS label, both derived rather than assumed.
 *
 * A failed lookup is reported in [error] and the member still derives: the display reads (history,
 * decimals) inform the user but do not build what is signed — `submitKaspaApproval` resolves with the
 * dapp's own queued fields — so the screen shows the shortfall and the user decides, exactly as the
 * React component's inline error does.
 */
export interface KaspaDerivedKRC20OrderApproval {
  kind: 'krc20Order';
  approvalId: string;
  approvalComponent: 'KRC20Order';
  method: string;
  origin: string;
  dappName: string;
  dappIcon: string;
  isScammer: boolean;
  networkId: TNetworkId;
  networkName: string;
  /** `KAS` on mainnet, `TKAS` elsewhere — derived, never assumed by the surface. */
  tick: string;
  orderType: KaspaKRC20OrderType;
  /** The two `sign*` methods only sign, so the confirm reads "Sign"; the rest "Sign & Submit". */
  isSignOnly: boolean;
  /** The KRC20 ticker, upper-cased for display; `''` until a lookup answers. */
  krc20Tick: string;
  /** The token amount in its own decimals, decimal string; `''` when unknown. */
  krc20Amount: string;
  /** The token's decimals as a string; `'8'` when no lookup answered. */
  decimal: string;
  /** `create` only: the KAS the order asks for. `''` otherwise. */
  kasAmount: string;
  /** Priority fee in KAS as the dapp sent it; `''` when there is none. */
  priorityFee: string;
  /** The pretty-printed inscription JSON, shown verbatim; `''` when it could not be built. */
  inscription: string;
  /** `create` only: the p2sh address the 1 KAS lock pays to; `''` otherwise. */
  lockAddress: string;
  /** `buy`/`cancel`: the spend rows. Empty for `create`. */
  outputs: KaspaDerivedKRC20Output[];
  /** A lookup that failed, quoted on screen rather than swallowed; `''` when every read succeeded. */
  error: string;
}

/**
 * The three shapes the `CommitReveal` component raises, named by the dapp's own `type` field:
 * `submitCommit` sends `Commit`, `submitReveal` sends `Reveal`, and `submitCommitReveal` sends the
 * combined `Commit & Reveal`. The fee math and the rows differ on this, exactly as `orderType` picks
 * the `KRC20Order` screen.
 */
export type KaspaCommitRevealType = 'Commit' | 'Reveal' | 'Commit & Reveal';

/** One spend row on a commit/reveal screen: an output address and its KAS amount, decimal string. */
export interface KaspaDerivedCommitRevealOutput {
  address: string;
  amount: string;
}

/**
 * A pending `CommitReveal`, derived: the inscription the script carries and the transaction figures
 * the React screen computes in `init` are computed here instead, so a native host renders them rather
 * than parsing a script or calling `prepareCreateTransaction` of its own (D084/D086).
 *
 * One member covers all three methods because they share a frame — the inscription, the spend rows,
 * the fee and a confirm — and differ only in how the rows and the fee are assembled: `Commit & Reveal`
 * combines two transactions and adds the reveal's change, which the background does here.
 *
 * Unlike `KRC20Order`, a failure here *disables* the confirm rather than merely annotating it: a script
 * that will not parse, a pubkey that is not this account's, or a prepare that throws means the wallet
 * cannot show what would be signed, so [error] is set and the surface refuses to submit — the native
 * mirror of the React component's `disabled` flag. Every amount is a decimal string.
 */
export interface KaspaDerivedCommitRevealApproval {
  kind: 'commitReveal';
  approvalId: string;
  approvalComponent: 'CommitReveal';
  /** `submitCommit`, `submitReveal` or `submitCommitReveal`. */
  method: string;
  origin: string;
  dappName: string;
  dappIcon: string;
  isScammer: boolean;
  networkId: TNetworkId;
  networkName: string;
  /** `KAS` on mainnet, `TKAS` elsewhere — derived, never assumed by the surface. */
  tick: string;
  /** The dapp's own `type`, validated against the three known shapes; drives the title and the fee. */
  type: KaspaCommitRevealType;
  /** The inscription protocol the script names; `''` when it did not parse. */
  protocolName: string;
  /** The inscription's mime type; `''` when the script carries none. */
  mimeType: string;
  /** The pretty-printed inscription content, shown verbatim; `''` when there is none. */
  inscription: string;
  /** Content the parser could not interpret, quoted rather than dropped; `''` when there is none. */
  unknownContent: string;
  /** The spend rows the screen lists. Empty when a prepare failed. */
  outputs: KaspaDerivedCommitRevealOutput[];
  /** The network fee in KAS, decimal string; for `Commit & Reveal` the combined pair's fee. */
  fee: string;
  /**
   * A script that will not parse, a pubkey that is not this account's, or a prepare that threw, quoted
   * on screen; `''` when every read succeeded. Non-empty disables the confirm.
   */
  error: string;
}

/**
 * The three shapes the single-inscription `signKRC20Transaction` method raises, named by the dapp's
 * numeric `TxType`: a deploy creates the token, a mint issues more of it, and a transfer moves it. The
 * rows differ on this, exactly as `type` picks the `CommitReveal` screen.
 */
export type KaspaKRC20InscribeType = 'deploy' | 'mint' | 'transfer';

/**
 * A pending `signKRC20Transaction`, derived: the token lookup and the inscription JSON the React
 * `SignPsbt` screen computes in `init` are computed here instead, so a native host renders figures
 * rather than calling an indexer of its own (D084/D086).
 *
 * One member covers all three shapes because they share a frame — who asks, the tick, the inscription
 * and a confirm — and differ in the rows: a transfer also shows an amount and a recipient, which a
 * deploy or mint carries only inside the inscription JSON. Every amount is a decimal string; the
 * token's own [decimal] divides its base-unit [amount], and [tick] is the KAS/TKAS label, both derived
 * rather than assumed.
 *
 * A failed lookup is reported in [error] and the member still derives: these reads inform the user but
 * do not build what is signed — `submitKaspaApproval` resolves with the dapp's own `inscribeJsonString`
 * — so the screen shows the shortfall and the user decides, exactly as the React component's inline
 * error does. Like `KRC20Order` and unlike `CommitReveal`, an [error] leaves the confirm live.
 */
export interface KaspaDerivedKRC20InscribeApproval {
  kind: 'krc20Inscribe';
  approvalId: string;
  approvalComponent: 'SignPsbt';
  /** `signKRC20Transaction`, the one method; [type] tells the three inscribe shapes apart. */
  method: string;
  origin: string;
  dappName: string;
  dappIcon: string;
  isScammer: boolean;
  networkId: TNetworkId;
  networkName: string;
  /** `KAS` on mainnet, `TKAS` elsewhere — derived, never assumed by the surface. */
  tick: string;
  /** The dapp's own `TxType`, validated against the three inscribe shapes; drives the title and rows. */
  type: KaspaKRC20InscribeType;
  /** The KRC20 ticker, upper-cased for display; `''` when the inscription carries none. */
  krc20Tick: string;
  /** The token's decimals as a string; `'8'` when no lookup answered. */
  decimal: string;
  /** `transfer` only: the amount in the token's own decimals, decimal string. `''` otherwise. */
  amount: string;
  /** `transfer` only: the raw base-unit amount the inscription carries, verbatim. `''` otherwise. */
  rawAmount: string;
  /** `transfer` only: the recipient the inscription names. `''` otherwise. */
  to: string;
  /** The pretty-printed inscription JSON, shown verbatim; the raw string when it will not parse. */
  inscription: string;
  /** Priority fee in KAS as the dapp sent it; `''` when there is none. */
  priorityFee: string;
  /** A lookup that failed, quoted on screen rather than swallowed; `''` when every read succeeded. */
  error: string;
}

/**
 * A pending approval this port does not derive.
 *
 * The batch psbt screen and the two `SignPsbt` methods this port does not derive — the KRC20 batch
 * transfer and the deprecated `signKRC20BatchTransferTransaction` — carry a payload whose meaning is a
 * screen full of ticks and inscriptions. Pretending to describe one
 * in a single confirmation line is how a user signs something else, so the answer is explicit and the
 * surface refuses out loud (D084) rather than the method throwing and the request hanging.
 *
 * `Connect`, `SwitchNetwork`, `SignText`, `KRC20Order` and `CommitReveal` are excluded at the type
 * level, exactly as D084 excludes `Connect`: a host quotes `reason` on a user-facing screen, and "this
 * cannot be shown" about a request that has its own derived member would be both false and alarming.
 * The compiler is what keeps that from coming back.
 */
export interface KaspaDerivedUnsupportedApproval {
  kind: 'unsupported';
  approvalId: string;
  approvalComponent: Exclude<
    KaspaApprovalComponentName,
    'Connect' | 'SwitchNetwork' | 'SignText' | 'KRC20Order' | 'CommitReveal'
  >;
  /** The provider method, which is the part that says *which* unsupported request this is. */
  method: string;
  origin: string;
  dappName: string;
  dappIcon: string;
  /** English, for a log line — the host renders its own localized refusal. */
  reason: string;
}

/**
 * An approval that is already being answered: wait for it, do not ask the user again.
 *
 * On Kaspa there is exactly one today — `requestApproval({ lock: true })`, resolved by the keyring's
 * own `unlock` event (`notificationService.wireKeyringUnlock`). It is a *queue slot*, not a screen:
 * React renders nothing for it and `ApprovalScreen` returns early.
 *
 * Separate from `unsupported` for the reason D084's amendment gives, and the member exists even though
 * Kaspa has no `PrivatekeyWaiting` today so that a future inline-signing wait cannot be pushed into
 * `unsupported` — which is the defect that shipped on the EVM side: a Reject button aimed at the
 * user's own signature.
 */
export interface KaspaDerivedProgressApproval {
  kind: 'progress';
  approvalId: string;
  approvalComponent: 'Lock';
  origin: string;
  dappName: string;
  dappIcon: string;
  /**
   * Whether a host may reject this entry at all. True for the lock slot: declining to unlock is a real
   * decision, and the `unlock` event is otherwise its only exit. A host reads this from the data rather
   * than from an exception — and `rejectKaspaApproval` enforces the same rule.
   */
  cancelable: boolean;
}

/** Nothing is waiting. Not an error: the screen was opened, or reopened, on an empty queue. */
export interface KaspaDerivedNoApproval {
  kind: 'none';
}

export type KaspaDerivedApproval =
  | KaspaDerivedSendApproval
  | KaspaDerivedSignPsktApproval
  | KaspaDerivedSignTextApproval
  | KaspaDerivedConnectApproval
  | KaspaDerivedSwitchNetworkApproval
  | KaspaDerivedKRC20OrderApproval
  | KaspaDerivedCommitRevealApproval
  | KaspaDerivedKRC20InscribeApproval
  | KaspaDerivedUnsupportedApproval
  | KaspaDerivedProgressApproval
  | KaspaDerivedNoApproval;

/**
 * What `submitKaspaApproval` answers, discriminated on `kind` for the same honesty reason D084 gives:
 * a grant has no amount and no fee, and reporting zeroes for them is a lie a reader cannot detect.
 *
 * Each member reports what was actually handed to the queue, so a host that logs this can answer "what
 * did the wallet agree to" without keeping its own copy of the numbers.
 */
export interface KaspaSendApprovalSubmitResult {
  kind: 'sendKaspa';
  approvalId: string;
  recipient: string;
  /** Base units, integer string — what the built transaction pays out. */
  amountSompi: string;
  /** Base units, integer string. */
  feeSompi: string;
  /** True when a payload was attached; the payload itself is not echoed back. */
  hasPayload: boolean;
}

export interface KaspaSignTextApprovalSubmitResult {
  kind: 'signText';
  approvalId: string;
  address: string;
}

export interface KaspaSignPsktApprovalSubmitResult {
  kind: 'signPskt';
  approvalId: string;
}

export interface KaspaConnectApprovalSubmitResult {
  kind: 'connect';
  approvalId: string;
  origin: string;
  /** The address `requestAccounts` will answer with for this origin. */
  address: string;
  networkId: TNetworkId;
}

export interface KaspaSwitchNetworkApprovalSubmitResult {
  kind: 'switchNetwork';
  approvalId: string;
  /** The network the wallet will be on once the provider method has run. */
  networkId: TNetworkId;
}

/**
 * A submitted `KRC20Order`. The receipt names the [orderType] rather than echoing amounts: what was
 * handed back to the queue is the dapp's own fields, which the host never sees and must not be able to
 * alter, so the only honest thing to report is which of the five methods was answered.
 */
export interface KaspaKRC20OrderApprovalSubmitResult {
  kind: 'krc20Order';
  approvalId: string;
  orderType: KaspaKRC20OrderType;
}

/**
 * A submitted `CommitReveal`. The receipt names the [type] rather than echoing figures: what was handed
 * back to the queue is the dapp's own commit/reveal fields, which the host never sees and must not be
 * able to alter, so the only honest thing to report is which of the three shapes was answered.
 */
export interface KaspaCommitRevealApprovalSubmitResult {
  kind: 'commitReveal';
  approvalId: string;
  type: KaspaCommitRevealType;
}

/**
 * A submitted `signKRC20Transaction`. The receipt names the [type] rather than echoing the inscription:
 * what was handed back to the queue is the dapp's own `inscribeJsonString`, which the host never sees
 * and must not be able to alter, so the only honest thing to report is which inscribe shape was signed.
 */
export interface KaspaKRC20InscribeApprovalSubmitResult {
  kind: 'krc20Inscribe';
  approvalId: string;
  type: KaspaKRC20InscribeType;
}

export type KaspaApprovalSubmitOutcome =
  | KaspaSendApprovalSubmitResult
  | KaspaSignPsktApprovalSubmitResult
  | KaspaSignTextApprovalSubmitResult
  | KaspaConnectApprovalSubmitResult
  | KaspaSwitchNetworkApprovalSubmitResult
  | KaspaKRC20OrderApprovalSubmitResult
  | KaspaCommitRevealApprovalSubmitResult
  | KaspaKRC20InscribeApprovalSubmitResult;
