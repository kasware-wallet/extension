import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import type { TKasplexOp, TKRC20History, TKRC20HistoryIssue } from '@/shared/types';
import { Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { EndCard, MiddleCard, StartCard } from '@/ui/components/Card';
import { useAppSelector } from '@/ui/state/hooks';
import { selectBlockstreamUrl } from '@/ui/state/settings/reducer';
import { fontSizes } from '@/ui/theme/font';
import { copyToClipboard, formatLocaleString, shortAddress } from '@/ui/utils';
import { CopyOutlined } from '@ant-design/icons';
import { sompiToAmount } from '@/shared/utils/format';

interface IInfo {
  name: string;
  value: string;
}

export default function KSPR721TxDetailScreen() {
  const { state } = useLocation();
  const { txDetail, op } = state as {
    txDetail: TKRC20History | TKRC20HistoryIssue;
    op: TKasplexOp;
  };
  const { t } = useTranslation();
  const [title, setTitle] = useState<string>('');
  const blockstreamUrl = useAppSelector(selectBlockstreamUrl);
  useEffect(() => {
    if (op == 'mint') setTitle('Mint');
    if (op == 'deploy') setTitle('Deploy');
    if (op == 'transfer') setTitle('Transfer');
    if (op == 'discount') setTitle('Send');
    setTitle(op);
    const titleName = op.charAt(0)?.toUpperCase() + op?.slice(1);
    setTitle(titleName ? titleName : '');
  }, [op]);
  const tools = useTools();
  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={t(title ?? '')}
      />

      <Content>
        <Column gap="zero">
          {txDetail?.p != undefined && (
            <StartCard key={'p'}>
              <Row justifyBetween full itemsCenter py="sm">
                <Text text="Protocol" preset="sub" selectText />
                <Text text={txDetail.p} wrap selectText />
              </Row>
            </StartCard>
          )}
          {txDetail?.deployer != undefined && (
            <MiddleCard key={'deployer'}>
              <Row justifyBetween full itemsCenter py="sm">
                <Text text="Deployer" preset="sub" selectText />
                <Row
                  justifyCenter
                  itemsCenter
                  gap="xs"
                  onClick={() => {
                    copyToClipboard(txDetail.deployer).then(() => {
                      tools.toastSuccess(t('Copied'));
                    });
                  }}
                >
                  <Text text={shortAddress(txDetail.deployer, 8)} wrap selectText />
                  <CopyOutlined style={{ color: '#888', fontSize: 14 }} />
                </Row>
              </Row>
            </MiddleCard>
          )}
          {txDetail?.to != undefined && (
            <MiddleCard key={'to'}>
              <Row justifyBetween full itemsCenter py="sm">
                <Text text="To" preset="sub" selectText />
                <Row
                  justifyCenter
                  itemsCenter
                  gap="xs"
                  onClick={() => {
                    copyToClipboard(txDetail.to).then(() => {
                      tools.toastSuccess(t('Copied'));
                    });
                  }}
                >
                  <Text text={shortAddress(txDetail.to, 8)} wrap selectText />
                  <CopyOutlined style={{ color: '#888', fontSize: 14 }} />
                </Row>
              </Row>
            </MiddleCard>
          )}
          {txDetail.tick !== undefined && (
            <MiddleCard key="tick">
              <Row justifyBetween full itemsCenter py="sm">
                <Text text="Tick" preset="sub" selectText />
                <Text text={txDetail.tick} selectText />
              </Row>
            </MiddleCard>
          )}

          {txDetail?.txIdRev != undefined && (
            <MiddleCard key="txIdRev">
              <Row justifyBetween full itemsCenter py="sm">
                <Text text="Reveal TX" preset="sub" selectText />
                <Row
                  gap="xs"
                  itemsCenter
                  onClick={() => {
                    window.open(`${blockstreamUrl}/txs/${txDetail?.txIdRev}`);
                  }}
                >
                  <Text preset="link" text={shortAddress(txDetail?.txIdRev, 12)} selectText />
                  <Icon icon="link" size={fontSizes.xxs} color="blue" />
                </Row>
              </Row>
            </MiddleCard>
          )}
          {txDetail?.mtsAdd != undefined && (
            <MiddleCard key={'mtsAdd'}>
              <Row justifyBetween full itemsCenter py="sm">
                <Text text="OP Created at" preset="sub" selectText />
                <Text text={new Date(Number(txDetail?.mtsAdd)).toLocaleString()} wrap selectText />
              </Row>
            </MiddleCard>
          )}
          {txDetail?.op != undefined && (
            <MiddleCard key={'op'}>
              <Row justifyBetween full itemsCenter py="sm">
                <Text text="OP" preset="sub" selectText />
                <Text text={txDetail.op} wrap selectText />
              </Row>
            </MiddleCard>
          )}
          {txDetail?.opError != undefined && (
            <MiddleCard key={'opError'}>
              <Row justifyBetween full itemsCenter py="sm">
                <Text text="OP Error" preset="sub" selectText />
                <Text text={txDetail.opError} wrap selectText color="red" />
              </Row>
            </MiddleCard>
          )}
          {txDetail?.opScore != undefined && (
            <MiddleCard key={'opScore'}>
              <Row justifyBetween full itemsCenter py="sm">
                <Text text="OP Score" preset="sub" selectText />
                <Text text={txDetail.opScore} wrap selectText />
              </Row>
            </MiddleCard>
          )}

          {txDetail?.feeRev != undefined && (
            <EndCard key={'feeRev'}>
              <Row justifyBetween full itemsCenter py="sm">
                <Text text="Reveal Fee" preset="sub" />
                <Text text={formatLocaleString(sompiToAmount(txDetail.feeRev, 8)) + ' KAS'} wrap />
              </Row>
            </EndCard>
          )}
        </Column>
        <Text text="raw data" preset="bold" />

        <Column style={{ backgroundColor: '#272626' }} px="md" py="md">
          <div
            style={{
              userSelect: 'text',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              flexWrap: 'wrap',
              fontSize: '1rem'
            }}
          >
            {JSON.stringify(txDetail, null, 2)}
          </div>
        </Column>
      </Content>
    </Layout>
  );
}
