/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Tabs, Tooltip } from 'antd';
import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';

import { KEYRING_TYPE } from '@/shared/constant';
import { NetworkType } from '@/shared/types';
import { Card, Column, Content, Footer, Header, Icon, Layout, Row, Text } from '@/ui/components';
import AccountSelect from '@/ui/components/AccountSelect';
import { AddressBar } from '@/ui/components/AddressBar';
import { Button } from '@/ui/components/Button';
import { NavTabBar } from '@/ui/components/NavTabBar';
import { NoticePopover } from '@/ui/components/NoticePopover';
import { UpgradePopover } from '@/ui/components/UpgradePopover';
import { getCurrentTab } from '@/ui/features/browser/tabs';
import { useAccountBalance, useBlueScore, useCurrentAccount } from '@/ui/state/accounts/hooks';
import { useCurrentKeyring } from '@/ui/state/keyrings/hooks';
import {
  useBlockstreamUrl,
  useNetworkType,
  useSkipVersionCallback,
  useVersionInfo,
  useWalletConfig
} from '@/ui/state/settings/hooks';
import { fontSizes } from '@/ui/theme/font';
import { shortAddress, sompiToAmount, useWallet } from '@/ui/utils';

import { Empty } from '@/ui/components/Empty';
import { accountActions } from '@/ui/state/accounts/reducer';
import { useAppDispatch } from '@/ui/state/hooks';
import { useFetchTxActivitiesCallback, useFetchUtxosCallback, useIncomingTx, useTxActivities, useUtxos } from '@/ui/state/transactions/hooks';
import { ExportOutlined, LoadingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '../MainRoute';

const $noBreakStyle: CSSProperties = {
  whiteSpace: 'nowrap',
  wordBreak: 'keep-all'
};

export default function WalletTabScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const accountBalance = useAccountBalance();
  const networkType = useNetworkType();
  const isTestNetwork = networkType === NetworkType.Testnet;

  const currentKeyring = useCurrentKeyring();
  const wallet = useWallet();
  // const [transactionInfos, setTransactionInfos] = useState<ITransactionInfo[]>([]);
  // const [balanceValue, setBalanceValue] = useState('--');
  // const getCacheBalance = async () => {
  //   if (accountBalance.amount === '0') {
  //     const cacheBalance = await wallet.getAddressCacheBalance(currentAccount.address);
  //     if (cacheBalance && Number(cacheBalance.amount) > 0) {
  //       setBalanceValue(cacheBalance.amount);
  //     } else {
  //       setBalanceValue(accountBalance.amount);
  //     }
  //   } else {
  //     setBalanceValue(accountBalance.amount);
  //   }
  // };
  // useEffect(() => {
  //   getCacheBalance();
  // }, [accountBalance.amount]);
  const balanceValue = useMemo(() => {
    // if (accountBalance.amount === '0' && transactionInfos.length === 0) {
    //   return '--';
    // } else {
      return accountBalance.amount;
    // }
  }, [accountBalance.amount]);
  const pendingValue = useMemo(() => {
    return accountBalance.pending_kas_amount;
  }, [accountBalance?.pending_kas_amount]);
  const outgoingValue = useMemo(() => {
    return accountBalance.outgoing;
  }, [accountBalance?.outgoing]);
  const [connected, setConnected] = useState(false);
  const [rpcStatus, setRpcStatus] = useState(true);
  const [usdValue, setUSDValue] = useState('0');
  const prevRpcStatus = useRef(true);
  const dispatch = useAppDispatch();
  const currentNetworkType = useNetworkType();
  // const assetTabKey = useAssetTabKey();

  const skipVersion = useSkipVersionCallback();

  const walletConfig = useWalletConfig();
  const versionInfo = useVersionInfo();

  const [showSafeNotice, setShowSafeNotice] = useState(false);


  useEffect(() => {
    wallet.handleRpcConnect().finally(() => {});
    // The rpc disconnection is handled by background
  }, []);

  useEffect(() => {
    const run = async () => {
      const show = await wallet.getShowSafeNotice();
      setShowSafeNotice(show);

      const activeTab = await getCurrentTab();
      if (!activeTab) return;
      const site = await wallet.getCurrentConnectedSite(activeTab.id);
      if (site) {
        setConnected(site.isConnected);
      }
    };
    run();
  }, []);

  useEffect(() => {
    prevRpcStatus.current = rpcStatus;
  }, [rpcStatus]);

  useEffect(() => {
    const monitorRpcStatus = setInterval(async () => {
      const status = await wallet.getRpcStatus();
      setRpcStatus(status);
    }, 1000);
    return () => {
      clearInterval(monitorRpcStatus);
    };
  }, []);
  useEffect(() => {
    // if (networkType !== NetworkType.Mainnet) return;
    fetch('https://api.kaspa.org/info/price')
      .then((response) => response.json())
      .then((data) => {
        const price = Number(data.price);
        // 0.178
        if(price && price > 0) dispatch(accountActions.setKasPrice(price));
        if (accountBalance.amount === '0') {
          setUSDValue('0');
        } else {
          const value = Number(accountBalance.amount) * price;
          setUSDValue(value.toLocaleString());
        }
      });
  }, [accountBalance.amount, networkType]);

  const tabItems = [
    {
      key: 'activity',
      label: t('Activity'),
      children: <ActivityTab />
    },
    {
      key: 'utxos-list',
      label: 'UTXO',
      children: <UTXOTab />
    }
  ];

  return (
    <Layout>
      <Header
        LeftComponent={
          <Column>
            {connected && (
              <Row
                itemsCenter
                onClick={() => {
                  navigate('ConnectedSitesScreen');
                }}>
                <Text text="·" color="green" size="xxl" />
                <Text text="Dapp Connected" size="xxs" />
              </Row>
            )}
          </Column>
        }
        RightComponent={
          <Card
            classname="card-select"
            preset="style2"
            onClick={() => {
              navigate('SwitchKeyringScreen');
            }}>
            <Text text={currentKeyring.alianName} size="xxs" style={{ padding: '3px 1px' }} />
          </Card>
        }
      />
      <Content>
        <Column gap="xl">
          {currentKeyring.type === KEYRING_TYPE.HdKeyring && <AccountSelect />}
          {/* <Row itemsCenter justifyCenter mt='sm'> */}
          <AddressBar />
          {/* <Row
              style={{ marginLeft: 8 }}
              itemsCenter
              onClick={() => {
                window.open(`${blockstreamUrl}/address/${currentAccount.address}`);
              }}>
              <Text text={'View History'} size="xs" />
              <Icon icon="link" size={fontSizes.xs} />
            </Row> */}
          {/* </Row> */}

          {isTestNetwork && <Text text="Kaspa Testnet activated." color="danger" textCenter />}
          {rpcStatus == false && <Text text="Connecting network..." color="danger" textCenter />}
          {walletConfig.statusMessage && <Text text={walletConfig.statusMessage} color="danger" textCenter />}

          <Tooltip
            placement={'bottom'}
            title={
              <>
                <Row justifyBetween>
                  <span style={$noBreakStyle}>{'Balance'}</span>
                  <span style={$noBreakStyle}>{`$${usdValue}`}</span>
                </Row>
                {/*    <Row justifyBetween>
                  <span style={$noBreakStyle}>{'Confirmed KAS'}</span>
                  <span style={$noBreakStyle}>{` ${accountBalance.confirm_kas_amount} KAS`}</span>
                </Row>
                <Row justifyBetween>
                  <span style={$noBreakStyle}>{'Unconfirmed KAS'}</span>
                  <span style={$noBreakStyle}>{` ${accountBalance.pending_kas_amount} KAS`}</span>
                </Row> */}
              </>
            }
            overlayStyle={{
              fontSize: fontSizes.xs
            }}>
            <div>
              <Text text={balanceValue + '  KAS'} preset="title-bold" textCenter size="xxxl" />
              {usdValue && Number(usdValue) > 0 && <Text text={'$' + usdValue} preset="title" textCenter size="lg" color="textDim"/>}
              {outgoingValue && Number(outgoingValue) > 0 && (
                <Text text={outgoingValue + '  KAS'} preset="title-bold" textCenter size="xxxl" />
              )}
              {pendingValue && Number(pendingValue) > 0 && (
                <Text text={pendingValue + '  KAS'} preset="title-bold" textCenter size="xxxl" />
              )}
            </div>
          </Tooltip>


          <Row justifyBetween>
            <Button
              text={t('Receive')}
              preset="default"
              icon="receive"
              onClick={(e) => {
                navigate('ReceiveScreen');
              }}
              full
            />

            <Button
              text={t('Send')}
              preset="default"
              icon="send"
              onClick={(e) => {
                navigate('TxCreateScreen');
              }}
              full
            />
            {walletConfig.moonPayEnabled && (
              <Button
                text="Buy"
                preset="default"
                icon="kas"
                onClick={(e) => {
                  navigate('FiatPayScreen');
                }}
                full
              />
            )}
          </Row>
          <Tabs
            size={'small'}
            defaultActiveKey="0"
            // activeKey={assetTabKey as unknown as string}
            items={tabItems as unknown as any[]}
            onTabClick={(key) => {
              // console.log(key);
            }}
          />
        </Column>
        {showSafeNotice && (
          <NoticePopover
            onClose={() => {
              wallet.setShowSafeNotice(false);
              setShowSafeNotice(false);
            }}
          />
        )}
        {!versionInfo.skipped && (
          <UpgradePopover
            onClose={() => {
              skipVersion(versionInfo.newVersion);
            }}
          />
        )}
      </Content>
      <Footer px="zero" py="zero">
        <NavTabBar tab="home" />
      </Footer>
    </Layout>
  );
}
function ActivityTab() {
  const navigate = useNavigate();
  const transactionInfos = useTxActivities();
  const incomingTx =  useIncomingTx()
  const fetchTxActivities = useFetchTxActivitiesCallback();

  const blockstreamUrl = useBlockstreamUrl();
  const currentAccount = useCurrentAccount();
  const { t } = useTranslation();
  const currentNetworkType = useNetworkType();
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTxActivities()
    }, 800);
   return () => {
     clearTimeout(timer);
   }
  }, [currentAccount]);

  if (currentNetworkType !== NetworkType.Mainnet && currentNetworkType !== NetworkType.Testnet) {
    return (
      <Row justifyCenter>
        <Text text="Not Supported." mt="md" />
      </Row>
    );
  }
  if (transactionInfos && transactionInfos.length > 0) {
    return (
      <div>
        {incomingTx && (
        <Card
        key={'incomingtx'}
        classname="card-select"
        mt="md">
            <Row full justifyCenter>
              <Text text="incoming transaction..." size="sm" />
              <Icon>
                <LoadingOutlined size={16}/>
              </Icon>
            </Row>
        </Card>
      )}
        {transactionInfos.map((e) => (
          <Card
            key={e.transaction_id}
            classname="card-select"
            mt="md"
            onClick={(event) => {
              navigate('TxDetailScreen', { txDetail: e.txDetail, txId: e.transaction_id });
            }}>
            <Row full justifyBetween>
              <Column full>
                <Row justifyBetween>
                  <Text text={e.mode} />
                  <TxConfirmState
                    isAccepted={e.isAccepted}
                    acceptingBlockBlueScore={e.txDetail.accepting_block_blue_score}
                  />
                </Row>
                <Row justifyBetween>
                  <Row>
                    <Text text={e.mode == 'Receive' ? '+' : '-'} color={e.mode == 'Receive' ? 'green' : 'red'} />
                    <Text text={`${e.amount} kas`} />
                  </Row>
                  <Text text={new Date(e.block_time).toLocaleString()} preset="sub" />
                </Row>
              </Column>
            </Row>
          </Card>
        ))}
        <Card
          key={'more-tx'}
          classname="card-select"
          mt="md"
          onClick={() => {
            window.open(`${blockstreamUrl}/address/${currentAccount.address}`);
          }}>
          <Row full justifyCenter>
            <ExportOutlined style={{fontSize: 14 }} />
            <Text preset="regular-bold" text={t('More')} size='lg'/>
          </Row>
        </Card>
      </div>
    );
  } else {
    return <Empty />;
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
  if (!blueScore || blueScore <= 0) {
    return (
      <Row>
        <Text text={isAccepted ? 'Accepted' : 'Not Accepted'} preset="sub" />
      </Row>
    );
  }
  if (blueScore - acceptingBlockBlueScore < 100) {
    return (
      <Row>
        <Text text={isAccepted ? 'Accepted' : 'Not Accepted'} preset="sub" />
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

function UTXOTab() {
  const utxos = useUtxos();
  const currentAccount = useCurrentAccount();
  const fetchUtxos = useFetchUtxosCallback();
  useEffect(() => {
    fetchUtxos();
  }, [currentAccount]);
  const navigate = useNavigate();
  if (utxos && utxos.length > 0) {
    return (
      <div>
        {utxos.map((e, index) => (
          <Card
            key={index}
            classname="card-select"
            mt="md"
            onClick={(event) => {
              navigate('UtxoDetailScreen', { utxoDetail: e.entry });
            }}>
            <Row full justifyBetween mt="sm">
              <Text text={`${sompiToAmount(Number(e.amount))} kas`} />
              {e?.entry.outpoint?.transactionId ? (
                <Text text={shortAddress(e?.entry.outpoint?.transactionId)} preset="sub" />
              ) : (
                <Text text={e.blockDaaScore} preset="sub" />
              )}
            </Row>
          </Card>
        ))}
      </div>
    );
  } else {
    return <Empty />;
  }
}
