import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ADDRESS_TYPES } from '@/shared/constant';
import type { WalletKeyring } from '@/shared/types';
import { AddressType } from '@/shared/types';
import { Card, Column, Content, Header, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { copyToClipboard, useLocationState, useWallet } from '@/ui/utils';
import { CopyOutlined } from '@ant-design/icons';

export default function WalletInfoScreen() {
  const { keyring } = useLocationState<{ keyring: WalletKeyring }>();

  const { t } = useTranslation();

  const [xpubStr, setXpubStr] = useState('');
  const [error, setError] = useState('');
  const wallet = useWallet();
  const tools = useTools();

  const [addressTypeStr, setAddressTypeStr] = useState('');

  useEffect(() => {
    const btnClick = async () => {
      try {
        const xpub = await wallet.getXpub(keyring);
        setXpubStr(xpub);
        switch (keyring.addressType) {
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
        setError((e as any).message);
      }
    };
    btnClick();
  }, [keyring, wallet]);

  function copy(str: string) {
    copyToClipboard(str);
    tools.toastSuccess(t('Copied'));
  }

  const pathName = ADDRESS_TYPES.find((v) => v.hdPath === keyring.hdPath)?.name || 'custom';
  return (
    <Layout>
      <Header
        hideConnectingComp
        onBack={() => {
          window.history.go(-1);
        }}
        title={t('Advanced Info')}
      />

      <Content>
        <Column>
          <Card style={{ backgroundColor: '#2c2323' }}>
            <Text
              text={`Exercise extreme caution when handling and sharing your xPub. An xPub allows anyone who possesses it to derive all your public keys and view your entire transaction history and balance.`}
              color="textDim"
              textCenter
              mt="xl"
              mb="xl"
              selectText
            />
          </Card>

          {error && <Text text={error} preset="regular" color="error" selectText />}

          <Row
            mt="xl"
            justifyCenter
            itemsCenter
            onClick={() => {
              copy(xpubStr);
            }}
          >
            <Text text="Copy XPUB" color="textDim" />
            <CopyOutlined style={{ color: '#888', fontSize: 14 }} />
          </Row>

          <Row justifyCenter>
            <Card preset="style2" style={{ margin: '3px 1px', padding: '10px 15px 10px 7px', wordBreak: 'break-word' }}>
              <Row full>
                <Text text={xpubStr} selectText disableTranslate />
              </Row>
            </Card>
          </Row>
          <Card justifyBetween>
            <Column>
              <Row
                fullX
                selfItemsCenter
                onClick={() => {
                  copy(keyring.hdPath);
                }}
              >
                <Text text={'Derivation Path: '} disableTranslate color="textDim" />
                <Text text={`${keyring.hdPath} (${pathName})`} disableTranslate />
              </Row>
              {addressTypeStr && (
                <Row fullX selfItemsCenter>
                  <Text text={'Address Type: '} disableTranslate color="textDim" />
                  <Text text={`${addressTypeStr}`} disableTranslate />
                </Row>
              )}
            </Column>
          </Card>
        </Column>
      </Content>
    </Layout>
  );
}
