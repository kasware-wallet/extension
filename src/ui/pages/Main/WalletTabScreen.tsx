import { Avatar, Checkbox, Drawer, Segmented, Tabs, Tooltip } from 'antd';
import BigNumber from 'bignumber.js';
import log from 'loglevel';
import type { CSSProperties } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ConnectedSite } from '@/shared/types/permission';
import { getCurrentConnectSite as getCurrentConnectSiteEVM } from '@/evm/ui/utils';
import { AssetListComponent } from '@/evm/ui/views/CommonPopup/AssetList/AssetListComponent';
import PendingApproval from '@/evm/ui/views/Dashboard/components/PendingApproval';
import { NFTView } from '@/evm/ui/views/NFTView';
import { KEYRING_TYPE } from '@/shared/constant';
import eventBus from '@/shared/eventBus';
import type { Inscription, IP2shOutput, ITxInfo, TKRC20History, TTabKey, TTokenType } from '@/shared/types';
import { ActivityTabKey, AddressType, AssetTabKey, NetworkType, NftTabKey, TokensTabKey, TxType } from '@/shared/types';
import { Card, Column, Content, Footer, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { ProfileImage } from '@/ui/components/CryptoImage';
import AccountSelect from '@/ui/components/AccountSelect';
import { useTools } from '@/ui/components/ActionComponent';
import { AddressBar } from '@/ui/components/AddressBar';
import { Button, ButtonColumn } from '@/ui/components/Button';
import { ConnectionFailurePopover } from '@/ui/components/ConnectionFailurePopover';
import { Empty } from '@/ui/components/Empty';
import { NavTabBar } from '@/ui/components/NavTabBar';
import { NoticePopover } from '@/ui/components/NoticePopover';
import { UpgradePopover } from '@/ui/components/UpgradePopover';
import SearchBar from '@/ui/components/search/SearchBar';
import { getCurrentTab } from '@/ui/features/browser/tabs';
import { useDisplayName } from '@/ui/hooks/useDisplayName';
import { useKrc20TokenSocialInfosQuery, useQueryConfigJSON } from '@/ui/hooks/kasware';
import { useBlueScore, useFetchBalanceCallback, useFetchInscriptionsQuery } from '@/ui/state/accounts/hooks';
import {
  selectAccountBalance,
  selectAccountInscriptions,
  selectCurrentAccount,
  selectCurrentKaspaAddress
} from '@/ui/state/accounts/reducer';
import { selectRpcStatus } from '@/ui/state/global/reducer';
import { historyActions } from '@/ui/state/history/reducer';
import { useAppDispatch, useAppSelector } from '@/ui/state/hooks';
import { useCurrentKeyring } from '@/ui/state/keyrings/hooks';
import { checkIfFirstLoginAsync } from '@/ui/state/models/appVersion';
import {
  useDexSupportChains,
  useEnableBridge,
  useEnableKRC20Swap,
  useSkipVersionCallback,
  useVersionInfo,
  useWalletConfig
} from '@/ui/state/settings/hooks';
import { selectBlockstreamUrl, selectKasTick, selectNetworkId, selectNetworkType } from '@/ui/state/settings/reducer';
import { useFetchTxActivitiesCallback, useFetchUtxosCallback, useIncomingTx } from '@/ui/state/transactions/hooks';
import { selectTxActivities, selectUtxos, transactionsActions } from '@/ui/state/transactions/reducer';
import {
  useActivityTabKey,
  useAssetTabKey,
  useFetchFeeRateOptionCallback,
  useKRC20History,
  useKRC20TokenIntro,
  useNftTabKey,
  useResetUiTxCreateScreen
} from '@/ui/state/ui/hooks';
import { selectTabsStatus, selectTokensTabKey, uiActions } from '@/ui/state/ui/reducer';
import { fontSizes } from '@/ui/theme/font';
import { formatLocaleString, getUsdValueStr, shortAddress, sleepSecond, useWallet } from '@/ui/utils';
import { useKrc20ActivitiesQuery, useKrc20DecName } from '@/ui/utils/hooks/kasplex/fetchKrc20AddressTokenList';
import { useKaspaPrice } from '@/ui/utils/hooks/price/usePrice';
import { EllipsisOutlined, LoadingOutlined, RightOutlined } from '@ant-design/icons';

import igraIcon from '@/assets/igra.png';
import kasplexIcon from '@/assets/icons/kasplex.ico';
import kaspaIcon from '@/assets/icons/kaspa.svg';

import { KRC20HistoryCardWithoutToken } from '../KRC20/KRC20TokenScreen';
import { useNavigate } from '../MainRoute';
import { DappConnectionItem } from './WalletTabScreen/DappConnection';
import { KNSTab } from './WalletTabScreen/KNSTab';
import { KsprNftTab } from './WalletTabScreen/KsprNftTab';
import { IGRA_HEX, KASPLEX_HEX } from '@/ui/utils/payload';
import { EVMActivityTab } from './WalletTabScreen/EVMActivityTab';
import { amountToSompi, sompiToAmount } from '@/shared/utils/format';

const $noBreakStyle: CSSProperties = {
  whiteSpace: 'nowrap',
  wordBreak: 'keep-all'
};
interface ITabItem {
  key: AssetTabKey;
  label: string;
  children: React.JSX.Element;
}
export default function WalletTabScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const resetUiTxCreateScreen = useResetUiTxCreateScreen();
  const accountBalance = useAppSelector((s) => selectAccountBalance(s, undefined));
  // const isTestNetwork = networkType === NetworkType.Testnet;
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
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
  useEffect(() => {
    (async () => {
      const pendingCount = await wallet.walletEVM?.getPendingApprovalCount();
      setPendingApprovalCount(pendingCount || 0);
    })();
  }, [wallet.walletEVM]);
  // const balanceValue = useMemo(() => {
  //   // if (accountBalance.amount === '0' && transactionInfos.length === 0) {
  //   //   return '--';
  //   // } else {
  //   return accountBalance.amount;
  //   // }
  // }, [accountBalance.amount]);
  // const rpcStatus = useRpcStatus();
  const rpcStatus = useAppSelector(selectRpcStatus);
  const [usdValue, setUSDValue] = useState(0);
  const [krc20TotalUsdValue, setKrc20TotalUsdValue] = useState(0);
  // const prevRpcStatus = useRef(true);
  const dispatch = useAppDispatch();
  const assetTabKey = useAssetTabKey();
  const kasPrice = useKaspaPrice();

  const skipVersion = useSkipVersionCallback();

  const walletConfig = useWalletConfig();
  const enableKRC20Swap = useEnableKRC20Swap();
  const enableBridge = useEnableBridge();
  const dexSupportChains = useDexSupportChains();
  const versionInfo = useVersionInfo();

  const [showSafeNotice, setShowSafeNotice] = useState(false);
  const [safeNoticeContent, setSafeNoticeContent] = useState<string | undefined>(undefined);
  const [retrieveAmt, setRetrieveAmt] = useState('');
  const [p2shOutputs, setP2shOutputs] = useState<IP2shOutput[]>([]);
  const krc20History = useKRC20History();
  const incomingTx = useIncomingTx();
  const currentAddress = useAppSelector(selectCurrentKaspaAddress);
  const accountInscriptions = useAppSelector(selectAccountInscriptions);
  const [showConnectionFailurePopover, setShowConnectionFailurePopover] = useState(false);
  const onSearch = useCallback(async () => {
    try {
      let arr = [
        krc20History[networkId]?.mintArr,
        krc20History[networkId]?.deployArr,
        krc20History[networkId]?.transferArr
      ].flatMap((arr2) => arr2 || []);
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
  }, [networkId, wallet, currentAddress, krc20History]);
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
    log.debug('WalletTabScreen');
    dispatch(checkIfFirstLoginAsync());
  }, [dispatch]);
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
        children: <UTXOTab rpcStatus={rpcStatus} />
      }
    ],
    [t, rpcStatus]
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
      <Header LeftComponent={<DappConnection />}>
        <Card
          classname="card-select"
          preset="style2"
          onClick={() => {
            navigate('SwitchKeyringScreen');
          }}
        >
          <Text text={currentKeyringDisplayName} size="xxs" style={{ padding: '3px 1px' }} textCenter />
        </Card>
      </Header>
      <Content>
        <Column gap="md">
          {currentKeyring.type === KEYRING_TYPE.HdKeyring && <AccountSelect />}
          {/* <Row itemsCenter justifyCenter mt='sm'> */}
          <AddressBar />
          {/* <Row
              style={{ marginLeft: 8 }}
              itemsCenter
              onClick={() => {
                window.open(`${blockstreamUrl}/addresses/${currentAccount.address}`);
              }}>
              <Text text={'View History'} size="xs" />
              <Icon icon="link" size={fontSizes.xs} />
            </Row>
          </Row> */}

          {/* {isTestNetwork && <Text text={`${networkId} activated.`} color="warning" textCenter selectText />} */}
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
            // title={
            //   <>
            //     <Row justifyBetween>
            //       <span style={$noBreakStyle}>{'Balance'}</span>
            //       <span style={$noBreakStyle}>{`$${totalUsdValue.toLocaleString('en-US')}`}</span>
            //     </Row>
            //     {/*    <Row justifyBetween>
            //       <span style={$noBreakStyle}>{'Confirmed KAS'}</span>
            //       <span style={$noBreakStyle}>{` ${accountBalance.confirm_kas_amount} KAS`}</span>
            //     </Row>
            //     <Row justifyBetween>
            //       <span style={$noBreakStyle}>{'Unconfirmed KAS'}</span>
            //       <span style={$noBreakStyle}>{` ${accountBalance.pending_kas_amount} KAS`}</span>
            //     </Row> */}
            //   </>
            // }
            overlayStyle={{
              fontSize: fontSizes.xs
            }}
          >
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
            {/* <Row justifyBetween style={{ height: '1.375rem' }}>
              <Row justifyCenter fullX>
                <Text
                  text={pendingValue && Number(pendingValue) > 0 ? '+' + pendingValue + '  KAS' : ' '}
                  preset="regular"
                  textCenter
                  size="sm"
                  color="green"
                />
              </Row>
              <Row justifyCenter fullX>
                <Text
                  text={outgoingValue && Number(outgoingValue) > 0 ? '-' + outgoingValue + '  KAS' : ' '}
                  preset="regular"
                  textCenter
                  size="sm"
                  color="red"
                />
              </Row>
            </Row> */}
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
            {/* <Button
              text={t('Send evm')}
              preset="default"
              LeftAccessory={<FontAwesomeIcon icon={faArrowUpFromBracket} />}
              onClick={() => {
                resetUiTxCreateScreen();
                // navigateOrigin(SEND_ROUTE);
                // navigate('TxCreateScreen');
              }}
              full
            /> */}
            {/* <Button
              text={t('evm home')}
              preset="default"
              LeftAccessory={<FontAwesomeIcon icon={faArrowUpFromBracket} />}
              onClick={() => {
                navigate('Dashboard');
              }}
              full
            /> */}
            {dexSupportChains?.length > 0 && (
              <ButtonColumn
                text={t('Swap')}
                preset="default"
                icon="swap"
                onClick={() => {
                  historyActions.updateMostRecentOverviewPage('/main');
                  navigate('EvmSwap');
                }}
                full
              />
            )}
            {enableBridge && (
              <ButtonColumn
                text={t('Bridge')}
                preset="default"
                icon="bridge"
                onClick={() => {
                  historyActions.updateMostRecentOverviewPage('/main');
                  navigate('BridgeScreen');
                }}
                full
              />
            )}
            {enableKRC20Swap == true && (
              <ButtonColumn
                text={t('Krc20-Swap')}
                preset="default"
                icon="swap"
                onClick={() => {
                  historyActions.updateMostRecentOverviewPage('/main');
                  navigate('KRC20SwapScreen');
                }}
                full
              />
            )}
            {/* {walletConfig.moonPayEnabled && (
              <Button
                text="Buy"
                preset="default"
                icon="kas"
                onClick={() => {
                  navigate('FiatPayScreen');
                }}
                full
              />
            )} */}
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
              }}
            >
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
                  }}
                >
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
        key={'tab-drawer'}
      >
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
            }}
          >
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
            }}
          >
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
            }}
          >
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
      {pendingApprovalCount > 0 && (
        <PendingApproval
          onRejectAll={() => {
            setPendingApprovalCount(0);
          }}
          count={pendingApprovalCount}
        />
      )}
    </Layout>
  );
}
function NFTTab() {
  const dispatch = useAppDispatch();
  const nftTabKey = useNftTabKey();
  // const networkId = useAppSelector(selectNetworkId);
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
          defaultValue={nftTabKey}
          onChange={(value) => {
            dispatch(uiActions.updateNftTab({ nftTabKey: value as NftTabKey }));
          }}
          options={
            // networkId == NETWORK_ID.testnet10
            // ? [NftTabKey.KNS, NftTabKey.KSPR, NftTabKey.EVM]
            // : [NftTabKey.KNS, NftTabKey.KSPR]
            [NftTabKey.KNS, NftTabKey.KSPR, NftTabKey.EVM]
          }
          style={{ fontSize: '1rem' }}
        />
      </Row>
      {nftTabKey === NftTabKey.KNS && <KNSTab />}
      {nftTabKey === NftTabKey.KSPR && <KsprNftTab />}
      {/* {nftTabKey === NftTabKey.EVM && networkId == NETWORK_ID.testnet10 && <NFTView />} */}
      {nftTabKey === NftTabKey.EVM && <NFTView />}
    </>
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
          options={
            // networkId === NETWORK_ID.testnet10
            // ? [ActivityTabKey.KAS, ActivityTabKey.KRC20, ActivityTabKey.EVM]
            // : [ActivityTabKey.KAS, ActivityTabKey.KRC20]
            [ActivityTabKey.KAS, ActivityTabKey.KRC20, ActivityTabKey.EVM]
          }
          style={{ fontSize: '1rem' }}
        />
      </Row>
      {activityTabKey === ActivityTabKey.KAS && <KASActivityTab />}
      {activityTabKey === ActivityTabKey.KRC20 && <KRC20Histories />}
      {/* {activityTabKey === ActivityTabKey.EVM && networkId === NETWORK_ID.testnet10 && <EVMActivityTab />} */}
      {activityTabKey === ActivityTabKey.EVM && <EVMActivityTab />}
      {/* {activityTabKey === ActivityTabKey.KRC721 && <KRC721Histories />} */}
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
            }}
          >
            <Row full justifyCenter itemsCenter>
              <Text preset="link" text={t('More')} size="md" />
              <Icon icon="link" size={fontSizes.xs} color="blue" />
            </Row>
          </Card>
        )}
      </div>
    );
  } else if (isLoading) {
    <Row justifyCenter mt="sm">
      <Icon>
        <LoadingOutlined />
      </Icon>
    </Row>;
  } else if (isError) {
    <Column justifyCenter>
      <Text text={error?.message} textCenter preset="sub" color="error" selectText />
    </Column>;
  } else {
    return <Empty />;
  }
}

export function KASActivityTab() {
  const navigate = useNavigate();
  const networkId = useAppSelector(selectNetworkId);
  const currentAddress = useAppSelector(selectCurrentKaspaAddress);
  const transactionInfos = useAppSelector(selectTxActivities);
  const incomingTx = useIncomingTx();
  const fetchTxActivities = useFetchTxActivitiesCallback();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const kasTick = useAppSelector(selectKasTick);
  const [krc20TxIds, setkrc20TxIds] = useState<string[]>([]);

  const blockstreamUrl = useAppSelector(selectBlockstreamUrl);
  const currentAccount = useAppSelector(selectCurrentAccount);
  const { t } = useTranslation();
  const currentNetworkType = useAppSelector(selectNetworkType);
  const tools = useTools();
  // const rpcStatus = useRpcStatus();
  const rpcStatus = useAppSelector(selectRpcStatus);
  const { activities: krc20Activities, refetch: refetchKrc20Activities } = useKrc20ActivitiesQuery(
    networkId,
    currentAddress
  );
  const startFetchTxActivities = useCallback(() => {
    setLoading(true);
    fetchTxActivities()
      .finally(async () => {
        await sleepSecond(1);
        setLoading(false);
      })
      .catch((e) => {
        log.debug(e.message);
        dispatch(transactionsActions.setTxActivities([]));
      });
    refetchKrc20Activities().catch((e) => {
      log.debug(e);
      tools.toastError(e?.message);
    });
  }, [dispatch, fetchTxActivities, refetchKrc20Activities, tools]);
  useEffect(() => {
    const timer = setTimeout(() => {
      startFetchTxActivities();
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [currentAccount?.address, networkId, startFetchTxActivities]);
  useEffect(() => {
    if (krc20Activities && krc20Activities.length > 0) {
      const txIds = krc20Activities.map((e: TKRC20History) => e.hashRev);
      setkrc20TxIds(txIds);
    }
  }, [krc20Activities]);

  useEffect(() => {
    wallet.getPendingTxDatas(currentAddress).then((res) => {
      // txListRef.current = res;
      dispatch(transactionsActions.setPendingList(res));
    });
  }, [currentAddress, dispatch, wallet]);

  useEffect(() => {
    if (rpcStatus == true) {
      wallet
        .subscribeSinkBlueScoreChanged()
        .then(() => log.debug('subscribed sink blue score changed'))
        .catch((err) => log.debug(err));
    }

    return () => {
      wallet
        .unsubscribeSinkBlueScoreChanged()
        .then(() => log.debug('unsubscribed sink blue score changed'))
        .catch((err) => log.debug(err));
    };
  }, [rpcStatus, wallet]);

  if (currentNetworkType !== NetworkType.Mainnet && currentNetworkType !== NetworkType.Testnet) {
    return (
      <Row justifyCenter>
        <Text text="Not Supported." mt="md" />
      </Row>
    );
  }
  // if (transactionInfos && transactionInfos.length > 0) {
  return (
    <>
      {incomingTx && (
        <Card
          key={'incomingtx'}
          classname="card-select"
          my="sm"
          fullX
          justifyCenter
          selfItemsCenter
          style={{ minHeight: 40 }}
          onClick={() => {
            if (loading == false) startFetchTxActivities();
          }}
        >
          <Text text="incoming transaction..." size="sm" />
        </Card>
      )}
      {transactionInfos && transactionInfos.length > 0 && (
        <div>
          {loading && (
            <Row justifyCenter mt="sm">
              <Icon>
                <LoadingOutlined />
              </Icon>
            </Row>
          )}
          {transactionInfos.map((e) => (
            <Card
              key={e.transaction_id}
              classname="card-select"
              mt="sm"
              onClick={() => {
                navigate('TxDetailScreen', {
                  txDetail: e.txDetail,
                  txId: e.transaction_id
                });
              }}
            >
              <Row full justifyBetween>
                <Column full>
                  <Row justifyBetween>
                    <Row itemsCenter>
                      <Text
                        text={e.mode == 'Receive' ? '+' : '-'}
                        color={e.mode == 'Receive' ? 'green' : 'red'}
                        selectText
                      />
                      <Text text={`${formatLocaleString(e.amount)} ${kasTick}`} selectText />
                      <TxAvatar txId={e.transaction_id} krc20TxIds={krc20TxIds} txPayload={e?.payload} />
                    </Row>
                    <TxConfirmState
                      isAccepted={e.isAccepted}
                      acceptingBlockBlueScore={e.txDetail.accepting_block_blue_score}
                    />
                  </Row>
                  <Row justifyBetween>
                    <Text text={shortAddress(e.transaction_id)} preset="sub" />
                    <Text text={new Date(e.block_time).toLocaleString()} preset="sub" />
                  </Row>
                </Column>
              </Row>
            </Card>
          ))}
          <Card
            key={'more-tx'}
            classname="card-select"
            mt="sm"
            onClick={() => {
              window.open(`${blockstreamUrl}/addresses/${currentAccount.address}`);
            }}
          >
            <Row full justifyCenter itemsCenter>
              <Text preset="link" text={t('More')} size="md" />
              <Icon icon="link" size={fontSizes.xs} color="blue" />
            </Row>
          </Card>
        </div>
      )}
      {loading && (
        <Row justifyCenter mt="sm">
          <Icon>
            <LoadingOutlined />
          </Icon>
        </Row>
      )}
      {loading == false && transactionInfos.length == 0 && <Empty />}
    </>
  );
}

function TxAvatar({
  txId,
  krc20TxIds,
  txPayload
}: {
  txId: string;
  krc20TxIds: string[];
  txPayload: string | undefined;
}) {
  const payloadIconUrl = useMemo(() => {
    if (!txPayload?.length) return undefined;
    const PAYLOAD_ICON_MAP = {
      [IGRA_HEX]: igraIcon,
      [KASPLEX_HEX]: kasplexIcon
    };
    const matchedHex = Object.keys(PAYLOAD_ICON_MAP).find((hex) => txPayload.startsWith(hex));
    return matchedHex ? PAYLOAD_ICON_MAP[matchedHex] : undefined;
  }, [txPayload]);

  if (txId !== undefined && krc20TxIds.includes(txId)) {
    return <Avatar size={16} src={kasplexIcon} />;
  } else if (txPayload && txPayload?.length > 0 && payloadIconUrl && payloadIconUrl?.length > 0) {
    return <Avatar size={16} src={payloadIconUrl} />;
  } else {
    return null;
  }
}

function TxConfirmState({
  isAccepted,
  acceptingBlockBlueScore
}: {
  isAccepted: boolean;
  acceptingBlockBlueScore: number;
}) {
  const blueScore = useBlueScore();
  if (isAccepted == false) {
    return (
      <Row>
        <Text text={isAccepted ? 'Accepted' : 'Not Accepted'} preset="sub" />
      </Row>
    );
  }
  if (!blueScore || blueScore <= 0 || blueScore - acceptingBlockBlueScore <= 0) {
    return (
      <Row>
        <Text text={isAccepted ? 'Accepted' : 'Not Accepted'} preset="sub" />
      </Row>
    );
  }
  if (blueScore - acceptingBlockBlueScore < 100) {
    return (
      <Row>
        <Text text={`${blueScore - acceptingBlockBlueScore} Confirmed`} preset="sub" />
      </Row>
    );
  }
  return (
    <Row>
      <Text text={'Confirmed'} preset="sub" />
    </Row>
  );
}

function UTXOTab({ rpcStatus }: { rpcStatus: boolean }) {
  const utxos = useAppSelector(selectUtxos);
  const currentAccount = useAppSelector(selectCurrentAccount);
  const fetchUtxos = useFetchUtxosCallback();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const tools = useTools();
  const { t } = useTranslation();
  const kasTick = useAppSelector(selectKasTick);
  const compound = async () => {
    setLoading(true);
    try {
      const result = await wallet.compoundUtxos([currentAccount]);
      setLoading(false);
      if (result == null || result == undefined) {
        tools.toastError('failed, please try again');
      } else {
        // await reloadAccounts();
        tools.toastSuccess('success');
      }
    } catch (e) {
      setLoading(false);
      tools.toastError((e as Error).message);
    }
  };
  useEffect(() => {
    if (!rpcStatus) return;
    const timer = setTimeout(() => {
      if (rpcStatus) {
        setLoading(true);
        fetchUtxos()
          .finally(() => {
            setLoading(false);
          })
          .catch((e) => {
            log.debug(e.message);
          });
      }
    }, 800);
    const utxosChangedHandler = () => {
      setLoading(true);
      fetchUtxos().finally(() => {
        setLoading(false);
      });
    };
    eventBus.addEventListener('utxosChangedNotification', utxosChangedHandler);
    return () => {
      clearTimeout(timer);
      eventBus.removeEventListener('utxosChangedNotification', utxosChangedHandler);
    };
  }, [currentAccount.address, rpcStatus, fetchUtxos]);
  const navigate = useNavigate();
  if (utxos && utxos.length > 0) {
    return (
      <>
        {utxos.length > 100 && (
          <Row justifyCenter my="xs" itemsCenter>
            <Text text="Too many UTXOs. Please compound them." color="warning" preset="sub" />
          </Row>
        )}
        <div>
          {utxos.length > 1 && (
            <Row justifyBetween itemsCenter>
              <Text text={`${formatLocaleString(utxos.length)} UTXOs`} preset="sub" />
              {loading == true && (
                <Row justifyCenter>
                  <Icon>
                    <LoadingOutlined />
                  </Icon>
                </Row>
              )}
              <Button
                text={t('Compound')}
                preset="default"
                onClick={() => {
                  compound();
                }}
              />
            </Row>
          )}
          {utxos.map((e, index) => {
            if (index > 20) return null;
            return (
              <Card
                key={e.entry.outpoint.transactionId + e.entry.amount}
                classname="card-select"
                mt="sm"
                onClick={() => {
                  navigate('UtxoDetailScreen', { utxoDetail: e });
                }}
              >
                <Row full justifyBetween itemsCenter>
                  <Text text={`${formatLocaleString(sompiToAmount(e.entry.amount, 8))} ${kasTick}`} />
                  {e?.entry.outpoint?.transactionId ? (
                    <Text text={shortAddress(e?.entry.outpoint?.transactionId)} preset="sub" />
                  ) : (
                    <Text text={e.entry.blockDaaScore} preset="sub" />
                  )}
                </Row>
              </Card>
            );
          })}
        </div>
      </>
    );
  } else if (loading) {
    return (
      <Row justifyCenter>
        <Icon>
          <LoadingOutlined />
        </Icon>
      </Row>
    );
  } else {
    return <Empty />;
  }
}
function TokensTab() {
  const currentNetworkType = useAppSelector(selectNetworkType);
  const dispatch = useAppDispatch();
  const tokensTabKey = useAppSelector(selectTokensTabKey);
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
          defaultValue={tokensTabKey}
          onChange={(value) => {
            dispatch(uiActions.updateTokensTab({ tokensTabKey: value as TokensTabKey }));
          }}
          options={[TokensTabKey.KASPA, TokensTabKey.EVM]}
          style={{ fontSize: '1rem' }}
        />
      </Row>
      {tokensTabKey === TokensTabKey.KASPA && <KRC20Tab />}
      {tokensTabKey === TokensTabKey.EVM && <EVMTokensTab />}
    </>
  );
}
function EVMTokensTab() {
  return <AssetListComponent visible={true} />;
}
function KRC20Tab() {
  const accountInscriptions = useAppSelector(selectAccountInscriptions);
  const [inputText, setInputText] = useState('');
  const accountBalance = useAppSelector((s) => selectAccountBalance(s, undefined));
  const kasTick = useAppSelector(selectKasTick);
  const { refetch, isLoading, error } = useFetchInscriptionsQuery();

  const displayedItems = useMemo(() => {
    const kasItem = {
      tokenType: 'KAS' as TTokenType,
      tick: kasTick,
      priceInKas: 1,
      balance: amountToSompi(accountBalance?.amount, 8),
      locked: '0',
      dec: '8',
      opScoreMod: '0'
    };
    const tempItems = simpleFuzzySearch([kasItem, ...accountInscriptions.list], inputText);
    return tempItems;
  }, [inputText, accountInscriptions.list, accountBalance?.amount, kasTick]);
  if (isLoading) {
    return (
      <>
        {displayedItems.map((e, index) => (
          <KRC20Card inscription={e} key={e?.tick + (e?.ca as string) || 'default-key-' + index} />
        ))}
        <div>
          <Row justifyCenter mt="lg">
            <Icon>
              <LoadingOutlined />
            </Icon>
          </Row>
        </div>
      </>
    );
  } else if (accountInscriptions && accountInscriptions.list.length > 0) {
    return (
      <div>
        {/* {krc20TotalUsdValue > 0 && (
          <Row itemsCenter my="sm">
            <Text
              text={krc20TotalUsdValue < 0.01 ? '< $0.01' : `$${krc20TotalUsdValue.toLocaleString('en-US')}`}
              // preset="sub"
              selectText
            />
          </Row>
        )} */}
        {accountInscriptions.list.length > 5 && <SearchBar onSearch={setInputText} autoFocus={true} />}
        {displayedItems.map((e, index) => (
          <KRC20Card inscription={e} key={e?.tick || 'default-key-' + index} />
        ))}
      </div>
    );
  } else if (error) {
    return (
      <>
        {displayedItems.map((e, index) => (
          <KRC20Card inscription={e} key={e?.tick || 'default-key-' + index} />
        ))}
        <Column justifyCenter>
          <Text text={error?.message} textCenter preset="sub" color="textDim" selectText mt="xl" />
          <Row justifyCenter>
            <Button
              text="Retry"
              preset="default"
              onClick={() => {
                refetch();
              }}
            />
          </Row>
        </Column>
      </>
    );
  } else {
    return (
      <>
        {displayedItems.map((e, index) => (
          <KRC20Card inscription={e} key={e?.tick || 'default-key-' + index} />
        ))}
      </>
    );
  }
}

function KRC20Card({ inscription }: { inscription: Inscription }) {
  if (inscription.tokenType == 'KRC20Issue') return <KRC20CardForIssueMod inscription={inscription} />;
  return <KRC20CardForMintMod inscription={inscription} />;
}

function KRC20CardForMintMod({ inscription }: { inscription: Inscription }) {
  const navigate = useNavigate();
  const krc20TokenIntro = useKRC20TokenIntro();
  const kasPrice = useKaspaPrice();
  const kasTick = useAppSelector(selectKasTick);
  const [usdValueStr, setUsdValueStr] = useState<string>('-');
  const logoUrl = useMemo(() => {
    if (inscription?.tick == kasTick) return kaspaIcon;
    const lowTick = inscription?.tick?.toLowerCase() as string;
    if (krc20TokenIntro[lowTick] && krc20TokenIntro[lowTick]?.logo) return krc20TokenIntro[lowTick]?.logo;
    return kasplexIcon;
  }, [inscription?.tick, krc20TokenIntro, kasTick]);
  const content = useMemo(() => {
    if (inscription?.tokenType == 'KAS') return 'kaspa';
    return 'KRC20: ' + inscription.tick?.toLowerCase();
  }, [inscription?.tick, inscription?.tokenType]);
  const totalFormattedAmount = useMemo(() => {
    const sompiAmt = BigInt(inscription?.balance) + BigInt(inscription?.locked);
    return formatLocaleString(sompiToAmount(sompiAmt, inscription.dec));
  }, [inscription?.balance, inscription?.locked, inscription.dec]);
  useEffect(() => {
    const priceInKas = inscription?.priceInKas ?? 0;
    const price = priceInKas * kasPrice;
    const sompiAmt = BigInt(inscription?.balance) + BigInt(inscription?.locked);
    const amt = sompiToAmount(sompiAmt, inscription.dec);
    const res = getUsdValueStr(price, amt);
    setUsdValueStr(res);
  }, [inscription, kasPrice]);

  return (
    <Row full justifyBetween selfItemsCenter style={{ gap: 2 }}>
      <Card classname="card-select" full justifyBetween mt="sm">
        <Row
          full
          onClick={() => {
            if (inscription?.tokenType == 'KAS') {
              navigate('KaspaTokenScreen', { krc20Token: inscription, logoUrl });
            } else {
              navigate('KRC20TokenScreen', {
                krc20Token: inscription,
                logoUrl
              });
            }
          }}
        >
          <Column style={{ width: 40 }} selfItemsCenter>
            <ProfileImage size={40} ticker={inscription.tick} tokenType={inscription.tokenType} ca={inscription.ca} />
          </Column>
          <Column full>
            <BalanceRow tick={inscription.tick as string} totalFormattedAmount={totalFormattedAmount} />
            <Row justifyBetween>
              <Text text={content} preset="sub" />
              <Text text={usdValueStr} preset="sub" />
            </Row>
          </Column>
        </Row>
      </Card>
    </Row>
  );
}

function KRC20CardForIssueMod({ inscription }: { inscription: Inscription }) {
  const navigate = useNavigate();
  const krc20TokenIntro = useKRC20TokenIntro();
  const kasPrice = useKaspaPrice();
  const kasNetworkId = useAppSelector(selectNetworkId);
  const [usdValueStr, setUsdValueStr] = useState<string>('-');

  const { name } = useKrc20DecName(kasNetworkId, (inscription.tick as string) || (inscription.ca as string));
  const logoUrl = useMemo(() => kasplexIcon, []);
  const content = useMemo(() => 'KRC20: ' + shortAddress(inscription.ca), [inscription.ca]);
  const totalFormattedAmount = useMemo(() => {
    const sompiAmt = BigInt(inscription?.balance) + BigInt(inscription?.locked);
    return formatLocaleString(sompiToAmount(sompiAmt, inscription.dec));
  }, [inscription?.balance, inscription?.locked, inscription.dec]);

  const [tick, setTick] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (name) {
      setTick(name);
    } else {
      setTick(shortAddress(inscription.ca, 3));
    }
  }, [name, inscription.ca]);
  useEffect(() => {
    const priceInKas = inscription?.priceInKas ?? 0;
    const price = priceInKas * kasPrice;
    const sompiAmt = BigInt(inscription?.balance) + BigInt(inscription?.locked);
    const amt = sompiToAmount(sompiAmt, inscription.dec);
    const res = getUsdValueStr(price, amt);
    setUsdValueStr(res);
  }, [inscription, kasPrice]);

  return (
    <Row full justifyBetween selfItemsCenter style={{ gap: 2 }}>
      <Card classname="card-select" full justifyBetween mt="sm">
        <Row
          full
          onClick={() => {
            navigate('KRC20TokenScreen', {
              krc20Token: inscription,
              logoUrl
            });
          }}
        >
          <Column style={{ width: 40 }} selfItemsCenter>
            <ProfileImage size={40} ticker={inscription.tick} tokenType={inscription.tokenType} ca={inscription.ca} />
          </Column>
          <Column full>
            <Row justifyBetween>
              <Text text={tick} />
              <Text text={totalFormattedAmount} style={{ paddingRight: 5, wordWrap: 'normal' }} preset="regular" />
            </Row>
            <Row justifyBetween>
              <Text text={content} preset="sub" />
              <Text text={usdValueStr} preset="sub" />
            </Row>
          </Column>
        </Row>
      </Card>
    </Row>
  );
}

function simpleFuzzySearch(items: Inscription[], searchTerm) {
  const searchTermLowerCase = searchTerm?.toLowerCase();
  const regex = new RegExp(searchTermLowerCase.split('').join('.*'), 'i');
  return items.filter((item) => item.tick && regex.test(item?.tick?.toLowerCase()));
}

function BalanceRow({ tick, totalFormattedAmount }: { tick: string; totalFormattedAmount: string }) {
  return (
    <Row justifyBetween>
      <Text text={tick} />
      <Text text={totalFormattedAmount} style={{ paddingRight: 5, wordWrap: 'normal' }} preset="regular" />
    </Row>
  );
}

function DappConnection() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const [site, setSite] = useState<ConnectedSite | undefined>(undefined);
  const [type, setType] = useState<'KASPA' | 'EVM' | undefined>(undefined);
  useEffect(() => {
    const run = async () => {
      const activeTab = await getCurrentTab();
      if (!activeTab) return;
      const siteEVM = await getCurrentConnectSiteEVM(wallet);
      if (siteEVM) {
        setSite(siteEVM as unknown as ConnectedSite);
        setType('EVM');
      } else {
        const site = await wallet.getCurrentConnectedSite(activeTab.id as number);
        if (site) {
          setSite(site);
          setType('KASPA');
        }
      }
    };
    run();
  }, [wallet]);
  if (site && site.isConnected)
    return (
      <Row
        itemsCenter
        justifyCenter
        onClick={() => {
          navigate('ConnectedSitesScreen', { site, type });
        }}
      >
        <DappConnectionItem item={site} />
      </Row>
    );

  return undefined;
}
