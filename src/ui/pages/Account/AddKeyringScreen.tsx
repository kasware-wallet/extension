/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Card, Column, Content, Header, Layout, Text } from '@/ui/components';

import { useTranslation } from 'react-i18next';
import { useNavigate } from '../MainRoute';

export default function AddKeyringScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={t('Create a new wallet')}
      />
      <Content>
        <Column>
          <Text text={t('Create Wallet')} preset="regular-bold" />

          <Card
            justifyCenter
            onClick={(e) => {
              navigate('CreateHDWalletScreen', { isImport: false });
            }}>
            <Column full justifyCenter>
              <Text text={`${t('With seed phrase')}(${t('12 words')}, ${t('24 words')})`} size="sm" />
            </Column>
          </Card>

          <Text text={t('Restore Wallet')} preset="regular-bold" mt="lg" />

          <Card
            justifyCenter
            onClick={(e) => {
              navigate('CreateHDWalletScreen', { isImport: true });
            }}>
            <Column full justifyCenter>
              <Text text={`${t('From seed phrase')}(${t('12 words')}, ${t('24 words')})`} size="sm" />
            </Column>
          </Card>

          <Card
            justifyCenter
            onClick={(e) => {
              navigate('CreateSimpleWalletScreen');
            }}>
            <Column full justifyCenter>
              <Text text={t('From single private key')} size="sm" />
            </Column>
          </Card>
        </Column>
      </Content>
    </Layout>
  );
}
