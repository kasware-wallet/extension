import { Collapse } from 'antd';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import type { Account } from '@/shared/types';
import { Button, Card, Column, Content, Header, Input, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { colors } from '@/ui/theme/colors';
import { copyToClipboard, useWallet } from '@/ui/utils';
import { CopyOutlined, WarningOutlined } from '@ant-design/icons';

type Status = '' | 'error' | 'warning' | undefined;

export default function ExportPrivateKeyScreen() {
  const { t } = useTranslation();
  const { Panel } = Collapse;
  const { state } = useLocation();
  const { account } = state as {
    account: Account;
  };

  const [password, setPassword] = useState('');
  const [disabled, setDisabled] = useState(true);

  const [privateKey, setPrivateKey] = useState({ hex: '', wif: '' });
  const [evmPrivateKey, setEvmPrivateKey] = useState({ hex: '', wif: '' });
  const [_status, setStatus] = useState<Status>('');
  const [error, setError] = useState('');
  const wallet = useWallet();
  const tools = useTools();

  const btnClick = async () => {
    try {
      const _res = await wallet.getPrivateKey(password, account);
      setPrivateKey(_res);
      const privateKeyHex = await wallet.walletEVM.getPrivateKey(password, {
        // pubkey: account.pubkey,
        address: account.evmAddress,
        type: account.type
      });
      if (!privateKeyHex) {
        setError('error, cannot get evm private key');
      } else {
        setEvmPrivateKey({ hex: privateKeyHex, wif: 'wif' });
      }
    } catch (e) {
      setStatus('error');
      setError((e as Error).message);
    }
  };

  const handleOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ('Enter' == e.key) {
      btnClick();
    }
  };

  useEffect(() => {
    setDisabled(true);
    if (password) {
      setDisabled(false);
      setStatus('');
      setError('');
    }
  }, [password]);

  function copy(str: string) {
    copyToClipboard(str);
    tools.toastSuccess(t('Copied'));
  }

  return (
    <Layout>
      <Header
        hideConnectingComp
        onBack={() => {
          window.history.go(-1);
        }}
        title={t('Export Private Key')}
      />
      <Content>
        {privateKey.wif == '' && evmPrivateKey.wif == '' ? (
          <Column gap="xl">
            {/* Warning Banner */}
            <Card
              style={{
                backgroundColor: 'rgba(237, 51, 75, 0.1)',
                border: '1px solid rgba(237, 51, 75, 0.3)',
                borderRadius: 12,
                padding: '24px 16px'
              }}
            >
              <Column itemsCenter gap="md">
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(237, 51, 75, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <WarningOutlined style={{ fontSize: 28, color: colors.red }} />
                </div>
              </Column>
            </Card>

            {/* Warning List */}
            <Column gap="md" style={{ padding: '0 8px' }}>
              {[
                t('Private key alone gives you full access to your account and funds.'),
                t('Never share it with anyone.'),
                t('Private key is only stored in your browser.'),
                t('KasWare will never ask for your private key.')
              ].map((item, index) => (
                <Row key={index} gap="sm" itemsCenter>
                  <div
                    style={{
                      minWidth: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(237, 51, 75, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span style={{ color: colors.red, fontSize: 12, fontWeight: 600 }}>{index + 1}</span>
                  </div>
                  <Text text={item} preset="regular" color="text" />
                </Row>
              ))}
            </Column>

            {/* Password Input Section */}
            <Column gap="sm" style={{ marginTop: 16 }}>
              <Text text={t('Enter your password to continue')} preset="sub" color="textDim" />

              <Input
                preset="password"
                placeholder={t('Password')}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                onKeyUp={(e) => handleOnKeyUp(e)}
                autoFocus={true}
                style={{ backgroundColor: 'transparent', border: 'none' }}
              />
              {error && (
                <Row gap="xs" itemsCenter style={{ marginTop: 4 }}>
                  <WarningOutlined style={{ color: colors.red, fontSize: 12 }} />
                  <Text text={error} preset="sub" color="red" />
                </Row>
              )}
            </Column>

            {/* Action Button */}
            <Button
              disabled={disabled}
              text={t('Show Private Key')}
              preset="primary"
              onClick={btnClick}
              style={{ marginTop: 16, height: 48, borderRadius: 8 }}
            />
          </Column>
        ) : (
          <Column gap="lg">
            {/* Security Warning */}
            <Card
              style={{
                backgroundColor: 'rgba(237, 51, 75, 0.1)',
                border: '1px solid rgba(237, 51, 75, 0.3)',
                borderRadius: 12,
                padding: '16px'
              }}
            >
              <Row gap="sm" itemsCenter>
                <WarningOutlined style={{ fontSize: 20, color: colors.red }} />
                <Text
                  text={t('The private key is the ONLY way to recover your account. Do NOT share it with anyone!')}
                  color="red"
                  preset="regular-bold"
                />
              </Row>
            </Card>

            {/* Info Text */}
            <Text
              text={`${t('If you ever change browsers or move computers')}, ${t(
                'you will need this Private Key to access this account'
              )}. ${t('Save it somewhere safe and secret')}`}
              preset="sub"
              color="textDim"
              textCenter
            />

            {/* Private Keys */}
            <Collapse
              style={{
                backgroundColor: colors.bg5,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                overflow: 'hidden'
              }}
            >
              {privateKey.wif !== '' && (
                <Panel header={<PanelHeader origin={`${t('Kaspa Private Key')}:`} />} key="kaspa">
                  <Card
                    onClick={() => {
                      copy(privateKey.hex);
                    }}
                    style={{
                      backgroundColor: colors.bg4,
                      borderRadius: 8,
                      padding: '12px 16px',
                      border: `1px solid ${colors.border}`,
                      cursor: 'pointer'
                    }}
                  >
                    <Row itemsCenter justifyBetween gap="md">
                      <Text
                        text={privateKey.hex}
                        color="text"
                        preset="regular"
                        style={{
                          overflowWrap: 'anywhere'
                        }}
                      />
                      <CopyOutlined style={{ color: colors.white_muted, fontSize: 16, minWidth: 16 }} />
                    </Row>
                  </Card>
                </Panel>
              )}
              {evmPrivateKey.wif !== '' && (
                <Panel header={<PanelHeader origin={`${t('EVM Private Key')}:`} />} key="evm">
                  <Card
                    onClick={() => {
                      copy(evmPrivateKey.hex);
                    }}
                    style={{
                      backgroundColor: colors.bg4,
                      borderRadius: 8,
                      padding: '12px 16px',
                      border: `1px solid ${colors.border}`,
                      cursor: 'pointer'
                    }}
                  >
                    <Row itemsCenter justifyBetween gap="md">
                      <Text
                        text={evmPrivateKey.hex}
                        color="text"
                        preset="regular"
                        style={{
                          overflowWrap: 'anywhere'
                        }}
                      />
                      <CopyOutlined style={{ color: colors.white_muted, fontSize: 16, minWidth: 16 }} />
                    </Row>
                  </Card>
                </Panel>
              )}
            </Collapse>
          </Column>
        )}
      </Content>
    </Layout>
  );
}

function PanelHeader({ origin }: { origin: string }) {
  return (
    <Row justifyCenter itemsCenter>
      <Text text={origin} preset="sub" color="textDim" textCenter />
    </Row>
  );
}
