import { Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { colors } from '@/ui/theme/colors';
import { useLocationState } from '@/ui/utils';
import { useEffect, useState } from 'react';

export default function TxFailScreen() {
  const { error } = useLocationState<{ error: string }>();
  const [isMassResaon, setIsMassResaon] = useState(false);
  useEffect(() => {
    if (error.includes('is larger than max allowed size of 100000')) {
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

          <Text preset="title" text="Payment Failed" textCenter />
          {isMassResaon && <Text text="You may increase transfer amount to avoid the error below." textCenter />}
          <Text preset="sub" style={{ color: colors.red,wordWrap: 'break-word' }} text={error} textCenter />
        </Column>
      </Content>
    </Layout>
  );
}
