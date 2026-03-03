import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { getCurrentConnectSite as getCurrentConnectSiteEVM } from '@/evm/ui/utils';
import { ADDRESS_TYPES, DISCORD_URL, GITHUB_URL, KEYRING_TYPE, TELEGRAM_URL, TWITTER_URL } from '@/shared/constant';
import { NetworkType } from '@/shared/types';
import { Card, Column, Content, Footer, Header, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { Button } from '@/ui/components/Button';
import { Icon } from '@/ui/components/Icon';
import { NavTabBar } from '@/ui/components/NavTabBar';
import { getCurrentTab, useExtensionIsInTab, useOpenExtensionInTab } from '@/ui/features/browser/tabs';
import { useCurrentAccount } from '@/ui/state/accounts/hooks';
import { useAppSelector } from '@/ui/state/hooks';
import { useCurrentKeyring } from '@/ui/state/keyrings/hooks';
import { useVersionInfo } from '@/ui/state/settings/hooks';
import { selectNetworkId, selectNetworkType } from '@/ui/state/settings/reducer';
import { fontSizes } from '@/ui/theme/font';
import { useWallet } from '@/ui/utils';
import { ExpandAltOutlined, RightOutlined } from '@ant-design/icons';
import { PATH_UNLOCK_SCREEN } from '@/shared/constant/route-path';

interface Setting {
  label?: string;
  value?: string;
  desc?: string;
  danger?: boolean;
  action: string;
  route: string;
  right: boolean;
}

export default function SettingsTabScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const networkType = useAppSelector(selectNetworkType);
  const networkId = useAppSelector(selectNetworkId);

  const isInTab = useExtensionIsInTab();

  const [connected, setConnected] = useState(false);
  const [contactCount, setContactCount] = useState(0);

  const currentKeyring = useCurrentKeyring();
  const currentAccount = useCurrentAccount();
  const versionInfo = useVersionInfo();
  const wallet = useWallet();
  useEffect(() => {
    const run = async () => {
      const res = await getCurrentTab();
      if (!res) return;
      const siteEVM = await getCurrentConnectSiteEVM(wallet);
      const site = await wallet.getCurrentConnectedSite(res.id as number);
      if (siteEVM && siteEVM.isConnected == true) {
        setConnected(siteEVM.isConnected);
      } else if (site && site.isConnected == true) {
        setConnected(site.isConnected);
      }
      const listContacts = await wallet.listContact();
      if (listContacts && listContacts.length > 0) {
        setContactCount(listContacts.length);
      }
    };
    run();
  }, [wallet]);

  const isCustomHdPath = useMemo(() => {
    const item = ADDRESS_TYPES[currentKeyring.addressType];
    return currentKeyring.hdPath !== '' && item.hdPath !== currentKeyring.hdPath;
  }, [currentKeyring]);
  const SettingList: Setting[] = [
    // {
    //   label: 'Manage Wallet',
    //   value: '',
    //   desc: '',
    //   action: 'manage-wallet',
    //   route: '/settings/manage-wallet',
    //   right: true
    // },
    // {
    //   label: 'Address Type',
    //   value: 'Taproot',
    //   desc: '',
    //   action: 'addressType',
    //   route: '/settings/address-type',
    //   right: true
    // },
    {
      label: 'Expand View',
      value: '',
      desc: t('Expand View'),
      action: 'expand-view',
      route: '/main',
      right: true
    },
    {
      label: t('My Contacts'),
      value: '',
      desc: '',
      action: 'contact-book',
      route: '/contact-book',
      right: true
    },
    {
      label: t('Connected Sites'),
      value: '',
      desc: '',
      action: 'connected-sites',
      route: '/connected-sites',
      right: true
    },
    {
      label: t('Add-ons'),
      value: '',
      desc: '',
      action: 'apps-option',
      route: '/settings/apps-option',
      right: true
    },
    {
      label: t('KASPA Network'),
      value: 'MAINNET',
      desc: '',
      action: 'networkType',
      route: '/settings/network-type',
      right: true
    },
    {
      label: t('EVM Network'),
      value: '',
      desc: '',
      action: 'evmNetworkType',
      route: '/custom-testnet',
      right: true
    },
    {
      label: '',
      value: '',
      desc: t('Lock Now'),
      action: 'lock-wallet',
      route: '',
      right: false
    },
    {
      label: t('More Options'),
      value: '',
      desc: '',
      action: 'more-options',
      route: '/settings/more-options',
      right: true
    }
  ];
  const toRenderSettings = SettingList.filter((v) => {
    if (v.action == 'contact-book') {
      v.value =
        contactCount == 0
          ? t('no contacts yet')
          : contactCount == 1
          ? `${contactCount} contact`
          : `${contactCount} contacts`;
    }
    if (v.action == 'manage-wallet') {
      v.value = currentKeyring.alianName;
    }

    if (v.action == 'connected-sites') {
      v.value = connected ? t('Connected') : t('Not connected');
    }

    if (v.action == 'networkType') {
      switch (networkType) {
        case NetworkType.Mainnet:
          v.value = t('Mainnet');
          break;
        case NetworkType.Testnet:
          if (!networkId || networkId == 'testnet-10') v.value = t('Testnet 10');
          if (networkId == 'testnet-11') v.value = t('Testnet 11');
          if (networkId == 'testnet-12') v.value = t('Testnet 12');
          break;
        case NetworkType.Devnet:
          v.value = t('Devnet');
          break;
        case NetworkType.Simnet:
          v.value = t('Simnet');
          break;
        default:
          v.value = t('Unknown Network Type');
      }
    }

    if (v.action == 'addressType') {
      const item = ADDRESS_TYPES[currentKeyring.addressType];
      const hdPath = currentKeyring.hdPath || item.hdPath;
      if (currentKeyring.type === KEYRING_TYPE.SimpleKeyring) {
        v.value = `${item.name}`;
      } else {
        v.value = `${item.name} (${hdPath}/${currentAccount.index})`;
      }
    }

    if (v.action == 'expand-view') {
      if (isInTab) {
        return false;
      }
    }

    return true;
  });

  const tools = useTools();
  const openExtensionInTab = useOpenExtensionInTab();

  return (
    <Layout>
      <Header title={'Settings'} />
      <Content>
        <Column>
          <div>
            {toRenderSettings.map((item) => {
              if (!item.label) {
                return (
                  <Row key={item.action} mb="xs">
                    <Button
                      full
                      style={{ height: 50 }}
                      text={item.desc}
                      RightAccessory={
                        item.action == 'expand-view' ? <ExpandAltOutlined style={{ color: '#AAA' }} /> : undefined
                      }
                      onClick={() => {
                        if (item.action == 'expand-view') {
                          openExtensionInTab();
                          return;
                        }
                        if (item.action == 'lock-wallet') {
                          wallet.lockWallet();
                          navigate(PATH_UNLOCK_SCREEN);
                          return;
                        }
                        navigate(item.route);
                      }}
                    />
                  </Row>
                );
              }
              return (
                <Card
                  classname="card-select"
                  key={item.action}
                  mb="xs"
                  onClick={() => {
                    if (item.action == 'addressType') {
                      if (isCustomHdPath) {
                        tools.showTip(
                          'The wallet currently uses a custom HD path and does not support switching address types.'
                        );
                        return;
                      }
                      navigate('/settings/address-type');
                      return;
                    }
                    if (item.action == 'expand-view') {
                      openExtensionInTab();
                      return;
                    }
                    navigate(item.route);
                  }}
                >
                  <Row full justifyBetween>
                    <Column justifyCenter gap="sm">
                      <Text text={item.label || item.desc} preset="regular-bold" />
                      {item.value != undefined && item.value?.length > 0 && <Text text={item.value} preset="sub" />}
                    </Column>

                    <Column justifyCenter>
                      {item.right && item.action !== 'expand-view' && (
                        <RightOutlined style={{ transform: 'scale(1.2)', color: '#AAA' }} />
                      )}
                      {item.right && item.action == 'expand-view' && (
                        <ExpandAltOutlined style={{ transform: 'scale(1.2)', color: '#AAA' }} />
                      )}
                    </Column>
                  </Row>
                </Card>
              );
            })}
          </div>
          <Row justifyCenter gap="xl" mt="lg">
            <Icon
              icon="discord"
              size={fontSizes.iconMiddle}
              color="textDim"
              onClick={() => {
                window.open(DISCORD_URL);
              }}
            />
            <Icon
              icon="telegram"
              size={fontSizes.iconMiddle}
              color="textDim"
              onClick={() => {
                window.open(TELEGRAM_URL);
              }}
            />

            <Icon
              icon="twitter"
              size={fontSizes.iconMiddle}
              color="textDim"
              onClick={() => {
                window.open(TWITTER_URL);
              }}
            />

            <Icon
              icon="github"
              size={fontSizes.iconMiddle}
              color="textDim"
              onClick={() => {
                window.open(GITHUB_URL);
              }}
            />
          </Row>
          <Text text={`KasWare: ${versionInfo.currentVesion}`} preset="sub" textCenter />
          {versionInfo.latestVersion && (
            <Text
              text={`Latest Version: ${versionInfo.latestVersion}`}
              preset="link"
              color="red"
              textCenter
              onClick={() => {
                window.open('https://docs.kasware.xyz/wallet/knowledge-base/update-your-wallet');
              }}
            />
          )}
        </Column>
      </Content>
      <Footer px="zero" py="zero">
        <NavTabBar tab="settings" />
      </Footer>
    </Layout>
  );
}
