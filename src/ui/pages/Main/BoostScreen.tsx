import { useEffect } from 'react';

import type { Approval } from '@/evm/background/service/notification';
import { getUiType, useApproval, useWallet } from '@/ui/utils';
import { useApproval as useApprovalEVM } from '@/evm/ui/utils';
import Browser from 'webextension-polyfill';
import { useNavigate, useNavigateOrigin } from '../MainRoute';

export default function BoostScreen() {
  const navigate = useNavigate();
  const navigateOrigin = useNavigateOrigin();
  const wallet = useWallet();

  const [getApproval, , rejectApproval, removeNotifiWindow] = useApproval();
  const getApprovalEVM = useApprovalEVM()[0];
  const loadView = async () => {
    const UIType = getUiType();
    const isInNotification = UIType.isNotification;
    const isInTab = UIType.isTab;
    let approval = await getApproval();
    const approvalEVM: Approval | undefined = await getApprovalEVM();
    if (isInNotification && !approval && !approvalEVM) {
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
        isInNotification &&
        approvalEVM?.data?.approvalComponent === 'Connect' &&
        approvalEVM?.data?.params?.$ctx?.providers?.length
      ) {
        navigateOrigin('/connect-approval');
      } else {
        navigate('UnlockScreen');
      }
      // navigate('UnlockScreen');
      return;
    }
    if ((await wallet.walletEVM.hasPageStateCache()) && !isInNotification && !isInTab && !approvalEVM && !approval) {
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
    } else if (approvalEVM && isInNotification) {
      navigateOrigin('/approval-evm');
    } else {
      navigate('WalletTabScreen');
      return;
    }
  };

  const init = async () => {
    const ready = await wallet.isReady();

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
