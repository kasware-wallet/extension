import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import type { IKaspaUtxoEntryReference } from '@/shared/types';
import { Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { useAppSelector } from '@/ui/state/hooks';
import { selectBlockstreamUrl, selectKasTick } from '@/ui/state/settings/reducer';
import { fontSizes } from '@/ui/theme/font';
import { shortAddress } from '@/ui/utils';
import { sompiToAmount } from '@/shared/utils/format';

export default function UtxoDetailScreen() {
  const { t } = useTranslation();
  const { state } = useLocation();
  const { utxoDetail } = state as {
    utxoDetail: IKaspaUtxoEntryReference;
  };
  const kasTick = useAppSelector(selectKasTick);

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={t('UTXO')}
      />
      <Content>
        <Column>
          {utxoDetail &&
            Object.entries(utxoDetail.entry).map(([key, value]) => {
              if ((key as keyof typeof utxoDetail.entry) == 'address') {
                return (
                  <div key="address">
                    <Text text="Address" preset="sub" selectText />
                    <Text text={value as string} style={{ wordWrap: 'break-word' }} selectText />
                  </div>
                );
              }

              if ((key as keyof typeof utxoDetail.entry) == 'outpoint') {
                return <Outpoint key={key} outpoint={value} />;
              }
              if ((key as keyof typeof utxoDetail.entry) == 'amount') {
                return (
                  <Column mt="md" key={key}>
                    <Row justifyBetween>
                      <Text text="Amount" preset="sub" selectText />
                      <Row>
                        <Text text={`${sompiToAmount(Number(value), 8)} ${kasTick}`} selectText />
                      </Row>
                    </Row>
                  </Column>
                );
              }
              if ((key as keyof typeof utxoDetail.entry) == 'scriptPublicKey') {
                return (
                  <Column mt="md" key={key}>
                    <Text text="script Public Key" preset="sub" selectText />
                    <Text text={value as string} style={{ wordWrap: 'break-word' }} selectText />
                  </Column>
                );
              }
              if ((key as keyof typeof utxoDetail.entry) == 'blockDaaScore') {
                return (
                  <Column mt="md" key={key}>
                    <Row justifyBetween>
                      <Text text="Block DAA Score" preset="sub" selectText />
                      <Row>
                        <Text text={`${value}`} selectText />
                      </Row>
                    </Row>
                  </Column>
                );
              }
              if ((key as keyof typeof utxoDetail.entry) == 'isCoinbase') {
                return (
                  <Column mt="md" key={key}>
                    <Row justifyBetween>
                      <Text text="is Coinbase" preset="sub" selectText />
                      <Row>
                        <Text text={`${value}`} selectText />
                      </Row>
                    </Row>
                  </Column>
                );
              }
              return (
                <Row key={key}>
                  <Text text={key} preset="sub" selectText />
                  <Text text={value as string} selectText />
                </Row>
              );
            })}
        </Column>{' '}
      </Content>
    </Layout>
  );
}
function Outpoint({ outpoint }) {
  const blockstreamUrl = useAppSelector(selectBlockstreamUrl);
  return (
    <Column>
      <Text text="Transaction ID" preset="sub" selectText />
      <div>
        <Row
          gap="xs"
          itemsCenter
          onClick={() => {
            window.open(`${blockstreamUrl}/txs/${outpoint.transactionId}`);
          }}
        >
          <Text text={shortAddress(outpoint.transactionId)} preset="link" selectText />
          <Icon icon="link" size={fontSizes.xxs} color="blue" />
        </Row>
      </div>
    </Column>
  );
}
