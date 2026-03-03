import { Tabs } from 'antd';
import BigNumber from 'bignumber.js';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import type {
  IKRC20Blacklist,
  IKRC20ByAddress,
  IKRC20Deploy,
  IKRC20DeployIssue,
  IKRC20Send,
  IKRC20TokenInfo,
  IKRC20TokenInfoIssue,
  IKRC20TokenIntro,
  IKRC20Transfer,
  IKRC20TransferIssue,
  Inscription,
  IToken,
  TKRC20History,
  TKRC20HistoryIssue
} from '@/shared/types';
import { NetworkType, SwapTabKey, TxType } from '@/shared/types';
import { Button, Card, Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { ProfileImage } from '@/ui/components/CryptoImage';
import { useTools } from '@/ui/components/ActionComponent';
import { Empty } from '@/ui/components/Empty';
import { useExtensionIsInTab } from '@/ui/features/browser/tabs';
import { useKrc20TokenSocialInfosQuery, useQueryConfigJSON } from '@/ui/hooks/kasware';
import { useNavigate } from '@/ui/pages/MainRoute';
import { useAccountInscriptions, useCurrentAccount } from '@/ui/state/accounts/hooks';
import { selectCurrentKaspaAddress } from '@/ui/state/accounts/reducer';
import { useAppDispatch, useAppSelector } from '@/ui/state/hooks';
// import { useEnableKRC20Swap } from '@/ui/state/settings/hooks';
import { selectBlockstreamUrl, selectNetworkId, selectNetworkType } from '@/ui/state/settings/reducer';
// import { useChaingeTokens } from '@/ui/state/transactions/chainge/useChaingeTokens';
import { useUpdateUiTxCreateScreen } from '@/ui/state/ui/hooks';
import { KRC20MintDeployTabKey, uiActions } from '@/ui/state/ui/reducer';
import { colors } from '@/ui/theme/colors';
import { fontSizes } from '@/ui/theme/font';
import { copyToClipboard, formatLocaleString, getUsdValueStr, shortAddress } from '@/ui/utils';
import { useKRC20Blacklist } from '@/ui/utils/hooks/kasplex';
import {
  useKrc20ActivitiesQuery,
  useKrc20DecName,
  useKrc20TokenInfoQuery
} from '@/ui/utils/hooks/kasplex/fetchKrc20AddressTokenList';
import { useKaspaPrice } from '@/ui/utils/hooks/price/usePrice';
import { CopyOutlined, ExpandAltOutlined, LoadingOutlined, LockOutlined } from '@ant-design/icons';
import { useKrc20TokenBalanceQuery } from '@/ui/hooks/kasplex';
import { sompiToAmount } from '@/shared/utils/format';
import { openExtensionInTab } from '@/shared/browser';
import { BURN_ADDRESS_DESHE } from '@/shared/constant/kasplex';

export default function KRC20TokenScreen() {
  const { t } = useTranslation();
  const { state } = useLocation();
  const networkId = useAppSelector(selectNetworkId);
  const { krc20Token } = state as {
    krc20Token: Inscription;
    logoUrl: string;
  };
  const currentAddress = useAppSelector(selectCurrentKaspaAddress);
  const { tokenBalance } = useKrc20TokenBalanceQuery(
    networkId,
    currentAddress,
    krc20Token.tokenType == 'KRC20Issue' ? (krc20Token?.ca as string) : (krc20Token?.tick as string)
  );
  const balanceValue = useMemo(() => {
    if (tokenBalance !== null) return Number(sompiToAmount(tokenBalance.balance, tokenBalance.dec));
    return Number(sompiToAmount(krc20Token.balance, krc20Token.dec));
  }, [krc20Token.balance, krc20Token.dec, tokenBalance]);
  const lockedBalanceValue = useMemo(() => {
    if (tokenBalance !== null) return Number(sompiToAmount(tokenBalance.locked, tokenBalance.dec));
    return Number(sompiToAmount(krc20Token.locked, krc20Token.dec));
  }, [tokenBalance, krc20Token.locked, krc20Token.dec]);

  const [usdValueStr, setUsdValueStr] = useState<string>('-');

  const navigate = useNavigate();
  const networkType = useAppSelector(selectNetworkType);
  const setUiState = useUpdateUiTxCreateScreen();
  // const { data: chaingeTokens } = useChaingeTokens();
  // const isSwapEnabled = useEnableKRC20Swap();
  const [isBlacklisted, setIsBlacklisted] = useState<boolean>(false);

  const configJSON = useQueryConfigJSON();

  const blacklist = useKRC20Blacklist(krc20Token.tokenType == 'KRC20Issue' ? krc20Token.ca : undefined);
  const isLive = useMemo(() => {
    if (networkType == NetworkType.Mainnet) return configJSON.data?.mainnet ?? true;
    if (networkType == NetworkType.Testnet) return configJSON.data?.testnet ?? true;
    return false;
  }, [networkType, configJSON]);
  const dispatch = useAppDispatch();
  const { data: krc20Info } = useKrc20TokenInfoQuery(
    networkId,
    krc20Token.tokenType == 'KRC20Mint' ? (krc20Token.tick as string) : (krc20Token.ca as string)
  );
  const tokenTick = useMemo(() => {
    if (krc20Token.tokenType == 'KRC20Mint') return krc20Token.tick;
    return krc20Token.tick ?? (krc20Info as IKRC20TokenInfoIssue)?.name;
  }, [krc20Token, krc20Info]);
  const [tokenState, setTokenState] = useState<string>('');
  const accountInscriptions = useAccountInscriptions();
  const isInTab = useExtensionIsInTab();
  const kasPrice = useKaspaPrice();
  const [tokenPrice, setTokenPrice] = useState<number>(0);
  const [enableSwap, setEnableSwap] = useState<boolean>(false);
  const [isChaingeSwap, setIsChaingeSwap] = useState<boolean>(false);
  const onClickSwap = () => {
    // historyActions.updateMostRecentOverviewPage('/krc20/token');
    navigate('KRC20SwapScreen', { token: krc20Token });
    if (isChaingeSwap == true) {
      dispatch(uiActions.updateSwapTab({ swapTabKey: SwapTabKey.CHAINGE }));
    }
  };

  useEffect(() => {
    if (blacklist && blacklist.data && blacklist.data?.length > 0) {
      const isBlacklisted = blacklist.data.find((item) => item.address == currentAddress);
      if (isBlacklisted) {
        setIsBlacklisted(true);
      }
    }
  }, [blacklist, krc20Token, currentAddress]);

  useEffect(() => {
    if (krc20Info?.state) {
      setTokenState(krc20Info?.state);
    }
  }, [krc20Info]);

  // useEffect(() => {
  //   if (chaingeTokens && chaingeTokens?.length > 0) {
  //     const token = chaingeTokens.find(
  //       (t) => t.ticker?.toUpperCase() && t.ticker?.toUpperCase() == krc20Token?.tick?.toUpperCase()
  //     );
  //     if (!token || isSwapEnabled == false) {
  //       setEnableSwap(false);
  //     } else {
  //       setEnableSwap(true);
  //       setIsChaingeSwap(true);
  //     }
  //   }
  // }, [chaingeTokens?.length, isSwapEnabled]);

  useEffect(() => {
    const fetchTokenPrice = async () => {
      const token = accountInscriptions.list.find((item) =>
        item.tokenType == 'KRC20Mint' ? item.tick == krc20Token?.tick : item.ca == krc20Token.ca
      );
      if (token) {
        const price = token.priceInKas * kasPrice;
        setTokenPrice(price);
        const amt = new BigNumber(balanceValue + lockedBalanceValue).toString();
        const res = getUsdValueStr(price, amt);
        setUsdValueStr(res);
      }
    };
    fetchTokenPrice();
  }, [
    networkId,
    tokenTick,
    balanceValue,
    lockedBalanceValue,
    kasPrice,
    accountInscriptions.list,
    krc20Token?.tick,
    krc20Token.ca
  ]);

  const tabItems = [
    {
      key: 'history',
      label: 'History',
      children: <Histories token={krc20Token} tokenBalance={tokenBalance} />
    },
    {
      key: 'tokeninfo',
      label: `${t('Token Info')} `,
      children: <TokenInfo tokenInfo={krc20Info} tokenPrice={tokenPrice} krc20Token={krc20Token} />
    }
  ];
  return (
    <Layout>
      <Header
        onBack={() => {
          navigate('WalletTabScreen');
        }}
        title={krc20Token?.tick?.toUpperCase()}
      />
      <Content style={{ padding: '0px 16px 24px' }}>
        <Row style={{ width: 40 }} selfItemsCenter fullX justifyCenter>
          <ProfileImage size={40} ticker={krc20Token.tick} tokenType={krc20Token.tokenType} ca={krc20Token.ca} />
        </Row>
        <div>
          {new BigNumber(lockedBalanceValue).isGreaterThan(0) && (
            <Row justifyBetween itemsCenter>
              <div />
              <Text
                classname="hover:underline hover:bg-opacity-[0.1]"
                text={formatLocaleString(lockedBalanceValue) + '  ' + krc20Token.tick + ' locked'}
                preset="title"
                textCenter
                size="md"
                color="textDim"
                selectText
                onClick={() => {
                  navigate('UnlockKRC20TokenScreen', {
                    krc20Token
                  });
                }}
              />
              <div />
            </Row>
          )}
          <Text
            text={formatLocaleString(balanceValue) + '  ' + krc20Token.tick}
            preset="title-bold"
            textCenter
            size="xxl"
            selectText
          />
          {usdValueStr != '-' && (
            <Text text={usdValueStr} preset="title" textCenter size="lg" color="textDim" selectText />
          )}
        </div>
        {krc20Token.tokenType == 'KRC20Issue' && <CaBar ca={krc20Token.ca} />}
        {isBlacklisted == true && (
          <Text
            text={'Your address is restricted by contract owner. Token transfer will not be validated.'}
            color="warning"
            textCenter
            selectText
          />
        )}
        <Row justifyBetween mt="lg">
          <Button
            text={t('Receive')}
            preset="default"
            icon="receive"
            onClick={() => {
              navigate('ReceiveScreen', { type: TxType.SIGN_KRC20_TRANSFER });
            }}
            full
          />

          {isLive && (
            <Button
              text={t('Send')}
              preset="default"
              icon="send"
              onClick={() => {
                setUiState({
                  tick: tokenTick,
                  ca: krc20Token.ca,
                  decimals: krc20Token.dec ?? '8',
                  type: TxType.SIGN_KRC20_TRANSFER,
                  tokenType: krc20Token.tokenType,
                  toInfo: {
                    address: '',
                    domain: '',
                    inscription: undefined
                  }
                });
                navigate('TxCreateScreen');
              }}
              full
            />
          )}
          {enableSwap === true && <Button text={t('Swap')} preset="default" icon="swap" onClick={onClickSwap} full />}
          {tokenState && tokenState == 'deployed' && isLive && krc20Token.tokenType == 'KRC20Mint' && (
            <Button
              text={t('Mint')}
              preset="primary"
              // icon="droplet-half"
              RightAccessory={isInTab ? undefined : <ExpandAltOutlined style={{ color: '#000' }} />}
              onClick={() => {
                dispatch(
                  uiActions.updateKRC20MintDeployTab({
                    krc20MintDeployTabKey: KRC20MintDeployTabKey.MINT
                  })
                );
                if (isInTab) {
                  navigate('KRC20MintDeployScreen', { tick: krc20Token.tick });
                } else {
                  openExtensionInTab('#/krc20/mintdeploy');
                }
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
            // dispatch(uiActions.updateAssetTabScreen({ assetTabKey: key as unknown as AssetTabKey }));
          }}
        />
      </Content>
    </Layout>
  );
}

export function CaBar({ length = 12, ca }) {
  const { t } = useTranslation();
  const tools = useTools();

  return (
    <Row
      selfItemsCenter
      itemsCenter
      onClick={() => {
        copyToClipboard(ca).then(() => {
          tools.toastSuccess(t('Copied'));
        });
      }}
    >
      <Text text={shortAddress(ca, length)} color="textDim" style={{ wordWrap: 'break-word' }} />
      {/*<Icon icon="copy" color="textDim" />*/}
      <CopyOutlined style={{ color: '#888', fontSize: 14 }} />
    </Row>
  );
}
function TokenInfo({
  tokenInfo,
  tokenPrice,
  krc20Token
}: {
  tokenInfo: IKRC20TokenInfo | IKRC20TokenInfoIssue | undefined | null;
  tokenPrice: number;
  krc20Token: Inscription;
}) {
  return (
    <Column gap="zero">
      <TokenSocialInfo krc20Token={krc20Token} />
      <TokenOnChainInfo tokenInfo={tokenInfo} tokenPrice={tokenPrice} />
    </Column>
  );
}
function TokenOnChainInfo({
  tokenInfo,
  tokenPrice
}: {
  tokenInfo: IKRC20TokenInfo | IKRC20TokenInfoIssue | undefined | null;
  tokenPrice: number;
}) {
  const [tokenTick, setTokenTick] = useState<string | undefined>(undefined);
  const [tokenName, setTokenName] = useState<string | undefined>(undefined);
  const [tokenCa, setTokenCa] = useState<string | undefined>(undefined);
  const [revealTx, setRevealTx] = useState('');
  const kasNetworkId = useAppSelector(selectNetworkId);

  const blockstreamUrl = useAppSelector(selectBlockstreamUrl);
  const [infoArray, setInfoArray] = useState<any[]>([]);
  const { tokenBalance: burnedTokenBalance } = useKrc20TokenBalanceQuery(
    kasNetworkId,
    BURN_ADDRESS_DESHE,
    tokenInfo?.mod == 'issue'
      ? (tokenInfo as IKRC20TokenInfoIssue)?.ca
      : (tokenInfo as IKRC20TokenInfo)?.tick?.toLowerCase(),
    // 'ppkas',
    kasNetworkId == 'mainnet'
  );
  const balanceValue = useMemo(() => {
    if (burnedTokenBalance !== null) return sompiToAmount(burnedTokenBalance.balance, burnedTokenBalance.dec);
    return '0';
  }, [burnedTokenBalance]);
  useEffect(() => {
    if (tokenInfo) {
      if ((tokenInfo as IKRC20TokenInfo).tick) setTokenTick((tokenInfo as IKRC20TokenInfo).tick);
      if ((tokenInfo as IKRC20TokenInfoIssue).name) setTokenName((tokenInfo as IKRC20TokenInfoIssue).name);
      if ((tokenInfo as IKRC20TokenInfoIssue).ca) setTokenCa((tokenInfo as IKRC20TokenInfoIssue).ca);

      setRevealTx(tokenInfo.hashRev);
      const infoA: any[] = [];
      let maxBN = new BigNumber(0);
      let mintedBN = new BigNumber(0);
      let preBN = new BigNumber(0);
      infoA.push({
        name: 'Price',
        value:
          tokenPrice == 0
            ? '-'
            : tokenPrice >= 0.001
            ? '$' + tokenPrice.toLocaleString('en-US')
            : '$' + tokenPrice.toString()
      });
      if (tokenInfo.dec) {
        infoA.push({
          name: 'Decimal',
          value: tokenInfo.dec
        });
      }
      if (tokenInfo?.mod) {
        infoA.push({
          name: 'Mod',
          value: tokenInfo.mod
        });
      }

      let dec = tokenInfo?.dec;
      if (dec == undefined || Number(dec) <= 0) {
        dec = '8';
      }
      if (tokenInfo.max) {
        maxBN = new BigNumber(tokenInfo.max).dividedBy(Math.pow(10, Number(dec)));
        infoA.push({
          name: 'Max Supply',
          value: formatLocaleString(maxBN)
        });
      }
      if (tokenInfo.minted) {
        mintedBN = new BigNumber(tokenInfo.minted).dividedBy(Math.pow(10, Number(dec)));
        infoA.push({
          name: 'Minted Amount',
          value: formatLocaleString(mintedBN)
        });
      }
      if (tokenInfo.burned) {
        mintedBN = new BigNumber(tokenInfo.burned).dividedBy(Math.pow(10, Number(dec))).plus(balanceValue);
        infoA.push({
          name: 'Burned Amount',
          value: formatLocaleString(mintedBN)
        });
      }
      if (tokenInfo.pre) {
        preBN = new BigNumber(tokenInfo.pre).dividedBy(Math.pow(10, Number(dec)));
        infoA.push({
          name: 'Pre-Allocation Amount',
          value: formatLocaleString(preBN)
        });
      }
      if (tokenInfo.holderTotal) {
        preBN = new BigNumber(tokenInfo.holderTotal);
        infoA.push({
          name: 'Total Holders',
          value: formatLocaleString(preBN)
        });
      }
      if (tokenInfo.transferTotal) {
        preBN = new BigNumber(tokenInfo.transferTotal);
        infoA.push({
          name: 'Total Transfer Times',
          value: formatLocaleString(preBN)
        });
      }
      if (tokenInfo.mintTotal) {
        preBN = new BigNumber(tokenInfo.mintTotal);
        infoA.push({
          name: 'Total Mint Times',
          value: formatLocaleString(preBN)
        });
      }
      if (tokenInfo.opScoreAdd) {
        infoA.push({
          name: 'opScoreAdd',
          value: tokenInfo.opScoreAdd
        });
      }
      if (tokenInfo.opScoreMod) {
        infoA.push({
          name: 'opScoreMod',
          value: tokenInfo.opScoreMod
        });
      }
      if (tokenInfo.state) {
        if (tokenInfo.state == 'finished') {
          infoA.push({
            name: 'State',
            value: '100% Minted'
          });
        } else if (tokenInfo.state == 'deployed' && maxBN.isGreaterThan(0)) {
          const percent = Number(mintedBN.dividedBy(maxBN)) * 100;
          infoA.push({
            name: 'State',
            value: `${percent.toLocaleString()}% Minted`
          });
        } else {
          infoA.push({
            name: 'State',
            value: tokenInfo.state
          });
        }
      }
      if ((tokenInfo as IKRC20TokenInfo)?.daas && (tokenInfo as IKRC20TokenInfo)?.daae) {
        const daas = Number((tokenInfo as IKRC20TokenInfo).daas).toLocaleString();
        const daae = Number((tokenInfo as IKRC20TokenInfo).daae).toLocaleString();
        infoA.push({
          name: 'DAA Scope',
          value: daas + '~' + daae
        });
      }
      setInfoArray(infoA);
    }
  }, [tokenInfo, tokenPrice, balanceValue]);

  return (
    <Column gap="zero">
      {tokenTick !== undefined && (
        <Card
          key="tick"
          classname="card-select"
          full
          justifyBetween
          py="xxs"
          mt="md"
          mb="zero"
          style={{ minHeight: 40, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
        >
          <Row justifyBetween full itemsCenter py="sm">
            <Text text="Tick" preset="sub" />
            <Text text={tokenTick} selectText />
          </Row>
        </Card>
      )}
      {tokenName !== undefined && (
        <Card
          key="tokenname"
          classname="card-select"
          full
          justifyBetween
          py="xxs"
          mt="md"
          mb="zero"
          style={{ minHeight: 40, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
        >
          <Row justifyBetween full itemsCenter py="sm">
            <Text text="Name" preset="sub" />
            <Text text={tokenName} selectText />
          </Row>
        </Card>
      )}
      {tokenCa !== undefined && (
        <Card
          key="tokenca"
          classname="card-select"
          full
          justifyBetween
          py="xxs"
          mt="xxs"
          mb="zero"
          style={{
            minHeight: 40,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0
          }}
        >
          <Row justifyBetween full itemsCenter py="sm">
            <Text text="Contract" preset="sub" />
            <Row
              gap="xxs"
              itemsCenter
              onClick={() => {
                window.open(`${blockstreamUrl}/txs/${tokenCa}`);
              }}
            >
              <Text preset="link" text={shortAddress(tokenCa, 12)} />
              <Icon icon="link" size={fontSizes.xxs} color="blue" />
            </Row>
          </Row>
        </Card>
      )}
      {infoArray &&
        infoArray.length > 0 &&
        infoArray.map((info, index) => {
          return (
            <Card
              py="sm"
              mt="xxs"
              mb="zero"
              key={index}
              classname="card-select"
              full
              justifyBetween
              style={{
                minHeight: 40,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0
              }}
            >
              <Row justifyBetween full itemsCenter py="sm">
                <Text text={info.name} preset="sub" selectText />
                <Text text={info.value} selectText />
              </Row>
            </Card>
          );
        })}

      <Card
        mt="xxs"
        mb="zero"
        key="revealtx"
        classname="card-select"
        full
        justifyBetween
        style={{
          minHeight: 40,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0
        }}
      >
        <Row justifyBetween full itemsCenter>
          <Text text="Reveal TX" preset="sub" />
          <Row
            gap="xxs"
            itemsCenter
            onClick={() => {
              window.open(`${blockstreamUrl}/txs/${revealTx}`);
            }}
          >
            <Text preset="link" text={shortAddress(revealTx, 12)} />
            <Icon icon="link" size={fontSizes.xxs} color="blue" />
          </Row>
        </Row>
      </Card>
    </Column>
  );
}
function TokenSocialInfo({ krc20Token }: { krc20Token: Inscription }) {
  const dispatch = useAppDispatch();
  const [tokenWebs, setTokenWebs] = useState<any[]>([]);
  const [tokenIntro, setTokenIntro] = useState<IKRC20TokenIntro | undefined>(undefined);
  const { data, isLoading } = useKrc20TokenSocialInfosQuery();
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      dispatch(uiActions.updateKRC20TokenIntro({ krc20TokenIntro: data }));
      if (data && krc20Token?.ca?.toLowerCase() && data[krc20Token?.ca?.toLowerCase()]) {
        setTokenIntro(data[krc20Token?.ca?.toLowerCase()]);
      } else if (data && krc20Token?.tick?.toLowerCase() && data[krc20Token?.tick?.toLowerCase()]) {
        setTokenIntro(data[krc20Token?.tick?.toLowerCase()]);
      }
    }
  }, [data, dispatch, krc20Token]);

  useEffect(() => {
    if (tokenIntro) {
      const infoA: any[] = [];
      if (tokenIntro?.website && tokenIntro?.website.length > 0) {
        infoA.push({
          name: 'Website',
          value: tokenIntro?.website
        });
      }
      if (tokenIntro?.twitter && tokenIntro?.twitter.length > 0) {
        infoA.push({
          name: 'X/Twitter',
          value: tokenIntro?.twitter
        });
      }
      if (tokenIntro?.telegram && tokenIntro?.telegram.length > 0) {
        infoA.push({
          name: 'Telegram',
          value: tokenIntro?.telegram
        });
      }
      if (tokenIntro?.discord && tokenIntro?.discord.length > 0) {
        infoA.push({
          name: 'Discord',
          value: tokenIntro?.discord
        });
      }
      setTokenWebs(infoA);
    }
  }, [tokenIntro]);
  if (isLoading) {
    return (
      <Row justifyCenter mt="sm">
        <Icon>
          <LoadingOutlined />
        </Icon>
      </Row>
    );
  }
  return (
    <>
      {tokenIntro?.desc != undefined && tokenIntro?.desc?.length > 0 && (
        <Row justifyCenter fullX mt={'xl'} mb="sm">
          <Card fullX>
            <Text
              size="sm"
              color="textDim"
              preset="sub"
              text={tokenIntro?.desc}
              style={{
                userSelect: 'text',
                maxHeight: 384,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                flexWrap: 'wrap'
              }}
            />
          </Card>
        </Row>
      )}
      {tokenWebs &&
        tokenWebs.length > 0 &&
        tokenWebs.map((info, index) => {
          return (
            <Card
              py="xs"
              mt="xs"
              mb="zero"
              key={index}
              classname="card-select"
              full
              justifyBetween
              style={{
                minHeight: 40,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0
              }}
            >
              <Row justifyBetween full itemsCenter py="sm">
                <Text text={info.name} preset="sub" selectText />
                <Row
                  gap="xxs"
                  itemsCenter
                  onClick={() => {
                    window.open(info.value);
                  }}
                >
                  <Text preset="link" text={info.value} selectText />
                  <Icon icon="link" size={fontSizes.xxs} color="blue" />
                </Row>
              </Row>
            </Card>
          );
        })}
    </>
  );
}
function Histories({ token, tokenBalance }: { token: Inscription; tokenBalance: IKRC20ByAddress | null }) {
  const currentAccount = useCurrentAccount();
  const networkId = useAppSelector(selectNetworkId);
  const {
    activities: krc20Histories,
    isLoading,
    isError,
    error,
    refetch
  } = useKrc20ActivitiesQuery(
    networkId,
    currentAccount.address,
    token?.tokenType == 'KRC20Mint' ? token?.tick : token?.ca
  );
  useEffect(() => {
    const timer = setTimeout(() => {
      refetch();
    }, 2000);
    return () => {
      clearTimeout(timer);
    };
  }, [tokenBalance]);

  if (krc20Histories && krc20Histories.length > 0) {
    return (
      <div>
        {krc20Histories.map((e, index) => (
          <KRC20HistoryCard history={e} key={index} token={{ tick: token?.tick ?? '', decimals: token.dec }} />
        ))}
      </div>
    );
  } else if (isLoading) {
    return (
      <Row justifyCenter>
        <Icon>
          <LoadingOutlined />
        </Icon>
      </Row>
    );
  } else if (isError) {
    return (
      <Column justifyCenter>
        <Text text={error?.message} textCenter preset="sub" color="error" selectText />
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
    );
  } else {
    return <Empty />;
  }
}

export function KRC20HistoryCardWithoutToken({ history }: { history: TKRC20History | TKRC20HistoryIssue }) {
  const [tokenTickDec, setTokenTickDec] = useState<IToken>({ tick: '', decimals: '8' });
  const kasNetworkId = useAppSelector(selectNetworkId);
  const { name: tokenName, dec: tokenDec } = useKrc20DecName(
    kasNetworkId,
    (history as IKRC20Transfer)?.tick || (history as IKRC20TransferIssue)?.ca
  );

  useEffect(() => {
    if (tokenName && tokenDec) {
      setTokenTickDec({ tick: tokenName, decimals: tokenDec });
    }
  }, [tokenName, tokenDec]);
  return <KRC20HistoryCard history={history} token={tokenTickDec} />;
}

function KRC20HistoryCard({ token, history }: { token: IToken; history: TKRC20History | TKRC20HistoryIssue }) {
  const navigate = useNavigate();
  return (
    <Card
      classname="card-select"
      mt="sm"
      onClick={() => {
        navigate('KRC20TxDetailScreen', { txDetail: history, op: history.op, token: token });
      }}
    >
      <Row full justifyBetween>
        <Column full>
          <Row justifyBetween>
            <KRC20OpAddress history={history} />
            <KRC20TxConfirmState txAccept={history.txAccept} opAccept={history.opAccept} opError={history.opError} />
          </Row>
          <Row justifyBetween>
            <KRC20OpAmount history={history} token={token} />
            <Text text={new Date(Number(history.mtsAdd)).toLocaleString()} preset="sub" />
          </Row>
          {history?.op == 'deploy' && (history as IKRC20Deploy)?.pre && Number((history as IKRC20Deploy)?.pre) > 0 && (
            <Row justifyBetween>
              <KRC20OpAmountPreAllocation history={history as IKRC20Deploy} token={token} />
              <Text text={new Date(Number(history.mtsAdd)).toLocaleString()} preset="sub" />
            </Row>
          )}
        </Column>
      </Row>
    </Card>
  );
}

function KRC20OpAddress({ history }: { history: TKRC20History | TKRC20HistoryIssue }) {
  const currentAccount = useCurrentAccount();
  if (history.op == 'transfer' || history.op == 'issue' || history.op == 'chown') {
    if (history.from == currentAccount.address) {
      return (
        <Row>
          <Text text={`${history.op} to ${shortAddress((history as IKRC20Transfer).to)}`} preset="sub" />
        </Row>
      );
    }
    if ((history as IKRC20Transfer).to == currentAccount.address) {
      return (
        <Row>
          <Text text={`${history.op} from ${shortAddress(history.from)}`} preset="sub" />
        </Row>
      );
    }
  }
  if (history.op == 'mint') {
    return (
      <Row>
        <Text text="Mint" preset="sub" />
      </Row>
    );
  }
  if (history.op == 'deploy') {
    return (
      <Row>
        <Text text={Number((history as IKRC20Deploy)?.pre) > 0 ? 'Deploy & Pre-Allocation' : 'Deploy'} preset="sub" />
      </Row>
    );
  }
  if (history.op == 'send') {
    if ((history as IKRC20Send).to == currentAccount.address) {
      return (
        <Row>
          <Text text={`${history.op} from ${shortAddress(history.from)}`} preset="sub" />
        </Row>
      );
    }
    if (history.from == currentAccount.address) {
      return (
        <Row>
          <Text text={`${history.op} to ${shortAddress((history as IKRC20Send).to)}`} preset="sub" />
        </Row>
      );
    }
  }
  if (history.op == 'burn') {
    return (
      <Row>
        <Text text={`${history.op} from ${shortAddress(history.from)}`} preset="sub" />
      </Row>
    );
  }
  if (history.op == 'blacklist') {
    return (
      <Row>
        <Text text={`${history.op} ${shortAddress((history as IKRC20Blacklist).to)}`} preset="sub" />
      </Row>
    );
  }
  if (history.op == 'list') {
    return (
      <Row>
        <Text text={`${history.op} for sale`} preset="sub" />
      </Row>
    );
  }

  return (
    <Row>
      <Text text={history.op} preset="sub" />
    </Row>
  );
}

function KRC20TxConfirmState({ txAccept, opAccept, opError }: { txAccept: string; opAccept: string; opError: string }) {
  if (opAccept == '1') {
    return (
      <Row>
        <Text text={'Success'} preset="sub" />
      </Row>
    );
  }
  if (opAccept == '-1') {
    return (
      <Row>
        <Text text={'Failed'} preset="sub" color="red" />
      </Row>
    );
  }
  if (opAccept == '0') {
    return (
      <Row>
        <Text text={'Unconfirmed'} preset="sub" />
      </Row>
    );
  }
}

function KRC20OpAmount({ history, token }: { history: TKRC20History | TKRC20HistoryIssue; token: IToken }) {
  const currentAccount = useCurrentAccount();
  const formattedAmount = useMemo(() => {
    return formatLocaleString(sompiToAmount((history as IKRC20Transfer)?.amt, token?.decimals ?? '8'));
  }, [token?.decimals, history]);
  if (history.op == 'transfer') {
    if (history.from == currentAccount.address) {
      return (
        <Row itemsCenter>
          <Text text={'-'} color={'red'} />
          <Text text={`${formattedAmount} ${token.tick}`} />
        </Row>
      );
    }
    if ((history as IKRC20Transfer).to == currentAccount.address) {
      return (
        <Row itemsCenter>
          <Text text={'+'} color={'green'} />
          <Text text={`${formattedAmount} ${token.tick}`} />
        </Row>
      );
    }
  }
  if (history.op == 'send') {
    if ((history as IKRC20Send).to == currentAccount.address) {
      return (
        <Row itemsCenter>
          <Text text={'+'} color={'green'} />
          <Text text={`${formattedAmount} ${token.tick}`} />
        </Row>
      );
    } else if (history.from == currentAccount.address) {
      return (
        <Row itemsCenter>
          <Text text={'-'} color={'red'} />
          <Text text={`${formattedAmount} ${token.tick}`} />
        </Row>
      );
    } else {
      return (
        <Row itemsCenter>
          <Text text={''} />
          <Text text={`${formattedAmount} ${token.tick}`} />
        </Row>
      );
    }
  }
  if (history.op == 'list') {
    return (
      <Row itemsCenter>
        <LockOutlined
          style={{
            fontSize: fontSizes.icon,
            color: colors.red
          }}
        />
        <Text text={`${formattedAmount} ${token.tick}`} />
      </Row>
    );
  }
  if (history.op == 'mint') {
    return (
      <Row itemsCenter>
        <Text text={'+'} color={'green'} />
        <Text text={`${formattedAmount} ${token.tick}`} />
      </Row>
    );
  }
  if (history.op == 'deploy') {
    return (
      <Column full>
        <Text
          text={`${formatLocaleString(sompiToAmount((history as IKRC20Deploy)?.max, token?.decimals ?? '8'))} ${
            token.tick
          }`}
        />
      </Column>
    );
  }
  if (history.op == 'burn') {
    return (
      <Row itemsCenter>
        <Text text={'-'} color={'red'} />
        <Text text={`${formattedAmount} ${token.tick}`} />
      </Row>
    );
  }
  if (history.op == 'blacklist') {
    if ((history as IKRC20Blacklist).mod == 'add') {
      return (
        <Row itemsCenter>
          <Text text={'blocked'} color={'red'} />
          <Text text={`${token.tick}`} />
        </Row>
      );
    }
    if ((history as IKRC20Blacklist).mod == 'remove') {
      return (
        <Row itemsCenter>
          <Text text={'unblocked'} color={'green'} />
          <Text text={`${token.tick}`} />
        </Row>
      );
    }
  }
  if (history.op == 'issue') {
    return (
      <Row itemsCenter>
        <Text text={'+'} color={'green'} />
        <Text text={`${formattedAmount} ${token.tick}`} />
      </Row>
    );
  }
  if (history.op == 'chown') {
    return (
      <Row itemsCenter>
        <Text text={`${token.tick}`} />
      </Row>
    );
  }
}

function KRC20OpAmountPreAllocation({ token, history }: { token: IToken; history: IKRC20Deploy | IKRC20DeployIssue }) {
  if (history.op == 'deploy') {
    return (
      <Column full>
        <Text text={`${formatLocaleString(sompiToAmount(history?.pre, token?.decimals ?? '8'))} ${token.tick}`} />
      </Column>
    );
  }
}
