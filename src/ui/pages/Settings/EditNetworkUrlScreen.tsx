import { Checkbox } from 'antd';
import log from 'loglevel';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { NETWORK_TYPES } from '@/shared/constant';
import type { INetworkType, TNetworkId } from '@/shared/types';
import { Button, Column, Content, Footer, Header, Icon, Input, Layout, Row, Text } from '@/ui/components';
import { useAppSelector } from '@/ui/state/hooks';
import { useChangeRpcLinksCallback, useRpcLinks } from '@/ui/state/settings/hooks';
import { selectNetworkType } from '@/ui/state/settings/reducer';
import { colors } from '@/ui/theme/colors';
import { fontSizes } from '@/ui/theme/font';
import { sleepSecond, useWallet } from '@/ui/utils';
import { LoadingOutlined } from '@ant-design/icons';
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
      //config resolver
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
      //config custom rpc
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
      // await wallet.setNetworkType(currentNetworkType, networkId);
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
          <Row>
            <Checkbox
              onChange={() => setResolverChecked(false)}
              checked={!resolverChecked}
              style={{ fontSize: fontSizes.md }}
            >
              <Text text={`${t('Customize WRPC Connection')}`} preset="sub" color="textDim" selectText />
            </Checkbox>
          </Row>
          {/* {resolverChecked == false && ( */}
          {/* <> */}
          <Row justifyBetween style={{ gap: 4 }}>
            <Column fullX>
              <Input
                placeholder={customRpcUrl ? customRpcUrl : 'Custom WRPC URL'}
                value={customRpcUrl}
                disabled={resolverChecked}
                onChange={(e) => {
                  setCustomRpcUrl(e.target.value);
                }}
                onKeyUp={(e) => handleOnKeyUp(e)}
                autoFocus={true}
              />
            </Column>
            <Button
              style={{
                height: '45px'
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
            onClick={() => window.open('https://docs.kasware.xyz/wallet/knowledge-base/set-your-own-rpc')}
          >
            <Text preset="link" color="textDim" text={'Learn how to set your own RPC'} textCenter size="xxs" />
            <Icon icon="link" size={fontSizes.xxs} color="textDim" />
          </Row>
          {/* </>
          )} */}
        </Column>
        <Column mt="md">
          <Row>
            <Checkbox
              onChange={() => setResolverChecked(true)}
              checked={resolverChecked}
              style={{ fontSize: fontSizes.md }}
            >
              <Text text={`${t('Automatic WRPC Connection by Resolver')}`} preset="sub" color="textDim" />
            </Checkbox>
          </Row>
          {/* {resolverChecked == true && (
            <> */}
          <Row justifyBetween style={{ gap: 4 }}>
            <Column fullX>
              <Input
                placeholder={
                  resolverUrls.length > 0 ? resolverUrls.join(',') : 'Custom Resolver URLs (Optional, comma separated)'
                }
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
                autoFocus={true}
              />
            </Column>
            <Button
              style={{
                height: '45px'
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
            onClick={() => window.open('https://kaspa.aspectron.org/rpc/kaspa-resolver.html')}
          >
            <Text preset="link" color="textDim" text={'Learn more about Kaspa Resolver'} textCenter size="xxs" />
            <Icon icon="link" size={fontSizes.xxs} color="textDim" />
          </Row>
          {/* </>
          )} */}
        </Column>
        <Row justifyCenter>
          {loading && (
            <Icon>
              <LoadingOutlined
                style={{
                  fontSize: fontSizes.icon,
                  color: colors.grey
                }}
              />
            </Icon>
          )}{' '}
        </Row>
      </Content>
      <Footer>
        <Button preset="primary" text={t('Confirm')} disabled={confirmDisabled} onClick={handleConfirm}></Button>
      </Footer>
    </Layout>
  );
}
