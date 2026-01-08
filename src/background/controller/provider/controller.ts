import { ethErrors } from 'eth-rpc-errors';
import log from 'loglevel';
import 'reflect-metadata';
import { openapiService, permissionService, sessionService } from '@/background/service';
import { NETWORK_TYPES, VERSION } from '@/shared/constant';
import type { TNetworkId } from '@/shared/types';
import { NetworkType } from '@/shared/types';
import BaseController from '../base';
import wallet from '../wallet';
import { amountToSompi } from '@/shared/utils/format';

class ProviderController extends BaseController {
  requestAccounts = async ({ session: { origin } }) => {
    if (!permissionService.hasPermission(origin)) {
      throw ethErrors.provider.unauthorized();
    }

    const _account = await wallet.getCurrentAccount();
    const account = _account ? [_account.address] : [];
    sessionService.broadcastEvent('accountsChanged', account);
    const connectSite = permissionService.getConnectedSite(origin);
    if (connectSite) {
      const network = wallet.getNetworkName();
      sessionService.broadcastEvent(
        'networkChanged',
        {
          network
        },
        origin
      );
    }
    return account;
  };

  @Reflect.metadata('SAFE', true)
  getAccounts = async ({ session: { origin } }) => {
    if (!permissionService.hasPermission(origin)) {
      return [];
    }

    const _account = await wallet.getCurrentAccount();
    const account = _account ? [_account.address] : [];
    return account;
  };

  @Reflect.metadata('SAFE', true)
  getNetwork = async ({ session: { origin } }) => {
    if (!permissionService.hasPermission(origin)) {
      return '';
    }
    const networkId = wallet.getNetworkId();
    return NETWORK_TYPES[networkId].name;
  };

  @Reflect.metadata('SAFE', true)
  disconnect = async ({
    data: {
      params: { origin }
    }
  }) => {
    log.debug('origin', origin);
    return await wallet.removeConnectedSite(origin);
  };

  @Reflect.metadata('APPROVAL', [
    'SwitchNetwork',
    (req) => {
      const network = req.data.params.network;
      if (NETWORK_TYPES['mainnet'].validNames.includes(network)) {
        req.data.params.networkType = NetworkType.Mainnet;
        req.data.params.networkId = 'mainnet';
      } else if (NETWORK_TYPES['testnet-12'].validNames.includes(network)) {
        req.data.params.networkType = NetworkType.Testnet;
        req.data.params.networkId = 'testnet-12';
      } else if (NETWORK_TYPES['testnet-11'].validNames.includes(network)) {
        req.data.params.networkType = NetworkType.Testnet;
        req.data.params.networkId = 'testnet-11';
      } else if (NETWORK_TYPES['testnet-10'].validNames.includes(network)) {
        req.data.params.networkType = NetworkType.Testnet;
        req.data.params.networkId = 'testnet-10';
      } else if (NETWORK_TYPES['devnet'].validNames.includes(network)) {
        req.data.params.networkType = NetworkType.Devnet;
        req.data.params.networkId = 'devnet';
      } else {
        throw new Error(
          `the network is invalid, supported networks: ${Object.values(NETWORK_TYPES)
            .map((v) => v.name)
            .join(',')}`
        );
      }

      if (req.data.params.networkType === wallet.getNetworkType()) {
        // skip approval
        return true;
      }
    }
  ])
  switchNetwork = async (req: {
    data: { params: { networkType: NetworkType; networkId: TNetworkId } };
    session: { origin: string };
  }) => {
    const {
      data: {
        params: { networkType, networkId }
      },
      session: { origin }
    } = req;
    await wallet.updateApprovalHistory({
      origin: origin,
      fnName: 'switchNetwork',
      params: JSON.stringify({ networkId })
    });
    wallet.setNetworkType(networkType, networkId);
    return NETWORK_TYPES[networkId]?.name;
  };

  @Reflect.metadata('SAFE', true)
  getPublicKey = async ({ session: { origin } }) => {
    if (!permissionService.hasPermission(origin)) {
      return '';
    }
    const account = await wallet.getCurrentAccount();
    if (!account) return '';
    return account.pubkey;
  };

  @Reflect.metadata('SAFE', true)
  getBalance = async ({ session: { origin } }) => {
    if (!permissionService.hasPermission(origin)) {
      return {};
    }

    const account = await wallet.getCurrentAccount();
    if (!account) return null;
    const balance = await wallet.getAddressBalance(account.address);
    return {
      confirmed: amountToSompi(balance.confirm_amount, 8),
      unconfirmed: amountToSompi(balance.pending_amount, 8),
      total: amountToSompi(balance.amount, 8)
    };
  };

  @Reflect.metadata('SAFE', true)
  getKRC20Balance = async ({ session: { origin } }) => {
    if (!permissionService.hasPermission(origin)) {
      return [];
    }

    const account = await wallet.getCurrentAccount();
    if (!account) return null;
    const balances = await wallet.getAddressInscriptions(account.address);
    return balances;
  };

  @Reflect.metadata('SAFE', true)
  getUtxoEntries = async ({
    session: { origin },
    data: {
      params: { address }
    }
  }) => {
    if (!permissionService.hasPermission(origin)) {
      throw ethErrors.provider.unauthorized();
    }
    const account = await wallet.getCurrentAccount();
    if (!account) throw new Error('no current account');
    const entries = await openapiService.getKASUtxoEntryReferences(address ? [address] : [account.address]);
    const res = JSON.stringify(entries, (key, value) => (typeof value === 'bigint' ? Number(value) : value));
    const jsonEntries = JSON.parse(res);
    return jsonEntries;
  };

  @Reflect.metadata('SAFE', true)
  getP2shAddress = async ({
    session: { origin },
    data: {
      params: { inscribeJsonString }
    }
  }) => {
    if (!permissionService.hasPermission(origin)) {
      throw ethErrors.provider.unauthorized();
    }
    const account = await wallet.getCurrentAccount();
    if (!account) throw new Error('no current account');
    const pubKey = account.pubkey;
    const currentKeyring = await wallet.getCurrentKeyring();
    if (!currentKeyring) throw new Error('no current keyring');
    const addressType = currentKeyring.addressType;
    const address = wallet.getP2shAddress(inscribeJsonString, pubKey, addressType);
    return address;
  };

  @Reflect.metadata('APPROVAL', [
    'KRC20Order',
    (req) => {
      const {
        data: {
          params: { krc20Tick, krc20Amount, kasAmount, psktExtraOutput, priorityFee, type }
        }
      } = req;
    }
  ])
  createKRC20Order = async ({
    approvalRes: { krc20Tick, krc20Amount, kasAmount, psktExtraOutput, priorityFee },
    session: { origin }
  }) => {
    wallet.updateApprovalHistory({
      origin,
      fnName: 'createKRC20Order',
      params: JSON.stringify({ krc20Tick, krc20Amount, kasAmount, psktExtraOutput, priorityFee })
    });
    const results = await wallet.createKRC20Order({
      krc20Tick,
      krc20Amount,
      kasAmount,
      psktExtraOutput,
      priorityFee
    });
    return results;
  };

  @Reflect.metadata('APPROVAL', [
    'KRC20Order',
    (req) => {
      const {
        data: {
          params: { krc20Tick, txJsonString, sendCommitTxId, type }
        }
      } = req;
    }
  ])
  cancelKRC20Order = async ({ approvalRes: { krc20Tick, txJsonString, sendCommitTxId }, session: { origin } }) => {
    wallet.updateApprovalHistory({
      origin: origin,
      fnName: 'cancelKRC20Order',
      params: JSON.stringify({ krc20Tick, txJsonString, sendCommitTxId })
    });
    const txid = await wallet.cancelKRC20Order({
      krc20Tick,
      txJsonString,
      sendCommitTxId
    });
    return txid;
  };

  @Reflect.metadata('APPROVAL', [
    'KRC20Order',
    (req) => {
      const {
        data: {
          params: { krc20Tick, txJsonString, sendCommitTxId, type }
        }
      } = req;
    }
  ])
  signCancelKRC20Order = async ({ approvalRes: { krc20Tick, txJsonString, sendCommitTxId }, session: { origin } }) => {
    wallet.updateApprovalHistory({
      origin: origin,
      fnName: 'signCancelKRC20Order',
      params: JSON.stringify({ krc20Tick, txJsonString, sendCommitTxId })
    });
    const tx = await wallet.signCancelKRC20Order({
      krc20Tick,
      txJsonString,
      sendCommitTxId
    });
    return tx;
  };

  @Reflect.metadata('APPROVAL', [
    'KRC20Order',
    (req) => {
      const {
        data: {
          params: { txJsonString, extraOutput, priorityFee, type }
        }
      } = req;
    }
  ])
  buyKRC20Token = async ({ approvalRes: { txJsonString, extraOutput, priorityFee }, session: { origin } }) => {
    wallet.updateApprovalHistory({
      origin: origin,
      fnName: 'buyKRC20Token',
      params: JSON.stringify({ txJsonString, extraOutput, priorityFee })
    });
    const txid = await wallet.buyKRC20Token({
      txJsonString,
      extraOutput,
      priorityFee
    });
    return txid;
  };

  @Reflect.metadata('APPROVAL', [
    'KRC20Order',
    (req) => {
      const {
        data: {
          params: { txJsonString, extraOutput, priorityFee, type }
        }
      } = req;
    }
  ])
  signBuyKRC20Token = async ({ approvalRes: { txJsonString, extraOutput, priorityFee }, session: { origin } }) => {
    wallet.updateApprovalHistory({
      origin: origin,
      fnName: 'signBuyKRC20Token',
      params: JSON.stringify({ txJsonString, extraOutput, priorityFee })
    });
    const tx = await wallet.signBuyKRC20Token({
      txJsonString,
      extraOutput,
      priorityFee
    });
    return tx;
  };

  @Reflect.metadata('APPROVAL', [
    'CommitReveal',
    (req) => {
      const {
        data: {
          params: { priorityEntries, entries, outputs, changeAddress, priorityFee, networkId, script, type }
        }
      } = req;
    }
  ])
  submitCommit = async ({
    approvalRes: { priorityEntries, entries, outputs, changeAddress, priorityFee, networkId, script },
    session: { origin }
  }) => {
    wallet.updateApprovalHistory({
      origin: origin,
      fnName: 'submitCommit',
      params: JSON.stringify({ priorityEntries, entries, outputs, changeAddress, priorityFee, networkId, script })
    });
    const results = await wallet.submitCommit({
      priorityEntries,
      entries,
      outputs,
      changeAddress,
      priorityFee,
      networkId,
      script
    });
    return results;
  };

  @Reflect.metadata('APPROVAL', [
    'CommitReveal',
    (req) => {
      const {
        data: {
          params: { priorityEntries, entries, outputs, changeAddress, priorityFee, networkId, script, type }
        }
      } = req;
    }
  ])
  submitReveal = async ({
    approvalRes: { priorityEntries, entries, outputs, changeAddress, priorityFee, networkId, script },
    session: { origin }
  }) => {
    wallet.updateApprovalHistory({
      origin: origin,
      fnName: 'submitReveal',
      params: JSON.stringify({ priorityEntries, entries, outputs, changeAddress, priorityFee, networkId, script })
    });
    const results = await wallet.submitReveal({
      priorityEntries,
      entries,
      outputs,
      changeAddress,
      priorityFee,
      networkId,
      script
    });
    return results;
  };

  @Reflect.metadata('APPROVAL', [
    'CommitReveal',
    (req) => {
      const {
        data: {
          params: { commit, reveal, script, networkId, type }
        }
      } = req;
    }
  ])
  submitCommitReveal = async ({ approvalRes: { commit, reveal, script, networkId }, session: { origin } }) => {
    wallet.updateApprovalHistory({
      origin: origin,
      fnName: 'submitCommitReveal',
      params: JSON.stringify({ commit, reveal, script, networkId })
    });
    const results = await wallet.submitCommitReveal(commit, reveal, script, networkId);
    return results;
  };

  @Reflect.metadata('APPROVAL', [
    'SignPsbt',
    (req) => {
      const {
        data: {
          params: { toAddress, sompi }
        }
      } = req;
    }
  ])
  sendKaspa = async ({ approvalRes: { psbtHex, payload }, session: { origin } }) => {
    const rawtx = psbtHex;
    await wallet.updateApprovalHistory({ origin, fnName: 'sendKaspa', params: psbtHex });
    return await wallet.sendKaspa(rawtx, false, undefined, { payload });
  };

  @Reflect.metadata('APPROVAL', [
    'SignPsbt',
    (req) => {
      const {
        data: {
          params: { inscribeJsonString, type, destAddr, priorityFee }
        }
      } = req;
    }
  ])
  signKRC20Transaction = async ({
    approvalRes: { inscribeJsonString, type, destAddr, priorityFee },
    session: { origin }
  }) => {
    await wallet.updateApprovalHistory({
      origin,
      fnName: 'signKRC20Transaction',
      params: JSON.stringify({ inscribeJsonString, type, destAddr, priorityFee })
    });
    return await wallet.signKRC20Tx(inscribeJsonString, type, priorityFee, true);
  };

  @Reflect.metadata('APPROVAL', [
    'SignPsbt',
    (req) => {
      const {
        data: {
          params: { inscribeJsonString, type, destAddr, priorityFee }
        }
      } = req;
    }
  ])
  signKRC20BatchTransferTransaction = async ({
    approvalRes: { inscribeJsonString, type, destAddr, priorityFee },
    session: { origin }
  }) => {
    return 'deprecated. please use krc20BatchTransferTransaction() instead';
  };

  @Reflect.metadata('SAFE', true)
  cancelKRC20BatchTransfer = async ({ session: { origin } }) => {
    if (!permissionService.hasPermission(origin)) {
      throw ethErrors.provider.unauthorized();
    }
    wallet.updateApprovalHistory({
      origin: origin,
      fnName: 'cancelKRC20BatchTransfer',
      params: JSON.stringify({})
    });
    await wallet.setBatchMintStatus(false);
  };

  @Reflect.metadata('APPROVAL', [
    'SignPsbt',
    (req) => {
      const {
        data: {
          params: { list, priorityFee }
        }
      } = req;
    }
  ])
  krc20BatchTransferTransaction = async ({ approvalRes: { list, priorityFee }, session: { origin } }) => {
    await wallet.updateApprovalHistory({
      origin,
      fnName: 'krc20BatchTransferTransaction',
      params: JSON.stringify({ list, priorityFee })
    });
    return await wallet.krc20BatchTransfer(list, priorityFee);
  };

  @Reflect.metadata('APPROVAL', [
    'SignText',
    () => {
      // todo check text
    }
  ])
  signMessage = async ({
    data: {
      params: { text, noAuxRand, type }
    },
    approvalRes,
    session: { origin }
  }) => {
    if (approvalRes?.signature) {
      return approvalRes.signature;
    }
    await wallet.updateApprovalHistory({
      origin,
      fnName: 'signMessage',
      params: JSON.stringify({ text, noAuxRand, type })
    });
    return wallet.signMessage(text, { noAuxRand, type });
  };

  @Reflect.metadata('SAFE', true)
  verifyMessage = async ({
    session: { origin },
    data: {
      params: { pubkey, message, sig }
    }
  }) => {
    if (!permissionService.hasPermission(origin)) {
      throw ethErrors.provider.unauthorized();
    }
    return await wallet.verifyMessage(pubkey, message, sig);
  };

  @Reflect.metadata('SAFE', true)
  verifyMessageECDSA = async ({
    session: { origin },
    data: {
      params: { pubkey, message, sig }
    }
  }) => {
    if (!permissionService.hasPermission(origin)) {
      throw ethErrors.provider.unauthorized();
    }
    return await wallet.verifyMessageECDSA(pubkey, message, sig);
  };

  @Reflect.metadata('SAFE', true)
  buildScript = async ({
    session: { origin },
    data: {
      params: { type, data }
    }
  }) => {
    if (!permissionService.hasPermission(origin)) {
      throw ethErrors.provider.unauthorized();
    }
    return await wallet.buildScript({ type, data });
  };

  @Reflect.metadata('SAFE', true)
  pushTx = async ({
    data: {
      params: { rawtx }
    }
  }) => {
    return await wallet.pushTx(rawtx);
  };

  @Reflect.metadata('APPROVAL', [
    'SignPsbt',
    (req) => {
      const {
        data: {
          params: { txJsonString, options }
        }
      } = req;
    }
  ])
  signPskt = async ({ approvalRes: { psktJsonString, psktOptions }, session: { origin } }) => {
    await wallet.updateApprovalHistory({
      origin,
      fnName: 'signPskt',
      params: JSON.stringify({ txJsonString: psktJsonString, options: psktOptions })
    });
    return await wallet.signPskt({ txJsonString: psktJsonString, options: psktOptions });
  };

  @Reflect.metadata('SAFE', true)
  getVersion = async () => {
    return VERSION;
  };
}

export default new ProviderController();
