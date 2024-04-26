/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from 'react';

import { DecodedPsbt, RawTxInfo, SignPsbtOptions, ToSignInput, TxType } from '@/shared/types';
import { Button, Card, Column, Content, Footer, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { AddressText } from '@/ui/components/AddressText';
import { WarningPopover } from '@/ui/components/WarningPopover';
import WebsiteBar from '@/ui/components/WebsiteBar';
import { useAccountAddress, useCurrentAccount } from '@/ui/state/accounts/hooks';
import { usePrepareSendKASCallback } from '@/ui/state/transactions/hooks';
import { colors } from '@/ui/theme/colors';
import { fontSizes } from '@/ui/theme/font';
import { amountToSompi, sompiToAmount, useApproval, useWallet } from '@/ui/utils';
import { LoadingOutlined } from '@ant-design/icons';
import { t } from 'i18next';

interface Props {
  header?: React.ReactNode;
  params: {
    data: {
      psbtHex: string;
      options: SignPsbtOptions;
      type: TxType;
      toAddress?: string;
      sompi?: number;
      feeRate?: number;
      rawTxInfo?: RawTxInfo;
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

enum TabState {
  DETAILS,
  DATA,
  HEX
}


function SignTxDetails({ txInfo, type, rawTxInfo }: { txInfo: TxInfo; rawTxInfo?: RawTxInfo; type: TxType }) {
  const address = useAccountAddress();

  const isCurrentToPayFee = useMemo(() => {
    if (type === TxType.SIGN_TX) {
      return false;
    } else {
      return true;
    }
  }, [type]);

  const spendSompi = useMemo(() => {
    if (txInfo.decodedPsbt.outputInfos.length > 0) {
      const amountSompi = txInfo.decodedPsbt.outputInfos[0].value;
      return amountSompi;
    } else {
      return 0;
    }
  }, [txInfo.decodedPsbt]);

  const sendingSompi = useMemo(() => {
    const inValue = txInfo.decodedPsbt.inputInfos
      .filter((v) => v.address === address)
      .reduce((pre, cur) => cur.value + pre, 0);
    return inValue;
  }, [txInfo.decodedPsbt]);

  const receivingSompi = useMemo(() => {
    const outValue = txInfo.decodedPsbt.outputInfos
      .filter((v) => v.address === address)
      .reduce((pre, cur) => cur.value + pre, 0);
    return outValue;
  }, [txInfo.decodedPsbt]);

  const spendAmount = useMemo(() => sompiToAmount(spendSompi), [spendSompi]);
  const balanceChangedAmount = useMemo(
    () => sompiToAmount(receivingSompi - sendingSompi),
    [sendingSompi, receivingSompi]
  );
  const feeAmount = useMemo(() => sompiToAmount(txInfo.decodedPsbt.fee), [txInfo.decodedPsbt]);
  // const feeAmount = useMemo(() => sompiToAmount(rawTxInfo?.fee), [txInfo.decodedPsbt]);
  const priorityFeeAmount = useMemo(() => {
    const priorityFee = Number(sompiToAmount(txInfo.decodedPsbt.feeRate * Number(amountToSompi(feeAmount))));
    return priorityFee;
  }, [txInfo.decodedPsbt]);

  if (type === TxType.SIGN_TX) {
    return (
      <Column gap="lg">
        <Text text={t('Sign Transaction') as string} preset="title-bold" textCenter mt="lg" />
        <Row justifyCenter>
          <Card style={{ backgroundColor: '#272626', maxWidth: 320, width: 320 }}>
            <Column gap="lg">
              <Column>
                <Column>
                  <Column justifyCenter>
                    <Row itemsCenter>
                      <Text
                        text={(receivingSompi > sendingSompi ? '+' : '') + balanceChangedAmount}
                        color={receivingSompi > sendingSompi ? 'white' : 'white'}
                        preset="bold"
                        textCenter
                        size="xxl"
                      />
                      <Text text="KAS" color="textDim" />
                    </Row>
                  </Column>
                </Column>
              </Column>
            </Column>
          </Card>
        </Row>
      </Column>
    );
  }

  return (
    <Column gap="lg">
      <Text text={t('Sign Transaction') as string} preset="title-bold" textCenter mt="lg" />
      <Row justifyCenter>
        <Card style={{ backgroundColor: '#272626', maxWidth: 320, width: 320 }}>
          <Column gap="lg">
            <Column>
              {rawTxInfo && (
                <Column>
                  <Text text={t('Send to') as string} textCenter color="textDim" />
                  <Row justifyCenter>
                    <AddressText addressInfo={rawTxInfo.toAddressInfo} textCenter />
                  </Row>
                </Column>
              )}
              {rawTxInfo && <Row style={{ borderTopWidth: 1, borderColor: colors.border }} my="md" />}

              <Column>
                <Text text={t('Spend Amount') as string} textCenter color="textDim" />

                <Column justifyCenter>
                  <Text text={spendAmount} color="white" preset="bold" textCenter size="xxl" />
                  {isCurrentToPayFee && <Text text={`${feeAmount} (${t('network fee')})`} preset="sub" textCenter />}
                  {isCurrentToPayFee && priorityFeeAmount > 0 && (
                    <Text text={`${priorityFeeAmount} (${t('priority fee')})`} preset="sub" textCenter />
                  )}
                </Column>
              </Column>
            </Column>
          </Column>
        </Card>
      </Row>
    </Column>
  );
}

function Section({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <Column>
      <Text text={title} preset="bold" />
      <Card>
        <Row full justifyBetween itemsCenter>
          {children}
        </Row>
      </Card>
    </Column>
  );
}

interface TxInfo {
  changedBalance: number;
  rawtx: string;
  psbtHex: string;
  toSignInputs: ToSignInput[];
  txError: string;
  decodedPsbt: DecodedPsbt;
  isScammer: boolean;
}

const initTxInfo: TxInfo = {
  changedBalance: 0,
  rawtx: '',
  psbtHex: '',
  toSignInputs: [],
  txError: '',
  isScammer: false,
  decodedPsbt: {
    inputInfos: [],
    outputInfos: [],
    fee: 0,
    feeRate: 0,
    risks: [],
    features: {
      rbf: false
    },
  }
};

export default function SignPsbt({
  params: {
    data: { psbtHex, options, type, toAddress, sompi, feeRate, rawTxInfo, ...rest },
    session
  },
  header,
  handleCancel,
  handleConfirm
}: Props) {
  const [getApproval, resolveApproval, rejectApproval] = useApproval();

  const [txInfo, setTxInfo] = useState<TxInfo>(initTxInfo);

  const [tabState, setTabState] = useState(TabState.DATA);

  const prepareSendKAS = usePrepareSendKASCallback();

  const wallet = useWallet();
  const [loading, setLoading] = useState(true);

  const tools = useTools();

  const address = useAccountAddress();
  const currentAccount = useCurrentAccount();

  const [isWarningVisible, setIsWarningVisible] = useState(false);

  const init = async () => {
    let txError = '';
    if (type === TxType.SEND_KASPA) {
      // request from kasware provider
      if (!psbtHex && toAddress && sompi) {
        try {
          const rawTxInfo = await prepareSendKAS({
            toAddressInfo: { address: toAddress, domain: '' },
            toAmount: sompi,
            feeRate,
            enableRBF: false
          });
          psbtHex = rawTxInfo.psbtHex;
        } catch (e) {
          console.log(e);
          txError = (e as any).message;
          tools.toastError(txError);
        }
      }
    }
    if (!psbtHex) {
      setLoading(false);
      setTxInfo(Object.assign({}, initTxInfo, { txError }));
      return;
    }

    const { isScammer } = await wallet.checkWebsite(session?.origin || '');

    const decodedPsbt = await wallet.decodePsbt(psbtHex);

    if (decodedPsbt.risks.length > 0) {
      setIsWarningVisible(true);
    }

    let toSignInputs: ToSignInput[] = [];
    if (type === TxType.SEND_KASPA) {
      toSignInputs = decodedPsbt.inputInfos.map((v, index) => ({
        index,
        publicKey: currentAccount.pubkey
      }));
    } else {
      try {
        toSignInputs = await wallet.formatOptionsToSignInputs(psbtHex, options);
      } catch (e) {
        txError = (e as Error).message;
        tools.toastError(txError);
      }
    }

    setTxInfo({
      decodedPsbt,
      changedBalance: 0,
      psbtHex,
      rawtx: '',
      toSignInputs,
      txError,
      isScammer
    });

    setLoading(false);
  };

  useEffect(() => {
    init();
  }, []);

  if (!handleCancel) {
    handleCancel = () => {
      rejectApproval();
    };
  }

  if (!handleConfirm) {
    handleConfirm = () => {
      resolveApproval({
        psbtHex: txInfo.psbtHex
      });
    };
  }

  const networkFee = useMemo(() => sompiToAmount(txInfo.decodedPsbt.fee), [txInfo.decodedPsbt]);
  // const networkFee = useMemo(() => sompiToAmount(rawTxInfo?.fee), [txInfo.decodedPsbt]);
  const detailsComponent = useMemo(() => {
    return <SignTxDetails txInfo={txInfo} rawTxInfo={rawTxInfo} type={type} />;
  }, [txInfo]);

  const isValidData = useMemo(() => {
    if (txInfo.psbtHex === '') {
      return false;
    }
    return true;
  }, [txInfo.psbtHex]);

  const isValid = useMemo(() => {
    // if (txInfo.toSignInputs.length == 0) {
    //   return false;
    // }
    // if (txInfo.decodedPsbt.inputInfos.length == 0) {
    //   return false;
    // }
    return true;
  }, [txInfo.decodedPsbt, txInfo.toSignInputs]);

  const canChanged = useMemo(() => {
    let val = true;
    txInfo.decodedPsbt.inputInfos.forEach((v) => {
      if (v.address == address && (!v.sighashType || v.sighashType === 1)) {
        val = false;
      }
    });
    return val;
  }, [txInfo.decodedPsbt]);

  const hasHighRisk = useMemo(() => {
    if (txInfo && txInfo.decodedPsbt) {
      return txInfo.decodedPsbt.risks.find((v) => v.level === 'high') ? true : false;
    } else {
      return false;
    }
  }, [txInfo]);

  if (loading) {
    return (
      <Layout>
        <Content itemsCenter justifyCenter>
          <Icon size={fontSizes.xxxl} color="gold">
            <LoadingOutlined />
          </Icon>
        </Content>
      </Layout>
    );
  }

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
        <Column gap="xl">
          {detailsComponent}
          {canChanged == false && (
            <Section title="Network Fee:">
              <Text text={networkFee} />
              <Text text="KAS" color="textDim" />
            </Section>
          )}

          {canChanged == false && (
            <Section title="Network Fee Rate:">
              <Text text={txInfo.decodedPsbt.feeRate.toString()} />
              <Text text="sat/vB" color="textDim" />
            </Section>
          )}
        </Column>
      </Content>

      <Footer>
        <Row full>
          <Button preset="default" text="Reject" onClick={handleCancel} full />
          {hasHighRisk == false && (
            <Button
              preset="primary"
              text={type == TxType.SIGN_TX ? 'Sign' : 'Sign & Pay'}
              onClick={()=>{
                setLoading(true);
                handleConfirm()
              }}
              disabled={isValid == false}
              full
            />
          )}
        </Row>
      </Footer>
      {isWarningVisible && (
        <WarningPopover
          risks={txInfo.decodedPsbt.risks}
          onClose={() => {
            setIsWarningVisible(false);
          }}
        />
      )}
    </Layout>
  );
}
