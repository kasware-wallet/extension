import BigNumber from 'bignumber.js';
import { useLocation } from 'react-router-dom';
// import { Address } from 'kaspa-wasm';

import { KASPLEX_MAINNET, KASPLEX_TESTNET_10, KASPLEX_TESTNET_11, KASPLEX_TESTNET_12 } from '@/shared/constant';
import type { ITransactionInfo, TNetworkId } from '@/shared/types';

import { sompiToAmount } from '@/shared/utils/format';
import type { currencies } from '../utils2/constants/currencies';

export * from './hooks';
export * from './WalletContext';
const UI_TYPE = {
  Tab: 'index',
  Pop: 'popup',
  Notification: 'notification'
};

type UiTypeCheck = {
  isTab: boolean;
  isNotification: boolean;
  isPop: boolean;
};

export const getUiType = (): UiTypeCheck => {
  const { pathname } = typeof window !== 'undefined' ? window?.location || { pathname: '' } : { pathname: '' };
  return Object.entries(UI_TYPE).reduce((m, [key, value]) => {
    m[`is${key}`] = pathname === `/${value}.html`;

    return m;
  }, {} as UiTypeCheck);
};

export const hex2Text = (hex: string) => {
  try {
    return hex.startsWith('0x') ? decodeURIComponent(hex.replace(/^0x/, '').replace(/[0-9a-f]{2}/g, '%$&')) : hex;
  } catch {
    return hex;
  }
};

export const getUITypeName = (): string => {
  // need to refact
  const UIType = getUiType();

  if (UIType.isPop) return 'popup';
  if (UIType.isNotification) return 'notification';
  if (UIType.isTab) return 'tab';

  return '';
};

/**
 *
 * @param origin (exchange.pancakeswap.finance)
 * @returns (pancakeswap)
 */
export const getOriginName = (origin: string) => {
  const matches = origin.replace(/https?:\/\//, '').match(/^([^.]+\.)?(\S+)\./);

  return matches ? matches[2] || origin : origin;
};

export const hashCode = (str: string) => {
  if (!str) return 0;
  let hash = 0,
    i,
    chr,
    len;
  if (str.length === 0) return hash;
  for (i = 0, len = str.length; i < len; i++) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

export const ellipsisOverflowedText = (str: string, length = 5, removeLastComma = false) => {
  if (str.length <= length) return str;
  let cut = str.substring(0, length);
  if (removeLastComma) {
    if (cut.endsWith(',')) {
      cut = cut.substring(0, length - 1);
    }
  }
  return `${cut}...`;
};

export function shortAddress(address?: string, len = 6) {
  if (!address) return '';
  const kasStart = 'kaspa:';
  const tkasStart = 'kaspatest:';
  if (address.startsWith(kasStart) || address.startsWith(tkasStart)) {
    const addrArray = address.split(':');
    const res =
      addrArray[0] +
      ':' +
      addrArray[1].slice(0, len) +
      '...' +
      addrArray[1].slice(addrArray[1].length - len, addrArray[1].length);
    return res;
  }
  if (address.length <= len * 2) return address;
  return address.slice(0, len + 2) + '...' + address.slice(address.length - len);
}

export function shortDesc(desc?: string, len = 50) {
  if (!desc) return '';
  if (desc.length <= len) return desc;
  return desc.slice(0, len) + '...';
}

export async function sleepSecond(timeSec: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, timeSec * 1000);
  });
}

/**
 * @deprecated
 */
export function isValidKaspaAddress(address: string) {
  return /^(kaspa|kaspatest|kaspadev):/i.test(address); // && Address.validate(address); // && address.split(':')[1].length === 61;
}

export const copyToClipboard = (textToCopy: string | number) => {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(textToCopy.toString());
  } else {
    const textArea = document.createElement('textarea');
    textArea.value = textToCopy.toString();
    textArea.style.position = 'absolute';
    textArea.style.opacity = '0';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    return new Promise<void>((res, rej) => {
      if (document.execCommand('copy')) {
        res();
      } else {
        rej();
      }
      textArea.remove();
    });
  }
};

export function formatDate(date: Date, fmt = 'yyyy-MM-dd hh:mm:ss') {
  const o = {
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'h+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds(),
    'q+': Math.floor((date.getMonth() + 3) / 3),
    S: date.getMilliseconds()
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, `${date.getFullYear()}`.substr(4 - RegExp.$1.length));
  for (const k in o)
    if (new RegExp(`(${k})`).test(fmt))
      fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : `00${o[k]}`.substr(`${o[k]}`.length));
  return fmt;
}

export function useLocationState<T>() {
  const { state } = useLocation();
  return state as T;
}

export function handleTransactions(data, address): ITransactionInfo[] {
  const transactionInfos: ITransactionInfo[] = [];
  for (let i = 0; i < data.length; i++) {
    let mode = '';
    const isAccepted = data[i].is_accepted as boolean;
    let amount = '0';
    let usdValue = '0';
    const block_time = data[i].block_time;
    const transaction_id = data[i].transaction_id;
    const item = data[i];
    let inputAmountSelf = 0;
    let inputAmountOther = 0;
    let outputAmountSelf = 0;
    let outputAmountOther = 0;
    const relatedAddresses: string[] = [];
    item.inputs?.map((e) => {
      if (e.previous_outpoint_address == address) {
        inputAmountSelf = e.previous_outpoint_amount + inputAmountSelf;
      } else {
        inputAmountOther = e.previous_outpoint_amount + inputAmountOther;
      }
    });
    item.outputs?.map((e) => {
      if (e.script_public_key_address == address) {
        outputAmountSelf = e.amount + outputAmountSelf;
      } else {
        outputAmountOther = e.amount + outputAmountOther;
      }
    });
    if (inputAmountSelf == 0) {
      mode = 'Receive';
      amount = sompiToAmount(outputAmountSelf, 8).replace(/\.0+$/, '');
      usdValue = amount;
      item.inputs.map((e) => {
        if (e.previous_outpoint_address != address) {
          relatedAddresses.push(e.previous_outpoint_address);
        }
      });
    } else if (inputAmountSelf - outputAmountSelf >= 0) {
      mode = 'Send';
      amount = sompiToAmount(inputAmountSelf - outputAmountSelf, 8).replace(/\.0+$/, '');
      usdValue = amount;
      item.outputs.map((e) => {
        if (e.script_public_key_address != address) {
          relatedAddresses.push(e.script_public_key_address);
        }
      });
    } else if (inputAmountSelf - outputAmountSelf < 0) {
      mode = 'Receive';
      amount = sompiToAmount(outputAmountSelf - inputAmountSelf, 8).replace(/\.0+$/, '');
      usdValue = amount;
      item.inputs.map((e) => {
        if (e.previous_outpoint_address != address) {
          relatedAddresses.push(e.previous_outpoint_address);
        }
      });
    }

    transactionInfos.push({
      mode,
      isAccepted,
      amount,
      usdValue,
      block_time,
      transaction_id,
      relatedAddresses,
      txDetail: data[i],
      payload: item?.payload
    });
  }

  return transactionInfos;
}

// export function handleTransactionsAddresses(data, address): IRecentTransactoinAddresses[] {
//   const transactionInfos: IRecentTransactoinAddresses[] = [];
//   for (let i = 0; i < data.length; i++) {
//     let mode = '';
//     const block_time = data[i].block_time;
//     const transaction_id = data[i].transaction_id;
//     const item = data[i];
//     let inputAmountSelf = 0;
//     let inputAmountOther = 0;
//     let outputAmountSelf = 0;
//     let outputAmountOther = 0;
//     const relatedAddresses: string[] = [];
//     item.inputs.forEach((e) => {
//       if (e.previous_outpoint_address == address) {
//         inputAmountSelf = e.previous_outpoint_amount + inputAmountSelf;
//       } else {
//         inputAmountOther = e.previous_outpoint_amount + inputAmountOther;
//       }
//     });
//     item.outputs.forEach((e) => {
//       if (e.script_public_key_address == address) {
//         outputAmountSelf = e.amount + outputAmountSelf;
//       } else {
//         outputAmountOther = e.amount + outputAmountOther;
//       }
//     });
//     if (inputAmountSelf == 0) {
//       mode = 'Receive';
//       item.inputs.forEach((e) => {
//         if (e.previous_outpoint_address != address) {
//           relatedAddresses.push(e.previous_outpoint_address);
//         }
//       });
//     } else {
//       mode = 'Send';
//       item.outputs.forEach((e) => {
//         if (e.script_public_key_address != address) {
//           relatedAddresses.push(e.script_public_key_address);
//         }
//       });
//     }

//     transactionInfos.push({
//       mode,
//       block_time,
//       transaction_id,
//       relatedAddresses
//     });
//   }

//   return transactionInfos;
// }

export const generateHdPath = (hdPath: string, dType: string, index: string) => {
  if (hdPath == "m/44'/972/0'") {
    // m/44'/972/0'/0'/0'
    return hdPath + '/' + dType + `'/` + index + `'`;
  } else if (hdPath == "m/44'/111111'/0'/0'") {
    // m/44'/111111'/0'/0'
    // chainge address only has one address per seedphrase
    return hdPath;
  } else {
    // m/44'/111111'/0'/0/0
    return hdPath + '/' + dType + '/' + index;
  }
};

export const formatLocaleString = (num: number | string | BigNumber) => {
  const numBN = new BigNumber(num).toString();
  const strArray = numBN.split('.');
  if (strArray.length === 1) {
    // const temp = Number(strArray[0]);
    // return temp.toLocaleString();
    const temp = new BigNumber(strArray[0]);
    return temp.toFormat();
  }
  // const num2 = Number(strArray[0]).toLocaleString() + '.' + strArray[1];
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

export const formatValue = (value: number | null | undefined): number => {
  if (value === 0 || value === null || value === undefined) {
    return 0;
  }
  return value;
};

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
  const marketCap = getMarketCap(minted, dec, floorPrice);

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

export const truncateAddress = (address: string): string => {
  return `${address.slice(0, 10)}.....${address.slice(-6)}`;
};

export const truncateWord = (word: string): string => {
  return word.length > 20 ? `${word.slice(0, 20)}...` : word;
};

export const getMarketCap = (minted: number, dec: number, floorPrice: number): number => {
  return formatNumberWithDecimal(minted, dec) * floorPrice;
};

export const formatGasFee = (gasFee: string | number): string => {
  const parsedGasFee = typeof gasFee === 'string' ? parseFloat(gasFee) : gasFee;
  const safeGasFee = isNaN(parsedGasFee) ? 0 : parsedGasFee;
  return safeGasFee.toLocaleString(navigator.language, {
    maximumFractionDigits: 8
  });
};

export const formatAndValidateAmount = (value: string, maxDecimals: number): string | null => {
  const decimalPlaces = value.split('.')[1]?.length || 0;
  if (decimalPlaces > maxDecimals) return null;

  if (value.startsWith('.') && value.length > 1) {
    value = `0${value}`;
  }

  return value;
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

export function getKasplexHost(networkId: TNetworkId): string {
  if (networkId == 'mainnet') {
    return KASPLEX_MAINNET;
  } else if (networkId === 'testnet-12') {
    return KASPLEX_TESTNET_12;
  } else if (networkId === 'testnet-11') {
    return KASPLEX_TESTNET_11;
  } else if (networkId === 'testnet-10') {
    return KASPLEX_TESTNET_10;
  } else if (networkId === 'devnet') {
    return KASPLEX_TESTNET_10;
  } else {
    return KASPLEX_MAINNET;
  }
}
