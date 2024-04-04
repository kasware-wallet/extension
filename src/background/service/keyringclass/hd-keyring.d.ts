import { SimpleKeyring } from './simple-keyring';
interface DeserializeOption {
    hdPath?: string;
    mnemonic?: string;
    xpriv?: string;
    activeIndexes?: number[];
    passphrase?: string;
}
export declare class HdKeyring extends SimpleKeyring {
  static type: string;
  type: string;
  mnemonic: string;
  xpriv: string;
  passphrase: string;
  network: any;
  hdPath: string;
  root: any;
  hdWallet?: any;
  // wallets: ECPairInterface[];
  wallets: any[];
  private _index2wallet;
  activeIndexes: number[];
  page: number;
  perPage: number;
  constructor(opts?: DeserializeOption);
  serialize(): Promise<DeserializeOption>;
  deserialize(_opts?: DeserializeOption): Promise<void>;
  initFromXpriv(xpriv: string): void;
  initFromMnemonic(mnemonic: string): void;
  changeHdPath(hdPath: string): void;
  getAccountByHdPath(hdPath: string, index: number): string;
  addAccounts(numberOfAccounts?: number,dType?:number,startIndex?:number): Promise<string[]>;
  activeAccounts(indexes: number[]): string[];
  getFirstPage(): Promise<{
        address: string;
        index: number;
    }[]>;
  getNextPage(): Promise<{
        address: string;
        index: number;
    }[]>;
  getPreviousPage(): Promise<{
        address: string;
        index: number;
    }[]>;
  getAddresses(start: number, end: number): {
        address: string;
        index: number;
    }[];
  __getPage(increment: number): Promise<{
        address: string;
        index: number;
    }[]>;
  getAccounts(): Promise<string[]>;
  getAccountsAndIndexAndDType: () => Promise<any[]>
  getIndexByAddress(address: string): number;
  private _addressFromIndex;
}
export { };

