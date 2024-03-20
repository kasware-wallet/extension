import { Column, Content, Footer, Header, Layout } from '@/ui/components';
import { NavTabBar } from '@/ui/components/NavTabBar';

export default function DiscoverTabScreen() {
  return (
    <Layout>
      <Header />
      <Content>
        <Column>
          <div>discover</div>
        </Column>
      </Content>
      <Footer px="zero" py="zero">
        <NavTabBar tab="mint" />
      </Footer>
    </Layout>
  );
}
