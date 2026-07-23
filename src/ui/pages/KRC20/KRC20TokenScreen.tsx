import type { TabsProps } from 'antd';
import { Tabs } from 'antd';
import BigNumber from 'bignumber.js';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import type { IKRC20TokenInfoIssue, Inscription } from '@/shared/types';
import { NetworkType, SwapTabKey, TxType } from '@/shared/types';
import { Button, Content, Header, Layout, Row, Text } from '@/ui/components';
import { ProfileImage } from '@/ui/components/CryptoImage';
import { useExtensionIsInTab } from '@/ui/features/browser/tabs';
import { useQueryConfigJSON } from '@/ui/hooks/kasware';
import { useNavigate } from '@/ui/pages/MainRoute';
import { useAccountInscriptions } from '@/ui/state/accounts/hooks';
import { selectCurrentKaspaAddress } from '@/ui/state/accounts/reducer';
import { useAppDispatch, useAppSelector } from '@/ui/state/hooks';
import { selectNetworkId, selectNetworkType } from '@/ui/state/settings/reducer';
import { useUpdateUiTxCreateScreenCallback } from '@/ui/state/temp-ui/hooks';
import { KRC20MintDeployTabKey, tempUiActions } from '@/ui/state/temp-ui/reducer';
import { uiActions } from '@/ui/state/ui/reducer';
import { formatLocaleString, getUsdValueStr, getTokenIdentifier, isKRC20Issue } from '@/ui/utils';
import { useKRC20Blacklist } from '@/ui/utils/hooks/kasplex';
import { useKrc20TokenInfoQuery } from '@/ui/utils/hooks/kasplex/fetchKrc20AddressTokenList';
import { useKaspaPrice } from '@/ui/utils/hooks/price/usePrice';
import { ExpandAltOutlined } from '@ant-design/icons';
import { useKrc20TokenBalanceQuery } from '@/ui/hooks/kasplex';
import { sompiToAmount } from '@/shared/utils/format';
import { openExtensionInTab } from '@/shared/browser';

import { CaBar, TokenInfo, Histories, KRC20HistoryCardWithoutToken } from './components';

export default function KRC20TokenScreen() {
  const { t } = useTranslation();
  const { state } = useLocation();
  const networkId = useAppSelector(selectNetworkId);
  const { krc20Token } = state as {
    krc20Token: Inscription;
    logoUrl: string;
  };
  const currentAddress = useAppSelector(selectCurrentKaspaAddress);
  const { tokenBalance } = useKrc20TokenBalanceQuery(networkId, currentAddress, getTokenIdentifier(krc20Token));
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
  const setUiState = useUpdateUiTxCreateScreenCallback();
  // const { data: chaingeTokens } = useChaingeTokens();
  // const isSwapEnabled = useEnableKRC20Swap();
  const [isBlacklisted, setIsBlacklisted] = useState<boolean>(false);

  const configJSON = useQueryConfigJSON();

  const blacklist = useKRC20Blacklist(isKRC20Issue(krc20Token.tokenType) ? krc20Token.ca : undefined);
  const isLive = useMemo(() => {
    if (networkType == NetworkType.Mainnet) return configJSON.data?.mainnet ?? true;
    if (networkType == NetworkType.Testnet) return configJSON.data?.testnet ?? true;
    return false;
  }, [networkType, configJSON]);
  const dispatch = useAppDispatch();
  const { data: krc20Info } = useKrc20TokenInfoQuery(networkId, getTokenIdentifier(krc20Token));
  const tokenTick = useMemo(() => {
    if (krc20Token.tokenType == 'KRC20Mint') return krc20Token.tick;
    return krc20Token.tick ?? (krc20Info as IKRC20TokenInfoIssue)?.name;
  }, [krc20Token, krc20Info]);
  const tokenState = krc20Info?.state ?? '';
  const accountInscriptions = useAccountInscriptions();
  const isInTab = useExtensionIsInTab();
  const kasPrice = useKaspaPrice();
  const [tokenPrice, setTokenPrice] = useState<number>(0);
  // const [enableSwap, setEnableSwap] = useState<boolean>(false);
  // const [isChaingeSwap, setIsChaingeSwap] = useState<boolean>(false);
  // const onClickSwap = () => {
  //   // historyActions.updateMostRecentOverviewPage('/krc20/token');
  //   navigate('KRC20SwapScreen', { token: krc20Token });
  //   if (isChaingeSwap == true) {
  //     dispatch(uiActions.updateSwapTab({ swapTabKey: SwapTabKey.CHAINGE }));
  //   }
  // };

  useEffect(() => {
    if (blacklist && blacklist.data && blacklist.data?.length > 0) {
      const isBlacklisted = blacklist.data.find((item) => item.address == currentAddress);
      if (isBlacklisted) {
        setIsBlacklisted(true);
      }
    }
  }, [blacklist, krc20Token, currentAddress]);

  useEffect(() => {
    const fetchTokenPrice = () => {
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

  const tabItems: TabsProps['items'] = [
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
        {isKRC20Issue(krc20Token.tokenType) && <CaBar ca={krc20Token.ca} />}
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
          {/* {enableSwap === true && <Button text={t('Swap')} preset="default" icon="swap" onClick={onClickSwap} full />} */}
          {tokenState && tokenState == 'deployed' && isLive && krc20Token.tokenType == 'KRC20Mint' && (
            <Button
              text={t('Mint')}
              preset="primary"
              // icon="droplet-half"
              RightAccessory={isInTab ? undefined : <ExpandAltOutlined style={{ color: '#000' }} />}
              onClick={() => {
                dispatch(
                  tempUiActions.updateKRC20MintDeployTab({
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
          defaultActiveKey="history"
          // activeKey={assetTabKey as unknown as string}
          items={tabItems}
          onTabClick={(key) => {
            // dispatch(uiActions.updateAssetTabScreen({ assetTabKey: key as unknown as AssetTabKey }));
          }}
        />
      </Content>
    </Layout>
  );
}
