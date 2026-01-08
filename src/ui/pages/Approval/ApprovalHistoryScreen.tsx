import { Collapse } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { IApprovalHistoryItem } from '@/shared/types';
import { Column, Content, Header, Layout, Row, Text } from '@/ui/components';
import { Empty } from '@/ui/components/Empty';
import { selectCurrentKaspaAddress } from '@/ui/state/accounts/reducer';
import { useAppSelector } from '@/ui/state/hooks';
import { selectNetworkId } from '@/ui/state/settings/reducer';
import { useWallet } from '@/ui/utils';

export default function ApprovalHistoryScreen() {
  const { t } = useTranslation();
  const networkId = useAppSelector(selectNetworkId);
  const address = useAppSelector(selectCurrentKaspaAddress);
  const { Panel } = Collapse;

  const [history, setHistory] = useState<IApprovalHistoryItem[]>([]);
  const wallet = useWallet();

  useEffect(() => {
    wallet
      .getApprovalHistory(networkId, address)
      .then((res) => {
        if (res && res.length > 0) {
          setHistory(res);
        }
      })
      .catch((err) => {
        console.error(err?.message);
      });
  }, [networkId, address]);

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={`Approval/Sign ${t('History')}`}
      />
      <Content gap="sm" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <Column full>
          {(history == undefined || history?.length == 0) && <Empty />}
          {history != undefined && history?.length > 0 && (
            <Collapse
              style={{
                backgroundColor: 'rgb(42, 38, 38)'
              }}
            >
              {history.map((item) => (
                <Panel header={<PanelHeader origin={item.origin} time={item.time} />} key={item.time}>
                  <Column full>
                    <Row justifyBetween>
                      <Text text={item.fnName} selectText />
                      <Text text="" />
                    </Row>
                    {item.params?.length > 0 ? (
                      <Row full>
                        <Text
                          text={item.params}
                          selectText
                          preset="sub"
                          style={{
                            userSelect: 'text',
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            flexWrap: 'wrap'
                          }}
                        />
                      </Row>
                    ) : null}
                  </Column>
                </Panel>
              ))}
            </Collapse>
          )}
        </Column>
      </Content>
    </Layout>
  );
}

function PanelHeader({ origin, time }: Omit<IApprovalHistoryItem, 'fnName' | 'params'>) {
  return (
    <Row justifyBetween>
      <Text
        text={origin}
        preset="sub"
        style={{
          userSelect: 'text',
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          flexWrap: 'wrap'
        }}
      />
      <Text text={new Date(time).toLocaleString()} preset="sub" selectText />
    </Row>
  );
}
