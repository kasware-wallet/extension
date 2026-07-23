/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ADDRESS_TYPES } from '@/shared/constant';
import type { WalletKeyring } from '@/shared/types';
import { AddressType } from '@/shared/types';
import { Button, Card, Column, Content, Grid, Header, Input, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { colors } from '@/ui/theme/colors';
import { copyToClipboard, useLocationState, useWallet } from '@/ui/utils';
import { CopyOutlined, WarningOutlined } from '@ant-design/icons';

type Status = '' | 'error' | 'warning' | undefined;

export default function ExportMnemonicsScreen() {
  const { keyring } = useLocationState<{ keyring: WalletKeyring }>();

  const { t } = useTranslation();

  const [password, setPassword] = useState('');
  const [disabled, setDisabled] = useState(true);

  const [mnemonic, setMnemonic] = useState('');
  const [status, setStatus] = useState<Status>('');
  const [error, setError] = useState('');
  const wallet = useWallet();
  const tools = useTools();

  const [passphrase, setPassphrase] = useState('');
  const [addressTypeStr, setAddressTypeStr] = useState('');

  const btnClick = async () => {
    try {
      const { mnemonic, passphrase, addressType } = await wallet.getMnemonics(password, keyring);
      setMnemonic(mnemonic);
      setPassphrase(passphrase);
      switch (addressType) {
        case AddressType.KASPA_44_972:
          setAddressTypeStr('legacy');
          break;
        case AddressType.KASPA_ONEKEY_44_111111:
          setAddressTypeStr('OneKey');
          break;
        case AddressType.KASPA_TANGEM_44_111111:
          setAddressTypeStr('Tangem(ECDSA)');
          break;
        case AddressType.KASPA_CHAINGE_44_111111_0_0:
          setAddressTypeStr('Chainge');
          break;
        default:
          setAddressTypeStr('standard');
          break;
      }
    } catch (e) {
      setStatus('error');
      setError((e as any).message);
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
  const words = mnemonic.split(' ');

  const pathName = ADDRESS_TYPES.find((v) => v.hdPath === keyring.hdPath)?.name || 'custom';
  return (
    <Layout>
      <Header
        hideConnectingComp
        onBack={() => {
          window.history.go(-1);
        }}
        title={t('Seed Phrase')}
      />

      <Content>
        {mnemonic === '' ? (
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
                t('Seed phrase alone gives you full access to your wallets and funds.'),
                t('Never share it with anyone.'),
                t('Seed phrase is only stored in your browser.'),
                t('KasWare will never ask for your seed phrase.')
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
              text={t('Show Seed Phrase')}
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
                  text={`The seedphrase ${
                    passphrase ? 'and passphrase are' : 'is'
                  } the ONLY way to recover your wallet. Do NOT share it with anyone!`}
                  color="red"
                  preset="regular-bold"
                />
              </Row>
            </Card>

            {/* Copy All Button */}
            <Button
              preset="default"
              text={t('Copy Seed Phrase')}
              onClick={() => copy(mnemonic)}
              RightAccessory={<CopyOutlined style={{ color: colors.white_muted, fontSize: 14 }} />}
              style={{
                height: 44,
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.bg5
              }}
            />

            {/* Seed Phrase Grid */}
            <Card
              style={{
                backgroundColor: colors.bg5,
                borderRadius: 12,
                padding: '20px 16px',
                border: `1px solid ${colors.border}`
              }}
            >
              <Grid columns={3} gap="sm">
                {words.map((v, index) => (
                  <Row key={index} justifyCenter>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: 100,
                        backgroundColor: colors.bg4,
                        borderRadius: 8,
                        padding: '10px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        border: `1px solid ${colors.border}`
                      }}
                    >
                      <span style={{ color: colors.white_muted, fontSize: 11, fontWeight: 500, minWidth: 18 }}>
                        {index + 1}
                      </span>
                      <span style={{ color: colors.white, fontSize: 13, fontWeight: 500 }}>{v}</span>
                    </div>
                  </Row>
                ))}
              </Grid>
            </Card>

            {/* Passphrase Card */}
            {passphrase && (
              <Card
                onClick={() => copy(passphrase)}
                style={{
                  backgroundColor: colors.bg5,
                  borderRadius: 12,
                  padding: '16px',
                  cursor: 'pointer',
                  border: `1px solid ${colors.border}`,
                  transition: 'all 0.2s'
                }}
              >
                <Row fullX justifyBetween itemsCenter>
                  <Row gap="sm" itemsCenter>
                    <Text text={t('Passphrase:')} preset="sub" color="textDim" />
                    <Text text={passphrase} preset="regular-bold" disableTranslate />
                  </Row>
                  <CopyOutlined style={{ color: colors.white_muted, fontSize: 14 }} />
                </Row>
              </Card>
            )}

            {/* Wallet Info Card */}
            <Card
              style={{
                backgroundColor: colors.bg5,
                borderRadius: 12,
                padding: '16px',
                border: `1px solid ${colors.border}`
              }}
            >
              <Column gap="md">
                <Row
                  fullX
                  justifyBetween
                  itemsCenter
                  onClick={() => copy(keyring.hdPath)}
                  style={{ cursor: 'pointer' }}
                >
                  <Text text={t('Derivation Path:')} preset="sub" color="textDim" />
                  <Row gap="xs" itemsCenter>
                    <Text text={`${keyring.hdPath} (${pathName})`} preset="regular" disableTranslate />
                    <CopyOutlined style={{ color: colors.white_muted, fontSize: 12 }} />
                  </Row>
                </Row>
                {addressTypeStr && (
                  <Row fullX justifyBetween itemsCenter>
                    <Text text={t('Address Type:')} preset="sub" color="textDim" />
                    <Text text={addressTypeStr} preset="regular" disableTranslate />
                  </Row>
                )}
              </Column>
            </Card>
          </Column>
        )}
      </Content>
    </Layout>
  );
}
