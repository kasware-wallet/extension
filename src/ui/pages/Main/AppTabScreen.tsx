import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import type { AppInfo } from '@/shared/types';
import { NetworkType } from '@/shared/types';
import { Card, Column, Content, Footer, Header, Layout, Row, Text } from '@/ui/components';
import { NavTabBar } from '@/ui/components/NavTabBar';
import { useExtensionIsInTab, useOpenExtensionInTab } from '@/ui/features/browser/tabs';
import { useQueryConfigJSON } from '@/ui/hooks/kasware';
import { useAppSummary } from '@/ui/state/accounts/hooks';
import { useAppSelector } from '@/ui/state/hooks';
import { useEnableKRC20Swap } from '@/ui/state/settings/hooks';
import { selectNetworkType } from '@/ui/state/settings/reducer';
import { ExpandAltOutlined, RightOutlined } from '@ant-design/icons';

function AppItem({ info, isLive }: { info: AppInfo; isLive: boolean }) {
  const navigate = useNavigate();
  const isInTab = useExtensionIsInTab();
  const openExtensionInTab = useOpenExtensionInTab();
  if (info.id == 'krc20mintdeploy') {
    return (
      <Card
        classname="card-select"
        key={info.id}
        mb="lg"
        onClick={() => {
          if (!isLive) return;
          if (isInTab) {
            navigate(info.url);
          } else {
            openExtensionInTab('#' + info.url);
          }
        }}
      >
        <Row full justifyBetween style={!isLive ? { cursor: 'not-allowed', opacity: 0.5 } : {}}>
          <Column justifyCenter>
            <Text text={info.title} preset="regular-bold" />
          </Column>
          <Column justifyCenter>
            {isInTab ? (
              <RightOutlined style={{ transform: 'scale(1.2)', color: '#AAA' }} />
            ) : (
              <ExpandAltOutlined style={{ transform: 'scale(1.2)', color: '#AAA' }} />
            )}
          </Column>
        </Row>
      </Card>
    );
  }
  return (
    <Card
      classname="card-select"
      key={info.id}
      mt="lg"
      onClick={() => {
        navigate(info.url);
      }}
    >
      <Row full justifyBetween>
        <Column justifyCenter>
          <Text text={info.title} preset="regular-bold" />
        </Column>
        <Column justifyCenter>
          <RightOutlined style={{ transform: 'scale(1.2)', color: '#AAA' }} />
        </Column>
      </Row>
    </Card>
  );
}

export default function AppTabScreen() {
  const networkType = useAppSelector(selectNetworkType);
  const appSummary = useAppSummary();
  // const status = useKRC20LaunchStatus();
  const enableSwap = useEnableKRC20Swap();
  const configJSON = useQueryConfigJSON();
  const isLive = useMemo(() => {
    if (networkType == NetworkType.Mainnet) return configJSON.data?.mainnet;
    if (networkType == NetworkType.Testnet) return configJSON.data?.testnet;
    return false;
  }, [networkType, configJSON]);
  return (
    <Layout>
      <Header title={'Explore'} />
      <Content>
        <Column gap="lg">
          {appSummary.apps.map((v) => {
            if (v.id == 'krc20swap' && enableSwap == false) return <div key="krc20swap"></div>;
            return <AppItem key={v.title} info={v} isLive={isLive ?? true} />;
          })}
        </Column>
      </Content>
      <Footer px="zero" py="zero">
        <NavTabBar tab="app" />
      </Footer>
    </Layout>
  );
}
