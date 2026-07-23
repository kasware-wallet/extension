import type { currencies } from '../constants/currencies';
import BigNumber from 'bignumber.js';

export const tokenPriceFormatter = (value: number, currency = 'USD' as keyof typeof currencies): string => {
  if (value >= 1) {
    return value.toLocaleString(navigator.language, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  const valueStr = value.toFixed(20).replace(/\.?0+$/, '');
  const match = valueStr.match(/^0\.(0+)/);
  const zeroCount = match ? match[1].length : 0;

  if (zeroCount === 3) {
    return parseFloat(value.toFixed(7)).toLocaleString(navigator.language, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 7
    });
  }

  if (zeroCount >= 4) {
    const significantPart = valueStr.slice(zeroCount + 2).slice(0, 4);
    const formatted = parseFloat(`0.${significantPart}`).toLocaleString(navigator.language, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    });
    return `0.${zeroCount ? `0(${zeroCount})` : ''}${formatted.slice(2)}`;
  }

  if (zeroCount < 4) {
    const roundedValue = parseFloat(value.toFixed(7));
    return roundedValue.toLocaleString(navigator.language, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 7
    });
  }

  return value.toLocaleString(navigator.language, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 7
  });
};

export const formatNumberAbbreviated = (
  balance: number,
  isCurrency = false,
  currency = 'USD' as keyof typeof currencies
): string => {
  let options: Intl.NumberFormatOptions;

  if (balance >= 1000000) {
    options = isCurrency
      ? {
          style: 'currency',
          currency: currency,
          notation: 'compact',
          maximumFractionDigits: 2
        }
      : {
          notation: 'compact',
          maximumFractionDigits: 2
        };
  } else {
    options = isCurrency
      ? {
          style: 'currency',
          currency: currency,
          maximumFractionDigits: 2
        }
      : {
          maximumFractionDigits: 2
        };
  }

  return balance.toLocaleString(navigator.language, options);
};

export const formatMarketCapAbbreviated = (
  minted: number,
  dec: number,
  floorPrice: number,
  currency = 'USD' as keyof typeof currencies
): string => {
  const marketCap = dec > 0 ? (minted / Math.pow(10, dec)) * floorPrice : minted * floorPrice;

  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
    ...(marketCap >= 100_000_000 && { notation: 'compact' })
  };

  return marketCap.toLocaleString(navigator.language, options);
};

export const formatVolumeAbbreviated = (volume: number): string => {
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    ...(volume >= 100_000_000 && { notation: 'compact' })
  };

  return volume.toLocaleString(navigator.language, options);
};

export const formatGasFee = (gasFee: string | number): string => {
  const parsedGasFee = typeof gasFee === 'string' ? parseFloat(gasFee) : gasFee;
  const safeGasFee = isNaN(parsedGasFee) ? 0 : parsedGasFee;
  return safeGasFee.toLocaleString(navigator.language, {
    maximumFractionDigits: 8
  });
};

export const formatUsd = (value: number): string => {
  return value.toLocaleString(navigator.language, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export function getUsdValueStr(price: number, amt: string) {
  const value = new BigNumber(amt).multipliedBy(price).toNumber();
  if (value > 0 && value < 0.01) {
    return '< $0.01';
  } else if (value >= 0.01) {
    return `$${value.toLocaleString('en-US')}`;
  } else {
    return '-';
  }
}

/**
 *
 * @param value  e.g. 1 means 1%
 */
export const formatPercentage = (value: string | number): string => {
  const parsedValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(parsedValue)) {
    throw new Error('Invalid value provided to formatPercentage');
  }

  const data = new Intl.NumberFormat(navigator.language, {
    style: 'percent',
    maximumFractionDigits: 2
  }).format(parsedValue / 100);
  return data;
};
