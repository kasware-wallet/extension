// Storage mass constant
const C = BigInt(Math.pow(10, 12));
// Number of dworks per 1 KAS (dworks are also known as sompis, and are the smallest KAS unit)
const K = Math.pow(10, 8);
// Maximal (standard) mass per Tx
const M = Math.pow(10, 5);
// Current standard mass-to-fee ratio is 1, meaning that a Tx with M mass is expected to pay a fee of M dworks
const MASS_FEE_RATIO = 1;
// Standard mass for a Tx with maximal mass
const F = MASS_FEE_RATIO * M;
// The threshold for which below it we give up the change and turn it into fee
const CHANGE_THRESHOLD = F;
// The maximum storage mass allowed to use for a single payment (which could be composed of several chained txs)
const MAX_PAYMENT_MASS = 20 * M;
const SPK_STD_LEN = 36; // version len + p2pk len
const SIG_STD_LEN = 66; // schnorr sig is 64 bytes + 2 op data bytes
const OUT_SIZE = 8 + 2 + 8 + SPK_STD_LEN;
const IN_SIZE = 32 + 4 + 8 + SIG_STD_LEN + 8;
const TX_FIELDS_SIZE = 2 + 8 + 8 + 8 + 20 + 8 + 32 + 8;
function estimatedTxSize(inputsNum, outputsNum) {
  return TX_FIELDS_SIZE + inputsNum * IN_SIZE + outputsNum * OUT_SIZE;
}
/**
 * Calculation of transaction compute mass. For simplicity, the calculation assumes
 * standard signatures and scripts. However other than that it is accurate.
 */
export function computeMass(inputs: bigint[], outputs: bigint[]) {
  const inputsNum = inputs.length;
  const outputsNum = outputs.length;
  return BigInt(1000 * inputsNum + 10 * SPK_STD_LEN * outputsNum + estimatedTxSize(inputsNum, outputsNum));
}
/**
 * Calculates the negative component of the storage mass formula. Note that there is no dependency on output
 * values but only on their count. The code is designed to maximize precision and to avoid intermediate overflows.
 * @param {number[]} inputs - An array of input values.
 * @param {number} outputsNum - The number of output values.
 * @returns {number} The negative component of the storage mass formula.
 */
function negativeMass(inputs: bigint[], outputsNum: number) {
  const inputsNum = inputs.length;
  if (outputsNum === 1 || inputsNum === 1 || (outputsNum === 2 && inputsNum === 2)) {
    return inputs.reduce(function (sum, v) {
      return sum + C / v;
    }, BigInt(0));
  }
  const avgInput =
    inputs.reduce(function (sum, v) {
      return sum + v;
    }, BigInt(0)) / BigInt(inputsNum);
  return BigInt(inputsNum) * (C / avgInput);
}
/**
 * Calculates the storage mass for the provided input/output collections.
 * @param {number[]} inputs - An array of input values.
 * @param {number[]} outputs - An array of output values.
 * @returns {number} The storage mass for the provided input/output collections.
 */
export function storageMass(inputs: bigint[], outputs: bigint[]) {
  const N = negativeMass(inputs, outputs.length);
  const P = outputs.reduce(function (sum, o) {
    return sum + C / o;
  }, BigInt(0));

  return P - N > BigInt(0) ? P - N : BigInt(0);
}
/**
 * Calculates the overall mass of this transaction.
 * @param {number[]} inputs - An array of input values.
 * @param {number[]} outputs - An array of output values.
 * @returns {number} The overall mass of this transaction.
 */
export function mass(inputs: bigint[], outputs: bigint[]) {
  // return Math.max(storageMass(inputs, outputs), computeMass(inputs, outputs));
  const storageMassCount = storageMass(inputs, outputs);
  const computeMassCount = computeMass(inputs, outputs);
  return storageMassCount > computeMassCount ? storageMassCount : computeMassCount;
}
