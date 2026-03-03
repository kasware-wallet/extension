/* eslint-disable @typescript-eslint/no-explicit-any */

import { t } from 'i18next';
import log from 'loglevel';
import React, { useEffect, useMemo, useState } from 'react';

import type { IKRC20List } from '@/shared/types';
import { constructKRC20ListJsonStrLowerCase, constructKRC20SendJsonStrLowerCase } from '@/shared/utils';
import { Button, Card, Column, Content, Footer, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { AddressText } from '@/ui/components/AddressText';
import WebsiteBar from '@/ui/components/WebsiteBar';
import {
  useAccountAddress,
  useAccountInscriptions,
  useCurrentAccount,
  useFetchInscriptionsCallback
} from '@/ui/state/accounts/hooks';
import { accountsActions } from '@/ui/state/accounts/reducer';
import { useAppDispatch, useAppSelector } from '@/ui/state/hooks';
import { useCurrentKeyring } from '@/ui/state/keyrings/hooks';
import { selectKasTick, selectNetworkId } from '@/ui/state/settings/reducer';
import { colors } from '@/ui/theme/colors';
import { fontSizes } from '@/ui/theme/font';
import { formatLocaleString, useApproval, useWallet } from '@/ui/utils';
import { ArrowDownOutlined, LoadingOutlined } from '@ant-design/icons';
import { sompiToAmount } from '@/shared/utils/format';

interface Props {
  header?: React.ReactNode;
  params: {
    data: {
      krc20Tick: string;
      krc20Amount: number;
      kasAmount: number;
      priorityFee?: number;
      type: 'buyKRC20Token' | 'createKRC20Order' | 'cancelKRC20Order' | 'signCancelKRC20Order' | 'signBuyKRC20Token';
      txJsonString: string;
      sendCommitTxId: string;
      psktExtraOutput?: { address: string; amount: number | string }[];
      extraOutput?: [{ address: string; amount: number | string }];
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

function SignTxDetails({
  krc20Tick,
  decimal,
  krc20Amount,
  kasAmount,
  priorityFee
}: {
  krc20Tick: string;
  decimal: string;
  krc20Amount: number;
  kasAmount: number;
  priorityFee?: number;
}) {
  log.debug('decimal', decimal);
  const kasTick = useAppSelector(selectKasTick);
  const wallet = useWallet();
  const account = useCurrentAccount();
  const keyring = useCurrentKeyring();
  const [p2shAddress, setP2shAddress] = useState<string>('');
  const [payload, setPayload] = useState<string>('Inscription:');

  const title = useMemo(() => {
    return `Create ${krc20Tick?.toUpperCase()} Order`;
  }, []);

  const prettyInscribeJsonString = useMemo(() => {
    const jsonStr = constructKRC20ListJsonStrLowerCase(krc20Tick, krc20Amount, decimal);
    if (jsonStr?.length > 0) {
      const json = JSON.parse(jsonStr);
      return JSON.stringify(json, null, 2);
    }
    return '';
  }, [krc20Tick, krc20Amount, decimal]);

  useEffect(() => {
    const init = async () => {
      const str = constructKRC20ListJsonStrLowerCase(krc20Tick, krc20Amount, decimal);
      const address = await wallet.getP2shAddress(str, account.pubkey, keyring.addressType);
      setP2shAddress(address);
    };
    init();
    if (krc20Amount > 0 && krc20Tick?.length > 0) {
      const content = `Inscription: list ${krc20Amount} ${krc20Tick?.toUpperCase()} on chain`;
      setPayload(content);
    }
  }, [krc20Tick, krc20Amount, decimal, account.pubkey, keyring.addressType]);

  return (
    <Column gap="sm">
      <Text text={title} preset="sub" color="textDim" selectText />
      {/* <Row itemsCenter>
        <Text text={'Type:'} preset="default" color="textDim" />
        <Text text={`Create ${krc20Tick} Order`} style={{ wordWrap: 'break-word' }} />
      </Row>
      <Row itemsCenter>
        <Text text={'Inscription Protocol:'} preset="default" color="textDim" />
        <Text text={'kasplex'} style={{ wordWrap: 'break-word' }} />
      </Row> */}
      <Row itemsCenter justifyCenter>
        <Text
          text={`lock ${formatLocaleString(krc20Amount)} ${krc20Tick?.toUpperCase()} and ${formatLocaleString(
            1
          )} ${kasTick}`}
          style={{ wordWrap: 'break-word' }}
          selectText
        />
      </Row>
      <Row justifyCenter>
        <ArrowDownOutlined
          style={{
            fontSize: fontSizes.icon,
            color: colors.white_muted
          }}
        />
      </Row>
      <Row itemsCenter justifyCenter>
        <Text text={`${formatLocaleString(kasAmount)} ${kasTick}`} style={{ wordWrap: 'break-word' }} selectText />
      </Row>
      <Column gap="sm" mt="md">
        <Text text={payload} preset="sub" color="textDim" selectText />
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
      <Text text={t('Lock Amount') as string} preset="sub" color="textDim" selectText />
      <Row itemsCenter>
        <Text text={`${formatLocaleString(1)} ${kasTick}`} color="white" preset="sub" selectText />
        <Text text={t('to') as string} textCenter color="textDim" preset="sub" selectText />
        <AddressText addressInfo={{ address: p2shAddress, domain: '' }} textCenter />
      </Row>
      {/* <Text
        style={{ userSelect: 'text' }}
        text={`2 ${kasTick} is locked. Will return to you after the order is completed.`}
        color="textDim"
        preset="sub"
      /> */}

      {priorityFee != undefined && priorityFee > 0 && (
        <Column justifyCenter mt="sm">
          <Text text={`${priorityFee} ${kasTick} ${t('priority fee')}`} preset="sub" textCenter selectText />
        </Column>
      )}
      {/* <Text
        selectText
        mt="md"
        mb="md"
        text={`0.1% of ${kasTick} will be deducted as a service fee when order is completed.`}
        preset="xsub"
        color="textDim"
      /> */}
    </Column>
  );
}

function SignTxDetailsBuyKRC20Token({
  txJsonString,
  extraOutput,
  priorityFee
}: {
  txJsonString: string;
  extraOutput?: [{ address: string; amount: number }];
  priorityFee?: number;
}) {
  const kasTick = useAppSelector(selectKasTick);
  const wallet = useWallet();
  const [error, setError] = useState<string>('');
  const networkId = useAppSelector(selectNetworkId);
  const [decimal, setDecimal] = useState<string>('8');
  const [krc20Tick, setkrc20Tick] = useState<string>('');
  const [krc20Amount, setkrc20Amount] = useState<string>('');
  const [krc20SompiAmt, setKrc20SompiAmt] = useState<string>('');
  const [sellerAddress, setSellerAddress] = useState<string>('seller address');
  const [payload, setPayload] = useState<string>('Inscription:');
  const title = useMemo(() => {
    if (krc20Tick?.length > 0) return `Buy ${krc20Tick?.toUpperCase()}`;
    return `Buy KRC20 Token`;
  }, [krc20Tick]);
  const prettyInscribeJsonString = useMemo(() => {
    const jsonStr = constructKRC20SendJsonStrLowerCase(krc20Tick);
    if (jsonStr?.length > 0) {
      const json = JSON.parse(jsonStr);
      return JSON.stringify(json, null, 2);
    }
  }, [krc20Tick]);
  const [outputs, setOutputs] = useState<{ address: string; amount: number }[]>([]);

  const fetchKRC20HistoryFromID = async (id: string) => {
    if (!id || id?.length <= 0) return;
    try {
      const history = (await wallet.getKRC20HistoryFromID(id)) as IKRC20List;
      if (history) {
        setkrc20Tick(history?.tick?.toUpperCase());
        setKrc20SompiAmt(history?.amt);
        setSellerAddress(history?.from);
      }
    } catch (e: any) {
      setError(e?.message ? e?.message : JSON.stringify(e));
    }
  };

  useEffect(() => {
    if (!txJsonString || txJsonString?.length <= 0) return;
    const txJson = JSON.parse(txJsonString);
    const id = txJson?.inputs[0]?.transactionId;
    fetchKRC20HistoryFromID(id);
  }, [txJsonString]);

  useEffect(() => {
    if (!txJsonString || txJsonString?.length <= 0) return;

    const getOutputs = async () => {
      const txJson = JSON.parse(txJsonString);
      const outputs1: any[] = [];
      for (const item of txJson.outputs) {
        const amount = sompiToAmount(item.value, 8);
        const address = await wallet.addressFromScriptPublicKey(item?.scriptPublicKey, networkId);
        outputs1.unshift({ address, amount });
      }
      const outputs2 = extraOutput ? extraOutput : ([] as any[]);
      setOutputs([...outputs1, ...outputs2]);
    };
    getOutputs();
  }, [txJsonString, extraOutput]);

  useEffect(() => {
    if (krc20Tick?.length > 0) {
      setPayload(`Inscription: send ${krc20Tick?.toUpperCase()}`);
      wallet
        .getKRC20TokenInfo(krc20Tick.toLowerCase())
        .then((res) => {
          if (res && res.length > 0) {
            setDecimal(res[0].dec);
          }
        })
        .catch((e) => {
          setError(e?.message ? e?.message : JSON.stringify(e));
        });
    }
  }, [krc20Tick]);

  useEffect(() => {
    setkrc20Amount(sompiToAmount(krc20SompiAmt, decimal));
  }, [krc20SompiAmt, decimal]);

  return (
    <Column gap="sm">
      <Text text={title} preset="sub" color="textDim" selectText />

      {krc20Tick?.length > 0 && (
        <>
          <Row itemsCenter justifyCenter>
            <Text
              text={`${formatLocaleString(krc20Amount)} ${krc20Tick}`}
              style={{ wordWrap: 'break-word' }}
              selectText
            />
          </Row>
        </>
      )}
      {krc20Tick?.length > 0 && (
        <Column gap="sm">
          <Text text={payload} preset="sub" color="textDim" selectText />
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
      )}
      {outputs?.length > 0 && <Text text={t('Spend Amount') as string} color="textDim" preset="sub" selectText />}
      {outputs?.map(({ address, amount }) => {
        return (
          <Row key={address + amount} itemsCenter>
            <Text text={`${formatLocaleString(amount)} ${kasTick}`} color="white" preset="sub" selectText />
            <Text text={t('to') as string} textCenter color="textDim" preset="sub" selectText />
            <AddressText addressInfo={{ address: address, domain: '' }} textCenter />
          </Row>
        );
      })}

      {/* <Column justifyCenter>
        <Text text={`${txInfo.txFee} ${kasTick} ${t('transaction fee')}`} preset="sub" textCenter />
      </Column> */}
      {priorityFee != undefined && priorityFee > 0 && (
        <Column justifyCenter>
          <Text text={`${priorityFee} ${kasTick} ${t('priority fee')}`} preset="sub" textCenter selectText />
        </Column>
      )}
      {error?.length > 0 && <Text text={error} color="error" selectText />}
    </Column>
  );
}

function SignTxDetailsCancelKRC20Order({
  decimal,
  krc20Tick,
  txJsonString,
  sendCommitTxId
}: {
  decimal: string;
  krc20Tick: string;
  txJsonString?: string;
  sendCommitTxId?: string;
}) {
  const address = useAccountAddress();
  const kasTick = useAppSelector(selectKasTick);
  const wallet = useWallet();
  // const [krc20Tick, setkrc20Tick] = useState<string>('');
  const [krc20Amount, setkrc20Amount] = useState<string>('0');
  const [error, setError] = useState<string>('');
  const [payload, setPayload] = useState<string>('Inscription:');
  const title = useMemo(() => {
    if (krc20Tick?.length > 0) return `Cancel ${krc20Tick?.toUpperCase()} Order `;
    return `Cancel KRC20 Order`;
  }, [krc20Tick]);

  const outputs = useMemo(() => {
    // const pskt = Transaction.deserializeFromSafeJSON(txJsonString) as Transaction;
    if (!txJsonString || txJsonString?.length <= 0) return;
    const txJson = JSON.parse(txJsonString);
    const amount = sompiToAmount(txJson.inputs[0].utxo?.amount, 8);
    // const scriptPubkey = txJson.outputs[0].scriptPublicKey;
    const outputs = [{ address: address, amount }];
    return outputs;
  }, [txJsonString]);

  const fetchKRC20HistoryFromID = async (id: string, decimal: string) => {
    if (!id || id?.length <= 0) return;
    try {
      const history = (await wallet.getKRC20HistoryFromID(id)) as IKRC20List;
      if (history) {
        // setkrc20Tick(history?.tick?.toUpperCase());
        const amt = sompiToAmount(history?.amt, decimal);
        setkrc20Amount(amt);
      }
    } catch (e: any) {
      setError(e?.message ? e?.message : JSON.stringify(e));
    }
  };

  useEffect(() => {
    let selectedId = '';
    if (txJsonString) {
      const txJson = JSON.parse(txJsonString);
      selectedId = txJson?.inputs[0]?.transactionId;
    } else if (sendCommitTxId) {
      selectedId = sendCommitTxId;
    } else {
      setError('txJsonString or sendCommitTxId must be provided');
      return;
    }
    fetchKRC20HistoryFromID(selectedId, decimal);
  }, [txJsonString, sendCommitTxId, decimal]);
  const prettyInscribeJsonString = useMemo(() => {
    const jsonStr = constructKRC20SendJsonStrLowerCase(krc20Tick);
    if (jsonStr?.length > 0) {
      const json = JSON.parse(jsonStr);
      return JSON.stringify(json, null, 2);
    }
  }, [krc20Tick]);

  useEffect(() => {
    if (krc20Tick?.length > 0) {
      setPayload(`Inscription: send ${krc20Tick?.toUpperCase()}`);
    }
  }, [krc20Tick]);

  return (
    <Column gap="sm">
      <Text text={title} preset="sub" color="textDim" selectText />

      {Number(krc20Amount) > 0 && (
        <Row itemsCenter justifyCenter>
          <Text
            selectText
            text={`${formatLocaleString(krc20Amount)} ${krc20Tick?.toUpperCase()}`}
            style={{ wordWrap: 'break-word' }}
          />
        </Row>
      )}
      {krc20Tick?.length > 0 && (
        <Column gap="sm">
          <Text text={payload} preset="sub" color="textDim" selectText />
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
      )}
      {outputs?.map(({ address, amount }) => {
        return (
          <Row key={address + amount} itemsCenter>
            <Text text={`${formatLocaleString(amount)} ${kasTick}`} color="white" preset="sub" selectText />
            <Text text={t('to') as string} textCenter color="textDim" preset="sub" selectText />
            <AddressText addressInfo={{ address: address, domain: '' }} textCenter />
          </Row>
        );
      })}

      {/* <Column justifyCenter>
        <Text text={`${txInfo.txFee} ${kasTick} ${t('transaction fee')}`} preset="sub" textCenter />
      </Column> */}
      {/* {priorityFee && priorityFee > 0 && (
        <Column justifyCenter>
          <Text text={`${priorityFee} ${kasTick} ${t('priority fee')}`} preset="sub" textCenter />
        </Column>
      )} */}
      {error?.length > 0 && <Text text={error} color="error" selectText />}
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
  toAddressInfos: {
    address: string;
    amount: number;
  }[];
  txFee: number;
  isScammer: boolean;
  // changedBalance: number;
  // rawtx: string;
  // psbtHex: string;
  // toSignInputs: ToSignInput[];
  // txError: string;
  // decodedPsbt: DecodedPsbt;
  // isScammer: boolean;
  // inscribeJsonString: string;
  // destAddr?: string;
}

const initTxInfo = {
  toAddressInfos: [],
  txFee: 0,
  isScammer: false
};

export default function KRC20Order({
  params: {
    data: {
      krc20Tick,
      krc20Amount,
      kasAmount,
      priorityFee,
      type,
      txJsonString,
      sendCommitTxId,
      psktExtraOutput,
      extraOutput
    },
    session
  },
  header,
  handleCancel,
  handleConfirm
}: Props) {
  const [getApproval, resolveApproval, rejectApproval] = useApproval();

  const [txInfo, setTxInfo] = useState<TxInfo>(initTxInfo);

  const [errors, setErrors] = useState<string[]>([]);

  const kasTick = useAppSelector(selectKasTick);

  const wallet = useWallet();
  const [loading, setLoading] = useState(true);
  const tools = useTools();
  const [content, setContent] = useState<string>('Sign & Submit');

  const currentAccount = useCurrentAccount();
  const [disabled, setDisabled] = useState(false);
  const accountInscriptions = useAccountInscriptions();
  const fetchInscription = useFetchInscriptionsCallback();
  const dispatch = useAppDispatch();
  const [decimal, setDecimal] = useState<string>('8');
  const handleFetchInscription = async () => {
    fetchInscription()
      .finally()
      .catch((e) => {
        log.debug(e.message);
        dispatch(
          accountsActions.setInscriptions({
            address: currentAccount.address,
            list: []
          })
        );
      });
  };

  const fetchKRC20Info = async (tick: string) => {
    const tokenInfos = await wallet.getKRC20TokenInfo(tick).catch((e) => {
      log.debug(e);
      tools.toastError((e as any).message);
    });
    if (tokenInfos && Array.isArray(tokenInfos) && tokenInfos.length > 0) {
      setDecimal(tokenInfos[0].dec);
    }
  };

  useEffect(() => {
    const index = accountInscriptions?.list.findIndex((item) => item.tick?.toLowerCase() === krc20Tick?.toLowerCase());
    if (index !== -1) {
      const krc20Token = accountInscriptions?.list[index];
      setDecimal(krc20Token.dec);
    } else if (krc20Tick && krc20Tick?.length > 0) {
      fetchKRC20Info(krc20Tick);
    }
  }, [krc20Tick, accountInscriptions?.list]);

  useEffect(() => {
    if (type == 'signBuyKRC20Token' || type == 'signCancelKRC20Order') setContent('Sign');
  }, [type]);

  useEffect(() => {
    // init();
    handleFetchInscription();
    setLoading(false);
  }, []);

  if (!handleCancel) {
    handleCancel = () => {
      rejectApproval();
    };
  }

  if (!handleConfirm) {
    handleConfirm = () => {
      if (type == 'createKRC20Order') {
        resolveApproval({
          krc20Tick,
          krc20Amount,
          kasAmount,
          psktExtraOutput,
          priorityFee
        });
      } else if (type == 'buyKRC20Token' || type == 'signBuyKRC20Token') {
        resolveApproval({
          txJsonString,
          extraOutput,
          priorityFee
        });
      } else if (type == 'cancelKRC20Order' || type == 'signCancelKRC20Order') {
        resolveApproval({
          krc20Tick,
          txJsonString,
          sendCommitTxId
        });
      }
    };
  }

  const networkFee = useMemo(() => txInfo.txFee, [txInfo.txFee]);
  const detailsComponent = useMemo(() => {
    if (type == 'createKRC20Order') {
      return (
        <SignTxDetails
          decimal={decimal}
          krc20Tick={krc20Tick}
          krc20Amount={krc20Amount}
          kasAmount={kasAmount}
          priorityFee={priorityFee}
        />
      );
    } else if (type == 'buyKRC20Token' || type == 'signBuyKRC20Token') {
      return (
        <SignTxDetailsBuyKRC20Token txJsonString={txJsonString} extraOutput={extraOutput} priorityFee={priorityFee} />
      );
    } else if (type == 'cancelKRC20Order' || type == 'signCancelKRC20Order') {
      return (
        <SignTxDetailsCancelKRC20Order
          decimal={decimal}
          txJsonString={txJsonString}
          krc20Tick={krc20Tick}
          sendCommitTxId={sendCommitTxId}
        />
      );
    }
  }, [
    type,
    decimal,
    krc20Tick,
    krc20Amount,
    kasAmount,
    priorityFee,
    txJsonString,
    sendCommitTxId,
    txInfo,
    extraOutput
  ]);
  const canChanged = useMemo(() => {
    return true;
  }, [txInfo]);

  const isValid = useMemo(() => {
    return true;
  }, [txInfo]);

  // const isValidData = useMemo(() => {
  //   if (txInfo.psbtHex === '') {
  //     return false;
  //   }
  //   return true;
  // }, [txInfo.psbtHex]);
  const hasHighRisk = useMemo(() => {
    return false;
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
        <Column gap="xxs">
          {detailsComponent}

          {canChanged == false && (
            <Section title="Transaction Fee:">
              <Text text={networkFee} />
              <Text text={kasTick} color="textDim" />
            </Section>
          )}

          {canChanged == false && (
            <Section title="Network Fee Rate:">
              {/* <Text text={txInfo.decodedPsbt.feeRate.toString()} /> */}
              <Text text={''} />
              <Text text="sat/vB" color="textDim" />
            </Section>
          )}
          {errors &&
            errors.map((error, index) => {
              if (errors.length == 1) {
                return <Text key={index} text={`${error}`} color="error" mt="md" />;
              }
              return <Text key={index} text={`${index + 1}: ${error}`} color="error" />;
            })}
        </Column>
      </Content>

      <Footer>
        <Column gap="sm">
          <Text
            selectText
            mt="md"
            mb="md"
            text={
              'Disclaimer: Double check the transaction details before confirming. KasWare Wallet is not responsible for any loss of funds.'
            }
            preset="xsub"
            color="textDim"
          />
        </Column>
        <Row full>
          <Button preset="default" text="Reject" onClick={handleCancel} full />
          {hasHighRisk == false && (
            <Button
              preset="primary"
              text={content}
              onClick={() => {
                setLoading(true);
                handleConfirm();
              }}
              disabled={disabled}
              full
            />
          )}
        </Row>
      </Footer>
      {/* {isWarningVisible && (
        <WarningPopover
          risks={txInfo.decodedPsbt.risks}
          onClose={() => {
            setIsWarningVisible(false);
          }}
        />
      )} */}
    </Layout>
  );
}
