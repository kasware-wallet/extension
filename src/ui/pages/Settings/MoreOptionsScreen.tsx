import {
  PATH_AUTO_LOCK_OPTION_SCREEN,
  PATH_CHANGE_PASSWORD_SCREEN,
  PATH_DONATION_TYPE_SCREEN,
  PATH_LANGUAGE_TYPE_SCREEN
} from '@/shared/constant/route-path';
import { Card, Column, Content, Header, Layout, Row, Text } from '@/ui/components';
import { LogoutPopover } from '@/ui/components/LogoutPopover';
import { useAutoLockMinutes } from '@/ui/state/settings/hooks';
import { RightOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function MoreOptionsScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const autoLockMinutes = useAutoLockMinutes();
  const [removeVisible, setRemoveVisible] = useState(false);
  const autoLockDec = useMemo(() => {
    switch (autoLockMinutes) {
      case 5:
        return t('5 minutes after idle');
      case 30:
        return t('30 minutes after idle');
      case 60:
        return t('1 hour after idle');
      case 99999:
        return t('Never');
      default:
        return `${autoLockMinutes} ${t('minutes')}`;
    }
  }, [autoLockMinutes, t]);

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={'More Options'}
      />
      <Content>
        <Column>
          <div>
            <Card
              classname="card-select"
              key="languageType"
              mt="md"
              onClick={() => {
                navigate(PATH_LANGUAGE_TYPE_SCREEN);
              }}
            >
              <Row full justifyBetween>
                <Column justifyCenter>
                  <Text text={t('Language')} preset="regular-bold" />
                </Column>

                <Column justifyCenter>{<RightOutlined style={{ transform: 'scale(1.2)', color: '#AAA' }} />}</Column>
              </Row>
            </Card>
            <Card
              classname="card-select"
              key="password"
              mt="md"
              onClick={() => {
                navigate(PATH_CHANGE_PASSWORD_SCREEN);
              }}
            >
              <Row full justifyBetween>
                <Column justifyCenter>
                  <Row itemsCenter>
                    <Text text={t('Change Password')} preset="regular-bold" />
                  </Row>
                  <Text text={t('Change your lockscreen password')} preset="sub" />
                </Column>

                <Column justifyCenter>
                  <RightOutlined style={{ transform: 'scale(1.2)', color: '#AAA' }} />
                </Column>
              </Row>
            </Card>
            <Card
              classname="card-select"
              key="auto-lock"
              mt="md"
              onClick={() => {
                navigate(PATH_AUTO_LOCK_OPTION_SCREEN);
              }}
            >
              <Row full justifyBetween>
                <Column justifyCenter>
                  <Row itemsCenter>
                    <Text text={t('Auto-lock option')} preset="regular-bold" />
                  </Row>
                  <Text text={autoLockDec} preset="sub" />
                </Column>

                <Column justifyCenter>
                  <RightOutlined style={{ transform: 'scale(1.2)', color: '#AAA' }} />
                </Column>
              </Row>
            </Card>
            <Card
              classname="card-select"
              key="donationType"
              mt="md"
              onClick={() => {
                navigate(PATH_DONATION_TYPE_SCREEN);
              }}
            >
              <Row full justifyBetween>
                <Column justifyCenter>
                  <Text text={t('Donate to us')} preset="regular-bold" />
                </Column>

                <Column justifyCenter>
                  <RightOutlined style={{ transform: 'scale(1.2)', color: '#AAA' }} />
                </Column>
              </Row>
            </Card>
            <Card
              classname="card-select"
              key="logout-wallet"
              mt="md"
              onClick={() => {
                setRemoveVisible(true);
              }}
            >
              <Row full justifyBetween>
                <Column justifyCenter>
                  <Text text={t('Logout')} preset="regular-bold" />
                </Column>

                <Column justifyCenter />
              </Row>
            </Card>
          </div>
        </Column>
        {removeVisible && (
          <LogoutPopover
            onClose={() => {
              setRemoveVisible(false);
            }}
          />
        )}
      </Content>
    </Layout>
  );
}
