/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import compareVersions from 'compare-versions';
import { useCallback } from 'react';

import { NETWORK_TYPES, VERSION } from '@/shared/constant';
import { NetworkType } from '@/shared/types';
import { useWallet } from '@/ui/utils';
import i18n, { addResourceBundle } from '@/ui/utils/i18n';

import { AppState } from '..';
import { useAppDispatch, useAppSelector } from '../hooks';
import { settingsActions } from './reducer';

export function useSettingsState(): AppState['settings'] {
  return useAppSelector((state) => state.settings);
}

export function useLocale() {
  const settings = useSettingsState();
  return settings.locale;
}

export function useChangeLocaleCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  return useCallback(
    async (locale: string) => {
      await wallet.setLocale(locale);
      await addResourceBundle(locale);
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

export function useAddressType() {
  const accountsState = useSettingsState();
  return accountsState.addressType;
}

export function useNetworkType() {
  const accountsState = useSettingsState();
  return accountsState.networkType;
}

export function useRpcLinks(){
  const settings = useSettingsState();
  return settings.rpcLinks
}

export function useChangeNetworkTypeCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  return useCallback(
    async (type: NetworkType) => {
      await wallet.setNetworkType(type);
      dispatch(
        settingsActions.updateSettings({
          networkType: type
        })
      );
    },
    [dispatch]
  );
}

export function useChangeRpcLinksCallback() {
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  return useCallback(
    async (type: typeof NETWORK_TYPES) => {
      await wallet.setRpcLinks(type);
      dispatch(
        settingsActions.updateSettings({
          rpcLinks: type
        })
      );
    },
    [dispatch]
  );
}

export function useBlockstreamUrl() {
  const networkType = useNetworkType();
  if (networkType === NetworkType.Mainnet) {
    return 'https://kas.fyi';
  } else {
    return 'https://kas.fyi';
  }
}

export function useTxIdUrl(txid: string) {
  const networkType = useNetworkType();
  if (networkType === NetworkType.Mainnet) {
    return `https://mempool.space/tx/${txid}`;
  } else {
    return `https://mempool.space/testnet/tx/${txid}`;
  }
}

export function useKaswareWebsite() {
  const networkType = useNetworkType();
  if (networkType === NetworkType.Mainnet) {
    return 'https://kasware.xyz';
  } else {
    return 'https://testnet.kasware.xyz';
  }
}

export function useWalletConfig() {
  const accountsState = useSettingsState();
  return accountsState.walletConfig;
}

export function useVersionInfo() {
  const accountsState = useSettingsState();
  const walletConfig = accountsState.walletConfig;
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
  if (currentVesion === '0.0.0') {
    skipped = true;
  }
  return {
    currentVesion,
    newVersion,
    latestVersion,
    skipped
  };
}

export function useSkipVersionCallback() {
  const wallet = useWallet();
  const dispatch = useAppDispatch();
  return useCallback((version: string) => {
    wallet.setSkippedVersion(version).then((v) => {
      dispatch(settingsActions.updateSettings({ skippedVersion: version }));
    });
  }, []);
}
