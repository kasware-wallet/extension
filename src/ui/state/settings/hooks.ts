import compareVersions from 'compare-versions';
import { useCallback } from 'react';

import { NETWORK_ID, VERSION, type EVM_CHAINS_ENUM } from '@/shared/constant';
import { NetworkType } from '@/shared/types';
import type { CURRENCIES, TNetworkId } from '@/shared/types';
import type { INetworkType } from '@/shared/types';
import { useQueryConfigJSON } from '@/ui/hooks/kasware';
import { useWallet } from '@/ui/utils';
import i18n from '@/ui/utils/i18n';

import type { AppState } from '..';
import { useAppDispatch, useAppSelector } from '../hooks';
import { selectNetworkId, selectNetworkType, selectSettings, settingsActions } from './reducer';
import { createSelector } from '@reduxjs/toolkit';
import { DEX_SUPPORT_CHAINS } from '@kasware-wallet/swap';
import { isCustomTestnet } from '@/utils/chain';
import { getIntersection } from '@/shared/utils/arrayUtils';
import { useSupportedDEXList } from '../models/swap';

export function useSettingsState(): AppState['settings'] {
  return useAppSelector((state) => state.settings);
}

const selectLocale = createSelector(selectSettings, (settings) => settings.locale);
export function useLocale() {
  return useAppSelector(selectLocale);
}

const selectCurrency = createSelector(selectSettings, (settings) => settings.currency);
export function useCurrency() {
  return useAppSelector(selectCurrency);
}

export function useChangeLocaleCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  return useCallback(
    async (locale: string) => {
      await wallet.setLocale(locale);
      // await addResourceBundle(locale);
      i18n.changeLanguage(locale);
      dispatch(
        settingsActions.updateSettings({
          locale
        })
      );

      // window.location.reload();
    },
    [dispatch, wallet]
  );
}

export function useChangeCurrencyCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  return useCallback(
    async (currency: keyof typeof CURRENCIES) => {
      await wallet.setCurrency(currency);
      dispatch(
        settingsActions.updateSettings({
          currency
        })
      );
    },
    [dispatch, wallet]
  );
}

// export function useAddressType() {
//   const accountsState = useSettingsState();
//   return accountsState.addressType;
// }

// export function useNetworkType() {
//   const accountsState = useSettingsState();
//   return accountsState.networkType;
// }

// export function useNetworkId() {
//   const accountsState = useSettingsState();
//   return accountsState.networkId as TNetworkId;
// }

const selectAutoLockMinutes = createSelector(selectSettings, (settings) => settings.autoLockMinutes);
export function useAutoLockMinutes() {
  return useAppSelector(selectAutoLockMinutes);
}

const selectRpcLinks = createSelector(selectSettings, (settings) => settings.rpcLinks);
export function useRpcLinks() {
  return useAppSelector(selectRpcLinks);
}
export function useChangeAutoLockMinutesCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  return useCallback(
    async (minutes: number) => {
      await wallet.setAutoLockMinutes(minutes);
      dispatch(
        settingsActions.updateSettings({
          autoLockMinutes: minutes
        })
      );
    },
    [dispatch, wallet]
  );
}
export function useChangeNetworkTypeCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  return useCallback(
    async (type: NetworkType, id: TNetworkId) => {
      await wallet.setNetworkType(type, id);
      dispatch(
        settingsActions.updateSettings({
          networkType: type,
          networkId: id
        })
      );
      await wallet.disconnectRpc();
      await wallet.handleRpcConnect();
    },
    [dispatch, wallet]
  );
}

export function useChangeRpcLinksCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  return useCallback(
    async (type: { [key: string]: INetworkType }) => {
      await wallet.setRpcLinks(type);
      dispatch(
        settingsActions.updateSettings({
          rpcLinks: type
        })
      );
    },
    [dispatch, wallet]
  );
}

export function useTxIdUrl(txid: string) {
  const networkType = useAppSelector(selectNetworkType);
  if (networkType === NetworkType.Mainnet) {
    return `https://mempool.space/tx/${txid}`;
  } else {
    return `https://mempool.space/testnet/tx/${txid}`;
  }
}

export function useKaswareWebsite() {
  const networkType = useAppSelector(selectNetworkType);
  if (networkType === NetworkType.Mainnet) {
    return 'https://kasware.xyz';
  } else {
    return 'https://testnet.kasware.xyz';
  }
}

export function useWalletConfig() {
  const configJSON = useQueryConfigJSON();
  return (
    configJSON.data?.versionConfig || {
      version: '0.0.0',
      moonPayEnabled: false,
      // swapEnabled: false,
      // swapEnabledV2: false,
      hibitSwapEnabled: false,
      chaingeSwapEnabled: false,
      evmBridgeEnabled: false,
      kaspaL2BridgeEnabled: false,
      krcL2BridgeEnabled: false,
      statusMessage: '',
      forceUpdate: false,
      shouldPopVersion: false
    }
  );
}

export function useEnableBridge() {
  const configJSON = useQueryConfigJSON();
  const versionConfig = configJSON.data?.versionConfig;

  const networkId = useAppSelector(selectNetworkId);
  const testnetList = useAppSelector((store) => store.chains.testnetList);
  const chainList =
    networkId === NETWORK_ID.mainnet
      ? testnetList.filter((chain) => !isCustomTestnet(chain))
      : testnetList.filter(isCustomTestnet);
  const chainIds = chainList?.map((chain) => chain.id);
  const enabled =
    versionConfig?.evmBridgeEnabled || versionConfig?.kaspaL2BridgeEnabled || versionConfig?.krcL2BridgeEnabled;
  const bridgeChainList = [
    ...(versionConfig?.evmBridgeEnabled ? configJSON.data?.evmBridgeChainList || [] : []),
    ...(versionConfig?.kaspaL2BridgeEnabled ? configJSON.data?.kaspaL2BridgeChainList || [] : []),
    ...(versionConfig?.krcL2BridgeEnabled ? configJSON.data?.krcL2BridgeChainList || [] : [])
  ];
  return enabled && bridgeChainList && getIntersection(chainIds, bridgeChainList)?.length > 0;
}
export function useDexSupportChains() {
  const networkId = useAppSelector(selectNetworkId);
  // const configJSON = useQueryConfigJSON();
  // const evmDexList = networkId === NETWORK_ID.mainnet ? configJSON.data?.evmMainnetDexList : configJSON.data?.evmTestnetDexList;
  const evmDexList = useSupportedDEXList();

  const testnetList = useAppSelector((store) => store.chains.testnetList);
  const chainList =
    networkId === NETWORK_ID.mainnet
      ? testnetList.filter((chain) => !isCustomTestnet(chain))
      : testnetList.filter(isCustomTestnet);
  const chainEnums = chainList?.map((chain) => chain.enum);
  if (chainEnums?.length <= 0 || !evmDexList || evmDexList?.length <= 0) return [];

  const supportedChains: EVM_CHAINS_ENUM[] = evmDexList?.flatMap((dex) => DEX_SUPPORT_CHAINS[dex]) || [];
  return getIntersection(chainEnums, supportedChains);
}
export function useEnableKRC20Swap() {
  const walletConfig = useWalletConfig();
  if (walletConfig?.hibitSwapEnabled == true || walletConfig?.chaingeSwapEnabled == true) return true;
  return false;
}

export function useVersionInfo() {
  const accountsState = useSettingsState();
  const walletConfig = useWalletConfig();
  const newVersion = walletConfig.version;
  const skippedVersion = accountsState.skippedVersion;
  const currentVesion = VERSION;
  let skipped = false;
  let latestVersion = '';
  // skip if new version is empty
  if (!newVersion) {
    skipped = true;
  }

  // skip if skipped
  if (newVersion == skippedVersion) {
    skipped = true;
  }

  // skip if current version is greater or equal to new version
  if (newVersion) {
    if (compareVersions(currentVesion, newVersion) >= 0) {
      skipped = true;
    } else {
      latestVersion = newVersion;
    }
  }

  // skip if current version is 0.0.0
  // if (currentVesion === '0.0.0') {
  //   skipped = true;
  // }
  return {
    currentVesion,
    newVersion,
    latestVersion,
    skipped,
    forceUpdate: walletConfig?.forceUpdate || false,
    shouldPopVersion: walletConfig?.shouldPopVersion || false
  };
}

export function useSkipVersionCallback() {
  const wallet = useWallet();
  const dispatch = useAppDispatch();
  return useCallback(
    (version: string) => {
      wallet.setSkippedVersion(version).then(() => {
        dispatch(settingsActions.updateSettings({ skippedVersion: version }));
      });
    },
    [dispatch, wallet]
  );
}

export function useCacheKrc721StreamUrl() {
  const networkId = useAppSelector(selectNetworkId);
  if (networkId === 'mainnet') {
    return 'https://cache.krc721.stream/krc721/mainnet';
  } else if (networkId === 'testnet-10') {
    return 'https://cache.krc721.stream/krc721/testnet-10';
  } else {
    return '';
  }
}
