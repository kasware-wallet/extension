import { IRecentTransactoinAddresses, ITransactionInfo } from '@/shared/types';
import BigNumber from 'bignumber.js';
import { useLocation } from 'react-router-dom';

export * from './WalletContext';
export * from './hooks';
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
  const { pathname } = window.location;
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

export const sompiToKAS = (amount: number) => {
  return amount / 100000000;
};

export function shortAddress(address?: string, len = 5) {
  if (!address) return '';
  if (address.length <= len * 2) return address;
  return address.slice(0, len + 2) + '...' + address.slice(address.length - len);
}

export function shortDesc(desc?: string, len = 50) {
  if (!desc) return '';
  if (desc.length <= len) return desc;
  return desc.slice(0, len) + '...';
}

export async function sleep(timeSec: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, timeSec * 1000);
  });
}

export function isValidAddress(address: string) {
  if (!address) return false;
  return true;
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
      document.execCommand('copy') ? res() : rej();
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

export function sompiToAmount(val: number) {
  const num = new BigNumber(val);
  return num.dividedBy(100000000).toString();
}

export function amountToSompi(val: string) {
  const num = new BigNumber(val);
  return num.multipliedBy(100000000).toNumber();
}

export function useLocationState<T>() {
  const { state } = useLocation();
  return state as T;
}

export function handleTransactions(data, address): ITransactionInfo[] {
  const transactionInfos: ITransactionInfo[] = [];
  for (let i = 0; i < data.length; i++) {
    let mode = '';
    const isConfirmed = data[i].is_accepted as boolean;
    let amount = '0';
    let usdValue = '0';
    const block_time = data[i].block_time;
    const transaction_id = data[i].transaction_id;
    const item = data[i];
    let inputAmountSelf = 0;
    let inputAmountOther = 0;
    let outputAmountSelf = 0;
    let outputAmountOther = 0;
    item.inputs.map((e) => {
      if (e.previous_outpoint_address == address) {
        inputAmountSelf = e.previous_outpoint_amount + inputAmountSelf;
      } else {
        inputAmountOther = e.previous_outpoint_amount + inputAmountOther;
      }
    });
    item.outputs.map((e) => {
      if (e.script_public_key_address == address) {
        outputAmountSelf = e.amount + outputAmountSelf;
      } else {
        outputAmountOther = e.amount + outputAmountOther;
      }
    });
    if (inputAmountSelf == 0) {
      mode = 'receive';
      amount = sompiToAmount(outputAmountSelf).replace(/\.0+$/, '');
      usdValue = amount;
    } else {
      mode = 'send';
      amount = sompiToAmount(inputAmountSelf - outputAmountSelf).replace(/\.0+$/, '');
      usdValue = amount;
    }

    transactionInfos.push({
      mode,
      isConfirmed,
      amount,
      usdValue,
      block_time,
      transaction_id,
      txDetail: data[i]
    });
  }

  return transactionInfos;
}

export function handleTransactionsAddresses(data, address): IRecentTransactoinAddresses[] {
  const transactionInfos: IRecentTransactoinAddresses[] = [];
  for (let i = 0; i < data.length; i++) {
    let mode = '';
    const block_time = data[i].block_time;
    const transaction_id = data[i].transaction_id;
    const item = data[i];
    let inputAmountSelf = 0;
    let inputAmountOther = 0;
    let outputAmountSelf = 0;
    let outputAmountOther = 0;
    const relatedAddresses: string[] = [];
    item.inputs.map((e) => {
      if (e.previous_outpoint_address == address) {
        inputAmountSelf = e.previous_outpoint_amount + inputAmountSelf;
      } else {
        inputAmountOther = e.previous_outpoint_amount + inputAmountOther;
      }
    });
    item.outputs.map((e) => {
      if (e.script_public_key_address == address) {
        outputAmountSelf = e.amount + outputAmountSelf;
      } else {
        outputAmountOther = e.amount + outputAmountOther;
      }
    });
    if (inputAmountSelf == 0) {
      mode = 'receive';
      item.inputs.map((e) => {
        if (e.previous_outpoint_address != address) {
          relatedAddresses.push(e.previous_outpoint_address);
        }
      });
    } else {
      mode = 'send';
      item.outputs.map((e) => {
        if (e.script_public_key_address != address) {
          relatedAddresses.push(e.script_public_key_address);
        }
      });
    }

    transactionInfos.push({
      mode,
      block_time,
      transaction_id,
      relatedAddresses
    });
  }

  return transactionInfos;
}

export const generateHdPath = (hdPath: string, dType: string, index: string) => {
  // eslint-disable-next-line quotes
  if (hdPath == "m/44'/972/0'") {
    // m/44'/972/0'/0'/0'
    // eslint-disable-next-line quotes
    return hdPath + '/' + dType + `'/` + index + `'`;
  } else {
    // m/44'/111111'/0'/0/0
    return hdPath + '/' + dType + '/' + index;
  }
};
