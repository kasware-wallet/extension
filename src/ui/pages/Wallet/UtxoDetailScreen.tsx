import { Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';

import { IKaspaUTXOWithoutBigint } from '@/shared/types';
import { useBlockstreamUrl } from '@/ui/state/settings/hooks';
import { fontSizes } from '@/ui/theme/font';
import { satoshisToAmount, shortAddress } from '@/ui/utils';
import { useLocation } from 'react-router-dom';

export default function UtxoDetailScreen() {
  const { state } = useLocation();
  const { utxoDetail } = state as {
    utxoDetail: IKaspaUTXOWithoutBigint;
  };

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title="History"
      />
      <Content>
        <Column>
          {utxoDetail &&
            Object.entries(utxoDetail).map(([key, value]) => {
              if (key == 'address') {
                return (
                  <div key="address">
                    <Text text="Address" preset="sub" />
                    <Text text={value} style={{ wordWrap: 'break-word' }} />
                  </div>
                );
              }

              if (key == 'outpoint') {
                return <Outpoint key={key} outpoint={value} />;
              }

              if (key == 'utxoEntry') {
                return <UtxoEntry key={key} utxoEntry={value} />;
              }
              return (
                <Row key={key}>
                  <Text text={key} />
                  <Text text={value} preset="sub" />
                </Row>
              );
            })}
        </Column>{' '}
      </Content>
    </Layout>
  );
}
function Outpoint({ outpoint }) {
  const blockstreamUrl = useBlockstreamUrl();
  return (
    <Column>
      <Text text="Transaction ID" preset="sub" />
      <div>
        <Row
          onClick={() => {
            window.open(`${blockstreamUrl}/transaction/${outpoint.transactionId}`);
          }}>
          <Text text={shortAddress(outpoint.transactionId,15) } />
          <Icon icon="link" size={fontSizes.xs} />
        </Row>
      </div>
    </Column>
  );
}
function UtxoEntry({ utxoEntry }: { utxoEntry: IKaspaUTXOWithoutBigint['utxoEntry'] }) {
  return (
    <div>
      <div>UTXO Entry</div>
      <Column mt="md">
        <Row justifyBetween>
          <Text text="Amount" preset="sub" />
          <Row>
            <Text text={`${satoshisToAmount(Number(utxoEntry.amount))} kas`} />
          </Row>
        </Row>
      </Column>
      <Column mt="md">
        <Row justifyBetween>
          <Text text="block DAA Score" preset="sub" />
          <Row>
            <Text text={`${utxoEntry.blockDaaScore}`} />
          </Row>
        </Row>
      </Column>
      <Column mt="md">
        <Row justifyBetween>
          <Text text="is Coinbase" preset="sub" />
          <Row>
            <Text text={`${utxoEntry.isCoinbase}`} />
          </Row>
        </Row>
      </Column>
      <Column mt="md">
        <Text text="script Public Key" preset="sub" />
        <Text text={utxoEntry.scriptPublicKey} style={{ wordWrap: 'break-word' }} />

      </Column>
    </div>
  );
}
