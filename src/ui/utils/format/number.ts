import BigNumber from 'bignumber.js';

export const formatLocaleString = (num: number | string | BigNumber) => {
  const numBN = new BigNumber(num).toString();
  const strArray = numBN.split('.');
  if (strArray.length === 1) {
    const temp = new BigNumber(strArray[0]);
    return temp.toFormat();
  }
  const num2 = new BigNumber(strArray[0]).toFormat() + '.' + strArray[1];
  return num2;
};

export function formatCompactNumber(number: number) {
  if (number < 0) {
    return '-' + formatCompactNumber(-1 * number);
  }
  if (number < 1000) {
    return number;
  } else if (number >= 1000 && number < 1_000_000) {
    return (number / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  } else if (number >= 1_000_000 && number < 1_000_000_000) {
    return (number / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (number >= 1_000_000_000 && number < 1_000_000_000_000) {
    return (number / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  } else if (number >= 1_000_000_000_000 && number < 1_000_000_000_000_000) {
    return (number / 1_000_000_000_000).toFixed(1).replace(/\.0$/, '') + 'T';
  } else {
    const num = new BigNumber(number);
    const t = new BigNumber(1_000_000_000_000);
    return num.dividedBy(t).toFixed(1).replace(/\.0$/, '') + 'T';
  }
}

export const formatNumberWithDecimal = (balance: number | string, decimals: number | string): number => {
  if (typeof balance !== 'number') {
    balance = Number(balance);
  }
  if (typeof decimals !== 'number') {
    decimals = Number(decimals);
  }
  if (isNaN(decimals) || decimals < 0) {
    throw new Error('Invalid decimals value');
  }

  if (decimals === 0) return balance;

  const factor = Math.pow(10, decimals);
  return parseFloat((balance / factor).toFixed(decimals));
};

export const formatTokenBalance = (balance: number, tick: string, decimals: number): number => {
  if (tick === 'KASPA') {
    return parseFloat(balance.toFixed(balance % 1 === 0 ? 0 : 2));
  } else {
    return formatNumberWithDecimal(balance, decimals);
  }
};

export const getMarketCap = (minted: number, dec: number, floorPrice: number): number => {
  return formatNumberWithDecimal(minted, dec) * floorPrice;
};

export const formatAndValidateAmount = (value: string, maxDecimals: number): string | null => {
  const decimalPlaces = value.split('.')[1]?.length || 0;
  if (decimalPlaces > maxDecimals) return null;

  if (value.startsWith('.') && value.length > 1) {
    value = `0${value}`;
  }

  return value;
};
