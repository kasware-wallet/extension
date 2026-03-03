import { PATH_WELCOME_SCREEN } from '@/shared/constant/route-path';
import { Button, Column, Content, Footer, Header, Layout, Row, Text } from '@/ui/components';
import { ResetWalletPopover } from '@/ui/components/ResetWalletPopover';
import { globalActions } from '@/ui/state/global/reducer';
import { useAppDispatch } from '@/ui/state/hooks';
import { fontSizes } from '@/ui/theme/font';
import { useWallet } from '@/ui/utils';
import { MedicineBoxOutlined } from '@ant-design/icons';
import { Checkbox } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox/Checkbox.js';
import log from 'loglevel';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function ForgotPasswordScreen() {
  const dispatch = useAppDispatch();
  const [checkedOne, setCheckedOne] = useState(false);
  const [checkedTwo, setCheckedTwo] = useState(false);
  const [checkedThree, setCheckedThree] = useState(false);
  const { t } = useTranslation();

  const wallet = useWallet();
  const navigate = useNavigate();
  const [popoverVisible, setPopoverVisible] = useState(false);
  const onChangeOne = (e: CheckboxChangeEvent) => {
    const val = e.target.checked;
    setCheckedOne(val);
  };
  const onChangeTwo = (e: CheckboxChangeEvent) => {
    const val = e.target.checked;
    setCheckedTwo(val);
  };
  const onChangeThree = (e: CheckboxChangeEvent) => {
    const val = e.target.checked;
    setCheckedThree(val);
  };
  return (
    <Layout>
      <Header
        hideConnectingComp
        onBack={() => {
          window.history.go(-1);
        }}
        title={t('Forgot Password')}
      />
      <Content>
        <Column fullX gap="zero" mt="lg" mb="lg">
          <Row justifyCenter mt="xxl" mb="xxl">
            <MedicineBoxOutlined style={{ fontSize: 70 }} />
          </Row>
        </Column>
        <Row>
          <Checkbox onChange={onChangeOne} checked={checkedOne} style={{ fontSize: fontSizes.sm }}>
            <Text text="Your password is stored locally and KasWare Wallet can't help you retrieve it." />
          </Checkbox>
        </Row>
        <Row>
          <Checkbox onChange={onChangeTwo} checked={checkedTwo} style={{ fontSize: fontSizes.sm }}>
            <Text text="If you forget your password, you can reset your wallet and re-import your wallet with its seed phrase or private key." />
          </Checkbox>
        </Row>
        <Row>
          <Checkbox onChange={onChangeThree} checked={checkedThree} style={{ fontSize: fontSizes.sm }}>
            <Text text="If you reset the wallet without backing it up, you'll permanently lose it and all assets. Be sure to back up all your seed phrase or private key before resetting." />
          </Checkbox>
        </Row>
        {popoverVisible && (
          <ResetWalletPopover
            onClose={() => {
              setPopoverVisible(false);
            }}
            onConfirm={async () => {
              log.debug('reset wallet');
              await wallet.logout();
              dispatch(globalActions.reset());
              navigate(PATH_WELCOME_SCREEN);
            }}
          />
        )}
      </Content>

      <Footer>
        <Button
          disabled={!checkedOne || !checkedTwo || !checkedThree}
          text="Reset Wallet"
          preset="primary"
          onClick={async () => {
            setPopoverVisible(true);
          }}
        />
      </Footer>
    </Layout>
  );
}
