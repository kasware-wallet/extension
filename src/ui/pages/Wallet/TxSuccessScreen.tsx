import { Button, Column, Content, Footer, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { useNavigate } from '@/ui/pages/MainRoute';
import { useBlockstreamUrl } from '@/ui/state/settings/hooks';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';
import { shortAddress, sompiToAmount, useLocationState } from '@/ui/utils';
import { ExportOutlined } from '@ant-design/icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface LocationState {
  txid: string;
  rawtx: string;
}

export default function TxSuccessScreen() {
  const { t } = useTranslation();
  const { txid, rawtx } = useLocationState<LocationState>();
  const navigate = useNavigate();
  const blockstreamUrl = useBlockstreamUrl();
  const toAddrss = useMemo(() => {
    const result = JSON.parse(rawtx);
    return result.to;
  }, []);
  const inputAmount = useMemo(() => {
    const result = JSON.parse(rawtx);
    const inputAmountSompi = result.amountSompi;
    return sompiToAmount(inputAmountSompi);
  }, []);

  return (
    <Layout>
      <Header />

      <Content style={{ gap: spacing.small }}>
        <Column justifyCenter mt="xxl" gap="xl">
          <Row justifyCenter mt="xxl">
            <Icon icon="success" size={70} style={{ alignSelf: 'center' }} />
          </Row>
          <Text preset="title" text={t('Sent')} textCenter size='xxxl'/>
          <Text text={`${inputAmount} KAS ${t('was successfully sent to')}`} color="textDim" textCenter />
          <Text text={shortAddress(toAddrss)} color="textDim" textCenter />
          <Row
            justifyCenter
            onClick={() => {
              window.open(`${blockstreamUrl}/transaction/${txid}`);
            }}>
            <ExportOutlined style={{color:colors.aqua,fontSize:14}}/>
            <Text preset="regular-bold" text={t('View transaction')} color="aqua" size='lg'/>
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
