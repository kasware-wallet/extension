import type { AddressSummary } from '@/shared/types/network';

/**
 * Which derivation a recovery phrase's money actually lives under.
 *
 * A phrase does not say which wallet wrote it, and the five entries in `ADDRESS_TYPES` produce five
 * different Kaspa addresses from the same seed. The React import flow resolves this by deriving every
 * candidate and looking for the one with a balance (`CreateHDWalletScreen.tsx`, `scanVaultAddress`); the
 * native hosts had no equivalent and always used the KasWare default, so a phrase from KDX, OneKey,
 * Tangem or Chainge imported on a phone produced an empty wallet — the phrase was right, the address was
 * wrong, and nothing said so.
 *
 * The rule lives here rather than in a screen because it decides which address a user is told is theirs,
 * and there are three screens that would otherwise each get their own copy (D076).
 */

/** One candidate derivation, with the evidence for or against it. */
export interface KaspaDerivationCandidate {
  addressType: number;
  hdPath: string;
  label: string;
  address: string;
  /** The indexer reports something at this address — coins, tokens, or both. */
  hasBalance: boolean;
  /**
   * Exactly one candidate carries this. It is the one with the most on it, or — when every candidate is
   * empty — the default, so a caller never has to encode "and what if nothing was found".
   */
  recommended: boolean;
}

/**
 * Pairs each derived address with its balance summary and marks the winner.
 *
 * `summaries` is positional, the way `getMultiAddressAssets` answers a comma-joined address list; a
 * short or missing entry counts as empty rather than throwing, because an indexer that skipped a row
 * should not stop an import.
 *
 * `totalSompi` is a JS `number` on `AddressSummary` and is used **only** to compare candidates against
 * each other and against zero — never displayed, never spent. A figure that survives to the screen goes
 * through the balance reads, which are strings.
 */
export function rankKaspaDerivations(
  candidates: Omit<KaspaDerivationCandidate, 'hasBalance' | 'recommended'>[],
  summaries: (AddressSummary | undefined)[],
  defaultAddressType: number
): KaspaDerivationCandidate[] {
  const scored = candidates.map((candidate, index) => {
    const total = summaries[index]?.totalSompi ?? 0;
    return { candidate, total, hasBalance: total > 0 };
  });

  const funded = scored.filter((entry) => entry.hasBalance);
  // `>` rather than `>=` so the first of two equal balances wins, which keeps the answer stable and
  // keeps the default ahead of an exotic type when both hold the same amount.
  const winner = funded.reduce<(typeof scored)[number] | undefined>(
    (best, entry) => (best === undefined || entry.total > best.total ? entry : best),
    undefined
  );
  const recommendedType = winner?.candidate.addressType ?? defaultAddressType;

  return scored.map(({ candidate, hasBalance }) => ({
    ...candidate,
    hasBalance,
    recommended: candidate.addressType === recommendedType
  }));
}
