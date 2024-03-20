/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NetworkType } from '@/shared/types';
import { Card, Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { useReloadAccounts } from '@/ui/state/accounts/hooks';
import { useChangeNetworkTypeCallback, useNetworkType, useRpcLinks } from '@/ui/state/settings/hooks';
import {
  CheckCircleFilled,
  SettingOutlined
} from '@ant-design/icons';
import { useNavigate } from '../MainRoute';

export default function NetworkTypeScreen() {
  const networkType = useNetworkType();
  const currentRpcLinks = useRpcLinks()
  const changeNetworkType = useChangeNetworkTypeCallback();
  const reloadAccounts = useReloadAccounts();
  const tools = useTools();
  const navigate = useNavigate();
  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title="Switch Network"
      />
      <Content>
        <Column>
          {currentRpcLinks.map((item, index) => {
            return (
              item.value !== NetworkType.Simnet && (
                <Card
                  key={index}
                  mt="lg">
                  <Row full
                    onClick={async () => {
                      if (item.value == networkType) {
                        return;
                      }
                      await changeNetworkType(item.value);
                      reloadAccounts();
                      navigate('MainScreen');
                      tools.toastSuccess('Network type changed');
                    }}>
                    <Column style={{ width: 20 }} selfItemsCenter>
                      {item.value == networkType && (
                        <Icon>
                          <CheckCircleFilled />
                        </Icon>
                      )}
                    </Column>
                    <Column justifyCenter>
                      <Text text={item.label} />
                      <Text text={item.url} preset="sub" />
                    </Column>
                    {/* <Column justifyCenter>
                      {item.value == networkType && <Icon icon="check" />}
                    </Column> */}
                  </Row>
                  <Column relative>
                    <Icon
                      onClick={(e) => {
                        navigate('EditNetworkUrlScreen', { item });
                        // setOptionsVisible(!optionsVisible);
                      }}>
                      <SettingOutlined />
                    </Icon>
                  </Column>
                </Card>
              )
            );
          })}
        </Column>
      </Content>
    </Layout>
  );
}
