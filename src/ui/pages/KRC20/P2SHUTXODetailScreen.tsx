/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMemo } from 'react';

import type { IP2shOutput } from '@/shared/types';
import { Card, Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { useAppSelector } from '@/ui/state/hooks';
import { selectBlockstreamUrl } from '@/ui/state/settings/reducer';
import { fontSizes } from '@/ui/theme/font';
import { formatLocaleString, shortAddress, useLocationState } from '@/ui/utils';
import { sompiToAmount } from '@/shared/utils/format';

interface LocationState {
  p2shOutput: IP2shOutput;
}

export default function P2SHUTXODetailScreen() {
  const blockstreamUrl = useAppSelector(selectBlockstreamUrl);
  const { p2shOutput } = useLocationState<LocationState>();

  const prettyInscribeJsonString = useMemo(() => {
    if (p2shOutput?.inscribeJsonString) {
      const json = JSON.parse(p2shOutput.inscribeJsonString);
      return JSON.stringify(json, null, 2);
    }
    return '';
  }, [p2shOutput?.inscribeJsonString]);

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={'UTXO'}
      />
      <Content>
        <Column gap="lg">
          <Row justifyBetween fullX itemsCenter py="sm">
            <Text text={'balance: '} color="textDim" />
            <Text
              text={`${formatLocaleString(sompiToAmount(p2shOutput?.balance, 8))} KAS`}
              preset="sub"
              style={{ wordWrap: 'break-word' }}
            />
          </Row>
          <Row justifyBetween fullX itemsCenter py="sm">
            <Text text={'p2sh address: '} color="textDim" />
            <Row
              gap="xs"
              itemsCenter
              onClick={() => {
                window.open(`${blockstreamUrl}/addresses/${p2shOutput?.commitAddress}`);
              }}
            >
              <div className="text-select">
                <Text text={shortAddress(p2shOutput?.commitAddress)} preset="link" />
              </div>
              <Icon icon="link" size={fontSizes.xxs} color="blue" />
            </Row>
          </Row>
          <Row justifyBetween fullX itemsCenter py="sm">
            <Text text={'transaction id: '} color="textDim" />
            <Row
              gap="xs"
              itemsCenter
              onClick={() => {
                window.open(`${blockstreamUrl}/txs/${p2shOutput?.transaction_id}`);
              }}
            >
              <div className="text-select">
                <Text text={shortAddress(p2shOutput?.transaction_id)} preset="link" />
              </div>
              <Icon icon="link" size={fontSizes.xxs} color="blue" />
            </Row>
          </Row>
          <Row justifyBetween></Row>
          <Row justifyCenter fullX mt={'xxl'} mb="sm">
            <Card fullX>
              <div
                style={{
                  userSelect: 'text',
                  maxHeight: 384,
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  flexWrap: 'wrap'
                }}
              >
                {prettyInscribeJsonString}
              </div>
            </Card>
          </Row>
        </Column>
      </Content>
    </Layout>
  );
}
