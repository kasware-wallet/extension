import { Card, Column, Content, Header, Layout, Row, Text } from '@/ui/components';
import { RightOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface Setting {
  label?: string;
  value?: string;
  desc?: string;
  danger?: boolean;
  action: string;
  route: string;
  right: boolean;
}

export default function AppsOptionScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const SettingList: Setting[] = [
    {
      label: t('Retrieve Incomplete KRC20 UTXOs'),
      value: '',
      desc: '',
      action: 'retrievep2shutxo',
      route: '/krc20/retrievep2shutxo',
      right: true
    }
  ];

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={'Add-ons Option'}
      />
      <Content>
        <Column>
          <div>
            {SettingList.map((item) => {
              return (
                <Card
                  classname="card-select"
                  key={item.action}
                  mt="md"
                  onClick={() => {
                    navigate(item.route);
                  }}
                >
                  <Row full justifyBetween>
                    <Column justifyCenter>
                      <Text text={item.label || item.desc} preset="regular-bold" />
                      {item.value != undefined && item.value?.length > 0 && <Text text={item.value} preset="sub" />}
                    </Column>
                    <Column justifyCenter>
                      {item.right && <RightOutlined style={{ transform: 'scale(1.2)', color: '#AAA' }} />}
                    </Column>
                  </Row>
                </Card>
              );
            })}
          </div>
        </Column>
      </Content>
    </Layout>
  );
}
