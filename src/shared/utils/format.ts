import BigNumber from 'bignumber.js';
export function sompiToAmount(val: number | string | bigint | BigNumber | undefined, dec: string | number) {
  if (val === undefined || val == null) return '0';
  const num = new BigNumber(val.toString());
  const multipler = Math.pow(10, Number(dec));
  return num.dividedBy(multipler).toString();
}

export function amountToSompi(val: string | number | undefined, dec: string | number) {
  if (val === undefined || val == null) return '0';
  const num = new BigNumber(val);
  const factor = Math.pow(10, Number(dec));
  return num.multipliedBy(factor).toFixed(0).toString();
}
