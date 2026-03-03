import { Column, Content, Layout, Row } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { Button } from '@/ui/components/Button';
import { Input } from '@/ui/components/Input';
import { Logo } from '@/ui/components/Logo';
import { Text } from '@/ui/components/Text';
import { useUnlockCallback } from '@/ui/state/global/hooks';
import { getUiType, useWallet } from '@/ui/utils';
import { t } from 'i18next';
import log from 'loglevel';
import qs from 'qs';
import React, { useEffect, useMemo, useState } from 'react';
import { useApproval as useApprovalEVM } from '@/evm/ui/utils';
import { useNavigate, useNavigateOrigin } from '../../MainRoute';

export default function UnlockScreen() {
  const wallet = useWallet();
  const navigate = useNavigate();
  const navigateOrigin = useNavigateOrigin();
  const [, resolveApproval] = useApprovalEVM();
  const [password, setPassword] = useState('');
  const [disabled, setDisabled] = useState(true);
  const UIType = getUiType();
  const isInNotification = UIType.isNotification;
  const unlock = useUnlockCallback();
  const tools = useTools();
  const query = useMemo(() => {
    return qs.parse(location.search, {
      ignoreQueryPrefix: true
    });
  }, [location.search]);
  const btnClick = async () => {
    try {
      await unlock(password);
      if (!isInNotification) {
        const hasVault = await wallet.hasVault();
        if (!hasVault) {
          navigate('WelcomeScreen');
          return;
        } else {
          navigate('WalletTabScreen');
          return;
        }
      }
      if (UIType.isNotification) {
        if (query.from === '/connect-approval') {
          navigateOrigin('/approval-evm?ignoreOtherWallet=1', { replace: true });
        } else {
          resolveApproval();
        }
      }
    } catch (e) {
      log.debug(e);
      tools.toastError('PASSWORD ERROR');
    }
  };

  const handleOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!disabled && 'Enter' == e.key) {
      btnClick();
    }
  };

  useEffect(() => {
    if (password) {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  }, [password]);
  return (
    <Layout>
      <Content preset="middle">
        <Column fullX>
          <Row justifyCenter>
            <Logo preset="large" />
          </Row>
          <Text preset="default" text={t('Accelerating Kaspa adoption') as string} textCenter color="textDim" />
          <Column gap="xl" mt="xxl">
            {/* <Text preset="title-bold" text="Enter your password" textCenter /> */}
            <Input
              preset="password"
              placeholder={t('Password')}
              onChange={(e) => setPassword(e.target.value)}
              onKeyUp={(e) => handleOnKeyUp(e)}
              autoFocus={true}
            />
            <Button disabled={disabled} text={t('Unlock')} preset="primary" onClick={btnClick} />
            <Text
              preset="link"
              color="textDim"
              text={'Forgot password?'}
              onClick={() => navigate('ForgotPasswordScreen')}
              textCenter
            />
          </Column>
        </Column>
      </Content>
    </Layout>
  );
}
