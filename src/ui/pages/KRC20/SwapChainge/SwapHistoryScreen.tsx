import { useEffect, useState } from 'react';

import type { IOrder } from '@/shared/types';
import { Card, Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { Empty } from '@/ui/components/Empty';
import { useAccountAddress } from '@/ui/state/accounts/hooks';
import { fontSizes } from '@/ui/theme/font';
import { formatNumberAbbreviated, shortAddress, useWallet } from '@/ui/utils';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/ui/state/hooks';
import { selectBlockstreamUrl, selectNetworkId } from '@/ui/state/settings/reducer';

export default function SwapHistoryScreen() {
  const { t } = useTranslation();
  const networkId = useAppSelector(selectNetworkId);
  const address = useAccountAddress();

  const [history, setHistory] = useState<IOrder[]>([]);
  const wallet = useWallet();

  useEffect(() => {
    wallet
      .getChaingeSwapOrder(networkId, address)
      .then((res) => {
        if (res && res.length > 0) {
          setHistory(res);
        }
      })
      .catch((err) => {
        console.error(err?.message);
      });
  }, [networkId, address, wallet]);

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={`Swap ${t('History')}`}
      />
      <Content gap="sm">
        <Column full>
          {(history == undefined || history?.length == 0) && <Empty />}
          {history != undefined &&
            history?.length > 0 &&
            history.map((item, index) => {
              return <ItemCard key={index} order={item} status={item?.status} />;
            })}
        </Column>
      </Content>
    </Layout>
  );
}

interface IHistoryItem {
  order: IOrder;
  status?: string;
}

function ItemCard({ order, status }: IHistoryItem) {
  const wallet = useWallet();
  const networkId = useAppSelector(selectNetworkId);
  const blockstreamUrl = useAppSelector(selectBlockstreamUrl);
  const address = useAccountAddress();
  const [latestStatus, setLatestStatus] = useState<string>('unknown');
  const [receiveOrRefundId, setReceiveOrRefundId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchStatus = async () => {
      //  status:
      // Unknown, Refunding, Pending //all regarded as pending
      // Succeeded //order executed successfully
      // Dropped //order dropped for any reasons, manual refund is needed
      // Refunded //order cannot proceed for any reasons, system refunded automatically
      // const finalStatuses = ['Succeeded', 'Refunded', 'Dropped', 'Failed'];
      const finalStatuses = ['Refunded', 'Dropped'];
      if (status && finalStatuses.includes(status)) {
        setLatestStatus(status);
      } else if (status && status == 'Succeeded' && order?.receiveOrRefundId && order?.receiveOrRefundId?.length > 0) {
        setLatestStatus(status);
        setReceiveOrRefundId(order?.receiveOrRefundId);
      } else {
        try {
          const response = await wallet.fetchOrderStatus(order?.orderId);
          const { status: newStatus } = response.data;
          setLatestStatus(newStatus);
          setReceiveOrRefundId(response.data?.hash);
          if (newStatus == 'Succeeded') {
            wallet.updateChaingeSwapOrder(networkId, address, {
              ...order,
              status: newStatus,
              receiveOrRefundId: response.data.hash
            });
          } else {
            wallet.updateChaingeSwapOrder(networkId, address, {
              ...order,
              status: newStatus
            });
          }
        } catch (err) {
          console.error(JSON.stringify(err));
        }
      }
    };
    fetchStatus();
  }, [status, order?.orderId, networkId, address, order, wallet]);
  return (
    <Card classname="card-select" fullX>
      <Column full>
        <Row justifyBetween>
          <Text
            text={`order ID: ${order?.orderId}`}
            preset="sub"
            style={{
              userSelect: 'text',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              flexWrap: 'wrap'
            }}
          />
          <Text text={new Date(order?.time).toLocaleString()} preset="sub" selectText />
        </Row>
        <Row justifyBetween>
          <Row>
            <Text
              text={
                order?.payAmount
                  ? formatNumberAbbreviated(Number(order?.payAmount)) + ' ' + order.payTokenTicker
                  : '' + order.payTokenTicker
              }
              selectText
            />
            <Text text={' -> '} selectText />
            <Text
              text={
                order?.receiveAmount
                  ? formatNumberAbbreviated(Number(order?.receiveAmount)) + ' ' + order.receiveTokenTicker
                  : '' + order.receiveTokenTicker
              }
              selectText
            />
          </Row>

          <Text text={latestStatus} selectText />
        </Row>
        {order?.payId != undefined && (
          <Row justifyBetween>
            <Row
              itemsCenter
              onClick={() => {
                window.open(`${blockstreamUrl}/txs/${order?.payId}`);
              }}
            >
              <Text text={shortAddress(order?.payId)} preset="link" selectText />
              <Icon icon="link" size={fontSizes.xxs} color="blue" />
            </Row>
          </Row>
        )}
        {receiveOrRefundId != undefined && receiveOrRefundId.length > 0 && (
          <Row justifyBetween>
            <Row
              itemsCenter
              onClick={() => {
                window.open(`${blockstreamUrl}/txs/${receiveOrRefundId}`);
              }}
            >
              <Text text={shortAddress(receiveOrRefundId)} preset="link" selectText />
              <Icon icon="link" size={fontSizes.xxs} color="blue" />
            </Row>
          </Row>
        )}
      </Column>
    </Card>
  );
}
