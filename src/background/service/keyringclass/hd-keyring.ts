'use strict';
import { HDPrivateKey } from '@brucelei/kaspacore';
import { XPrivateKey } from 'kaspa-wasm';
// var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
//     if (k2 === undefined) k2 = k;
//     var desc = Object.getOwnPropertyDescriptor(m, k);
//     if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
//       desc = { enumerable: true, get: function() { return m[k]; } };
//     }
//     Object.defineProperty(o, k2, desc);
// }) : (function(o, m, k, k2) {
//     if (k2 === undefined) k2 = k;
//     o[k2] = m[k];
// }));
// var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
//     Object.defineProperty(o, "default", { enumerable: true, value: v });
// }) : function(o, v) {
//     o["default"] = v;
// });
// var __importStar = (this && this.__importStar) || function (mod) {
//     if (mod && mod.__esModule) return mod;
//     var result = {};
//     if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
//     __setModuleDefault(result, mod);
//     return result;
// };
// var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
//     function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
//     return new (P || (P = Promise))(function (resolve, reject) {
//         function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
//         function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
//         function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
//         step((generator = generator.apply(thisArg, _arguments || [])).next());
//     });
// };
// Object.defineProperty(exports, "__esModule", { value: true });
// exports.HdKeyring = void 0;
// const bip39 = __importStar(require("bip39"));
// const hdkey = __importStar(require("hdkey"));
// const bitcoin_core_1 = require("../bitcoin-core");
// const simple_keyring_1 = require("./simple-keyring");
import { tempAccount } from '@/shared/types';
import * as kaspa_wasm from 'kaspa-wasm';
import { SimpleKeyring } from './simple-keyring';

type TKaspaWasm = typeof kaspa_wasm;
type TXPrv = kaspa_wasm.XPrv;
type TKeypair = kaspa_wasm.Keypair;
interface DeserializeOption {
  hdPath?: string;
  mnemonic?: string;
  xpriv?: string;
  activeIndexes?: number[];
  activeChangeIndexes?: number[];
  passphrase?: string;
}

type TIndex2Wallet = Array<string | TKeypair | number>;

const hdPathString = 'm/44\'/111111\'/0\'';
const type = 'HD Key Tree';
class HdKeyring extends SimpleKeyring {
  static type: string;
  //   type: string;
  mnemonic: string;
  // kaspaWasm: TKaspaWasm;
  xpriv: string;
  passphrase: string;
  // network: bitcoin.Network;
  //   network: string;
  hdPath: string;
  // root: bitcore.HDPrivateKey;
  root: TXPrv;
  hdWallet?: TXPrv;
  // wallets: ECPairInterface[];
  //   wallets: any[];

  private _index2wallet: { [key: string]: TIndex2Wallet };
  // key:dType.toString() + index.toString()
  // indexes for receive address
  activeIndexes: number[];
  // indexes for change address
  activeChangeIndexes: number[];
  page: number;
  perPage: number;
  // changeHdPath(hdPath: string): void;
  // getAccountByHdPath(hdPath: string, index: number): string;
  // addAccounts(numberOfAccounts?: number): Promise<string[]>;
  // activeAccounts(indexes: number[]): string[];
  // getFirstPage(): Promise<{
  //     address: string;
  //     index: number;
  // }[]>;
  // getNextPage(): Promise<{
  //     address: string;
  //     index: number;
  // }[]>;
  // getPreviousPage(): Promise<{
  //     address: string;
  //     index: number;
  // }[]>;
  // getAddresses(start: number, end: number): {
  //     address: string;
  //     index: number;
  // }[];
  // __getPage(increment: number): Promise<{
  //     address: string;
  //     index: number;
  // }[]>;
  // getAccounts(): Promise<string[]>;
  // getIndexByAddress(address: string): number;
  // private _addressFromIndex;
  /* PUBLIC METHODS */
  constructor(password: string, kaspaWasm: TKaspaWasm, opts?: DeserializeOption) {
    super(null, kaspaWasm, null);
    // this.kaspaWasm = kaspaWasm;
    this.type = type;
    this.mnemonic = null as unknown as string;
    this.xpriv = null as unknown as string;
    // this.network = bitcoin_core_1.bitcoin.networks.bitcoin;
    this.network = 'network';
    this.hdPath = hdPathString || opts?.hdPath;
    this.root = null as unknown as TXPrv;
    this.wallets = [];
    this._index2wallet = {};
    this.activeIndexes = [];
    this.activeChangeIndexes = [];
    this.page = 0;
    this.perPage = 5;
    if (opts) {
      this.deserialize(opts);
    }
    // const privKey =
    //   'xprv9s21ZrQH143K2XuocheafBADbWsozEMHbbgbqxWrQ1z812RPVrJZkFqhkufYdH3i3MLuq2MeS5eLxDAZMmAGz1ydcNoDCX6KYwbuZtQbh1b';
    // const HDWallet = new HDPrivateKey(privKey);
    // const dType = 0;
    // const index = 1;
    // const { privateKey } = HDWallet.deriveChild(`m/44'/972/0'/${dType}'/${index}'`);
  }
  serialize(): Promise<DeserializeOption> {
    // return __awaiter(this, void 0, void 0, function* () {
    return Promise.resolve({
      mnemonic: this.mnemonic,
      xpriv: this.xpriv,
      activeIndexes: this.activeIndexes,
      activeChangeIndexes: this.activeChangeIndexes,
      hdPath: this.hdPath,
      passphrase: this.passphrase
    });
    // });
  }
  // deserialize(_opts: DeserializeOption = {}): Promise<void>{
  deserialize(_opts: DeserializeOption = {}) {
    // return __awaiter(this, void 0, void 0, function* () {
    if (this.root) {
      throw new Error('KAS-HD-Keyring: Seed phrase already provided');
    }
    const opts = _opts;
    this.wallets = [];
    this.mnemonic = null;
    this.xpriv = null;
    this.root = null;
    this.hdPath = opts.hdPath || hdPathString;
    if (opts.passphrase) {
      this.passphrase = opts.passphrase;
    }
    if (opts.mnemonic) {
      this.initFromMnemonic(opts.mnemonic);
    } else if (opts.xpriv) {
      this.initFromXpriv(opts.xpriv);
    }
    if (opts.activeIndexes) {
      this.activeAccounts(opts.activeIndexes, 0);
    }
    if (opts.activeChangeIndexes && opts.activeChangeIndexes.length > 0) {
      this.activeAccounts(opts.activeChangeIndexes, 1);
    }

    // });
  }
  initFromXpriv(xpriv: string): void {
    if (this.root) {
      throw new Error('KAS-HD-Keyring: Seed phrase already provided');
    }
    this.xpriv = xpriv;
    this._index2wallet = {};
    // this.hdWallet = hdkey.fromJSON({ xpriv });
    this.hdWallet = null;
    this.root = this.hdWallet;
  }
  initFromMnemonic(mnemonic: string): void {
    if (this.root) {
      throw new Error('Kas-Hd-Keyring: Seed phrase already provided');
    }
    this.mnemonic = mnemonic;
    this._index2wallet = {};
    // const seed = bip39.mnemonicToSeedSync(mnemonic, this.passphrase);
    const { Mnemonic, XPrv } = this.kaspaWasm;
    const mnemonicObject = new Mnemonic(this.mnemonic);
    const seed = mnemonicObject.toSeed(this.passphrase);
    // this.hdWallet = hdkey.fromMasterSeed(seed);
    this.hdWallet = new XPrv(seed);
    // this.root = this.hdWallet.derive(this.hdPath);
    // const path = this.hdPath + '/' + this.deriveType;
    // this.root = this.hdWallet.derivePath(this.hdPath);
    // new XPrivateKey has include derivePath method
    this.root = this.hdWallet;
  }
  changeHdPath(hdPath: string): void {
    if (!this.mnemonic) {
      throw new Error('KAS-HD-Keyring: Not support');
    }
    this.hdPath = hdPath;
    // this.root = this.hdWallet.derive(this.hdPath);
    this.root = this.hdWallet.derivePath(this.hdPath);
    const indexes = this.activeIndexes;
    this._index2wallet = {};
    this.activeIndexes = [];
    this.wallets = [];
    this.activeAccounts(indexes);
  }
  getAccountByHdPath(hdPath: string, index: number): string {
    if (!this.mnemonic) {
      throw new Error('KAS-HD-Keyring: Not support');
    }
    // const root = this.hdWallet.derive(hdPath);
    // const child = root.deriveChild(index);
    // const ecpair = bitcoin_core_1.ECPair.fromPrivateKey(child.privateKey);
    // const address = ecpair.publicKey.toString("hex");
    // return address;
    this.root = this.hdWallet.derivePath(hdPath);
    const root_xprv_str = this.root.intoString('xprv');
    const child = new XPrivateKey(root_xprv_str, false, 0n);
    const receivePrivateKey = child.receiveKey(index);
    const keyPair = receivePrivateKey.toKeypair();
    const address = keyPair.publicKey;
    return address;
  }
  addAccounts(numberOfAccounts = 1, dType = 0, currentIdx = 0): Promise<string[]> {
    let count = numberOfAccounts;
    // let currentIdx = 0;
    const newWallets: TKeypair[] = [];
    while (count) {
      // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
      const [address, wallet, ddType, i] = this._addressFromIndex(currentIdx, dType);
      if (this.wallets.includes(wallet as TKeypair)) {
        currentIdx++;
      } else {
        this.wallets.push(wallet as TKeypair);
        newWallets.push(wallet as TKeypair);
        if (dType == 0) {
          this.activeIndexes.push(currentIdx);
        } else if (dType == 1) {
          this.activeChangeIndexes.push(currentIdx);
        }
        count--;
      }
    }
    const hexWallets = newWallets.map((w) => {
      return w.publicKey;
    });
    return Promise.resolve(hexWallets);
  }
  activeAccounts(indexes: number[], dType = 0): string[] {
    const accounts: string[] = [];
    for (const index of indexes) {
      // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
      const [address, wallet, ddType, i] = this._addressFromIndex(index, dType);
      this.wallets.push(wallet as TKeypair);
      if (dType == 0) {
        this.activeIndexes.push(index);
      } else {
        this.activeChangeIndexes.push(index);
      }
      accounts.push(address as string);
    }
    return accounts;
  }
  getFirstPage(): Promise<
    {
      address: string;
      index: number;
    }[]
    > {
    this.page = 0;
    return this.__getPage(1);
  }
  getNextPage(): Promise<
    {
      address: string;
      index: number;
    }[]
    > {
    return this.__getPage(1);
  }
  getPreviousPage(): Promise<
    {
      address: string;
      index: number;
    }[]
    > {
    return this.__getPage(-1);
  }
  // generate address
  getAddresses(
    start: number,
    end: number,
    dType = 0
  ): {
    address: string;
    index: number;
  }[] {
    const from = start;
    const to = end;
    const accounts: {
      address: string;
      index: number;
    }[] = [];
    for (let i = from; i < to; i++) {
      // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
      const [address, wallet, ddType, index] = this._addressFromIndex(i, dType);
      accounts.push({
        address: address as string,
        index: i as number
      });
    }
    return accounts;
  }
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  __getPage(increment: number): Promise<
    {
      address: string;
      index: number;
    }[]
  > {
    // return __awaiter(this, void 0, void 0, function* () {
    //     this.page += increment;
    //     if (!this.page || this.page <= 0) {
    //         this.page = 1;
    //     }
    //     const from = (this.page - 1) * this.perPage;
    //     const to = from + this.perPage;
    //     const accounts = [];
    //     for (let i = from; i < to; i++) {
    //         const [address] = this._addressFromIndex(i);
    //         accounts.push({
    //             address,
    //             index: i + 1,
    //         });
    //     }
    //     return accounts;
    // });
  }
  getAccounts = async () => {
    // return __awaiter(this, void 0, void 0, function* () {
    //     return this.wallets.map((w) => {
    //         return w.publicKey.toString("hex");
    //     });
    // });
    // return Promise.resolve(['dfds'])
    // const { XPublicKey } = this.kaspaWasm;
    const pubkeys = await Promise.all(
      this.wallets.map((w) => {
        // const xpub = w.publicKey().intoString('xpub');
        // const xpubObj = await XPublicKey.fromXPub(xpub);
        // const compressedPublicKey = await xpubObj.receivePubkeys(0, 1);
        // return compressedPublicKey[0];
        return w.publicKey;
      })
    );
    return pubkeys;
  };
  getAccountsAndIndexAndDType = async () => {
    const Arr: tempAccount[] = [];
    for (const key in this._index2wallet) {
      const obj = {
        publickey: this._index2wallet[key][0] as string,
        deriveType: this._index2wallet[key][2] as number,
        index: this._index2wallet[key][3] as number
      };
      Arr.push(obj);
    }
    const result = await Promise.all(Arr);
    return result;
  };
  getIndexByAddress(address: string): number {
    for (const key in this._index2wallet) {
      if (this._index2wallet[key][0] === address) {
        return Number(key);
      }
    }
    return null;
  }
  private _addressFromIndex(i: number, dType = 0) {
    const key = dType.toString() + i.toString();
    if (!this._index2wallet[key]) {
      // 0
      // const child = this.root.deriveChild(i);
      // const ecpair = bitcoin_core_1.ECPair.fromPrivateKey(child.privateKey);
      // const address = ecpair.publicKey.toString("hex");
      const root_xprv_str = this.root.intoString('xprv');
      // eslint-disable-next-line quotes
      if (this.hdPath == "m/44'/972/0'") {
        const privKey = root_xprv_str;
        const HDWallet = new HDPrivateKey(privKey);
        const { privateKey } = HDWallet.deriveChild(`m/44'/972/0'/${dType}'/${i}'`);
        const { PrivateKey } = this.kaspaWasm;
        const privateKeyWasm = new PrivateKey(privateKey.toString());
        const keyPair = privateKeyWasm.toKeypair();
        const address: string = keyPair.publicKey;
        this._index2wallet[key] = [address, keyPair, dType, i];
      } else {
        // this.hdPath == "m/44'/111111'/0'"
        const child = new XPrivateKey(root_xprv_str, false, 0n);
        // 3  generate kaspa address e.g. receive_pubkeys,changes_pubkeys
        if (dType == 0) {
          const receivePrivateKey = child.receiveKey(i);
          const keyPair = receivePrivateKey.toKeypair();
          const address = keyPair.publicKey;
          this._index2wallet[key] = [address, keyPair, dType, i];
        } else {
          const changePrivateKey = child.changeKey(i);
          const keyPair = changePrivateKey.toKeypair();
          const address = keyPair.publicKey;
          this._index2wallet[key] = [address, keyPair, dType, i];
        }
      }
    }
    return this._index2wallet[key];
  }
}
// exports.HdKeyring = HdKeyring;
HdKeyring.type = type;

export { HdKeyring };

