import { useLocation } from 'react-router-dom';
import { KASPLEX_MAINNET, KASPLEX_TESTNET_10, KASPLEX_TESTNET_11, KASPLEX_TESTNET_12 } from '@/shared/constant';
import type { Inscription, TNetworkId, TTokenType } from '@/shared/types';

// Re-export from subdirectories
export * from './format';
export * from './validation';
export * from './sorting';
export * from './constants';
export * from './types';
export * from './transaction';

// Re-export hooks
export * from './hooks';

// Re-export WalletContext
export * from './WalletContext';

// UI type detection
export const UI_TYPE = {
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
  return /^(kaspa|kaspatest|kaspadev):[qp][a-z0-9]{60}$|^(kaspa|kaspatest|kaspadev):[qp][a-z0-9]{62}$/i.test(address); // && Address.validate(address); // && address.split(':')[1].length === 61;
}

// Re-export from shared utils
export { copyToClipboard, clearClipboard } from '@/shared/utils/clipboard';

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
  } else if (networkId === 'simnet') {
    return KASPLEX_TESTNET_10;
  } else {
    return KASPLEX_MAINNET;
  }
}

/**
 * Check if token type is KRC20 Issue mode
 */
export function isKRC20Issue(tokenType: TTokenType): boolean {
  return tokenType === 'KRC20Issue';
}

/**
 * Get token identifier (ca for KRC20Issue, tick for KRC20Mint)
 * Returns empty string if the corresponding field is undefined
 */
export function getTokenIdentifier(token: Inscription): string {
  return token.tokenType === 'KRC20Issue' ? token.ca ?? '' : token.tick ?? '';
}

/**
 * Format time as relative time (e.g., "5 minutes ago") if less than a week,
 * otherwise display as full date string.
 * @param timeMs - timestamp in milliseconds
 */
export function formatTimeAgo(timeMs: number): string {
  const now = Date.now();
  const diffMs = now - timeMs;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const ONE_WEEK_IN_DAYS = 7;

  if (diffSec < 60) {
    return 'Just now';
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  } else if (diffDay < ONE_WEEK_IN_DAYS) {
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  } else {
    return new Date(timeMs).toLocaleString();
  }
}
