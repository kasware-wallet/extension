import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useState } from 'react';
import type { WalletController as KaspaWalletControllerClass } from '@/background/controller/wallet';

import type { OpenApiService } from '@kasware-wallet/api';
import type { PopupProps } from '@/evm/ui/component/Popup';
import type { WalletControllerType as EvmWalletControllerType } from '@/evm/ui/utils/WalletContext';
import type { Object } from 'ts-toolbelt';
import type { CommonPopupComponentName } from '@/evm/ui/views/CommonPopup';
import type { IExtractFromPromise } from '@/shared/types/evm';

export type WalletController = Object.Merge<
  {
    [key in keyof KaspaWalletControllerClass]: KaspaWalletControllerClass[key] extends (
      ...args: infer ARGS
    ) => infer RET
      ? <T extends IExtractFromPromise<RET> = IExtractFromPromise<RET>>(
          ...args: ARGS
        ) => Promise<IExtractFromPromise<T>>
      : KaspaWalletControllerClass[key];
  },
  {
    walletEVM: EvmWalletControllerType;
    openapiEVM: OpenApiService;
    testnetOpenapiEVM: any;
    fakeTestnetOpenapiEVM: any;
    openapi: {
      [key: string]: (...params: any) => Promise<any>;
    };
  }
>;

const useCommonPopupViewState = () => {
  const [componentName, setComponentName] = useState<CommonPopupComponentName | false>();
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState<ReactNode>('Sign');
  const [height, setHeight] = useState(360);
  const [className, setClassName] = useState<'isConnectView' | undefined>();
  const [account, setAccount] = useState<{
    address: string;
    brandName: string;
    realBrandName?: string;
    chainId?: number;
    type: string;
  }>();
  const [data, setData] = useState<any>();
  const [popupProps, setPopupProps] = useState<PopupProps | undefined>();

  const activePopup = (name: CommonPopupComponentName) => {
    setComponentName(name);
    setVisible(true);
  };

  const closePopup = useCallback(() => {
    setVisible(false);
    setComponentName(undefined);
  }, []);

  const activeApprovalPopup = () => {
    if (componentName === 'Approval' && visible === false) {
      setVisible(true);
      return true;
    }
    return false;
  };

  return {
    visible,
    setVisible,
    closePopup,
    componentName,
    activePopup,
    title,
    setTitle,
    height,
    setHeight,
    className,
    setClassName,
    account,
    setAccount,
    activeApprovalPopup,
    data,
    setData,
    popupProps,
    setPopupProps
  };
};

// Separate contexts to avoid unnecessary re-renders when unrelated values change
const WalletInstanceContext = createContext<WalletController | null>(null);
const CommonPopupViewContext = createContext<ReturnType<typeof useCommonPopupViewState> | null>(null);

const WalletProvider = ({ children, wallet }: { children?: ReactNode; wallet: WalletController }) => {
  const commonPopupView = useCommonPopupViewState();

  return (
    <WalletInstanceContext.Provider value={wallet}>
      <CommonPopupViewContext.Provider value={commonPopupView}>{children}</CommonPopupViewContext.Provider>
    </WalletInstanceContext.Provider>
  );
};

const useWallet = () => {
  const wallet = useContext(WalletInstanceContext);
  if (!wallet) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return wallet;
};

const useCommonPopupView = () => {
  const commonPopupView = useContext(CommonPopupViewContext);
  if (!commonPopupView) {
    throw new Error('useCommonPopupView must be used within WalletProvider');
  }
  return commonPopupView;
};

export { useCommonPopupView, useWallet, WalletProvider };
