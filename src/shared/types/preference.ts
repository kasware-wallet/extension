import type { Account } from '../types';

export interface AddressSortStore {
  search: string;
  sortType: 'usd' | 'addressType' | 'alphabet';
  lastScrollOffset?: number;
  lastCurrentRecordTime?: number;
}

export interface addedToken {
  [address: string]: string[];
}
export interface Token {
  address: string;
  chain: number;
}
export type IHighlightedAddress = {
  brandName: Account['brandName'];
  address: Account['address'];
};
