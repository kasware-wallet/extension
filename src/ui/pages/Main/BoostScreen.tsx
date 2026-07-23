import { useEffect } from 'react';

import { getUiType, useApproval, useWallet } from '@/ui/utils';
import Browser from 'webextension-polyfill';
import { useNavigate, useNavigateOrigin } from '../MainRoute';

export default function BoostScreen() {
  const navigate = useNavigate();
  const navigateOrigin = useNavigateOrigin();
  const wallet = useWallet();

  const [getApproval, , rejectApproval, removeNotifiWindow] = useApproval();
  const loadView = async () => {
    const UIType = getUiType();
    const isInNotification = UIType.isNotification;
    const isInTab = UIType.isTab;
    let approval = await getApproval();
    if (isInNotification && !approval) {
      Browser.runtime.sendMessage({ type: 'closeNotification' });
      window.close();
      return;
    }

    // if (!isInNotification) {
    //   await rejectApproval();
    //   approval = undefined;
    // }

    if (!isInNotification && !approval) {
      await rejectApproval();
      approval = undefined;
    }
    if (!isInNotification && approval) {
      removeNotifiWindow();
    }

    const isBooted = await wallet.isBooted();
    const hasVault = await wallet.hasVault();
    const isUnlocked = await wallet.isUnlocked();

    if (!isBooted) {
      navigate('WelcomeScreen');
      return;
    }

    if (!isUnlocked) {
      if (
        isInNotification 
      ) {
        navigateOrigin('/connect-approval');
      } else {
        navigate('UnlockScreen');
      }
      // navigate('UnlockScreen');
      return;
    }
    if ((await wallet.walletEVM.hasPageStateCache()) && !isInNotification && !isInTab  && !approval) {
      const cache = (await wallet.walletEVM.getPageStateCache())!;
      if (cache.path && cache.path !== '/') {
        // prevent path is empty then extension will stuck
        navigateOrigin(cache.path + (cache.search || ''));
        return;
      } else {
        wallet.walletEVM.clearPageStateCache();
      }
    }

    if (!hasVault) {
      navigate('WelcomeScreen');
      return;
    }

    if ((await wallet.getPreMnemonics()) && !isInNotification && !isInTab) {
      navigate('CreateHDWalletScreen', { isImport: false });
      return;
    }

    const currentAccount = await wallet.getCurrentAccount();

    if (!currentAccount) {
      navigate('WelcomeScreen');
      return;
    } else if (approval) {
      navigate('ApprovalScreen');
    } else {
      navigate('WalletTabScreen');
      return;
    }
  };

  const init = async () => {
    let ready = false;
    try {
      ready = await wallet.isReady();
    } catch {
      // Background not ready yet, retry
    }

    if (ready) {
      loadView();
    } else {
      setTimeout(() => {
        init();
      }, 1000);
    }
  };

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div></div>;
}
