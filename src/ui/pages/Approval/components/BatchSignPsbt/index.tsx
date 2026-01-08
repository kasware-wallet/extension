/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';

import type { SignPsbtOptions } from '@/shared/types';
import { TxType } from '@/shared/types';
import { Button, Card, Column, Content, Footer, Header, Layout, Row, Text } from '@/ui/components';
import WebsiteBar from '@/ui/components/WebsiteBar';
import { useApproval, useWallet } from '@/ui/utils';
import { t } from 'i18next';

interface Props {
  header?: React.ReactNode;
  params: {
    data: {
      psbtHex: string;
      options: SignPsbtOptions;
      type: TxType;
      inscribeJsonString: string;
      destAddr?: string;
    };
    session?: {
      origin: string;
      icon: string;
      name: string;
    };
  };
  handleCancel?: () => void;
  handleConfirm?: () => void;
}

function SignTxDetails({ txInfo, type }: { txInfo: TxInfo; type: TxType }) {
  const title = useMemo(() => {
    if (type == TxType.SIGN_KRC20_MINT_BATCH) {
      return t('Batch Mint KRC20 Token') as string;
    }
    if (type == TxType.SIGN_KRC20_TRANSFER_BATCH) {
      return t('Transfer KRC20 Token') as string;
    }
  }, [type]);

  const prettyInscribeJsonString = useMemo(() => {
    if (txInfo?.inscribeJsonString) {
      const json = JSON.parse(txInfo.inscribeJsonString);
      return JSON.stringify(json, null, 2);
    }
    return '';
  }, [txInfo?.inscribeJsonString]);

  if (type == TxType.SIGN_KRC20_MINT_BATCH || type == TxType.SIGN_KRC20_TRANSFER_BATCH) {
    return (
      <Column gap="lg">
        <Text text={title} preset="title-bold" textCenter mt="lg" mb={'md'} />
        <Row justifyCenter fullX mt={'zero'} mb="sm">
          <Card fullX>
            <div
              style={{
                userSelect: 'text',
                maxHeight: 384,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                flexWrap: 'wrap',
                fontSize: '1rem'
              }}
            >
              {prettyInscribeJsonString}
            </div>
          </Card>
        </Row>
      </Column>
    );
  }
}

interface TxInfo {
  psbtHex: string;
  isScammer: boolean;
  inscribeJsonString: string;
  destAddr?: string;
}

const initTxInfo: TxInfo = {
  psbtHex: '',
  isScammer: false,
  inscribeJsonString: '',
  destAddr: ''
};

export default function BatchSignPsbt({
  params: {
    data: { psbtHex, type, inscribeJsonString, destAddr },
    session
  },
  header,
  handleCancel,
  handleConfirm
}: Props) {
  const [, resolveApproval, rejectApproval] = useApproval();
  const [txInfo, setTxInfo] = useState<TxInfo>(initTxInfo);
  const wallet = useWallet();

  const init = async () => {
    if (!psbtHex) {
      if (
        type == TxType.SIGN_KRC20_TRANSFER ||
        type == TxType.SIGN_KRC20_MINT ||
        type == TxType.SIGN_KRC20_MINT_BATCH ||
        type == TxType.SIGN_KRC20_DEPLOY
      ) {
        setTxInfo(Object.assign({}, initTxInfo, { inscribeJsonString, destAddr }));
      } else {
        setTxInfo(Object.assign({}, initTxInfo));
      }
      return;
    }

    const { isScammer } = await wallet.checkWebsite(session?.origin || '');

    setTxInfo({
      psbtHex,
      isScammer,
      inscribeJsonString,
      destAddr
    });
  };

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!handleCancel) {
    handleCancel = () => {
      rejectApproval();
    };
  }

  if (!handleConfirm) {
    handleConfirm = () => {
      if (type === TxType.SIGN_KRC20_DEPLOY || type === TxType.SIGN_KRC20_MINT || type === TxType.SIGN_KRC20_TRANSFER) {
        resolveApproval({
          inscribeJsonString: txInfo.inscribeJsonString,
          type,
          destAddr: txInfo.destAddr
        });
      } else {
        resolveApproval({
          psbtHex: txInfo.psbtHex
        });
      }
    };
  }

  const detailsComponent = useMemo(() => {
    return <SignTxDetails txInfo={txInfo} type={type} />;
  }, [txInfo, type]);

  if (!header && session) {
    header = (
      <Header>
        <WebsiteBar session={session} />
      </Header>
    );
  }

  if (txInfo.isScammer) {
    return (
      <Layout>
        <Content>
          <Column>
            <Text text="Phishing Detection" preset="title-bold" textCenter mt="xxl" />
            <Text text="Malicious behavior and suspicious activity have been detected." mt="md" />
            <Text
              text="Your access to this page has been restricted by KasWare Wallet as it might be unsafe."
              mt="md"
            />
          </Column>
        </Content>

        <Footer>
          <Row full>
            <Button text="Reject (blocked by KasWare Wallet)" preset="danger" onClick={handleCancel} full />
          </Row>
        </Footer>
      </Layout>
    );
  }

  return (
    <Layout>
      {header}
      <Content>
        <Column gap="xxs">
          {detailsComponent}
        </Column>
      </Content>

      <Footer>
        <Row full>
          <Button preset="default" text="Reject" onClick={handleCancel} full />
          <Button
            preset="primary"
            text={type == TxType.SIGN_TX ? 'Sign' : 'Sign & Pay'}
            onClick={() => {
              handleConfirm();
            }}
            full
          />
        </Row>
      </Footer>
    </Layout>
  );
}
