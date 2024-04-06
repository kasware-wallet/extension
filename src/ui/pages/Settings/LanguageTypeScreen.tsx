/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Card, Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { useReloadAccounts } from '@/ui/state/accounts/hooks';
import { useChangeLocaleCallback, useLocale } from '@/ui/state/settings/hooks';
import { CheckCircleFilled } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Languages } from '../../../../build/languages.js';

export default function LanguageTypeScreen() {
  const changeLanguageType = useChangeLocaleCallback();
  const locale = useLocale();
  const reloadAccounts = useReloadAccounts();
  const tools = useTools();
  const { t } = useTranslation();
  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={t('Switch Language')}
      />
      <Content>
        <Column>
          {Languages &&
            Languages.length > 0 &&
            Languages.map((item, index) => {
              return (
                <Card classname="card-select" key={index} mt="lg">
                  <Row
                    full
                    onClick={async () => {
                      if (item.symbol == locale) {
                        return;
                      }
                      await changeLanguageType(item.symbol);
                      reloadAccounts();
                      // navigate('MainScreen');
                      tools.toastSuccess(t('Language type changed'));
                    }}>
                    <Column style={{ width: 20 }} selfItemsCenter>
                      {item.symbol == locale && (
                        <Icon>
                          <CheckCircleFilled />
                        </Icon>
                      )}
                    </Column>
                    <Column justifyCenter>
                      <Text text={item.name} />
                      {/* <Text text={item.symbol} preset="sub" /> */}
                    </Column>
                  </Row>
                </Card>
              );
            })}
        </Column>
      </Content>
    </Layout>
  );
}
