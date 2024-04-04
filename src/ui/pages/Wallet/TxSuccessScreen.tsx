import { Button, Column, Content, Footer, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { useNavigate } from '@/ui/pages/MainRoute';
import { useBlockstreamUrl } from '@/ui/state/settings/hooks';
import { spacing } from '@/ui/theme/spacing';
import { useLocationState } from '@/ui/utils';
import { useTranslation } from 'react-i18next';

interface LocationState {
  txid: string;
}

export default function TxSuccessScreen() {
  const { t } = useTranslation();
  const { txid } = useLocationState<LocationState>();
  const navigate = useNavigate();
  const blockstreamUrl = useBlockstreamUrl();

  return (
    <Layout>
      <Header />

      <Content style={{ gap: spacing.small }}>
        <Column justifyCenter mt="xxl" gap="xl">
          <Row justifyCenter>
            <Icon icon="success" size={50} style={{ alignSelf: 'center' }} />
          </Row>

          <Text preset="title" text={t('Payment Sent')} textCenter />
          <Text preset="sub" text={t('Your transaction has been successfully sent')} color="textDim" textCenter />

          <Row
            justifyCenter
            onClick={() => {
              window.open(`${blockstreamUrl}/tx/${txid}`);
            }}>
            <Icon icon="eye" color="textDim" />
            <Text preset="regular-bold" text={t('View on Block Explorer')} color="textDim" />
          </Row>
        </Column>
      </Content>
      <Footer>
        <Button
          full
          text={t('Done')}
          onClick={() => {
            navigate('MainScreen');
          }}
        />
      </Footer>
    </Layout>
  );
}
