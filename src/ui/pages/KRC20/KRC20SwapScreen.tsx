import { Segmented } from 'antd';
import Drawer from 'antd/lib/drawer';
import log from 'loglevel';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { SwapTabKey } from '@/shared/types';
import { Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { selectMostRecentOverviewPage } from '@/ui/state/history/reducer';
import { useAppDispatch, useAppSelector } from '@/ui/state/hooks';
import { useWalletConfig } from '@/ui/state/settings/hooks';
import { selectSwapTabKey, uiActions } from '@/ui/state/ui/reducer';
import { colors } from '@/ui/theme/colors';
import { formatPercentage } from '@/ui/utils';
import { EllipsisOutlined, HistoryOutlined } from '@ant-design/icons';
import { faSliders } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import KRC20SwapChaingeTab from './SwapChainge/KRC20SwapChaingeTab';

import { Swap } from '@/evm/ui/views/Swap';
import { NETWORK_ID } from '@/shared/constant';
import { selectNetworkId } from '@/ui/state/settings/reducer';
import SlippageSettings from './SwapChainge/SlippageSettings';

export default function KRC20SwapScreen() {
  const location = useLocation();
  const networkId = useAppSelector(selectNetworkId);
  const { token: locationToken } = location.state || {};

  const [isSlippageOpen, setIsSlippageOpen] = useState(false);

  const mostRecentOverviewPage = useAppSelector(selectMostRecentOverviewPage);

  /**
   * slippage tolerance. e.g., 1 means 1%
   */
  const [slippage, setSlippage] = useState<number>(1);

  const navigate = useNavigate();

  const { t } = useTranslation();

  const dispatch = useAppDispatch();

  const [optionsVisible, setOptionsVisible] = useState(false);

  const swapTabKey = useAppSelector(selectSwapTabKey);
  log.debug('swapTabKey', swapTabKey);
  const [tabOptions, setTabOptions] = useState([SwapTabKey.CHAINGE]);
  const walletConfig = useWalletConfig();
  useEffect(() => {
    const options = [] as SwapTabKey[];
    if (walletConfig?.chaingeSwapEnabled == true) options.push(SwapTabKey.CHAINGE);
    // options.push(SwapTabKey.EVM);
    setTabOptions(options);
    if (options.length > 0 && options.includes(swapTabKey) == false) {
      dispatch(uiActions.updateSwapTab({ swapTabKey: options[0] }));
    }
  }, [walletConfig, dispatch]);
  return (
    <Layout>
      <Header
        onBack={() => {
          log.debug('mostRecentOverviewPage', mostRecentOverviewPage);
          navigate(mostRecentOverviewPage);
        }}
        title={'KRC20 Swap'}
        RightComponent={
          <Column relative classname="column-select">
            {optionsVisible && (
              <div
                style={{
                  position: 'fixed',
                  zIndex: 10,
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0
                }}
                onTouchStart={() => {
                  setOptionsVisible(false);
                }}
                onMouseDown={() => {
                  setOptionsVisible(false);
                }}
              ></div>
            )}
            <Icon
              onClick={() => {
                setOptionsVisible(!optionsVisible);
              }}
            >
              <EllipsisOutlined />
            </Icon>
            {optionsVisible && (
              <Column
                style={{
                  backgroundColor: colors.black,
                  width: 180,
                  position: 'absolute',
                  right: 0,
                  padding: 5,
                  zIndex: 10
                }}
              >
                <Column>
                  <Column classname="column-select">
                    <Row
                      itemsCenter
                      onClick={() => {
                        navigate('/krc20/swap/history');
                      }}
                    >
                      <HistoryOutlined />
                      <Text text={t('History')} size="sm" selectText />
                    </Row>
                  </Column>
                  <Column classname="column-select">
                    <Row
                      itemsCenter
                      onClick={() => {
                        setIsSlippageOpen(true);
                      }}
                    >
                      <Icon>
                        <FontAwesomeIcon icon={faSliders} />
                      </Icon>

                      <Text text={t('Slippage')} size="sm" selectText />

                      <span className="text-base">{formatPercentage(slippage)}</span>
                    </Row>
                  </Column>
                  {/* <Column classname="column-select">
                    <Row
                      itemsCenter
                      onClick={() => {
                        window.open(`https://www.hibit.app/`);
                      }}
                    >
                      <Icon icon="droplet-half" />
                      <Text text={t('Liquidity Pools')} size="sm" selectText />
                    </Row>
                  </Column> */}
                </Column>
              </Column>
            )}
          </Column>
        }
      />
      <Content>
        <Column gap="sm">
          <Row justifyEnd>
            <Segmented
              size="middle"
              value={swapTabKey}
              onChange={(value) => {
                dispatch(uiActions.updateSwapTab({ swapTabKey: value as SwapTabKey }));
              }}
              options={tabOptions}
              style={{ fontSize: '1rem' }}
            />
          </Row>
          {/* {swapTabKey === SwapTabKey.EVM && networkId == NETWORK_ID.testnet10 && <Swap />} */}
          {swapTabKey === SwapTabKey.CHAINGE && (
            <KRC20SwapChaingeTab slippage={slippage} locationToken={locationToken} />
          )}
          {tabOptions?.length == 0 && (
            <Row justifyCenter mt="xxl">
              <Text text={'Swap is in maintenance mode.'} color="error" selectText />
            </Row>
          )}

          <Drawer
            placement={'bottom'}
            closable={false}
            onClose={() => setIsSlippageOpen(false)}
            open={isSlippageOpen}
            key={'isSlippageOpen'}
          >
            {isSlippageOpen && (
              <SlippageSettings
                onClose={() => setIsSlippageOpen(false)}
                onSelectSlippage={setSlippage}
                slippage={slippage}
              />
            )}
          </Drawer>
        </Column>
      </Content>
    </Layout>
  );
}
