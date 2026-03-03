import { Drawer } from 'antd';
import log from 'loglevel';
import React, { useEffect, useMemo } from 'react';

import { useRpcStatus } from '@/ui/state/global/hooks';
import { globalActions } from '@/ui/state/global/reducer';
import { useAppDispatch, useAppSelector } from '@/ui/state/hooks';
import { selectNetworkId } from '@/ui/state/settings/reducer';
import { usePendingList, useReplaceTransactionCallback } from '@/ui/state/transactions/hooks';
import { colors } from '@/ui/theme/colors';
import { fontSizes } from '@/ui/theme/font';
import { useWallet } from '@/ui/utils';
import { LoadingOutlined, RightOutlined } from '@ant-design/icons';
import { faArrowLeftLong, faClose } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Button } from '../Button';
import { Card } from '../Card';
import { Column } from '../Column';
import { Empty } from '../Empty';
import { Icon } from '../Icon';
import { Logo } from '../Logo';
import { TxListCard } from '../PendingCard';
import { Row } from '../Row';
import { Text } from '../Text';
import './index.module.less';
import useProcessPendingTxList from '@/ui/hooks/useProcessPendingTxList';
import { useRpcLinks } from '@/ui/state/settings/hooks';
import { useNavigate } from '@/ui/pages/MainRoute';
import { useLocation } from 'react-router-dom';

interface HeaderProps {
  onBack?: () => void;
  title?: string;
  LeftComponent?: React.ReactNode;
  RightComponent?: React.ReactNode;
  children?: React.ReactNode;
  hideConnectingComp?: boolean;
}

export function Header(props: HeaderProps) {
  const { onBack, title, LeftComponent, RightComponent, children, hideConnectingComp } = props;
  const rpcStatus = useRpcStatus();
  const location = useLocation();
  const navigate = useNavigate();
  const currentRpcLinks = useRpcLinks();
  const wallet = useWallet();
  const [drawerVisible, setDrawerVisible] = React.useState(false);
  const pendingList = usePendingList();
  const dispatch = useAppDispatch();
  const handleReplaceTransaction = useReplaceTransactionCallback();
  const networkId = useAppSelector(selectNetworkId);
  const networkIdComponent = useMemo(() => {
    if (networkId == 'testnet-10') {
      return <Text text="TN10" preset="xsub" color="warning" />;
    } else if (networkId == 'testnet-11') {
      return <Text text="TN11" preset="xsub" color="warning" />;
    } else if (networkId == 'testnet-12') {
      return <Text text="TN12" preset="xsub" color="warning" />;
    } else if (networkId == 'devnet') {
      return <Text text="DEV" preset="xsub" color="warning" />;
    } else {
      return null;
    }
  }, [networkId]);

  const renderCenterComponent = () => {
    if (children) {
      return children;
    }

    if (title) {
      return <Text text={title} preset="regular-bold" selectText />;
    }

    return <Logo preset="small" connected={rpcStatus} />;
  };

  useProcessPendingTxList();
  useEffect(() => {
    const initRpcStatus = async () => {
      const rs = await wallet.getRpcStatus();
      dispatch(globalActions.updateRpcStatus({ rpcStatus: rs }));
      if (!rs)
        wallet.handleRpcConnect().catch((e) => {
          log.debug(e);
        });
    };
    initRpcStatus();
  }, [dispatch, wallet]);

  const showConnectingComp = useMemo(() => {
    return rpcStatus !== true && !hideConnectingComp && !['/connect-approval'].includes(location.pathname);
  }, [hideConnectingComp, location.pathname, rpcStatus]);

  return (
    <div style={{ display: 'block' }}>
      <Row
        justifyBetween
        itemsCenter
        style={{
          height: '56px',
          padding: 15
        }}
      >
        <Row full>
          <Column selfItemsCenter classname="column-select">
            {LeftComponent}
            {onBack && (
              <Row
                onClick={() => {
                  onBack();
                }}
              >
                <Icon>
                  <FontAwesomeIcon icon={faArrowLeftLong} />
                </Icon>
              </Row>
            )}
          </Column>
        </Row>

        <Row itemsCenter selfItemsCenter gap="xs">
          {renderCenterComponent()}
          {networkIdComponent}
        </Row>

        <Row full justifyEnd>
          <Column selfItemsCenter>{RightComponent}</Column>
        </Row>
      </Row>
      {showConnectingComp && (
        <Card
          py="xs"
          mt="zero"
          mb="sm"
          classname="card-select"
          full
          justifyBetween
          onClick={() => {
            navigate('EditNetworkUrlScreen', { item: currentRpcLinks[networkId], networkId });
          }}
          style={{
            minHeight: 30,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0
          }}
        >
          <Row justifyBetween full itemsCenter py="xxs">
            <div></div>
            <Row itemsCenter>
              <LoadingOutlined
                style={{
                  fontSize: fontSizes.icon,
                  color: colors.orange
                }}
              />
              <Text text={'Connecting...'} preset="regular" color="textDim" />
            </Row>
            <RightOutlined color="grey" />
          </Row>
        </Card>
      )}
      {pendingList?.length > 0 && (
        <Card
          py="xs"
          mt="zero"
          mb="sm"
          classname="card-select"
          full
          justifyBetween
          onClick={() => {
            setDrawerVisible(true);
          }}
          style={{
            minHeight: 30,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0
          }}
        >
          <Row justifyBetween full itemsCenter py="xxs">
            <Row></Row>
            <Row>
              <Icon>
                <LoadingOutlined
                  style={{
                    fontSize: fontSizes.icon,
                    color: colors.grey
                  }}
                />
              </Icon>
              <Text text={`pending transaction`} preset="sub" color="orange_light" />
            </Row>
            <RightOutlined color="grey" />
          </Row>
        </Card>
      )}
      <Drawer
        placement={'bottom'}
        closable={false}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        key={'fee-drawer'}
      >
        <Column mt="lg">
          <Row justifyBetween itemsCenter>
            <Text text={'pending transactions'} color="textDim" preset="sub" />
            <Button onClick={() => setDrawerVisible(false)}>
              <Icon>
                <FontAwesomeIcon icon={faClose} />
              </Icon>
            </Button>
          </Row>
          {pendingList?.length > 0 &&
            pendingList.map((e) => (
              <TxListCard e={e} key={e.transaction_id} handleReplaceTransaction={handleReplaceTransaction} />
            ))}
          {pendingList?.length == 0 && (
            <Row justifyCenter my="xxl">
              <Empty text={'No pending transaction'} />
            </Row>
          )}
        </Column>
      </Drawer>
    </div>
  );
}
