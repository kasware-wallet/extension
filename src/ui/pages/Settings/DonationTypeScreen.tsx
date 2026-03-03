import { DONATION_ADDRESS } from '@/shared/constant';
import { Column, Content, Header, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { sizes } from '@/ui/theme/spacing';
import { copyToClipboard, shortAddress } from '@/ui/utils';
import { CopyOutlined } from '@ant-design/icons';
import QRCode from 'qrcode.react';
import { useTranslation } from 'react-i18next';

export default function DonationTypeScreen() {
  const { t } = useTranslation();
  const tools = useTools();
  const address = DONATION_ADDRESS;
  const length = 10;

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={'Donation'}
      />
      <Content>
        <Column gap="xl" mt="lg">
          <Column
            justifyCenter
            rounded
            style={{ backgroundColor: 'white', alignSelf: 'center', alignItems: 'center', padding: 10 }}
          >
            <QRCode value={address} renderAs="svg" size={sizes.qrcode}></QRCode>
          </Column>
          <Row
            selfItemsCenter
            itemsCenter
            onClick={() => {
              copyToClipboard(address).then(() => {
                tools.toastSuccess(t('Copied'));
              });
            }}
          >
            <Text text={shortAddress(address, length)} color="textDim" style={{ wordWrap: 'normal' }} />
            <CopyOutlined style={{ color: '#888', fontSize: 14 }} />
          </Row>
        </Column>
      </Content>
    </Layout>
  );
}
