/* eslint-disable @typescript-eslint/no-explicit-any */
// "use strict";

import { IOpts } from '@/shared/types';
import * as kaspa_wasm from 'kaspa-wasm';
import { PrivateKey } from 'kaspa-wasm';

type TKaspaWasm = typeof kaspa_wasm;
type TKeyPair = kaspa_wasm.Keypair;

// Object.defineProperty(exports, "__esModule", { value: true });
// exports.SimpleKeyring = void 0;
// const bip371_1 = require("bitcoinjs-lib/src/psbt/bip371");
// const bs58check_1 = require("bs58check");
// const events_1 = require("events");
// const bitcoin_core_1 = require("../bitcoin-core");
// const message_1 = require("../message");
// const utils_1 = require("../utils");
const type = 'Simple Key Pair';
// class SimpleKeyring extends events_1.EventEmitter {
class SimpleKeyring {
  static type: string;
  type: string;
  network: any;
  // wallets: ECPairInterface[];
  wallets: TKeyPair[];
  kaspaWasm: TKaspaWasm;
  constructor(password: string, kaspaWasm: TKaspaWasm, opts?: IOpts|string[]) {
    // super();
    this.type = type;
    this.kaspaWasm = kaspaWasm;
    // this.network = bitcoin_core_1.bitcoin.networks.bitcoin;
    this.wallets = [];
    if (opts) {
      this.deserialize(opts);
    }
  }
  serialize() {
    // return __awaiter(this, void 0, void 0, function* () {
    //     return this.wallets.map((wallet) => wallet.privateKey.toString("hex"));
    // });
    const seralizedWallets = this.wallets.map((wallet) => wallet.privateKey.toString());
    return Promise.resolve(seralizedWallets)
  }
  deserialize(opts) {
    // return __awaiter(this, void 0, void 0, function* () {
    // const privateKeys = opts;
    // this.wallets = privateKeys.map((key) => {
    //     let buf;
    //     if (key.length === 64) {
    //         // privateKey
    //         buf = Buffer.from(key, "hex");
    //     }
    //     else {
    //         // base58
    //         buf = (0, bs58check_1.decode)(key).slice(1, 33);
    //     }
    //     return bitcoin_core_1.ECPair.fromPrivateKey(buf);
    // });
    // });
    const privateKeys:string[] = opts;
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
    //         newWallets.push(bitcoin_core_1.ECPair.makeRandom());
    //     }
    //     this.wallets = this.wallets.concat(newWallets);
    //     const hexWallets = newWallets.map(({ publicKey }) => publicKey.toString("hex"));
    //     return hexWallets;
    // });
  }
  getAccounts() {
    // return __awaiter(this, void 0, void 0, function* () {
    //     return this.wallets.map(({ publicKey }) => publicKey.toString("hex"));
    // });
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
    // return __awaiter(this, void 0, void 0, function* () {
    //     inputs.forEach((input) => {
    //         const keyPair = this._getPrivateKeyFor(input.publicKey);
    //         if ((0, bip371_1.isTaprootInput)(psbt.data.inputs[input.index]) &&
    //             !input.disableTweakSigner) {
    //             const signer = (0, utils_1.tweakSigner)(keyPair, opts);
    //             psbt.signInput(input.index, signer, input.sighashTypes);
    //         }
    //         else {
    //             const signer = keyPair;
    //             psbt.signInput(input.index, signer, input.sighashTypes);
    //         }
    //     });
    //     return psbt;
    // });
    // psbt means pending in generator
    const keyPair = this._getPrivateKeyFor(inputs[0].publicKey);
    const privateKey = keyPair.privateKey;
    await psbt.sign([privateKey]);
    return psbt;
  };
  signMessage(publicKey: string, text: string) {
    // return __awaiter(this, void 0, void 0, function* () {
    //     const keyPair = this._getPrivateKeyFor(publicKey);
    //     return (0, message_1.signMessageOfECDSA)(keyPair, text);
    // });
    const keyPair = this._getPrivateKeyFor(publicKey);
    const { signMessage } = this.kaspaWasm;
    const signature = signMessage({ message: text, privateKey: keyPair.privateKey.toString() });
    return Promise.resolve(signature);
  }
  verifyMessage(publicKey: string, message: string, signature: string) {
    // return __awaiter(this, void 0, void 0, function* () {
    //     return (0, message_1.verifyMessageOfECDSA)(publicKey, text, sig);
    // });
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
    // return __awaiter(this, void 0, void 0, function* () {
    //     const wallet = this._getWalletForAccount(publicKey);
    //     return wallet.privateKey.toString("hex");
    // });
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
    // const wallet = this.wallets.find(wallet => wallet.publicKey.toString('hex') == publicKey);
    const wallet = this.wallets.find((wallet) => wallet.publicKey == publicKey);
    if (!wallet) {
      throw new Error('Simple Keyring - Unable to find matching publicKey.');
    }
    return wallet;
  }
}
// exports.SimpleKeyring = SimpleKeyring;
SimpleKeyring.type = type;

export { SimpleKeyring };

