/* eslint-disable @typescript-eslint/no-explicit-any */
// "use strict";

import { IOpts } from '@/shared/types';
import * as kaspa_wasm from 'kaspa-wasm';
import { PrivateKey } from 'kaspa-wasm';

type TKaspaWasm = typeof kaspa_wasm;
type TKeyPair = kaspa_wasm.Keypair;

const type = 'Simple Key Pair';
class SimpleKeyring {
  static type: string;
  type: string;
  network: any;
  wallets: TKeyPair[];
  kaspaWasm: TKaspaWasm;
  constructor(password: string, kaspaWasm: TKaspaWasm, opts?: IOpts | string[]) {
    // super();
    this.type = type;
    this.kaspaWasm = kaspaWasm;
    this.wallets = [];
    if (opts) {
      this.deserialize(opts);
    }
  }
  serialize() {
    const seralizedWallets = this.wallets.map((wallet) => wallet.privateKey.toString());
    return Promise.resolve(seralizedWallets);
  }
  deserialize(opts) {
    const privateKeys: string[] = opts;
    this.wallets = privateKeys.map((key) => {
      // From Hex string
      const privateKey = new PrivateKey(key); // From BIP0340
      const keyPair = privateKey.toKeypair();
      return keyPair;
    });
  }
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  addAccounts(n = 1) {
    // return __awaiter(this, void 0, void 0, function* () {
    //     const newWallets = [];
    //     for (let i = 0; i < n; i++) {
    //         newWallets.push(kaspa_core.ECPair.makeRandom());
    //     }
    //     this.wallets = this.wallets.concat(newWallets);
    //     const hexWallets = newWallets.map(({ publicKey }) => publicKey.toString("hex"));
    //     return hexWallets;
    // });
  }
  getAccounts() {
    return this.wallets.map(({ publicKey }) => publicKey);
  }
  getAccountsAndIndexAndDType = async () => {
    // const Arr: tempAccount[] = [];
    const Arr = this.wallets.map(({ publicKey }) => {
      return {
        publickey: publicKey,
        deriveType: 0,
        index: 0
      };
    });
    // Arr.push(obj);

    const result = await Promise.all(Arr);
    return result;
  };
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  signTransaction = async (psbt, inputs, opts) => {
    // psbt means pending in generator
    const privateKeys:any[] = [];
    inputs.forEach((input) => {
      const keyPair = this._getPrivateKeyFor(input.publicKey);
      const privateKey = keyPair.privateKey;
      privateKeys.push(privateKey);
    });
    await psbt.sign(privateKeys);
    return psbt;
  };
  signMessage(publicKey: string, text: string) {
    const keyPair = this._getPrivateKeyFor(publicKey);
    const { signMessage } = this.kaspaWasm;
    const signature = signMessage({ message: text, privateKey: keyPair.privateKey.toString() });
    return Promise.resolve(signature);
  }
  verifyMessage(publicKey: string, message: string, signature: string) {
    const { verifyMessage } = this.kaspaWasm;
    const isVerified = verifyMessage({ message, signature, publicKey });
    return Promise.resolve(isVerified);
  }
  private _getPrivateKeyFor(publicKey: string) {
    if (!publicKey) {
      throw new Error('Must specify publicKey.');
    }
    const wallet = this._getWalletForAccount(publicKey);
    return wallet;
  }
  exportAccount(publicKey) {
    const wallet = this._getWalletForAccount(publicKey);
    return wallet.privateKey.toString();
  }
  removeAccount(publicKey) {
    if (!this.wallets.map((wallet) => wallet.publicKey.toString('hex')).includes(publicKey)) {
      throw new Error(`PublicKey ${publicKey} not found in this keyring`);
    }
    this.wallets = this.wallets.filter((wallet) => wallet.publicKey.toString('hex') !== publicKey);
  }
  private _getWalletForAccount(publicKey: string) {
    const wallet = this.wallets.find((wallet) => wallet.publicKey == publicKey);
    if (!wallet) {
      throw new Error('Simple Keyring - Unable to find matching publicKey.');
    }
    return wallet;
  }
}
SimpleKeyring.type = type;

export { SimpleKeyring };

