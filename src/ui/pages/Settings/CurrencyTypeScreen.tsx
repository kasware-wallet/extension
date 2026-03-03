import type { ICurrencyItem } from '@/shared/types';
import { CURRENCIES } from '@/shared/types';
import { Card, Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { useReloadAccounts } from '@/ui/state/accounts/hooks';
import { useChangeCurrencyCallback, useCurrency } from '@/ui/state/settings/hooks';
import { colors } from '@/ui/theme/colors';
import { fontSizes } from '@/ui/theme/font';
import { CheckCircleFilled, LoadingOutlined } from '@ant-design/icons';
import VirtualList from 'rc-virtual-list';
import { forwardRef, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function CurrencyTypeScreen() {
  const currency = useCurrency();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const items = useMemo(() => {
    return Object.values(CURRENCIES);
  }, []);

  const ForwardMyItem = forwardRef(MyItem);
  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={t('Default Currency')}
      />
      <Content>
        <Column>
          <Row justifyCenter>
            {loading && (
              <Icon>
                <LoadingOutlined
                  style={{
                    fontSize: fontSizes.icon,
                    color: colors.grey
                  }}
                />
              </Icon>
            )}
          </Row>
        </Column>
        <VirtualList
          // data={items}
          data={items}
          data-id="list"
          itemHeight={30}
          itemKey={(item) => item.id}
          // disabled={animating}
          style={{
            boxSizing: 'border-box'
          }}
          // onSkipRender={onAppear}
          // onItemRemove={onAppear}
        >
          {(item, index) => <ForwardMyItem currency={currency} item={item} setLoading={setLoading} key={index} />}
        </VirtualList>
      </Content>
    </Layout>
  );
}
interface MyItemProps {
  item: ICurrencyItem;
  currency: keyof typeof CURRENCIES;
  setLoading: (loading: boolean) => void;
}
function MyItem({ item, currency, setLoading }: MyItemProps, _ref) {
  const changeCurrencyType = useChangeCurrencyCallback();
  const selected = currency === item.id.toUpperCase();

  const tools = useTools();
  const reloadAccounts = useReloadAccounts();
  return (
    <Row full justifyBetween selfItemsCenter style={{ gap: 2 }}>
      <Card
        classname="card-select"
        full
        justifyBetween
        mt="md"
        style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
      >
        <Row
          full
          onClick={async () => {
            if (currency == item.id.toUpperCase()) {
              return;
            }
            setLoading(true);
            await changeCurrencyType(item.id.toUpperCase() as keyof typeof CURRENCIES);

            reloadAccounts();
            setLoading(false);
            tools.toastSuccess('Currency type changed');
          }}
        >
          <Column style={{ width: 20 }} selfItemsCenter>
            {selected && (
              <Icon>
                <CheckCircleFilled />
              </Icon>
            )}
          </Column>
          <Column>
            <Row justifyBetween>
              <Text text={`${item.id.toUpperCase()} - ${item.unit}`} />
            </Row>
            <Text text={item.name} preset="sub" style={{ overflowWrap: 'break-word', wordBreak: 'break-all' }} />
          </Column>
        </Row>
      </Card>
    </Row>
  );
}
