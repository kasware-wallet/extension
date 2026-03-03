import VirtualList from 'rc-virtual-list';
import type { Dispatch, SetStateAction } from 'react';
import { forwardRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Account, Inscription } from '@/shared/types';
import { Button, Card, Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';

import { selectCurrentKaspaAddress } from '@/ui/state/accounts/reducer';
import { useAppSelector } from '@/ui/state/hooks';

import { colors } from '@/ui/theme/colors';
import { formatLocaleString, useWallet } from '@/ui/utils';
import { DeleteOutlined, EllipsisOutlined, LoadingOutlined, LockOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';

import type { IKrc20MarketInfo } from '@/ui/hooks/kasplex';
import { useKrc20MarketInfoQuery } from '@/ui/hooks/kasplex';
import { fontSizes } from '@/ui/theme/font';
import { UnlockKRC20TokenPopover } from '@/ui/components/UnlockKRC20TokenPopover';
import { useKrc20DecName } from '@/ui/utils/hooks/kasplex/fetchKrc20AddressTokenList';
import { selectNetworkId } from '@/ui/state/settings/reducer';
import { sompiToAmount } from '@/shared/utils/format';

export interface ItemData {
  key: string;
  account?: Account;
}

interface MyItemProps {
  account?: Account;
  autoNav?: boolean;
  order: IKrc20MarketInfo;
  krc20Token: Inscription;
  setUnlockedTokenPopupVisible: Dispatch<SetStateAction<boolean>>;
  setSelectedOrder: Dispatch<SetStateAction<IKrc20MarketInfo | null>>;
}

export function MyItem({ order, krc20Token, setUnlockedTokenPopupVisible, setSelectedOrder }: MyItemProps, ref) {
  const { t } = useTranslation();
  const kasNetworkId = useAppSelector(selectNetworkId);
  const { name: tokenName } = useKrc20DecName(kasNetworkId, (order?.tick as string) ?? (order?.ca as string));
  const [optionsVisible, setOptionsVisible] = useState(false);
  return (
    <Row full justifyBetween selfItemsCenter style={{ gap: 2 }}>
      <Card
        classname="card-select"
        full
        justifyBetween
        mt="md"
        style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
      >
        <Row full justifyBetween>
          <Column full>
            <Row justifyBetween>
              <Text text={`list for sale`} preset="sub" />
              <Text text={'Success'} preset="sub" />
            </Row>
            <Row justifyBetween>
              <Row itemsCenter>
                <LockOutlined
                  style={{
                    fontSize: fontSizes.icon,
                    color: colors.red
                  }}
                />
                <Text text={`${formatLocaleString(sompiToAmount(order.amount, krc20Token.dec ?? '8'))} ${tokenName}`} />
              </Row>
              <Text text={new Date(Number(order.opScoreAdd)).toLocaleString()} preset="sub" />
            </Row>
          </Column>
        </Row>
      </Card>
      <Card
        onClick={() => {
          setOptionsVisible(!optionsVisible);
        }}
        classname="card-select"
        mt="md"
        style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
      >
        <Column style={{ width: 20 }} selfItemsCenter>
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

          <Icon>
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
                <Column
                  classname="column-select"
                  onClick={async () => {
                    setOptionsVisible(false);
                    setSelectedOrder(order);
                    setUnlockedTokenPopupVisible(true);
                  }}
                >
                  <Row>
                    <DeleteOutlined />
                    <Text text={t('Cancel order')} size="sm" />
                  </Row>
                </Column>
              </Column>
            </Column>
          )}
        </Column>
      </Card>
    </Row>
  );
}

export default function UnlockKRC20TokenScreen() {
  const { t } = useTranslation();
  const { state } = useLocation();
  const { krc20Token } = state as {
    krc20Token: Inscription;
    logoUrl: string;
  };
  const kasNetworkId = useAppSelector(selectNetworkId);
  const [selectedOrder, setSelectedOrder] = useState<IKrc20MarketInfo | null>(null);
  const [unlockedTokenPopupVisible, setUnlockedTokenPopupVisible] = useState(false);
  const { name: tokenName } = useKrc20DecName(
    kasNetworkId,
    krc20Token.tokenType == 'KRC20Issue' ? (krc20Token.ca as string) : (krc20Token.tick as string)
  );

  const wallet = useWallet();

  const [filteredItems, setFilteredItems] = useState<IKrc20MarketInfo[]>([]);
  const tools = useTools();

  const currentAddress = useAppSelector(selectCurrentKaspaAddress);
  const ForwardMyItem = forwardRef(MyItem);

  const { isLoading, listOrders, isError, error, refetch } = useKrc20MarketInfoQuery(
    kasNetworkId,
    currentAddress,
    krc20Token?.tokenType == 'KRC20Issue' ? (krc20Token?.ca as string) : (krc20Token?.tick as string)
  );
  useEffect(() => {
    if (listOrders != null && listOrders.length > 0) {
      setFilteredItems(listOrders);
    }
  }, [listOrders]);

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={`${t('Locked')} ${tokenName}`}
      />
      {isLoading && (
        <Row justifyCenter>
          <Icon>
            <LoadingOutlined />
          </Icon>
        </Row>
      )}

      {isError && (
        <Column justifyCenter gap="sm">
          <Text text={error ? error?.message : 'error'} textCenter preset="sub" color="textDim" selectText mt="xl" />
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
      )}

      <Content style={{ gap: '2px' }}>
        <Row justifyBetween itemsCenter>
          <Text text={'You can unlock token by canceling a sell order.'} color="textDim" preset="sub" selectText />
        </Row>

        <VirtualList
          data={filteredItems}
          data-id="list"
          itemHeight={30}
          itemKey={(item) => item.uTxid}
          style={{
            boxSizing: 'border-box'
          }}
        >
          {(item, index) => (
            <ForwardMyItem
              order={item}
              krc20Token={krc20Token}
              setUnlockedTokenPopupVisible={setUnlockedTokenPopupVisible}
              setSelectedOrder={setSelectedOrder}
              autoNav={true}
              key={index}
            />
          )}
        </VirtualList>
        {unlockedTokenPopupVisible && selectedOrder != null && (
          <UnlockKRC20TokenPopover
            order={selectedOrder}
            onClose={async () => {
              setUnlockedTokenPopupVisible(false);
            }}
            onConfirm={async () => {
              tools.showLoading(true);
              try {
                const txId = await wallet.cancelKRC20Order({
                  krc20Tick: (selectedOrder.tick as string) ?? (selectedOrder.ca as string),
                  sendCommitTxId: selectedOrder.uTxid
                });
                if (txId && txId.length > 0) {
                  tools.toastSuccess('token will be unlocked in a few seconds.');
                  const newListOrders = filteredItems?.filter((order) => order.uTxid !== selectedOrder.uTxid);
                  setFilteredItems(newListOrders || []);
                }
              } catch (e: any) {
                tools.toastError(e?.message ? e.message : JSON.stringify(e));
              } finally {
                tools.showLoading(false);
                setUnlockedTokenPopupVisible(false);
              }
            }}
          />
        )}
      </Content>
    </Layout>
  );
}
