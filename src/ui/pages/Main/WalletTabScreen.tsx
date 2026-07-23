import { KEYRING_TYPE } from '@/shared/constant';
import type { IP2shOutput, TTabKey } from '@/shared/types';
import { ActivityTabKey, AddressType, AssetTabKey, NetworkType, TxType } from '@/shared/types';
import { Card, Column, Content, Footer, Header, Icon, Layout, LoadingSpinner, Row, Text } from '@/ui/components';
import AccountSelect from '@/ui/components/AccountSelect';
import { AddressBar } from '@/ui/components/AddressBar';
import { Button, ButtonColumn } from '@/ui/components/Button';
import { ConnectionFailurePopover } from '@/ui/components/ConnectionFailurePopover';
import { Empty } from '@/ui/components/Empty';
import { NavTabBar } from '@/ui/components/NavTabBar';
import { NoticePopover } from '@/ui/components/NoticePopover';
import { UpgradePopover } from '@/ui/components/UpgradePopover';
import { useKrc20TokenSocialInfosQuery, useQueryConfigJSON } from '@/ui/hooks/kasware';
import { useDisplayName } from '@/ui/hooks/useDisplayName';
import { useFetchBalanceCallback, useFetchInscriptionsQuery } from '@/ui/state/accounts/hooks';
import {
  selectAccountBalance,
  selectAccountInscriptions,
  selectCurrentKaspaAddress
} from '@/ui/state/accounts/reducer';
import { selectRpcStatus } from '@/ui/state/global/reducer';
import { useAppDispatch, useAppSelector } from '@/ui/state/hooks';
import { useCurrentKeyring } from '@/ui/state/keyrings/hooks';
import { useEnableBridge, useSkipVersionCallback, useVersionInfo, useWalletConfig } from '@/ui/state/settings/hooks';
import { selectKasTick, selectNetworkId, selectNetworkType } from '@/ui/state/settings/reducer';
import { useFetchFeeRateOptionCallback, useResetUiTxCreateScreenCallback } from '@/ui/state/temp-ui/hooks';
import { useIncomingTx } from '@/ui/state/transactions/hooks';
import { useActivityTabKey, useAssetTabKey } from '@/ui/state/ui/hooks';
import { selectTabsStatus, uiActions } from '@/ui/state/ui/reducer';
import { fontSizes } from '@/ui/theme/font';
import { formatLocaleString, sleepSecond, useWallet } from '@/ui/utils';
import { useKrc20ActivitiesQuery } from '@/ui/utils/hooks/kasplex/fetchKrc20AddressTokenList';
import { useKaspaPrice } from '@/ui/utils/hooks/price/usePrice';
import { EllipsisOutlined, RightOutlined } from '@ant-design/icons';
import { Checkbox, Drawer, Segmented, Tabs, Tooltip } from 'antd';
import BigNumber from 'bignumber.js';
import log from 'loglevel';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { KRC20HistoryCardWithoutToken } from '../KRC20/components';
import { useNavigate } from '../MainRoute';

import { sompiToAmount } from '@/shared/utils/format';
import KASActivityTab from '@/ui/components/KASActivityTab';
import NFTTab from './WalletTabScreen/NFTTab';
import TokensTab from './WalletTabScreen/TokensTab';
import UTXOTab from './WalletTabScreen/UTXOTab';

interface ITabItem {
  key: AssetTabKey;
  label: string;
  children: React.JSX.Element;
}
export default function WalletTabScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const resetUiTxCreateScreen = useResetUiTxCreateScreenCallback();
  const accountBalance = useAppSelector((s) => selectAccountBalance(s, undefined));
  const networkId = useAppSelector(selectNetworkId);
  const fetchFeeRateOption = useFetchFeeRateOptionCallback();
  const currentKeyring = useCurrentKeyring();
  const wallet = useWallet();
  const kasTick = useAppSelector(selectKasTick);
  const isLegacyAddressType = useMemo(
    () => currentKeyring?.addressType === AddressType.KASPA_44_972,
    [currentKeyring.addressType]
  );
  const [tabDrawerVisible, setTabDrawerVisible] = useState(false);
  const rpcStatus = useAppSelector(selectRpcStatus);
  const [usdValue, setUSDValue] = useState(0);
  const [krc20TotalUsdValue, setKrc20TotalUsdValue] = useState(0);
  const dispatch = useAppDispatch();
  const assetTabKey = useAssetTabKey();
  const kasPrice = useKaspaPrice();

  const skipVersion = useSkipVersionCallback();

  const walletConfig = useWalletConfig();
  const enableBridge = useEnableBridge();
  const versionInfo = useVersionInfo();

  const [showSafeNotice, setShowSafeNotice] = useState(false);
  const [safeNoticeContent, setSafeNoticeContent] = useState<string | undefined>(undefined);
  const [retrieveAmt, setRetrieveAmt] = useState('');
  const [p2shOutputs, setP2shOutputs] = useState<IP2shOutput[]>([]);
  const incomingTx = useIncomingTx();
  const currentAddress = useAppSelector(selectCurrentKaspaAddress);
  const accountInscriptions = useAppSelector(selectAccountInscriptions);
  const [showConnectionFailurePopover, setShowConnectionFailurePopover] = useState(false);
  const onSearch = useCallback(async () => {
    try {
      let arr: string[] = [];
      const str3 = await wallet.getKRC20HistoryLocalStorage(networkId, currentAddress);
      arr = arr.concat(str3);
      const utxos: IP2shOutput[] = await wallet.findP2shUtxos(arr);
      setP2shOutputs(utxos);
      const value = utxos.reduce((agg, curr) => {
        return BigInt(curr.balance) + agg;
      }, BigInt(0));
      setRetrieveAmt(sompiToAmount(value, 8));
    } catch (e) {
      if (e instanceof Error) {
        console.error(e?.message);
      } else {
        console.error(JSON.stringify(e));
      }
    }
  }, [networkId, wallet, currentAddress]);
  const totalUsdValue = useMemo(() => {
    return (krc20TotalUsdValue || 0) + (usdValue || 0);
  }, [krc20TotalUsdValue, usdValue]);
  useEffect(() => {
    if (rpcStatus) return;
    const timer = setTimeout(() => {
      setShowConnectionFailurePopover(true);
    }, 30000);

    return () => {
      clearTimeout(timer);
    };
  }, [rpcStatus]);

  useEffect(() => {
    if (rpcStatus) {
      wallet.getBatchMintStatus().then((status) => {
        if (status == false) {
          onSearch();
        }
      });
    }
  }, [rpcStatus, networkId, currentAddress, onSearch, wallet]);
  useEffect(() => {
    if (incomingTx && p2shOutputs?.length > 0) {
      const commitAddresses = p2shOutputs.map((output) => output.commitAddress);
      if (!commitAddresses || commitAddresses.length == 0) return;
      wallet.getKASUtxos(commitAddresses).then((utxos) => {
        const newP2shOutputs = p2shOutputs.filter((output) =>
          utxos.some(
            (u) =>
              u.entry.outpoint.transactionId === output.transaction_id && u.entry.outpoint.index === output.utxo_index
          )
        );
        setP2shOutputs(newP2shOutputs);
        const value = newP2shOutputs.reduce((agg, curr) => {
          return BigInt(curr.balance) + agg;
        }, BigInt(0));
        setRetrieveAmt(sompiToAmount(value, 8));
      });
    }
  }, [incomingTx, p2shOutputs, wallet]);
  useEffect(() => {
    const intervalId = setInterval(() => {
      wallet.getRpcStatus().then(() => {
        // log.debug(e);
      });
    }, 1000 * 30);
    return () => {
      clearInterval(intervalId);
    };
  }, [wallet]);
  const { data: tokenIntro } = useKrc20TokenSocialInfosQuery();
  useEffect(() => {
    if (rpcStatus) fetchFeeRateOption();
  }, [networkId, rpcStatus, fetchFeeRateOption]);
  useEffect(() => {
    if (tokenIntro && Object.values(tokenIntro).length > 0) {
      dispatch(uiActions.updateKRC20TokenIntro({ krc20TokenIntro: tokenIntro }));
    }
  }, [dispatch, tokenIntro]);
  const fetchBalanceUtxos = useFetchBalanceCallback();
  useEffect(() => {
    if (rpcStatus)
      fetchBalanceUtxos()
        .finally(() => {
          // setLoadingUtxos(false);
        })
        .catch((e) => {
          log.debug(e.message);
        });
  }, [networkId, rpcStatus, fetchBalanceUtxos]);
  const configJSON = useQueryConfigJSON();
  useEffect(() => {
    const run = async () => {
      if (configJSON.data?.notice?.showsafenotice && configJSON.data.notice?.notice?.length > 0) {
        const content = await wallet.fetchNotice(configJSON.data);
        setSafeNoticeContent(content);
      }
      const show = await wallet.getShowSafeNotice();
      setShowSafeNotice(show);
    };
    run();
  }, [configJSON.data, wallet]);

  useEffect(() => {
    if (accountBalance.amount === '0') {
      setUSDValue(0);
    } else {
      const value = Number(accountBalance.amount) * kasPrice;
      setUSDValue(value);
    }
  }, [kasPrice, accountBalance.amount]);

  useFetchInscriptionsQuery();

  useEffect(() => {
    if (accountInscriptions?.list?.length > 0 && kasPrice) {
      const totalUsdValue =
        accountInscriptions.list?.reduce((acc, cur) => {
          //   .floorPrice;
          if (cur.priceInKas && cur.priceInKas > 0 && kasPrice) {
            const amt = sompiToAmount(BigInt(cur.balance) || 0, cur.dec);
            const value = new BigNumber(amt).multipliedBy(cur.priceInKas).multipliedBy(kasPrice).toNumber();
            return acc + value;
          }
          return acc;
        }, 0) || 0;
      setKrc20TotalUsdValue(totalUsdValue);
    }
  }, [accountInscriptions?.list, kasPrice]);

  const tabItems = useMemo(
    () => [
      {
        key: AssetTabKey.TOKENS,
        label: 'Tokens',
        children: <TokensTab />
      },
      {
        key: AssetTabKey.NFT,
        label: 'NFTs',
        children: <NFTTab />
      },
      {
        key: AssetTabKey.ACTIVITIES,
        label: t('Activity'),
        children: <ActivityTab />
      },
      {
        key: AssetTabKey.UTXO,
        label: 'UTXO',
        children: <UTXOTab />
      }
    ],
    [t]
  );

  const [displayedTabItems, setDisplayedTabItems] = useState<ITabItem[]>(tabItems);
  const tabsStatus = useAppSelector(selectTabsStatus);

  useEffect(() => {
    const newTabItems = tabItems.filter((item) => tabsStatus[item.key]);
    setDisplayedTabItems(newTabItems);
  }, [tabsStatus, tabItems]);

  const onChangeStatus = (tab: TTabKey, status: boolean) => {
    dispatch(uiActions.setTabsStatus({ tabKey: tab, status }));
  };
  const currentKeyringDisplayName = useDisplayName(currentKeyring.alianName);

  return (
    <Layout>
      <Header>
        <Card
          classname="card-select"
          preset="style2"
          onClick={() => {
            navigate('SwitchKeyringScreen');
          }}>
          <Text text={currentKeyringDisplayName} size="xxs" style={{ padding: '3px 1px' }} textCenter />
        </Card>
      </Header>
      <Content>
        <Column gap="md">
          {currentKeyring.type === KEYRING_TYPE.HdKeyring && <AccountSelect />}
          <AddressBar />
          {isLegacyAddressType == true && (
            <Text
              text={
                'Your address is a legacy type. It will be deprecated by kaspa ecosystem soon. Please create a new wallet on kasware and transfer your KAS and KRC20 token to it.'
              }
              color="warning"
              textCenter
              selectText
            />
          )}
          {walletConfig.statusMessage && <Text text={walletConfig.statusMessage} color="danger" textCenter />}

          <Tooltip
            placement={'bottom'}
            overlayStyle={{
              fontSize: fontSizes.xs
            }}>
            <div>
              {/* <Text
                text={formatLocaleString(balanceValue) + ' ' + kasTick}
                preset="title-bold"
                textCenter
                size="xxl"
                selectText
              /> */}
              {(usdValue !== undefined || krc20TotalUsdValue !== undefined) && totalUsdValue > 0 && (
                <Text
                  text={'$' + totalUsdValue.toLocaleString('en-US')}
                  preset="title-bold"
                  textCenter
                  size="xxl"
                  // color="textDim"
                  selectText
                />
              )}
            </div>
          </Tooltip>

          <Row justifyBetween>
            <ButtonColumn
              text={t('Receive')}
              preset="default"
              icon="receive"
              onClick={() => {
                navigate('ReceiveScreen', { type: TxType.SEND_KASPA });
              }}
              full
            />
            <ButtonColumn
              text={t('Send')}
              preset="default"
              icon="send"
              onClick={() => {
                resetUiTxCreateScreen();
                navigate('TxCreateScreen');
              }}
              full
            />
          </Row>

          {retrieveAmt && Number(retrieveAmt) > 0 && (
            <Card
              py="xs"
              mt="xxs"
              mb="zero"
              classname="card-select"
              full
              justifyBetween
              onClick={() => {
                navigate('RetrieveP2SHUTXOScreen', { outputs: p2shOutputs });
              }}
              style={{
                minHeight: 30
              }}>
              <Row justifyBetween full itemsCenter py="xxs">
                <Text text={`Retrieve ${formatLocaleString(retrieveAmt)} ${kasTick}`} preset="sub" color="orange" />
                <RightOutlined color="orange" />
              </Row>
            </Card>
          )}

          <Tabs
            tabBarExtraContent={
              <Column relative classname="column-select">
                <Icon
                  onClick={() => {
                    setTabDrawerVisible(true);
                  }}>
                  <EllipsisOutlined />
                </Icon>
              </Column>
            }
            size={'small'}
            defaultActiveKey="0"
            activeKey={assetTabKey as unknown as string}
            items={displayedTabItems}
            onTabClick={(key) => {
              dispatch(uiActions.updateAssetTabScreen({ assetTabKey: key as unknown as AssetTabKey }));
            }}
          />
        </Column>
        {showSafeNotice && safeNoticeContent && (
          <NoticePopover
            content={safeNoticeContent}
            onClose={() => {
              wallet.setShowSafeNotice(false);
              setShowSafeNotice(false);
            }}
          />
        )}
        {!versionInfo.skipped && versionInfo.shouldPopVersion && (
          <UpgradePopover
            onClose={() => {
              skipVersion(versionInfo.newVersion);
            }}
          />
        )}
        {showConnectionFailurePopover == true && rpcStatus == false && (
          <ConnectionFailurePopover
            onClose={() => setShowConnectionFailurePopover(false)}
            onTryAgain={async () => {
              setShowConnectionFailurePopover(false);
              await sleepSecond(0.2);
              wallet.disconnectRpc().then(() => {
                wallet.handleRpcConnect();
              });
            }}
          />
        )}
      </Content>
      <Drawer
        placement={'bottom'}
        closable={false}
        onClose={() => setTabDrawerVisible(false)}
        open={tabDrawerVisible}
        key={'tab-drawer'}>
        <Column mt="lg">
          <Text text={t('Tab Option')} color="textDim" preset="sub" />
          <Card fullX justifyBetween classname="cursor-not-allowed">
            <Row itemsCenter>
              <Checkbox disabled checked={tabsStatus['TOKENS']} className="select-checkbox-wrapper" />
              <Text text={`${t('Tokens')}`} />
            </Row>
          </Card>
          <Card
            fullX
            justifyBetween
            classname="card-select"
            onClick={() => {
              onChangeStatus('NFT', !tabsStatus.NFT);
            }}>
            <Row itemsCenter>
              <Checkbox checked={tabsStatus.NFT} className="select-checkbox-wrapper" />
              <Text text={'NFTs'} />
            </Row>
          </Card>
          <Card
            fullX
            justifyBetween
            classname="card-select"
            onClick={() => {
              onChangeStatus('ACTIVITIES', !tabsStatus['ACTIVITIES']);
            }}>
            <Row itemsCenter>
              <Checkbox checked={tabsStatus['ACTIVITIES']} className="select-checkbox-wrapper" />
              <Text text={`Activity`} />
            </Row>
          </Card>
          <Card
            fullX
            justifyBetween
            classname="card-select"
            onClick={() => {
              onChangeStatus('UTXO', !tabsStatus['UTXO']);
            }}>
            <Row itemsCenter>
              <Checkbox checked={tabsStatus['UTXO']} className="select-checkbox-wrapper" />
              <Text text={`UTXO`} />
            </Row>
          </Card>

          <Button preset="primary" text={t('Close')} onClick={() => setTabDrawerVisible(false)}></Button>
        </Column>
      </Drawer>
      <Footer px="zero" py="zero">
        <NavTabBar tab="home" />
      </Footer>
    </Layout>
  );
}

function ActivityTab() {
  const dispatch = useAppDispatch();
  const activityTabKey = useActivityTabKey();
  const currentNetworkType = useAppSelector(selectNetworkType);
  if (currentNetworkType !== NetworkType.Mainnet && currentNetworkType !== NetworkType.Testnet) {
    return (
      <Row justifyCenter>
        <Text text="Not Supported." mt="md" />
      </Row>
    );
  }

  return (
    <>
      <Row justifyEnd>
        <Segmented
          size="middle"
          defaultValue={activityTabKey}
          onChange={(value) => {
            dispatch(uiActions.updateActivityTab({ activityTabKey: value as ActivityTabKey }));
          }}
          options={[ActivityTabKey.KAS, ActivityTabKey.KRC20]}
          style={{ fontSize: '1rem' }}
        />
      </Row>
      {activityTabKey === ActivityTabKey.KAS && <KASActivityTab />}
      {activityTabKey === ActivityTabKey.KRC20 && <KRC20Histories />}
    </>
  );
}

function KRC20Histories() {
  const networkId = useAppSelector(selectNetworkId);
  const address = useAppSelector(selectCurrentKaspaAddress);
  const { t } = useTranslation();
  const { activities, isLoading, isError, error } = useKrc20ActivitiesQuery(networkId, address);
  if (activities && activities.length > 0) {
    return (
      <div>
        {activities.map((e, index) => (
          <KRC20HistoryCardWithoutToken history={e} key={e?.txAccept ? e?.hashRev + index : index} />
        ))}
        {networkId == 'mainnet' && (
          <Card
            key={'more-tx'}
            classname="card-select"
            mt="sm"
            onClick={() => {
              window.open(`https://kaspa.stream/addresses/addresses/${address}?view=token_transfer`);
            }}>
            <Row full justifyCenter itemsCenter>
              <Text preset="link" text={t('More')} size="md" />
              <Icon icon="link" size={fontSizes.xs} color="blue" />
            </Row>
          </Card>
        )}
      </div>
    );
  } else if (isLoading) {
    return (
      <Row justifyCenter mt="sm">
        <LoadingSpinner size="medium" />
      </Row>
    );
  } else if (isError) {
    return (
      <Column justifyCenter>
        <Text text={error?.message} textCenter preset="sub" color="error" selectText />
      </Column>
    );
  } else {
    return <Empty />;
  }
}
