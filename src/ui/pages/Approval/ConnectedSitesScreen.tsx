import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate as useNavigateOrigin } from 'react-router-dom';

import type { ConnectedSite } from '@/shared/types/permission';
import { FallbackSiteLogo } from '@/evm/ui/component';
import { TooltipWithMagnetArrow } from '@/evm/ui/component/Tooltip/TooltipWithMagnetArrow';
import { Divide } from '@/evm/ui/views/Approval/components/Divide';
import { CurrentConnection } from '@/evm/ui/views/Dashboard/components/CurrentConnection';
import { findChainByEnum } from '@/utils/chain';
import { Card, Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { Empty } from '@/ui/components/Empty';
import { useWallet } from '@/ui/utils';
import { HistoryOutlined } from '@ant-design/icons';

import './style.less';

interface LocationState {
  site?: ConnectedSite | undefined;
  type?: 'EVM' | 'KASPA' | undefined;
}

export default function ConnectedSitesScreen() {
  const wallet = useWallet();
  const { t } = useTranslation();
  const navigateOrigin = useNavigateOrigin();
  const { state } = useLocation() as { state: LocationState };
  const currentConnectedSite = useMemo(() => state?.site, [state?.site]);

  const [sites, setSites] = useState<ConnectedSite[]>([]);

  const getSites = async () => {
    let sites = await wallet.getConnectedSites();
    let sitesEVM = await wallet.walletEVM.getConnectedSites();
    if (currentConnectedSite) {
      sites = sites.filter((site) => site.origin !== currentConnectedSite.origin);
      sitesEVM = sitesEVM.filter((site) => site.origin !== currentConnectedSite.origin);
    }
    sites = sites.concat(sitesEVM as unknown as ConnectedSite[]);
    setSites(sites);
  };

  useEffect(() => {
    getSites();
  }, [currentConnectedSite]);

  const handleRemove = async (origin: string) => {
    await wallet.removeConnectedSite(origin);
    await wallet.walletEVM.removeConnectedSite(origin);
    getSites();
  };
  return (
    <Layout>
      <Header
        hideConnectingComp
        onBack={() => {
          window.history.go(-1);
        }}
        title={t('Connected Sites')}
        RightComponent={
          <Column
            selfItemsCenter
            classname="column-select"
            onClick={() => {
              navigateOrigin('/connected-sites/history');
            }}
          >
            <Icon>
              <HistoryOutlined />
            </Icon>
          </Column>
        }
      />
      <Content>
        <Column>
          {state?.type == 'EVM' && (
            <>
              <CurrentConnection />
              <Divide />
            </>
          )}
          {state?.type == 'KASPA' && currentConnectedSite !== undefined && (
            <>
              <Item key={currentConnectedSite.origin} item={currentConnectedSite} onRemove={handleRemove} />
              <Divide />
            </>
          )}
          {sites.length > 0 ? (
            sites.map((item, index) => <Item key={item.origin + index} item={item} onRemove={handleRemove} />)
          ) : (
            <Empty />
          )}
        </Column>
      </Content>
    </Layout>
  );
}

function Item({ item, onRemove }: { item: ConnectedSite; onRemove: (origin: string) => void }) {
  const chainItem = useMemo(() => {
    if (item.chain == 'kaspa_mainnet' || item.chain == 'kaspa_testnet10' || item.chain == 'kaspa_testnet11') {
      return {
        logo: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 28'><circle cx='14' cy='14' r='14' fill='%236A7587'></circle><text x='14' y='15' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='16' font-weight='500'>${encodeURIComponent(
          item.chain.trim().substring(0, 1).toUpperCase()
        )}</text></svg>`,
        name: item.chain
      };
    } else {
      return findChainByEnum(item.chain);
    }
  }, [item.chain]);
  return (
    <Card>
      <Row full justifyBetween itemsCenter>
        <Row itemsCenter>
          <div className="logo">
            <FallbackSiteLogo url={item.icon} origin={item.origin} width="32px" />
            <TooltipWithMagnetArrow title={chainItem?.name} className="rectangle w-[max-content]">
              <img className="connect-chain" src={chainItem?.logo} alt={chainItem?.name} />
            </TooltipWithMagnetArrow>
          </div>

          <Text text={item.origin} preset="sub" />
        </Row>
        <Column justifyCenter>
          <Icon
            icon="close"
            onClick={() => {
              onRemove(item.origin);
            }}
          />
        </Column>
      </Row>
    </Card>
  );
}
