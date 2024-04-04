/* eslint-disable quotes */
import { Button, Column, Content, Layout, Logo, Row, Text } from '@/ui/components';
import { useWallet } from '@/ui/utils';

import { useNavigate } from '../MainRoute';
import { useTranslation } from 'react-i18next';

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const { t } = useTranslation();

  return (
    <Layout>
      <Content preset="middle">
        <Column fullX>
          <Row justifyCenter>
            <Logo preset="large" />
          </Row>
          <Column gap="xl" mt="xxl">
            <Text
              text={t("First Open Source Chrome wallet for Kaspa in the world! Simple and reliable.")}
              preset="sub"
              textCenter
            />

            <Button
              text={t("Create a new wallet")}
              preset="primary"
              onClick={async () => {
                const isBooted = await wallet.isBooted();
                if (isBooted) {
                  navigate('CreateHDWalletScreen', { isImport: false });
                } else {
                  navigate('CreatePasswordScreen', { isNewAccount: true });
                }
              }}
            />
            <Button
              text={t("I already have a wallet")}
              preset="default"
              onClick={async () => {
                const isBooted = await wallet.isBooted();
                if (isBooted) {
                  navigate('CreateHDWalletScreen', { isImport: true });
                } else {
                  navigate('CreatePasswordScreen', { isNewAccount: false });
                }
              }}
            />
          </Column>
        </Column>
      </Content>
    </Layout>
  );
}
