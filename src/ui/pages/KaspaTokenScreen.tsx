/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tabs, Tooltip } from 'antd';
import BigNumber from 'bignumber.js';
import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import type { IKRC20ByAddress, IKRC20TokenIntro } from '@/shared/types';
import { TxType } from '@/shared/types';
import { Card, Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { useNavigate } from '@/ui/pages/MainRoute';
import { useEnableBridge, useEnableKRC20Swap } from '@/ui/state/settings/hooks';
import { useResetUiTxCreateScreen } from '@/ui/state/ui/hooks';
import { fontSizes } from '@/ui/theme/font';
import { formatLocaleString } from '@/ui/utils';

import { ProfileImage } from '../components/CryptoImage';
import { selectAccountBalance } from '../state/accounts/reducer';
import { historyActions } from '../state/history/reducer';
import { useAppSelector } from '../state/hooks';
import { selectNetworkId } from '../state/settings/reducer';
import { useKaspaPrice } from '../utils/hooks/price/usePrice';
import { KASActivityTab } from './Main/WalletTabScreen';
import { ButtonColumn } from '../components/Button';

const $noBreakStyle: CSSProperties = {
  whiteSpace: 'nowrap',
  wordBreak: 'keep-all'
};

export default function KaspaTokenScreen() {
  const { t } = useTranslation();
  const { state } = useLocation();
  const networkId = useAppSelector(selectNetworkId);
  const accountBalance = useAppSelector((s) => selectAccountBalance(s, undefined));
  const resetUiTxCreateScreen = useResetUiTxCreateScreen();
  const { krc20Token } = state as {
    krc20Token: IKRC20ByAddress;
    logoUrl: string;
  };

  const balanceValue = useMemo(() => {
    return accountBalance.amount;
  }, [accountBalance.amount]);
  const tokenTick = useMemo(() => {
    return krc20Token.tick;
  }, [krc20Token]);
  const [usdValueStr, setUsdValueStr] = useState<string>('-');

  const navigate = useNavigate();

  const [tokenIntro, setTokenIntro] = useState<IKRC20TokenIntro | undefined>(undefined);
  const kasPrice = useKaspaPrice();
  const enableSwap = useEnableKRC20Swap();
  const enableBridge = useEnableBridge();
  const fetchKRC20Info = async () => {
    const tokenIntro = {
      tick: 'KAS',
      name: 'Kaspa',
      website: '',
      logo: '',
      desc: 'Kaspa is the fastest, open-source, decentralized & fully scalable Layer-1 in the world. The world’s first blockDAG – a digital ledger enabling parallel blocks and instant transaction confirmation – built on a robust proof-of-work engine with rapid single-second block intervals. Built by industry pioneers, led by the people.'
    };
    setTokenIntro(tokenIntro);
  };

  useEffect(() => {
    const fetchTokenPrice = async () => {
      if (kasPrice) {
        const value = new BigNumber(balanceValue).multipliedBy(1).multipliedBy(kasPrice).toNumber();
        if (value > 0 && value < 0.01) {
          setUsdValueStr('< $0.01');
        } else if (value >= 0.01) {
          setUsdValueStr(`$${value.toLocaleString('en-US')}`);
        }
      }
      // }
    };
    fetchTokenPrice();
  }, [networkId, tokenTick, balanceValue, kasPrice]);

  useEffect(() => {
    fetchKRC20Info();
  }, [tokenTick]);

  const tabItems = [
    {
      key: 'history',
      label: 'Activity',
      children: <KASActivityTab />
    },
    {
      key: 'tokeninfo',
      label: `${t('Token Info')} `,
      children: <TokenInfo tokenIntro={tokenIntro} />
    }
  ];
  return (
    <Layout>
      <Header
        onBack={() => {
          // window.history.go(-1);
          navigate('WalletTabScreen');
        }}
        title={krc20Token?.tick?.toUpperCase()}
      />
      <Content style={{ padding: '0px 16px 24px' }}>
        <Row style={{ width: 40 }} selfItemsCenter fullX justifyCenter>
          <ProfileImage size={40} ticker={krc20Token.tick} tokenType="KAS" />
        </Row>
        <Tooltip
          placement={'bottom'}
          title={
            <>
              <Row justifyBetween itemsCenter>
                <span style={$noBreakStyle}>{'Balance'}</span>
                <span style={$noBreakStyle}>{usdValueStr}</span>
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
          }}
        >
          <div>
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
        </Tooltip>
        <Row justifyBetween mt="lg">
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
          {enableSwap == true && (
            <ButtonColumn
              text={t('Swap')}
              preset="default"
              icon="swap"
              onClick={() => {
                historyActions.updateMostRecentOverviewPage('/kaspa/token');
                navigate('KRC20SwapScreen');
              }}
              full
            />
          )}
        </Row>
        <Tabs size={'small'} defaultActiveKey="0" items={tabItems} />
      </Content>
    </Layout>
  );
}

function TokenInfo({ tokenIntro }: { tokenIntro: IKRC20TokenIntro | undefined }) {
  const [price, setPrice] = useState(0);
  const kasPrice = useKaspaPrice();

  const [infoArray, setInfoArray] = useState<any[]>([]);
  const [tokenWebs, setTokenWebs] = useState<any[]>([]);
  useEffect(() => {
    const infoA: any[] = [];
    infoA.push({
      name: 'Price',
      value: price == 0 ? '-' : price >= 0.001 ? '$' + price.toLocaleString('en-US') : '$' + price.toString()
    });
    infoA.push({
      name: 'Decimal',
      value: '8'
    });

    infoA.push({
      name: 'Max Supply',
      value: '~28.7B'
    });

    setInfoArray(infoA);
  }, [price]);

  useEffect(() => {
    setPrice(kasPrice);
  }, [kasPrice]);

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

  return (
    <Column gap="zero">
      {tokenIntro?.desc != undefined && (
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
                <Text text={info.name} preset="sub" />
                <Row
                  gap="xxs"
                  itemsCenter
                  onClick={() => {
                    window.open(info.value);
                  }}
                >
                  <Text preset="link" text={info.value} />
                  <Icon icon="link" size={fontSizes.xxs} color="blue" />
                </Row>
              </Row>
            </Card>
          );
        })}

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
                <Text text={info.name} preset="sub" />
                <Text text={info.value} />
              </Row>
            </Card>
          );
        })}
    </Column>
  );
}
