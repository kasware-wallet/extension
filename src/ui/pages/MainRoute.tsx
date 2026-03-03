import log from 'loglevel';
import { useCallback, useEffect, useRef } from 'react';
import { HashRouter, Route, Routes, useNavigate as useNavigateOrigin, useLocation } from 'react-router-dom';

import Activities from '@/evm/ui/views/Activities';
import AddAddress from '@/evm/ui/views/AddAddress';
import AddressManagement from '@/evm/ui/views/AddressManagement';
import ApprovalEvm from '@/evm/ui/views/Approval';
import { ConnectApproval } from '@/evm/ui/views/Approval/components/Connect/SelectWalletApproval';
import ApprovalManagePage from '@/evm/ui/views/ApprovalManagePage';
import { CommonPopup } from '@/evm/ui/views/CommonPopup';
import { CustomTestnetTokenDetailScreen } from '@/evm/ui/views/CommonPopup/AssetList/CustomTestnetTokenDetailScreen';
import CreateMnemonics from '@/evm/ui/views/CreateMnemonics';
import CustomRPC from '@/evm/ui/views/CustomRPC';
import { CustomTestnet } from '@/evm/ui/views/CustomTestnet';
import { DappSearchPage } from '@/evm/ui/views/DappSearch';
import { GnosisQueue } from '@/evm/ui/views/GnosisQueue';
import { HistoryPage } from '@/evm/ui/views/History';
import { ImportMyMetaMaskAccount } from '@/evm/ui/views/ImportMyMetaMaskAccount';
import ImportSuccess from '@/evm/ui/views/ImportSuccess';
import NFTApproval from '@/evm/ui/views/NFTApproval';
import NoAddress from '@/evm/ui/views/NoAddress';
import Receive from '@/evm/ui/views/Receive';
import RequestPermission from '@/evm/ui/views/RequestPermission';
import SendNFT from '@/evm/ui/views/SendNFT';
import SendEvmToken from '@/evm/ui/views/SendToken';
import { Bridge, BridgeComponent } from '@/evm/ui/views/Bridge';
import { Swap } from '@/evm/ui/views/Swap';
import TokenApproval from '@/evm/ui/views/TokenApproval';
import { LoadingOutlined } from '@ant-design/icons';

import { Content, Icon, Layout } from '../components';
import { accountsActions } from '../state/accounts/reducer';
import { useIsReady, useIsUnlocked } from '../state/global/hooks';
import { globalActions } from '../state/global/reducer';
import { useAppDispatch } from '../state/hooks';
import { settingsActions } from '../state/settings/reducer';
import { useWallet } from '../utils';
import AddKeyringScreen from './Account/AddKeyringScreen';
import ContactBookScreen from './Account/ContactBookScreen';
import CreateAccountScreen from './Account/CreateAccountScreen';
import CreateContactScreen from './Account/CreateContactScreen';
import CreateHDWalletScreen from './Account/CreateHDWalletScreen';
import CreatePasswordScreen from './Account/CreatePasswordScreen';
import CreateSimpleWalletScreen from './Account/CreateSimpleWalletScreen';
import SwitchAccountScreen from './Account/SwitchAccountScreen';
import SwitchKeyringScreen from './Account/SwitchKeyringScreen';
import UnlockScreen from './Account/UnlockScreen';
import ApprovalHistoryScreen from './Approval/ApprovalHistoryScreen';
import ApprovalScreen from './Approval/ApprovalScreen';
import ConnectedSitesScreen from './Approval/ConnectedSitesScreen';
import KRC20BatchMintProcessScreen from './KRC20/KRC20BatchMintProcessScreen';
import KRC20BatchTxConfirmScreen from './KRC20/KRC20BatchTxConfirmScreen';
import KRC20DeployScreen from './KRC20/KRC20DeployScreen';
import KRC20HistoryScreen from './KRC20/KRC20HistoryScreen';
import KRC20MintDeployScreen from './KRC20/KRC20MintDeployScreen';
import KRC20SwapScreen from './KRC20/KRC20SwapScreen';
import KRC20TokenScreen from './KRC20/KRC20TokenScreen';
import KRC20TxConfirmScreen from './KRC20/KRC20TxConfirmScreen';
import KRC20TxDetailScreen from './KRC20/KRC20TxDetailScreen';
import KSPR721TxDetailScreen from './KRC20/KSPR721TxDetailScreen';
import P2SHUTXODetailScreen from './KRC20/P2SHUTXODetailScreen';
import RetrieveP2SHUTXOScreen from './KRC20/RetrieveP2SHUTXOScreen';
import SwapConfirmed from './KRC20/SwapChainge/SwapConfirmed';
import SwapHistoryScreen from './KRC20/SwapChainge/SwapHistoryScreen';
import KaspaTokenScreen from './KaspaTokenScreen';
import AppTabScreen from './Main/AppTabScreen';
import BoostScreen from './Main/BoostScreen';
import ForgotPasswordScreen from './Main/ForgotPasswordScreen';
import SettingsTabScreen from './Main/SettingsTabScreen';
import WalletTabScreen from './Main/WalletTabScreen';
import WelcomeScreen from './Main/WelcomeScreen';
import KNSDetailScreen from './Main/kns-kspr/KNSDetailScreen';
import KsprDetailScreen from './Main/kns-kspr/KsprDetailScreen';
import SendKNSnKSPRScreen from './Main/kns-kspr/SendKNSnKSPRScreen';
import AppsOptionScreen from './Settings/AppsOptionScreen';
import AutoLockOptionScreen from './Settings/AutoLockOptionScreen';
import ChangePasswordScreen from './Settings/ChangePasswordScreen';
import CurrencyTypeScreen from './Settings/CurrencyTypeScreen';
import DonationTypeScreen from './Settings/DonationTypeScreen';
import EditAccountNameScreen from './Settings/EditAccountNameScreen';
import EditContactNameScreen from './Settings/EditContactNameScreen';
import EditNetworkUrlScreen from './Settings/EditNetworkUrlScreen';
import EditWalletNameScreen from './Settings/EditWalletNameScreen';
import ExportMnemonicsScreen from './Settings/ExportMnemonicsScreen';
import ExportPrivateKeyScreen from './Settings/ExportPrivateKeyScreen';
import LanguageTypeScreen from './Settings/LanguageTypeScreen';
import MoreOptionsScreen from './Settings/MoreOptionsScreen';
import NetworkTypeScreen from './Settings/NetworkTypeScreen';
import UpgradeNoticeScreen from './Settings/UpgradeNoticeScreen';
import ChooseTokenScreen from './Wallet/ChooseTokenScreen';
import EVMReceiveScreen from './Wallet/EVMReceiveScreen';
import ReceiveScreen from './Wallet/ReceiveScreen';
import TxConfirmScreen from './Wallet/TxConfirmScreen';
import TxCreateScreen from './Wallet/TxCreateScreen';
import TxDetailScreen from './Wallet/TxDetailScreen';
import TxFailScreen from './Wallet/TxFailScreen';
import TxSuccessScreen from './Wallet/TxSuccessScreen';
import UtxoDetailScreen from './Wallet/UtxoDetailScreen';
import './index.module.less';
import UnlockKRC20TokenScreen from './KRC20/UnlockKRC20TokenScreen';
import BridgeScreen from '@/evm/ui/views/Bridge/BridgeScreen';
import WalletInfoScreen from './Settings/WalletInfoScreen';

// Import types from shared
import type {
  RawTxInfo,
  TTokenType,
  TxType,
  IKNSAsset,
  IKRC20TokenInfo,
  IP2shOutput,
  WalletKeyring,
  Inscription,
  TProtocol,
  Account,
  IToken,
  TKRC20History,
  TKRC20HistoryIssue,
  IKaspaUtxoEntryReference,
  INetworkType,
  TNetworkId,
  TKasplexOp,
  TChaingeOrderResponse,
  IChaingeToken
} from '@/shared/types';
import type { ConnectedSite } from '@/shared/types/permission';
import type { ContactBookItem } from '@/shared/types/contact-book';
import {
  PATH_ADD_KEYRING_SCREEN,
  PATH_APP_TAB_SCREEN,
  PATH_APPROVAL_HISTORY_SCREEN,
  PATH_APPROVAL_SCREEN,
  PATH_APPS_OPTION_SCREEN,
  PATH_AUTO_LOCK_OPTION_SCREEN,
  PATH_BOOST_SCREEN,
  PATH_BRIDGE_SCREEN,
  PATH_CHANGE_PASSWORD_SCREEN,
  PATH_CHOOSE_TOKEN_SCREEN,
  PATH_CONNECTED_SITES_SCREEN,
  PATH_CONTACT_BOOK_SCREEN,
  PATH_CREATE_ACCOUNT_SCREEN,
  PATH_CREATE_CONTACT_SCREEN,
  PATH_CREATE_HD_WALLET,
  PATH_CREATE_PASSWORD_SCREEN,
  PATH_CREATE_SIMPLE_WALLET_SCREEN,
  PATH_CURRENCY_TYPE_SCREEN,
  PATH_CUSTOM_TESTNET,
  PATH_CUSTOM_TESTNET_TOKEN_DETAIL_SCREEN,
  PATH_DONATION_TYPE_SCREEN,
  PATH_EDIT_ACCOUNT_NAME_SCREEN,
  PATH_EDIT_CONTACT_NAME_SCREEN,
  PATH_EDIT_NETWORK_URL_SCREEN,
  PATH_EDIT_WALLET_NAME_SCREEN,
  PATH_EVM_RECEIVE_SCREEN,
  PATH_EVM_SWAP,
  PATH_EXPORT_MNEMONICS_SCREEN,
  PATH_EXPORT_PRIVATE_KEY_SCREEN,
  PATH_FORGOT_PASSWORD_SCREEN,
  PATH_KASPA_TOKEN_SCREEN,
  PATH_KNS_DETAIL_SCREEN,
  PATH_KRC20_BATCH_MINT_PROCESS_SCREEN,
  PATH_KRC20_BATCH_TX_CONFIRM_SCREEN,
  PATH_KRC20_DEPLOY_SCREEN,
  PATH_KRC20_HISTORY_SCREEN,
  PATH_KRC20_MINT_DEPLOY_SCREEN,
  PATH_KRC20_SWAP_SCREEN,
  PATH_KRC20_TOKEN_SCREEN,
  PATH_KRC20_TX_CONFIRM_SCREEN,
  PATH_KRC20_TX_DETAIL_SCREEN,
  PATH_KSPR721_TX_DETAIL_SCREEN,
  PATH_KSPR_DETAIL_SCREEN,
  PATH_LANGUAGE_TYPE_SCREEN,
  PATH_MAIN_SCREEN,
  PATH_MORE_OPTIONS_SCREEN,
  PATH_NETWORK_TYPE_SCREEN,
  PATH_P2SH_UTXO_DETAIL_SCREEN,
  PATH_RECEIVE_SCREEN,
  PATH_RETRIEVE_P2SH_UTXO_SCREEN,
  PATH_SEND_KNS_KSPR_SCREEN,
  PATH_SETTINGS_TAB_SCREEN,
  PATH_SWAP_CONFIRMED,
  PATH_SWAP_HISTORY_SCREEN,
  PATH_SWITCH_ACCOUNT_SCREEN,
  PATH_SWITCH_KEYRING_SCREEN,
  PATH_TX_CONFIRM_SCREEN,
  PATH_TX_CREATE_SCREEN,
  PATH_TX_DETAIL_SCREEN,
  PATH_TX_FAIL_SCREEN,
  PATH_TX_SUCCESS_SCREEN,
  PATH_UNLOCK_KRC20_TOKEN_SCREEN,
  PATH_UNLOCK_SCREEN,
  PATH_UPGRADE_NOTICE_SCREEN,
  PATH_UTXO_DETAIL_SCREEN,
  PATH_WALLET_INFO_SCREEN,
  PATH_WELCOME_SCREEN
} from '@/shared/constant/route-path';
import { PrivateRoute } from '@/evm/ui/component';
import { AppDimensions } from '../components/Responsive';

// Define navigation state types for each route
type NavigationStateMap = {
  BoostScreen?: never;
  WelcomeScreen?: never;
  WalletTabScreen?: never;
  AppTabScreen?: never;
  SettingsTabScreen?: never;
  CreateHDWalletScreen: { isImport: boolean; fromUnlock?: boolean };
  CreateAccountScreen?: never;
  CreateContactScreen?: never;
  CreatePasswordScreen: { isNewAccount: boolean };
  UnlockScreen?: never;
  ForgotPasswordScreen?: never;
  SwitchAccountScreen?: never;
  ContactBookScreen?: never;
  ReceiveScreen: { type: TxType };
  EVMReceiveScreen?: never;
  TxCreateScreen?: { rawTxInfo: RawTxInfo; type: TxType; tokenType: TTokenType } | undefined;
  ChooseTokenScreen: { source: string };
  TxConfirmScreen: { rawTxInfo: RawTxInfo; type: TxType; tokenType: TTokenType; isRBF: boolean };
  TxSuccessScreen: {
    type: TxType;
    txid?: string;
    rawtx?: string;
    txids?: string;
    tokenType?: TTokenType;
    inscribeJsonString?: string;
    destAddr?: string;
  };
  TxFailScreen: { error: string };
  NetworkTypeScreen?: never;
  AutoLockOptionScreen?: never;
  LanguageTypeScreen?: never;
  CurrencyTypeScreen?: never;
  DonationTypeScreen?: never;
  MoreOptionsScreen?: never;
  AppsOptionScreen?: never;
  ChangePasswordScreen?: never;
  ExportMnemonicsScreen: { keyring: WalletKeyring };
  WalletInfoScreen: { keyring: WalletKeyring };
  ExportPrivateKeyScreen: { account: Account };
  TxDetailScreen: { txDetail: { [key: string]: any }; txId: string };
  UtxoDetailScreen: { utxoDetail: IKaspaUtxoEntryReference };
  KNSDetailScreen: { knsAsset: IKNSAsset };
  KsprDetailScreen: { tokenId: string; tick: string };
  SendKNSnKSPRScreen: { type: TxType; knsAsset?: IKNSAsset; ksprAsset?: { tokenId: string; tick: string } };
  KaspaTokenScreen: { krc20Token: Inscription; logoUrl?: string };
  KRC20TokenScreen: { krc20Token: Inscription; logoUrl?: string };
  UnlockKRC20TokenScreen: { krc20Token: Inscription };
  CustomTestnetTokenDetailScreen: { token?: any };
  KRC20MintDeployScreen: { tick?: string };
  KRC20DeployScreen: { rawTxInfo: RawTxInfo };
  KRC20SwapScreen: { token: Inscription };
  SwapHistoryScreen?: never;
  SwapConfirmed: { order: TChaingeOrderResponse; receiveToken: IChaingeToken };
  RetrieveP2SHUTXOScreen: { outputs: IP2shOutput[] | undefined };
  P2SHUTXODetailScreen: { p2shOutput: IP2shOutput };
  KRC20HistoryScreen?: never;
  KRC20TxConfirmScreen: {
    inscribeJsonString: string;
    type: TxType;
    tokenType: TTokenType;
    priorityFee: number;
    isRBF: boolean;
    protocol: TProtocol;
    destAddr?: string;
  };
  KRC20BatchTxConfirmScreen: {
    inscribeJsonString: string;
    type: TxType;
    times: number;
    priorityFee: number;
  };
  KRC20BatchMintProcessScreen?: never;
  KRC20TxDetailScreen: { txDetail: TKRC20History | TKRC20HistoryIssue; op: string; token: IToken };
  KSPR721TxDetailScreen: { txDetail: TKRC20History | TKRC20HistoryIssue; op: TKasplexOp };
  ApprovalScreen?: never;
  ConnectedSitesScreen: { site?: ConnectedSite; type?: 'EVM' | 'KASPA' };
  ApprovalHistoryScreen?: never;
  SwitchKeyringScreen?: never;
  AddKeyringScreen?: never;
  EditWalletNameScreen?: { keyring: WalletKeyring };
  EditNetworkUrlScreen: { item: INetworkType; networkId: TNetworkId };
  CreateSimpleWalletScreen?: never;
  UpgradeNoticeScreen?: never;
  EditAccountNameScreen?: { account: Account };
  EditContactNameScreen: { account: ContactBookItem };
  CustomTestnet?: never;
  EvmSwap?: never;
  BridgeScreen?: never;
};

export const routes = {
  BoostScreen: {
    path: PATH_BOOST_SCREEN,
    element: <BoostScreen />
  },
  WelcomeScreen: {
    path: PATH_WELCOME_SCREEN,
    element: <WelcomeScreen />
  },
  WalletTabScreen: {
    path: PATH_MAIN_SCREEN,
    element: <WalletTabScreen />
  },
  AppTabScreen: {
    path: PATH_APP_TAB_SCREEN,
    element: <AppTabScreen />
  },
  SettingsTabScreen: {
    path: PATH_SETTINGS_TAB_SCREEN,
    element: <SettingsTabScreen />
  },
  CreateHDWalletScreen: {
    path: PATH_CREATE_HD_WALLET,
    element: <CreateHDWalletScreen />
  },
  CreateAccountScreen: {
    path: PATH_CREATE_ACCOUNT_SCREEN,
    element: <CreateAccountScreen />
  },
  CreateContactScreen: {
    path: PATH_CREATE_CONTACT_SCREEN,
    element: <CreateContactScreen />
  },
  CreatePasswordScreen: {
    path: PATH_CREATE_PASSWORD_SCREEN,
    element: <CreatePasswordScreen />
  },
  UnlockScreen: {
    path: PATH_UNLOCK_SCREEN,
    element: <UnlockScreen />
  },
  ForgotPasswordScreen: {
    path: PATH_FORGOT_PASSWORD_SCREEN,
    element: <ForgotPasswordScreen />
  },
  SwitchAccountScreen: {
    path: PATH_SWITCH_ACCOUNT_SCREEN,
    element: <SwitchAccountScreen />
  },
  ContactBookScreen: {
    path: PATH_CONTACT_BOOK_SCREEN,
    element: <ContactBookScreen />
  },
  ReceiveScreen: {
    path: PATH_RECEIVE_SCREEN,
    element: <ReceiveScreen />
  },
  EVMReceiveScreen: {
    path: PATH_EVM_RECEIVE_SCREEN,
    element: <EVMReceiveScreen />
  },

  TxCreateScreen: {
    path: PATH_TX_CREATE_SCREEN,
    element: <TxCreateScreen />
  },
  ChooseTokenScreen: {
    path: PATH_CHOOSE_TOKEN_SCREEN,
    element: <ChooseTokenScreen />
  },
  TxConfirmScreen: {
    path: PATH_TX_CONFIRM_SCREEN,
    element: <TxConfirmScreen />
  },
  TxSuccessScreen: {
    path: PATH_TX_SUCCESS_SCREEN,
    element: <TxSuccessScreen />
  },
  TxFailScreen: {
    path: PATH_TX_FAIL_SCREEN,
    element: <TxFailScreen />
  },

  NetworkTypeScreen: {
    path: PATH_NETWORK_TYPE_SCREEN,
    element: <NetworkTypeScreen />
  },
  AutoLockOptionScreen: {
    path: PATH_AUTO_LOCK_OPTION_SCREEN,
    element: <AutoLockOptionScreen />
  },
  LanguageTypeScreen: {
    path: PATH_LANGUAGE_TYPE_SCREEN,
    element: <LanguageTypeScreen />
  },
  CurrencyTypeScreen: {
    path: PATH_CURRENCY_TYPE_SCREEN,
    element: <CurrencyTypeScreen />
  },
  DonationTypeScreen: {
    path: PATH_DONATION_TYPE_SCREEN,
    element: <DonationTypeScreen />
  },
  MoreOptionsScreen: {
    path: PATH_MORE_OPTIONS_SCREEN,
    element: <MoreOptionsScreen />
  },
  AppsOptionScreen: {
    path: PATH_APPS_OPTION_SCREEN,
    element: <AppsOptionScreen />
  },
  ChangePasswordScreen: {
    path: PATH_CHANGE_PASSWORD_SCREEN,
    element: <ChangePasswordScreen />
  },
  ExportMnemonicsScreen: {
    path: PATH_EXPORT_MNEMONICS_SCREEN,
    element: <ExportMnemonicsScreen />
  },
  WalletInfoScreen: {
    path: PATH_WALLET_INFO_SCREEN,
    element: <WalletInfoScreen />
  },
  ExportPrivateKeyScreen: {
    path: PATH_EXPORT_PRIVATE_KEY_SCREEN,
    element: <ExportPrivateKeyScreen />
  },
  TxDetailScreen: {
    path: PATH_TX_DETAIL_SCREEN,
    element: <TxDetailScreen />
  },
  UtxoDetailScreen: {
    path: PATH_UTXO_DETAIL_SCREEN,
    element: <UtxoDetailScreen />
  },
  KNSDetailScreen: {
    path: PATH_KNS_DETAIL_SCREEN,
    element: <KNSDetailScreen />
  },
  KsprDetailScreen: {
    path: PATH_KSPR_DETAIL_SCREEN,
    element: <KsprDetailScreen />
  },
  SendKNSnKSPRScreen: {
    path: PATH_SEND_KNS_KSPR_SCREEN,
    element: <SendKNSnKSPRScreen />
  },
  KaspaTokenScreen: {
    path: PATH_KASPA_TOKEN_SCREEN,
    element: <KaspaTokenScreen />
  },
  KRC20TokenScreen: {
    path: PATH_KRC20_TOKEN_SCREEN,
    element: <KRC20TokenScreen />
  },
  UnlockKRC20TokenScreen: {
    path: PATH_UNLOCK_KRC20_TOKEN_SCREEN,
    element: <UnlockKRC20TokenScreen />
  },
  CustomTestnetTokenDetailScreen: {
    path: PATH_CUSTOM_TESTNET_TOKEN_DETAIL_SCREEN,
    element: <CustomTestnetTokenDetailScreen />
  },

  KRC20MintDeployScreen: {
    path: PATH_KRC20_MINT_DEPLOY_SCREEN,
    element: <KRC20MintDeployScreen />
  },
  KRC20DeployScreen: {
    path: PATH_KRC20_DEPLOY_SCREEN,
    element: <KRC20DeployScreen />
  },
  KRC20SwapScreen: {
    path: PATH_KRC20_SWAP_SCREEN,
    element: <KRC20SwapScreen />
  },
  SwapHistoryScreen: {
    path: PATH_SWAP_HISTORY_SCREEN,
    element: <SwapHistoryScreen />
  },
  SwapConfirmed: {
    path: PATH_SWAP_CONFIRMED,
    element: <SwapConfirmed />
  },
  RetrieveP2SHUTXOScreen: {
    path: PATH_RETRIEVE_P2SH_UTXO_SCREEN,
    element: <RetrieveP2SHUTXOScreen />
  },
  P2SHUTXODetailScreen: {
    path: PATH_P2SH_UTXO_DETAIL_SCREEN,
    element: <P2SHUTXODetailScreen />
  },
  KRC20HistoryScreen: {
    path: PATH_KRC20_HISTORY_SCREEN,
    element: <KRC20HistoryScreen />
  },
  KRC20TxConfirmScreen: {
    path: PATH_KRC20_TX_CONFIRM_SCREEN,
    element: <KRC20TxConfirmScreen />
  },
  KRC20BatchTxConfirmScreen: {
    path: PATH_KRC20_BATCH_TX_CONFIRM_SCREEN,
    element: <KRC20BatchTxConfirmScreen />
  },
  KRC20BatchMintProcessScreen: {
    path: PATH_KRC20_BATCH_MINT_PROCESS_SCREEN,
    element: <KRC20BatchMintProcessScreen />
  },
  KRC20TxDetailScreen: {
    path: PATH_KRC20_TX_DETAIL_SCREEN,
    element: <KRC20TxDetailScreen />
  },
  KSPR721TxDetailScreen: {
    path: PATH_KSPR721_TX_DETAIL_SCREEN,
    element: <KSPR721TxDetailScreen />
  },
  ApprovalScreen: {
    path: PATH_APPROVAL_SCREEN,
    element: <ApprovalScreen />
  },
  ConnectedSitesScreen: {
    path: PATH_CONNECTED_SITES_SCREEN,
    element: <ConnectedSitesScreen />
  },
  ApprovalHistoryScreen: {
    path: PATH_APPROVAL_HISTORY_SCREEN,
    element: <ApprovalHistoryScreen />
  },
  SwitchKeyringScreen: {
    path: PATH_SWITCH_KEYRING_SCREEN,
    element: <SwitchKeyringScreen />
  },
  AddKeyringScreen: {
    path: PATH_ADD_KEYRING_SCREEN,
    element: <AddKeyringScreen />
  },
  EditWalletNameScreen: {
    path: PATH_EDIT_WALLET_NAME_SCREEN,
    element: <EditWalletNameScreen />
  },
  EditNetworkUrlScreen: {
    path: PATH_EDIT_NETWORK_URL_SCREEN,
    element: <EditNetworkUrlScreen />
  },
  CreateSimpleWalletScreen: {
    path: PATH_CREATE_SIMPLE_WALLET_SCREEN,
    element: <CreateSimpleWalletScreen />
  },
  UpgradeNoticeScreen: {
    path: PATH_UPGRADE_NOTICE_SCREEN,
    element: <UpgradeNoticeScreen />
  },
  EditAccountNameScreen: {
    path: PATH_EDIT_ACCOUNT_NAME_SCREEN,
    element: <EditAccountNameScreen />
  },
  EditContactNameScreen: {
    path: PATH_EDIT_CONTACT_NAME_SCREEN,
    element: <EditContactNameScreen />
  },
  // TestScreen: {
  //   path: '/test',
  //   element: <TestScreen />
  // },
  // FiatPayScreen: {
  //   path: '/moonpay',
  //   element: <FiatPayScreen />
  // },
  // Dashboard: {
  //   path: '/dashboard',
  //   element: <Dashboard />
  // },
  CustomTestnet: {
    path: PATH_CUSTOM_TESTNET,
    element: <CustomTestnet />
  },
  EvmSwap: {
    path: PATH_EVM_SWAP,
    element: <Swap />
  },
  BridgeScreen: {
    path: PATH_BRIDGE_SCREEN,
    element: <BridgeScreen />
  }
};

type RouteTypes = keyof typeof routes;

export function useNavigate() {
  const navigate = useNavigateOrigin();
  const location = useLocation();
  const lastPathRef = useRef<string>('');

  return useCallback(
    <T extends RouteTypes>(routKey: T, state?: NavigationStateMap[T]) => {
      const targetPath = routes[routKey].path;
      const currentPath = location.pathname + location.search;

      // Skip navigation if target path is the same as current path
      if (targetPath === currentPath) {
        return;
      }

      // Use replace to avoid duplicate history entries if target path is the same as last path
      if (targetPath === lastPathRef.current) {
        navigate(targetPath, { state, replace: true });
      } else {
        navigate(targetPath, { state });
      }

      lastPathRef.current = targetPath;
    },
    [navigate, location.pathname, location.search]
  );
}

export { useNavigateOrigin };

const Main = () => {
  const wallet = useWallet();
  const dispatch = useAppDispatch();

  const isReady = useIsReady();
  const isUnlocked = useIsUnlocked();

  const selfRef = useRef({
    settingsLoaded: false,
    summaryLoaded: false,
    accountLoaded: false,
    configLoaded: false
  });
  const self = selfRef.current;
  const init = useCallback(async () => {
    try {
      if (!self.accountLoaded) {
        const currentAccount = await wallet.getCurrentAccount();
        if (currentAccount) {
          dispatch(accountsActions.setCurrent(currentAccount));

          const accounts = await wallet.getAccounts();
          dispatch(accountsActions.setAccounts(accounts));

          if (accounts.length > 0) {
            self.accountLoaded = true;
          }
        }
      }

      if (!self.settingsLoaded) {
        const networkType = await wallet.getNetworkType();
        const networkId = await wallet.getNetworkId();
        const rpcLinks = await wallet.getRpcLinks();
        const autoLockMinutes = await wallet.getAutoLockMinutes();
        dispatch(
          settingsActions.updateSettings({
            networkType,
            networkId,
            rpcLinks,
            autoLockMinutes
          })
        );

        const _locale = await wallet.getLocale();
        const _currency = await wallet.getCurrency();
        dispatch(settingsActions.updateSettings({ locale: _locale, currency: _currency }));
        self.settingsLoaded = true;
      }

      if (!self.summaryLoaded) {
        // wallet.getInscriptionSummary().then((data) => {
        //   dispatch(accountsActions.setInscriptionSummary(data));
        // });

        wallet.getAppSummary().then((data) => {
          dispatch(accountsActions.setAppSummary(data));
        });
        // wallet.getKRC20LaunchStatus().then((data) => {
        //   dispatch(accountsActions.setKRC20LaunchStatus(data));
        // });
        self.summaryLoaded = true;
      }

      if (!self.configLoaded) {
        wallet.getSkippedVersion().then((data) => {
          dispatch(settingsActions.updateSettings({ skippedVersion: data }));
        });
      }

      dispatch(globalActions.update({ isReady: true }));
    } catch (e) {
      log.debug('init error', e);
    }
  }, [wallet, dispatch, isReady, isUnlocked]);

  useEffect(() => {
    wallet.hasVault().then((val) => {
      if (val) {
        wallet.isUnlocked().then((isUnlocked) => {
          dispatch(globalActions.update({ isUnlocked }));
          if (!isUnlocked && location.href.includes(routes.UnlockScreen.path) === false) {
            const basePath = location.href.split('#')[0];
            location.href = `${basePath}#${routes.UnlockScreen.path}`;
          }
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add('dark');
  }, []);

  if (!isReady) {
    return (
      <AppDimensions>
        <Layout>
          <Content justifyCenter itemsCenter>
            <Icon>
              <LoadingOutlined />
            </Icon>
          </Content>
        </Layout>
      </AppDimensions>
    );
  }
  return (
    <AppDimensions>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {Object.keys(routes)
            .map((v) => routes[v])
            .map((v) => {
              if (
                [
                  PATH_BOOST_SCREEN,
                  PATH_UNLOCK_SCREEN,
                  PATH_FORGOT_PASSWORD_SCREEN,
                  PATH_WELCOME_SCREEN,
                  PATH_CREATE_PASSWORD_SCREEN
                ].includes(v.path)
              ) {
                return <Route key={v.path} path={v.path} element={v.element} />;
              } else {
                return <Route key={v.path} path={v.path} element={<PrivateRoute>{v.element}</PrivateRoute>} />;
              }
            })}

          <Route path="/no-address" element={<NoAddress />} />
          <Route path="/connect-approval" element={<ConnectApproval />} />
          <Route
            path="/mnemonics/create"
            element={
              <PrivateRoute>
                <CreateMnemonics />
              </PrivateRoute>
            }
          />

          <Route
            path="/bridge"
            element={
              <PrivateRoute>
                <BridgeComponent />
              </PrivateRoute>
            }
          />
          <Route
            path="/dex-swap"
            element={
              <PrivateRoute>
                <Swap />
              </PrivateRoute>
            }
          />
          <Route
            path="/popup/import/success"
            element={
              <PrivateRoute>
                <ImportSuccess isPopup />
              </PrivateRoute>
            }
          />
          <Route
            path="/history"
            element={
              <PrivateRoute>
                <HistoryPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/history/filter-scam"
            element={
              <PrivateRoute>
                <HistoryPage isFitlerScam={true} />
              </PrivateRoute>
            }
          />
          <Route
            path="/activities"
            element={
              <PrivateRoute>
                <Activities />
              </PrivateRoute>
            }
          />
          <Route
            path="/gnosis-queue"
            element={
              <PrivateRoute>
                <GnosisQueue />
              </PrivateRoute>
            }
          />
          <Route
            path="/add-address"
            element={
              <PrivateRoute>
                <AddAddress />
              </PrivateRoute>
            }
          />
          <Route
            path="/approval-evm"
            element={
              <PrivateRoute>
                <ApprovalEvm />
              </PrivateRoute>
            }
          />
          <Route
            path="/token-approval"
            element={
              <PrivateRoute>
                <TokenApproval />
              </PrivateRoute>
            }
          />
          <Route
            path="/nft-approval"
            element={
              <PrivateRoute>
                <NFTApproval />
              </PrivateRoute>
            }
          />

          <Route
            path="/request-permission"
            element={
              <PrivateRoute>
                <RequestPermission />
              </PrivateRoute>
            }
          />
          <Route
            path="/send-token"
            element={
              <PrivateRoute>
                <SendEvmToken />
              </PrivateRoute>
            }
          />
          <Route
            path="/send-nft"
            element={
              <PrivateRoute>
                <SendNFT />
              </PrivateRoute>
            }
          />
          <Route
            path="/receive"
            element={
              <PrivateRoute>
                <Receive />
              </PrivateRoute>
            }
          />
          <Route
            path="/approval-manage"
            element={
              <PrivateRoute>
                <ApprovalManagePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/dapp-search"
            element={
              <PrivateRoute>
                <DappSearchPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/import/metamask"
            element={
              <PrivateRoute>
                <ImportMyMetaMaskAccount />
              </PrivateRoute>
            }
          />
          <Route
            path="/switch-address"
            element={
              <PrivateRoute>
                <AddressManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/custom-rpc"
            element={
              <PrivateRoute>
                <CustomRPC />
              </PrivateRoute>
            }
          />
          <Route
            path="/custom-testnet"
            element={
              <PrivateRoute>
                <CustomTestnet />
              </PrivateRoute>
            }
          />
        </Routes>
        <CommonPopup />
      </HashRouter>
    </AppDimensions>
  );
};

export default Main;
