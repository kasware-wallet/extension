import { Card, Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { useReloadAccounts } from '@/ui/state/accounts/hooks';
import { useChangeLocaleCallback, useLocale } from '@/ui/state/settings/hooks';
import { CheckCircleFilled } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { LANGS } from '@/shared/constant/i18n';

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
        <Column full classname="flex flex-col gap-3 px-4">
          {LANGS.map((item) => {
            return (
              <Card key={item.code}>
                <Row
                  full
                  onClick={async () => {
                    if (item.code === locale) {
                      return;
                    }
                    await changeLanguageType(item.code);
                    reloadAccounts();
                    tools.toastSuccess(t('Language type changed'));
                  }}
                >
                  <Column style={{ width: 20 }} selfItemsCenter>
                    {item.code === locale && (
                      <Icon>
                        <CheckCircleFilled />
                      </Icon>
                    )}
                  </Column>
                  <Column justifyCenter>
                    <Text text={item.name} preset="regular-bold" />
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
