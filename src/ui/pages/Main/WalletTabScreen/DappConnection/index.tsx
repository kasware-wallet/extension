import { message } from 'antd';
import type { ConnectedSite } from '@/shared/types/permission';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { ChainSelector, FallbackSiteLogo } from '@/evm/ui/component';
import { getCurrentTab } from '@/evm/ui/utils';

import { TooltipWithMagnetArrow } from '@/evm/ui/component/Tooltip/TooltipWithMagnetArrow';
import { getOriginFromUrl } from '@/utils';
import { findChainByEnum } from '@/utils/chain';
import { ga4 } from '@/utils/ga4';
import { matomoRequestEvent } from '@/utils/matomo-request';
import type { EVM_CHAINS_ENUM } from '@/shared/constant';
import { DEFAULT_CHAIN, KASPA_CHAINS_ENUM } from '@/shared/constant';
import { useWallet } from '@/ui/utils';

import './style.less';

interface CurrentConnectionProps {
  onChainChange?: (chain: EVM_CHAINS_ENUM) => void;
}
export const CurrentNetwork = memo((props: CurrentConnectionProps) => {
  const { onChainChange } = props;
  const wallet = useWallet();
  const { t } = useTranslation();
  const [site, setSite] = useState<ConnectedSite | null>(null);
  const { state } = useLocation();
  const { showChainsModal = false, trigger } = state ?? {};
  const [isShowMetamaskModePopup, setIsShowMetamaskModePopup] = useState(false);

  const [visible, setVisible] = useState(trigger === 'current-connection' && showChainsModal);

  const getCurrentSite = useCallback(async () => {
    const tab = await getCurrentTab();
    if (!tab.id || !tab.url) return;
    const domain = getOriginFromUrl(tab.url);
    const current = await wallet.walletEVM.getCurrentSite(tab.id, domain);
    setSite(current);
  }, [wallet.walletEVM]);

  const handleRemove = async (origin: string) => {
    await wallet.walletEVM.removeConnectedSite(origin);
    getCurrentSite();
    message.success({
      icon: <i />,
      content: <span className="text-white">{t('disconnected')}</span>
    });
  };
  const handleChangeDefaultChain = async (chain: EVM_CHAINS_ENUM) => {
    const _site = {
      ...site!,
      chain
    };
    setSite(_site);
    setVisible(false);
    onChainChange?.(chain);
    await wallet.walletEVM.setSite(_site);
    const rpc = await wallet.walletEVM.getCustomRpcByChain(chain);
    if (rpc) {
      const avaliable = await wallet.walletEVM.pingCustomRPC(chain);
      if (!avaliable) {
        message.error(t('rpcUnavailable'));
      }
    }
  };

  useEffect(() => {
    getCurrentSite();
  }, [getCurrentSite]);

  return (
    <>
      {/* {site ? (
        <div className="site mr-[18px]">
          <div className="relative">
            <FallbackSiteLogo
              url={site.icon}
              origin={site.origin}
              width="28px"
              className="site-icon"></FallbackSiteLogo>
            {site.isMetamaskMode ? (
              <TooltipWithMagnetArrow
                placement="top"
                overlayClassName={clsx('rectangle max-w-[360px] w-[360px]')}
                align={{
                  offset: [0, 4]
                }}
                title={t('metamaskModeTooltipNew')}>
                <div className="absolute top-[-4px] right-[-4px] text-r-neutral-title-2">
                  <img src={IconMetamaskMode} alt="metamask mode"></img>
                </div>
              </TooltipWithMagnetArrow>
            ) : null}
          </div>
          <div className="site-content">
            <div className="site-name" title={site?.origin}>
              {site?.origin}
            </div>
            <div className={clsx('site-status text-[12px]', site?.isConnected && 'active')}>
              {site?.isConnected ? t('connected') : t('Not connected')}
              <RCIconDisconnectCC
                viewBox="0 0 14 14"
                className="site-status-icon w-[12px] h-[12px] ml-[4px] text-r-neutral-foot hover:text-kasware-red-default"
                onClick={() => handleRemove(site!.origin)}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="site is-empty">
          <img src={IconDapps} className="site-icon ml-[6px]" alt="" />
          <div className="site-content">{t('noDappFound')}</div>
        </div>
      )} */}
      <ChainSelector
        // className={clsx(!site && 'disabled')}
        value={site?.chain || DEFAULT_CHAIN}
        onChange={handleChangeDefaultChain}
        showModal={visible}
        onAfterOpen={() => {
          matomoRequestEvent({
            category: 'Front Page Click',
            action: 'Click',
            label: 'Change Chain'
          });

          ga4.fireEvent('Click_ChangeChain', {
            event_category: 'Front Page Click'
          });
        }}
        showRPCStatus
      />
    </>
  );
});

export function DappConnectionItem({ item }: { item: ConnectedSite }) {
  const chainItem = useMemo(() => {
    if (item.chain == 'kaspa_mainnet' || item.chain == 'kaspa_testnet10' || item.chain == 'kaspa_testnet11') {
      return {
        logo: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 28'><circle cx='14' cy='14' r='14' fill='%236A7587'></circle><text x='14' y='15' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='16' font-weight='500'>${encodeURIComponent(
          item.chain?.trim().substring(0, 1).toUpperCase()
        )}</text></svg>`,
        name: item.chain
      };
    } else {
      return findChainByEnum(item.chain);
    }
  }, [item.chain]);
  return (
    <div className="logo">
      <FallbackSiteLogo url={item.icon} origin={item.origin} width="28px" />
      <TooltipWithMagnetArrow title={chainItem?.name} className="rectangle w-[max-content]">
        <img className="connect-chain" src={chainItem?.logo} alt={chainItem?.name} />
      </TooltipWithMagnetArrow>
    </div>
  );
}
