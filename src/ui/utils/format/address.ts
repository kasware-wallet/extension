export const truncateAddress = (address: string): string => {
  return `${address.slice(0, 10)}.....${address.slice(-6)}`;
};

export const truncateWord = (word: string): string => {
  return word.length > 20 ? `${word.slice(0, 20)}...` : word;
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

export const hex2Text = (hex: string) => {
  try {
    return hex.startsWith('0x') ? decodeURIComponent(hex.replace(/^0x/, '').replace(/[0-9a-f]{2}/g, '%$&')) : hex;
  } catch {
    return hex;
  }
};

export function shortDesc(desc?: string, len = 50) {
  if (!desc) return '';
  if (desc.length <= len) return desc;
  return desc.slice(0, len) + '...';
}
