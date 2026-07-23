import log from 'loglevel';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { HashRouter, Route, Routes, useLocation, useNavigate as useNavigateOrigin } from 'react-router-dom';

import { Content, Layout, LoadingSpinner } from '../components';
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
import KRC20TokenScreen from './KRC20/KRC20TokenScreen';
import KRC20TxConfirmScreen from './KRC20/KRC20TxConfirmScreen';
import KRC20TxDetailScreen from './KRC20/KRC20TxDetailScreen';
import KSPR721TxDetailScreen from './KRC20/KSPR721TxDetailScreen';
import P2SHUTXODetailScreen from './KRC20/P2SHUTXODetailScreen';
import RetrieveP2SHUTXOScreen from './KRC20/RetrieveP2SHUTXOScreen';
import UnlockKRC20TokenScreen from './KRC20/UnlockKRC20TokenScreen';
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
import WalletInfoScreen from './Settings/WalletInfoScreen';
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

// Import types from shared
import {
  PATH_ADD_KEYRING_SCREEN,
  PATH_APP_TAB_SCREEN,
  PATH_APPROVAL_HISTORY_SCREEN,
  PATH_APPROVAL_SCREEN,
  PATH_APPS_OPTION_SCREEN,
  PATH_AUTO_LOCK_OPTION_SCREEN,
  PATH_BOOST_SCREEN,
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
  PATH_DONATION_TYPE_SCREEN,
  PATH_EDIT_ACCOUNT_NAME_SCREEN,
  PATH_EDIT_CONTACT_NAME_SCREEN,
  PATH_EDIT_NETWORK_URL_SCREEN,
  PATH_EDIT_WALLET_NAME_SCREEN,
  PATH_EVM_RECEIVE_SCREEN,
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
import type {
  Account,
  IKaspaUtxoEntryReference,
  IKNSAsset,
  INetworkType,
  Inscription,
  IP2shOutput,
  IToken,
  RawTxInfo,
  TKasplexOp,
  TKRC20History,
  TKRC20HistoryIssue,
  TNetworkId,
  TProtocol,
  TTokenType,
  TxType,
  WalletKeyring
} from '@/shared/types';
import type { ContactBookItem } from '@/shared/types/contact-book';
import type { ConnectedSite } from '@/shared/types/permission';
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
  RetrieveP2SHUTXOScreen: { outputs: IP2shOutput[] | undefined };
  P2SHUTXODetailScreen: { p2shOutput: IP2shOutput };
  KRC20HistoryScreen?: never;
  KRC20TxConfirmScreen: {
    inscribeJsonString: string;
    type: TxType;
    tokenType: TTokenType;
    // isRBF: boolean;
    protocol: TProtocol;
    feeRate?: number;
    destAddr?: string;
  };
  KRC20BatchTxConfirmScreen: {
    inscribeJsonString: string;
    type: TxType;
    times: number;
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
  KRC20MintDeployScreen: {
    path: PATH_KRC20_MINT_DEPLOY_SCREEN,
    element: <KRC20MintDeployScreen />
  },
  KRC20DeployScreen: {
    path: PATH_KRC20_DEPLOY_SCREEN,
    element: <KRC20DeployScreen />
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
        wallet.getAppSummary().then((data) => {
          dispatch(accountsActions.setAppSummary(data));
        });
        self.summaryLoaded = true;
      }

      if (!self.configLoaded) {
        wallet.getSkippedVersion().then((data) => {
          dispatch(settingsActions.updateSettings({ skippedVersion: data }));
        });
      }

      dispatch(globalActions.update({ isReady: true }));
    } catch (e: any) {
      log.debug('init error', e);
      // Retry when background is not ready yet (disconnected error)
      if (e?.code === 4900) {
        setTimeout(() => {
          dispatch(globalActions.update({ isReady: false }));
          init();
        }, 1000);
      } else {
        // For other errors, still mark as ready so UI can render
        // and user is not stuck on a black/loading screen
        log.error('init failed with non-connection error', e);
        dispatch(globalActions.update({ isReady: true }));
      }
    }
  }, [wallet, dispatch, isReady, isUnlocked]);

  useEffect(() => {
    wallet
      .hasVault()
      .then((val) => {
        if (val) {
          wallet.isUnlocked().then((isUnlocked) => {
            dispatch(globalActions.update({ isUnlocked }));
            if (!isUnlocked && location.href.includes(routes.UnlockScreen.path) === false) {
              const basePath = location.href.split('#')[0];
              location.href = `${basePath}#${routes.UnlockScreen.path}`;
            }
          });
        }
      })
      .catch((e) => {
        log.error('hasVault/isUnlocked check failed', e);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    init();
    // Safety timeout: if init takes too long (e.g. background unresponsive),
    // force isReady to true so the UI is not stuck on a black/loading screen
    const timeout = setTimeout(() => {
      dispatch(globalActions.update({ isReady: true }));
    }, 10000);
    return () => clearTimeout(timeout);
  }, [init, dispatch]);

  useLayoutEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add('dark');
  }, []);

  if (!isReady) {
    return (
      <AppDimensions>
        <Layout>
          <Content justifyCenter itemsCenter>
            <LoadingSpinner size="medium" />
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
            .map((v) => (
              <Route key={v.path} path={v.path} element={v.element} />
            ))}
        </Routes>
      </HashRouter>
    </AppDimensions>
  );
};

export default Main;
