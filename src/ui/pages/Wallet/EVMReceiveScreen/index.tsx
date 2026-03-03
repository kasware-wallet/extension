import QRCode from 'qrcode.react';

import { Column, Content, Header, Layout } from '@/ui/components';
import { useCurrentAccount } from '@/ui/state/accounts/hooks';
import { sizes } from '@/ui/theme/spacing';

import { DisplayAddress } from '@/ui/components/AddressBar';
import './index.less';


export default function EVMReceiveScreen() {
  const currentAccount = useCurrentAccount();

  const address = currentAccount?.evmAddress;


  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={currentAccount?.alianName}
      />
      <Content>
        <Column gap="xl" mt="lg">
          <Column
            justifyCenter
            rounded
            style={{ backgroundColor: 'white', alignSelf: 'center', alignItems: 'center', padding: 10 }}>
            <QRCode
              value={address}
              renderAs="svg"
              size={sizes.qrcode}></QRCode>
          </Column>

          <DisplayAddress length={6} address={address} />
        </Column>
      </Content>
    </Layout>
  );
}
