import { Card, Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { useAutoLockMinutes, useChangeAutoLockMinutesCallback } from '@/ui/state/settings/hooks';
import { colors } from '@/ui/theme/colors';
import { fontSizes } from '@/ui/theme/font';
import { CheckCircleFilled, LoadingOutlined } from '@ant-design/icons';
import VirtualList from 'rc-virtual-list';
import { forwardRef, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function AutoLockOptionScreen() {
  const autoLockMinutes = useAutoLockMinutes();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const items = useMemo(() => {
    return [
      { id: 'five-minutes', label: '5 minutes after idle', value: 5 },
      { id: 'thirties-minutes', label: '30 minutes after idle', value: 30 },
      { id: 'one-hour', label: '1 hour after idle', value: 60 },
      { id: 'never', label: 'Never', value: 99999 }
    ];
  }, []);

  const ForwardMyItem = forwardRef(MyItem);

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={t('Auto-lock')}
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
          {(item, index) => (
            <ForwardMyItem
              autoLockMinutes={autoLockMinutes}
              item={item}
              setLoading={setLoading}
              autoNav={true}
              key={index}
            />
          )}
        </VirtualList>
      </Content>
    </Layout>
  );
}
interface MyItemProps {
  item: { id: string; label: string; value: number };
  autoLockMinutes: number;
  setLoading: (loading: boolean) => void;
  autoNav?: boolean;
}
function MyItem({ item, autoLockMinutes, setLoading, autoNav }: MyItemProps, ref) {
  // const autoLockMinutes2 = useAutoLockMinutes();
  const changeAutoLockMinutes = useChangeAutoLockMinutesCallback();
  const selected = useMemo(() => autoLockMinutes === item.value, [autoLockMinutes, item]);

  const tools = useTools();
  return (
    <Row full justifyBetween selfItemsCenter style={{ gap: 2 }}>
      <Card classname="card-select" full justifyBetween mt="md">
        <Row
          full
          onClick={async () => {
            if (autoLockMinutes == item.value) {
              return;
            }
            setLoading(true);
            // await wallet.setAutoLockMinutes(item.value);
            await changeAutoLockMinutes(item.value);
            setLoading(false);
            tools.toastSuccess('Auto-lock time changed');
          }}
        >
          <Column style={{ width: 20 }} selfItemsCenter>
            {selected && (
              <Icon>
                <CheckCircleFilled />
              </Icon>
            )}
          </Column>
          <Column justifyCenter selfItemsCenter>
            <Row justifyBetween>
              <Text text={`${item.label}`} />
            </Row>
          </Column>
        </Row>
      </Card>
    </Row>
  );
}
