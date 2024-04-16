/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Card, Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';

import { ImportOutlined, KeyOutlined, PlusCircleOutlined } from '@ant-design/icons';
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
          <Card
            classname="card-select"
            justifyBetween
            mt="md"
            onClick={(e) => {
              navigate('CreateHDWalletScreen', { isImport: false });
            }}>
            <Row>
              <Column style={{ width: 20 }} selfItemsCenter>
                <Icon>
                  <PlusCircleOutlined />
                </Icon>
              </Column>
              <Column>
                <Text text="Create A New Wallet" />
                <Text text={`${t('With seed phrase')}(${t('12 words')}, ${t('24 words')})`} preset="sub" />
              </Column>
            </Row>
          </Card>
          <Card
            classname="card-select"
            justifyBetween
            mt="sm"
            onClick={(e) => {
              navigate('CreateHDWalletScreen', { isImport: true });
            }}>
            <Row>
              <Column style={{ width: 20 }} selfItemsCenter>
                <Icon>
                  <ImportOutlined />
                </Icon>
              </Column>
              <Column>
                <Text text="Import Seed Phrase" />
                <Text text={`${t('Import accounts from another wallet app')}`} preset="sub" />
              </Column>
            </Row>
          </Card>
          <Card
            classname="card-select"
            justifyBetween
            mt="sm"
            onClick={(e) => {
              navigate('CreateSimpleWalletScreen');
            }}>
            <Row>
              <Column style={{ width: 20 }} selfItemsCenter>
                <Icon>
                  <KeyOutlined />
                </Icon>
              </Column>
              <Column>
                <Text text="Import Private Key" />
                <Text text={'Import a single account'} preset="sub" />
              </Column>
            </Row>
          </Card>
        </Column>
      </Content>
    </Layout>
  );
}
