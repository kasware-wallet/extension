import { Drawer } from 'antd';
import log from 'loglevel';
import React, { useCallback, useEffect, useMemo } from 'react';

import { useRpcStatus } from '@/ui/state/global/hooks';
import { globalActions } from '@/ui/state/global/reducer';
import { useAppDispatch, useAppSelector } from '@/ui/state/hooks';
import { selectNetworkId } from '@/ui/state/settings/reducer';
import { usePendingList, useReplaceTransactionCallback } from '@/ui/state/transactions/hooks';
import { colors } from '@/ui/theme/colors';
import { useWallet } from '@/ui/utils';
import { RightOutlined } from '@ant-design/icons';

import { Button } from '../Button';
import { MiddleCard } from '../Card';
import { Column } from '../Column';
import { Empty } from '../Empty';
import { Icon } from '../Icon';
import { LoadingSpinner } from '../LoadingSpinner';
import { Logo } from '../Logo';
import { TxListCard } from '../PendingCard';
import { Row } from '../Row';
import { Text } from '../Text';
import './index.module.less';
import useProcessPendingTxList from '@/ui/hooks/useProcessPendingTxList';
import { useRpcLinks } from '@/ui/state/settings/hooks';
import { useNavigate } from '@/ui/pages/MainRoute';
import { useLocation } from 'react-router-dom';
import { getNetworkShortLabel } from '@/shared/utils';

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
  const networkLabel = getNetworkShortLabel(networkId);
  const networkIdComponent = useMemo(() => {
    if (!networkLabel) return null;
    return <Text text={networkLabel} preset="xsub" color="warning" />;
  }, [networkLabel]);

  const renderCenterComponent = useCallback(() => {
    if (children) return children;
    if (title) return <Text text={title} preset="regular-bold" selectText />;
    return <Logo preset="small" connected={rpcStatus} />;
  }, [children, title, rpcStatus]);

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
                <Icon icon="left" />
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
        <MiddleCard
          py="xs"
          mt="zero"
          mb="sm"
          onClick={() => {
            navigate('EditNetworkUrlScreen', { item: currentRpcLinks[networkId], networkId });
          }}
          style={{
            minHeight: 30
          }}
        >
          <Row justifyBetween full itemsCenter py="xxs">
            <div></div>
            <Row itemsCenter>
              <LoadingSpinner size="small" color={colors.orange} text="Connecting..." />
            </Row>
            <RightOutlined color="grey" />
          </Row>
        </MiddleCard>
      )}
      {pendingList?.length > 0 && (
        <MiddleCard
          py="xs"
          mt="zero"
          mb="sm"
          onClick={() => {
            setDrawerVisible(true);
          }}
          style={{
            minHeight: 30
          }}
        >
          <Row justifyBetween full itemsCenter py="xxs">
            <Row></Row>
            <Row>
              <LoadingSpinner size="small" color={colors.grey} text="pending transactions" />
            </Row>
            <RightOutlined color="grey" />
          </Row>
        </MiddleCard>
      )}
      <Drawer
        placement={'bottom'}
        closable={false}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        style={{
          body: {
            padding: 0,
            background: 'var(--r-neutral-bg1)',
            borderRadius: '16px 16px 0 0'
          },
          mask: {
            background: 'rgba(0, 0, 0, 0.7)'
          }
        }}
      >
        <Column>
          {/* Header */}
          <Row
            justifyBetween
            itemsCenter
            style={{ marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${colors.border}` }}
          >
            <Row itemsCenter gap="sm">
              <LoadingSpinner size="small" color={colors.orange} text="Pending Transactions" />
              {pendingList?.length > 0 && (
                <span
                  style={{
                    background: colors.orange,
                    color: colors.white,
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 10,
                    minWidth: 20,
                    textAlign: 'center'
                  }}
                >
                  {pendingList.length}
                </span>
              )}
            </Row>
            <Button
              onClick={() => setDrawerVisible(false)}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: colors.bg3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                minWidth: 'unset',
                minHeight: 32
              }}
            >
              <Icon icon="close" color="white_muted" size={14} />
            </Button>
          </Row>

          {/* Transaction List */}
          <Column style={{ maxHeight: '60vh', overflowY: 'auto', gap: 0 }}>
            {pendingList?.length > 0 &&
              pendingList.map((e) => (
                <TxListCard e={e} key={e.transaction_id} handleReplaceTransaction={handleReplaceTransaction} />
              ))}
            {pendingList?.length === 0 && (
              <Row justifyCenter my="xxl">
                <Empty text={'No pending transaction'} />
              </Row>
            )}
          </Column>
        </Column>
      </Drawer>
    </div>
  );
}
