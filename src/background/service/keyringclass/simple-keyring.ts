/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitter } from 'events';
import type { PendingTransaction, SighashType, Transaction } from 'kaspa-wasm';
import {
  Keypair,
  PrivateKey,
  signEcdsaTransaction,
  signMessage,
  signMessageECDSA,
  signSchnorrTransaction,
  verifyMessage,
  verifyMessageECDSA
} from 'kaspa-wasm';

import type { IOpts, ToSignInput } from '@/shared/types';
import type { Keyring } from '../keyring';

type TKeyPair = Keypair;

const type = 'Simple Key Pair';
class SimpleKeyring extends EventEmitter implements Keyring {
  static type = type;
  hdPath = '';
  type = type;
  network: any;
  wallets: TKeyPair[];
  constructor(opts?: IOpts | string[]) {
    super();
    this.type = type;
    this.wallets = [];
    if (opts) {
      this.deserialize(opts);
    }
  }
  serialize(): any {
    const seralizedWallets = this.wallets.map((wallet) => wallet.privateKey.toString());
    return seralizedWallets;
  }
  deserialize(opts: any) {
    const privateKeys: string[] = opts;
    this.wallets = privateKeys.map((key) => {
      // From Hex string
      const privateKey = new PrivateKey(key); // From BIP0340
      const keyPair = privateKey.toKeypair();
      return keyPair;
    });
  }
  addAccounts(n = 1) {
    const newWallets: Keypair[] = [];
    for (let i = 0; i < n; i++) {
      newWallets.push(Keypair.random());
    }
    this.wallets = this.wallets.concat(newWallets);
    const hexWallets = newWallets.map(({ publicKey }) => publicKey.toString());
    return hexWallets;
  }
  async getAccounts() {
    return this.wallets.map(({ publicKey }) => publicKey);
  }
  getAccountsAndIndexAndDType = async () => {
    const Arr = this.wallets.map(({ publicKey }, i) => {
      return {
        publickey: publicKey,
        deriveType: 0,
        index: 0,
      };
    });
    const result = await Promise.all(Arr);
    return result;
  };

  signPendingTransaction = async (psbt: PendingTransaction, inputs: ToSignInput[], checkFullSigned?: boolean) => {
    const privateKeys: any[] = [];
    inputs.forEach((input) => {
      const keyPair = this._getPrivateKeyFor(input.publicKey);
      const privateKey = keyPair.privateKey;
      privateKeys.push(privateKey);
    });
    psbt.sign(privateKeys, checkFullSigned);
    return psbt;
  };
  createInputSignature = (
    pTx: PendingTransaction,
    inputs: ToSignInput[],
    input_index: number,
    sighash_type?: SighashType
  ) => {
    const signatures: string[] = [];
    for (const input of inputs) {
      const keyPair = this._getPrivateKeyFor(input.publicKey);
      const privateKey = new PrivateKey(keyPair.privateKey);
      const signature = pTx.createInputSignature(input_index, privateKey, sighash_type);
      signatures.push(signature);
    }
    return signatures;
  };
  signTransactionKaspa = async (tx: Transaction, inputs: ToSignInput[], verify_sig: boolean) => {
    const privateKeys: any[] = [];
    inputs.forEach((input) => {
      const keyPair = this._getPrivateKeyFor(input.publicKey);
      const privateKey = keyPair.privateKey;
      privateKeys.push(privateKey);
    });
    const inputIndexs = new Uint8Array(this._createSequentialArray(0, tx.inputs.length));
    const sigHashType = new Uint8Array(this._createSameArray(1, tx.inputs.length));
    const result = signSchnorrTransaction(tx, privateKeys, verify_sig, inputIndexs, sigHashType);
    return Promise.resolve(result);
  };
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  signTransactionOneKaspa = async (tx: Transaction, inputs: ToSignInput[], verify_sig: boolean, txInputsLength = 1) => {
    const privateKeys: any[] = [];
    inputs.forEach((input) => {
      const keyPair = this._getPrivateKeyFor(input.publicKey);
      const privateKey = keyPair.privateKey;
      privateKeys.push(privateKey);
    });
    const inputIndexs = new Uint8Array(this._createSequentialArray(0, tx.inputs.length));
    const sigHashType = new Uint8Array(this._createSameArray(1, tx.inputs.length));
    const result = signSchnorrTransaction(tx, privateKeys, verify_sig, inputIndexs, sigHashType);
    return Promise.resolve(result);
  };

  signSchnorrTransaction = async (
    tx: Transaction,
    inputs: ToSignInput[],
    // signerLenght: number,
    verify_sig: boolean
    // inputIndexs: Uint8Array,
    // sigHashType: Uint8Array
  ) => {
    const privateKeys: any[] = [];
    const signers2: any[] = [];
    const inputIndexs2: any[] = [];
    const sigHashType2: any[] = [];
    inputs.forEach((input) => {
      const keyPair = this._getPrivateKeyFor(input.publicKey);
      const privateKey = keyPair.privateKey;
      privateKeys.push(privateKey);
      signers2.push(privateKey);
      inputIndexs2.push(input.index);
      sigHashType2.push(input.sighashTypes ? input.sighashTypes[0] : 1);
    });
    const result = signSchnorrTransaction(
      tx,
      signers2,
      verify_sig,
      new Uint8Array(inputIndexs2),
      new Uint8Array(sigHashType2)
    );
    return Promise.resolve(result);
  };
  signEcdsaTransaction = async (
    tx: Transaction,
    inputs: ToSignInput[],
    // signerLenght: number,
    verify_sig: boolean
    // inputIndexs: Uint8Array,
    // sigHashType: Uint8Array
  ) => {
    const privateKeys: any[] = [];
    const signers2: any[] = [];
    const inputIndexs2: any[] = [];
    const sigHashType2: any[] = [];
    inputs.forEach((input) => {
      const keyPair = this._getPrivateKeyFor(input.publicKey);
      const privateKey = keyPair.privateKey;
      privateKeys.push(privateKey);
      signers2.push(privateKey);
      inputIndexs2.push(input.index);
      sigHashType2.push(input.sighashTypes ? input.sighashTypes[0] : 1);
    });
    const result = signEcdsaTransaction(
      tx,
      signers2,
      verify_sig,
      new Uint8Array(inputIndexs2),
      new Uint8Array(sigHashType2)
    );

    return Promise.resolve(result);
  };

  signMessageECDSA(publicKey: string, text: string, noAuxRand?: boolean) {
    const keyPair = this._getPrivateKeyFor(publicKey);
    const signature = signMessageECDSA({ message: text, privateKey: keyPair.privateKey.toString(), noAuxRand });
    return Promise.resolve(signature);
  }
  signMessage(publicKey: string, text: string, noAuxRand?: boolean) {
    const keyPair = this._getPrivateKeyFor(publicKey);
    const signature = signMessage({ message: text, privateKey: keyPair.privateKey.toString(), noAuxRand });
    return Promise.resolve(signature);
  }
  verifyMessageECDSA(publicKey: string, message: string, signature: string) {
    const isVerified = verifyMessageECDSA({ message, signature, publicKey });
    return Promise.resolve(isVerified);
  }
  verifyMessage(publicKey: string, message: string, signature: string) {
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
  private _createSameArray(m: any, length: number) {
    return Array.from({ length }, () => m);
  }

  private _createSequentialArray(m: number, n: number) {
    return Array.from({ length: n }, (_, i) => m + i);
  }
  exportAccount(publicKey: string) {
    const wallet = this._getWalletForAccount(publicKey);
    return wallet.privateKey.toString();
  }
  removeAccount(publicKey) {
    if (!this.wallets.map((wallet) => wallet.publicKey.toString()).includes(publicKey)) {
      throw new Error(`PublicKey ${publicKey} not found in this keyring`);
    }
    this.wallets = this.wallets.filter((wallet) => wallet.publicKey.toString() !== publicKey);
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
