import { Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';

import { useBlockstreamUrl } from '@/ui/state/settings/hooks';
import { fontSizes } from '@/ui/theme/font';
import { shortAddress, sompiToAmount } from '@/ui/utils';
import { IUtxoEntry } from 'kaspa-wasm';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

export default function UtxoDetailScreen() {
  const { t } = useTranslation();
  const { state } = useLocation();
  const { utxoDetail } = state as {
    utxoDetail: IUtxoEntry;
  };

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={t('History')}
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
              // if (key == 'utxoEntry') {
              //   return <UtxoEntry key={key} utxoEntry={value} />;
              // }
              if (key == 'amount') {
                return (
                  <Column mt="md" key={key}>
                    <Row justifyBetween>
                      <Text text="Amount" preset="sub" />
                      <Row>
                        <Text text={`${sompiToAmount(Number(value))} kas`} />
                      </Row>
                    </Row>
                  </Column>
                );
              }
              if (key == 'scriptPublicKey') {
                return (
                  <Column mt="md" key={key}>
                    <Text text="script Public Key" preset="sub" />
                    <Text text={value.script} style={{ wordWrap: 'break-word' }} />
                  </Column>
                );
              }
              if (key == 'blockDaaScore') {
                return (
                  <Column mt="md" key={key}>
                    <Row justifyBetween>
                      <Text text="Block DAA Score" preset="sub" />
                      <Row>
                        <Text text={`${value}`} />
                      </Row>
                    </Row>
                  </Column>
                );
              }
              if (key == 'isCoinbase') {
                return (
                  <Column mt="md" key={key}>
                    <Row justifyBetween>
                      <Text text="is Coinbase" preset="sub" />
                      <Row>
                        <Text text={`${value}`} />
                      </Row>
                    </Row>
                  </Column>
                );
              }
              return (
                <Row key={key}>
                  <Text text={key} preset="sub" />
                  <Text text={value} />
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
          <Text text={shortAddress(outpoint.transactionId, 15)} />
          <Icon icon="link" size={fontSizes.xs} />
        </Row>
      </div>
    </Column>
  );
}
