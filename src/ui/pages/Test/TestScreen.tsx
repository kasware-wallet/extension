
import { Column, Content, Layout } from '@/ui/components';
import { AddressTypeCard2 } from '@/ui/components/AddressTypeCard';

export default function TestScreen() {
  return <TestAddressTypeCard />;
}
function TestAddressTypeCard() {
  const items = [
    { address: 'kaspa:1234567890', path: 'm/84\'/0\'/0\'/0/0', satoshis: 100 }
  ];
  return (
    <Layout>
      <Content>
        <Column my="md" mt="md">
          <AddressTypeCard2 label="Modern" items={items} checked />
          <AddressTypeCard2 label="Legacy" items={items} checked={false} />
        </Column>
      </Content>
    </Layout>
  );
}
