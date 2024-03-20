import { Column, Content, Header, Layout, TextArea } from '@/ui/components';
import { fontSizes } from '@/ui/theme/font';

const disclaimStr = 'buy kas';
export default function FiatPayScreen() {
  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title="Buy"
      />
      <Content>
        <Column gap="xl" mt="lg">
          <Column justifyCenter rounded>
            <TextArea text={disclaimStr} style={{ fontSize: fontSizes.sm }} />
          </Column>
        </Column>
      </Content>
    </Layout>
  );
}
