import { Radio } from 'antd';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import type { INetworkType, TNetworkId } from '@/shared/types';
import { Button, Card, Column, Content, Footer, Header, Icon, Input, Layout, LoadingSpinner, Row, Text } from '@/ui/components';
import { useAppSelector } from '@/ui/state/hooks';
import { useChangeRpcLinksCallback, useRpcLinks } from '@/ui/state/settings/hooks';
import { selectNetworkType } from '@/ui/state/settings/reducer';
import { colors } from '@/ui/theme/colors';
import { fontSizes } from '@/ui/theme/font';
import { sleepSecond, useWallet } from '@/ui/utils';
import { useTools } from '@/ui/components/ActionComponent';
import { isValidUrl, isValidWsUrl } from '@/ui/utils/stringUtils';

export default function EditNetworkUrlScreen() {
  const { t } = useTranslation();
  const { state } = useLocation();
  const { item, networkId } = state as {
    item: INetworkType;
    networkId: TNetworkId;
  };
  const [resolverChecked, setResolverChecked] = useState(item?.isResolver);
  const [resolverUrls, setResolverUrls] = useState<string[]>(item?.resolverUrls || []);
  const [loading, setLoading] = useState(false);

  const currentRpcLinks = useRpcLinks();
  const currentNetworkType = useAppSelector(selectNetworkType);
  const changeRpcLinks = useChangeRpcLinksCallback();
  const wallet = useWallet();
  const tools = useTools();
  const [customRpcUrl, setCustomRpcUrl] = useState(item?.url);

  const handleConfirm = async () => {
    if (confirmDisabled) {
      return;
    }
    setLoading(true);
    const rpcLink = currentRpcLinks[networkId];
    let newRpcLink: INetworkType;
    if (resolverChecked) {
      // config resolver
      if (resolverUrls?.length > 0 && resolverUrls?.every((url) => !isValidUrl(url))) {
        tools.toastWarning(t('Please input at least one valid resolver URL'));
        setLoading(false);
        return;
      }
      newRpcLink = {
        ...rpcLink,
        isResolver: resolverChecked,
        resolverUrls: resolverUrls.filter((url) => isValidUrl(url))
      };
    } else {
      // config custom rpc
      if (!customRpcUrl || customRpcUrl?.length == 0 || !isValidWsUrl(customRpcUrl)) {
        tools.toastWarning(t('Please input a valid WRPC URL'));
        setLoading(false);
        return;
      }
      newRpcLink = {
        ...rpcLink,
        isResolver: resolverChecked,
        url: customRpcUrl
      };
    }

    await changeRpcLinks({ ...currentRpcLinks, [networkId]: newRpcLink });
    if (currentNetworkType == item.value) {
      wallet.disconnectRpc().then(() => {
        wallet.handleRpcConnect();
      });
    }
    await sleepSecond(1);
    window.history.go(-1);
  };

  const handleOnKeyUp = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ('Enter' == e.key) {
      await handleConfirm();
    }
  };

  const confirmDisabled = useMemo(() => {
    if (resolverChecked) {
      return false;
    }
    if (customRpcUrl?.length == 0) {
      return true;
    }
  }, [customRpcUrl, resolverChecked]);

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={item.label}
      />
      <Content>
        <Column gap="lg">
          {/* Custom WRPC Option */}
          <Card
            style={{
              padding: '16px',
              border: resolverChecked ? '1px solid rgba(255,255,255,0.08)' : `1px solid ${colors.aqua}`,
              backgroundColor: 'var(--r-neutral-card-1)'
            }}
            px="zero"
          >
            <Column gap="md" fullX>
              <Row itemsCenter fullX onClick={() => setResolverChecked(false)} style={{ cursor: 'pointer' }}>
                <Radio
                  checked={!resolverChecked}
                  onChange={() => setResolverChecked(false)}
                  style={{ marginRight: 8 }}
                />
                <Text
                  text={t('Customize WRPC Connection')}
                  preset="regular-bold"
                  color={resolverChecked ? 'textDim' : 'text'}
                />
              </Row>

              <Row justifyBetween fullX style={{ gap: 8 }}>
                <Column fullX>
                  <Input
                    placeholder="wss://..."
                    value={customRpcUrl}
                    disabled={resolverChecked}
                    onChange={(e) => {
                      setCustomRpcUrl(e.target.value);
                    }}
                    onKeyUp={(e) => handleOnKeyUp(e)}
                    autoFocus={!resolverChecked}
                  />
                </Column>
                <Button
                  style={{
                    height: '44px',
                    minWidth: '70px'
                  }}
                  disabled={customRpcUrl?.length === 0 || resolverChecked}
                  text={t('Reset')}
                  preset="primary"
                  onClick={() => {
                    setCustomRpcUrl('');
                  }}
                />
              </Row>

              <Row
                justifyCenter
                itemsCenter
                fullX
                onClick={() => window.open('https://docs.kasware.xyz/wallet/knowledge-base/set-your-own-rpc')}
                style={{ cursor: 'pointer', marginTop: 4 }}
              >
                <Text preset="link" color="aqua" text={'Learn how to set your own RPC'} textCenter size="xxs" />
                <Icon icon="link" size={fontSizes.xxs} color="aqua" />
              </Row>
            </Column>
          </Card>

          {/* Resolver Option */}
          <Card
            style={{
              padding: '16px',
              border: !resolverChecked ? '1px solid rgba(255,255,255,0.08)' : `1px solid ${colors.aqua}`,
              backgroundColor: 'var(--r-neutral-card-1)'
            }}
            px="zero"
          >
            <Column gap="md" fullX>
              <Row itemsCenter fullX onClick={() => setResolverChecked(true)} style={{ cursor: 'pointer' }}>
                <Radio checked={resolverChecked} onChange={() => setResolverChecked(true)} style={{ marginRight: 8 }} />
                <Text
                  text={t('Automatic WRPC Connection')}
                  preset="regular-bold"
                  color={!resolverChecked ? 'textDim' : 'text'}
                />
              </Row>

              <Row justifyBetween fullX style={{ gap: 8 }}>
                <Column fullX>
                  <Input
                    placeholder="Custom Resolver URLs (Optional, comma separated)"
                    value={resolverUrls.length > 0 ? resolverUrls.join(',') : ''}
                    onChange={async (e) => {
                      if (e.target.value?.trim()?.length > 0) {
                        setResolverUrls(e.target.value.split(','));
                      } else {
                        setResolverUrls([]);
                      }
                    }}
                    disabled={!resolverChecked}
                    onKeyUp={(e) => handleOnKeyUp(e)}
                  />
                </Column>
                <Button
                  style={{
                    height: '44px',
                    minWidth: '70px'
                  }}
                  disabled={resolverUrls.length == 0 || !resolverChecked}
                  text={t('Reset')}
                  preset="primary"
                  onClick={async () => {
                    setResolverUrls([]);
                  }}
                />
              </Row>

              <Row
                justifyCenter
                itemsCenter
                fullX
                onClick={() => window.open('https://kaspa.aspectron.org/rpc/kaspa-resolver.html')}
                style={{ cursor: 'pointer', marginTop: 4 }}
              >
                <Text preset="link" color="aqua" text={'Learn more about Kaspa Resolver'} textCenter size="xxs" />
                <Icon icon="link" size={fontSizes.xxs} color="aqua" />
              </Row>
            </Column>
          </Card>
        </Column>

        <Row justifyCenter mt="lg">
          {loading && <LoadingSpinner size="medium" />}
        </Row>
      </Content>
      <Footer>
        <Button preset="primary" text={t('Confirm')} disabled={confirmDisabled} onClick={handleConfirm} />
      </Footer>
    </Layout>
  );
}
