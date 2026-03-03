import { Card, Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { useReloadAccounts } from '@/ui/state/accounts/hooks';
import { useChangeLocaleCallback, useLocale } from '@/ui/state/settings/hooks';
import { CheckCircleFilled } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from '../../../../build/languages.js';

export default function LanguageTypeScreen() {
  const changeLanguageType = useChangeLocaleCallback();
  const locale = useLocale();
  const reloadAccounts = useReloadAccounts();
  const tools = useTools();
  const { t } = useTranslation();
  const [startLang, setStartLang] = useState<(typeof Languages)[0]>(null as unknown as (typeof Languages)[0]);
  const [endLang, setEndLang] = useState<(typeof Languages)[0]>(null as unknown as (typeof Languages)[0]);
  useEffect(() => {
    if (Languages && Languages.length > 0) {
      setStartLang(Languages[0]);
    }
    if (Languages && Languages.length > 1) {
      setEndLang(Languages[Languages.length - 1]);
    }
  }, []);
  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={t('Switch Language')}
      />
      <Content>
        <Column full gap="zero">
          {startLang && (
            <Card
              classname="card-select"
              key={'start'}
              mt="zero"
              mb="xs"
              style={{
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0
              }}
            >
              <Row
                full
                onClick={async () => {
                  if (startLang.symbol == locale) {
                    return;
                  }
                  await changeLanguageType(Languages[0].symbol);
                  reloadAccounts();
                  tools.toastSuccess(t('Language type changed'));
                }}
              >
                <Column style={{ width: 20 }} selfItemsCenter>
                  {startLang.symbol == locale && (
                    <Icon>
                      <CheckCircleFilled />
                    </Icon>
                  )}
                </Column>
                <Column justifyCenter>
                  <Text text={startLang.name} preset="regular-bold" />
                  {/* <Text text={item.symbol} preset="sub" /> */}
                </Column>
              </Row>
            </Card>
          )}
          {Languages &&
            Languages.length > 2 &&
            Languages.map((item, index) => {
              if (index !== 0 && index !== Languages.length - 1) {
                return (
                  <Card
                    classname="card-select"
                    key={index}
                    mt="zero"
                    mb="xs"
                    style={{
                      borderTopLeftRadius: 0,
                      borderTopRightRadius: 0,
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0
                    }}
                  >
                    <Row
                      full
                      onClick={async () => {
                        if (item.symbol == locale) {
                          return;
                        }
                        await changeLanguageType(item.symbol);
                        reloadAccounts();
                        // navigate('WalletTabScreen');
                        tools.toastSuccess(t('Language type changed'));
                      }}
                    >
                      <Column style={{ width: 20 }} selfItemsCenter>
                        {item.symbol == locale && (
                          <Icon>
                            <CheckCircleFilled />
                          </Icon>
                        )}
                      </Column>
                      <Column justifyCenter>
                        <Text text={item.name} preset="regular-bold" />
                        {/* <Text text={item.symbol} preset="sub" /> */}
                      </Column>
                    </Row>
                  </Card>
                );
              }
            })}
          {endLang && (
            <Card
              classname="card-select"
              key={'end'}
              mt="zero"
              mb="xs"
              style={{
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0
              }}
            >
              <Row
                full
                onClick={async () => {
                  if (endLang.symbol == locale) {
                    return;
                  }
                  await changeLanguageType(endLang.symbol);
                  reloadAccounts();
                  // navigate('WalletTabScreen');
                  tools.toastSuccess(t('Language type changed'));
                }}
              >
                <Column style={{ width: 20 }} selfItemsCenter>
                  {endLang.symbol == locale && (
                    <Icon>
                      <CheckCircleFilled />
                    </Icon>
                  )}
                </Column>
                <Column justifyCenter>
                  <Text text={endLang.name} preset="regular-bold" />
                  {/* <Text text={item.symbol} preset="sub" /> */}
                </Column>
              </Row>
            </Card>
          )}
        </Column>
      </Content>
    </Layout>
  );
}
