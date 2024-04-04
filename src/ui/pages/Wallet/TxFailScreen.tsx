import { Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { colors } from '@/ui/theme/colors';
import { useLocationState } from '@/ui/utils';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function TxFailScreen() {
  const { t } = useTranslation();
  const { error } = useLocationState<{ error: string }>();
  const [isMassResaon, setIsMassResaon] = useState(false);
  useEffect(() => {
    if (error && error.includes('is larger than max allowed size of 100000')) {
      setIsMassResaon(true);
    }
  }, [error]);
  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
      />
      <Content>
        <Column justifyCenter mt="xxl" gap="xl">
          <Row justifyCenter>
            <Icon icon="delete" size={50} />
          </Row>

          <Text preset="title" text={t('Payment Failed')} textCenter />
          {isMassResaon && <Text text={t('You may increase transfer amount')} textCenter />}
          <Text preset="sub" style={{ color: colors.red, wordWrap: 'break-word' }} text={error} textCenter />
        </Column>
      </Content>
    </Layout>
  );
}
