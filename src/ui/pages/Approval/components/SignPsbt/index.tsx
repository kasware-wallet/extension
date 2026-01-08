/* eslint-disable @typescript-eslint/no-explicit-any */
import { Checkbox, Progress } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import BigNumber from 'bignumber.js';
import { t } from 'i18next';
import type { HexString } from 'kaspa-wasm';
import log from 'loglevel';
import React, { useEffect, useMemo, useState } from 'react';

import eventBus from '@/shared/eventBus';
import type {
  DecodedPsbt,
  DecodedPskt,
  IBatchTransfer,
  IInputInfo,
  IOutputInfo,
  KasplexData,
  RawTxInfo,
  SignPsbtOptions,
  SignPsktOptions,
  ToSignInput,
  TTokenType
} from '@/shared/types';
import { TxType } from '@/shared/types';
import type { KsprTransfer } from '@/shared/types/kspr';
import { Button, Card, Column, Content, Footer, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { AddressText } from '@/ui/components/AddressText';
import KnsPreview from '@/ui/components/KnsPreview';
import KsprNftPreview from '@/ui/components/KsprNftPreview';
import { WarningPopover } from '@/ui/components/WarningPopover';
import WebsiteBar from '@/ui/components/WebsiteBar';
import { useAccountAddress, useCurrentAccount } from '@/ui/state/accounts/hooks';
import { useAppSelector } from '@/ui/state/hooks';
import { selectKasTick, selectNetworkId } from '@/ui/state/settings/reducer';
import { usePrepareSendKASCallback } from '@/ui/state/transactions/hooks';
import { selectKnsAssets } from '@/ui/state/transactions/reducer';
import { fontSizes } from '@/ui/theme/font';
import { formatLocaleString, shortAddress, useApproval, useWallet } from '@/ui/utils';
import { useKrc20DecName } from '@/ui/utils/hooks/kasplex/fetchKrc20AddressTokenList';
import { LoadingOutlined } from '@ant-design/icons';
import { sompiToAmount } from '@/shared/utils/format';
import PayloadComp from '../PayloadComp';
import { SendToComp } from '@/ui/components/SendTo';

interface Props {
  header?: React.ReactNode;
  params: {
    data: {
      list: IBatchTransfer[];
      psbtHex: string;
      options: SignPsbtOptions;
      psktJsonString?: string;
      psktOptions?: SignPsktOptions;
      type: TxType;
      tokenType: TTokenType;
      toAddress?: string;
      sompi?: number;
      feeRate?: number;
      priorityFee?: number;
      payload?: string;
      rawTxInfo?: RawTxInfo;
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

function InputInfo({ inputInfos }: { inputInfos: IInputInfo[] | undefined }) {
  if (inputInfos == undefined) return null;
  return (
    <Column gap="sm">
      <Text text={'Inputs:'} preset="default" color="textDim" selectText />
      {inputInfos?.map((item, index) => {
        return (
          <Row justifyBetween fullX mt={'zero'} mb="sm" key={index}>
            <AddressText address={item.address} textCenter />
            <Text text={formatLocaleString(item.value)} selectText />
          </Row>
        );
      })}
    </Column>
  );
}
function OutputInfo({ outputInfos }: { outputInfos: IOutputInfo[] | undefined }) {
  if (outputInfos == undefined) return null;
  return (
    <Column gap="sm">
      <Text text={'outputs:'} preset="default" color="textDim" selectText />
      {outputInfos?.map((item, index) => {
        return (
          <Row justifyBetween fullX mt={'zero'} mb="sm" key={index}>
            <AddressText address={item.address} textCenter />
            <Text text={formatLocaleString(item.value)} selectText />
          </Row>
        );
      })}
    </Column>
  );
}

function SignTxDetails({
  txInfo,
  type,
  tokenType,
  rawTxInfo,
  batchTransferList,
  payload,
  decodedPskt
}: {
  txInfo: ITxInfo;
  rawTxInfo?: RawTxInfo;
  type: TxType;
  tokenType: TTokenType;
  batchTransferList: IBatchTransfer[] | undefined;
  payload?: Uint8Array | HexString;
  decodedPskt?: DecodedPskt;
}) {
  const address = useAccountAddress();
  const kasTick = useAppSelector(selectKasTick);
  const knsAssets = useAppSelector(selectKnsAssets);
  const kasNetworkId = useAppSelector(selectNetworkId);
  const isCurrentToPayFee = useMemo(() => {
    if (type === TxType.SIGN_TX) {
      return false;
    } else {
      return true;
    }
  }, [type]);
  const title = useMemo(() => {
    if (type === TxType.SIGN_KRC20_DEPLOY) {
      return t('Deploy KRC20 Token') as string;
    }
    if (type == TxType.SIGN_KRC20_MINT) {
      return t('Mint KRC20 Token') as string;
    }
    if (type == TxType.SIGN_KRC20_TRANSFER) {
      return t('Transfer KRC20 Token') as string;
    }
    if (type == TxType.SIGN_KNS_TRANSFER) {
      return t('Transfer KNS') as string;
    }
    if (type == TxType.SIGN_KSPRNFT_TRANSFER) {
      return t('Transfer') as string;
    }
    if (type == TxType.SIGN_KRC20_TRANSFER_BATCH) {
      return t('Batch Transfer KRC20 Token') as string;
    }
    if (type === TxType.SIGN_TX) {
      return t('Sign Transaction') as string;
    }
  }, [type]);

  const spendAmount = useMemo(() => {
    if (txInfo.decodedPsbt.outputInfos.length > 0) {
      const amount = txInfo.decodedPsbt.outputInfos[0].value;
      return amount;
    } else {
      return 0;
    }
  }, [txInfo.decodedPsbt]);

  const balanceChangedAmount = useMemo(() => {
    const inValue =
      decodedPskt?.inputInfos
        .filter((v) => v.address === address)
        .reduce((pre, cur) => cur.value + pre, 0)
        .toFixed(8) || 0;
    const outValue =
      decodedPskt?.outputInfos
        .filter((v) => v.address === address)
        .reduce((pre, cur) => cur.value + pre, 0)
        .toFixed(8) || 0;
    const amt = new BigNumber(outValue).minus(inValue).toNumber();
    return amt;
  }, [decodedPskt]);

  const inputInfos = useMemo(() => {
    if (decodedPskt?.inputInfos) {
      return decodedPskt.inputInfos;
    }
    return undefined;
  }, [decodedPskt]);
  const outputInfos = useMemo(() => {
    if (decodedPskt?.outputInfos) {
      return decodedPskt.outputInfos;
    }
    return undefined;
  }, [decodedPskt]);

  const knsAsset = useMemo(() => {
    if (txInfo?.inscribeJsonString && type === TxType.SIGN_KNS_TRANSFER) {
      const json = JSON.parse(txInfo.inscribeJsonString);
      return knsAssets.find((v) => v.assetId === json?.id);
    }
    return undefined;
  }, [txInfo?.inscribeJsonString, knsAssets, type]);
  const ksprAsset = useMemo(() => {
    if (txInfo?.inscribeJsonString && type === TxType.SIGN_KSPRNFT_TRANSFER) {
      const json: KsprTransfer = JSON.parse(txInfo.inscribeJsonString);
      return { tokenId: json?.tokenId, tick: json?.tick };
    }
    return undefined;
  }, [txInfo?.inscribeJsonString, knsAssets, type]);

  const prettyInscribeJsonString = useMemo(() => {
    if (txInfo?.inscribeJsonString) {
      const json = JSON.parse(txInfo.inscribeJsonString);
      return JSON.stringify(json, null, 2);
    }
    return '';
  }, [txInfo?.inscribeJsonString]);

  const inscribeJson = useMemo(() => {
    if (txInfo?.inscribeJsonString) {
      const json = JSON.parse(txInfo.inscribeJsonString);
      return json;
    }
    return '';
  }, [txInfo?.inscribeJsonString]);

  const feeAmount = useMemo(() => {
    if (txInfo.decodedPsbt.fee && txInfo.decodedPsbt.fee > 0) {
      return new BigNumber(txInfo.decodedPsbt.fee).plus(txInfo.decodedPsbt.priorityFee).toNumber();
    }
    if (decodedPskt?.fee && decodedPskt?.fee > 0) return decodedPskt.fee;
    return 0;
  }, [txInfo.decodedPsbt, decodedPskt]);
  const { name: krc20Tick, dec: krc20Dec } = useKrc20DecName(kasNetworkId, inscribeJson.tick || inscribeJson.ca);

  if (type === TxType.SIGN_TX) {
    return (
      <>
        <Column gap="lg">
          <Text text={title} preset="title-bold" textCenter mt="lg" selectText />
          <Row justifyCenter>
            <Card style={{ backgroundColor: '#272626', maxWidth: 320, width: 320 }}>
              <Column gap="lg">
                <Column>
                  <Column>
                    <Column justifyCenter>
                      <Row itemsCenter>
                        <Text
                          text={(balanceChangedAmount > 0 ? '+' : '') + balanceChangedAmount}
                          color={balanceChangedAmount > 0 ? 'white' : 'white'}
                          preset="bold"
                          textCenter
                          size="xxl"
                          selectText
                        />
                        <Text text={kasTick} color="textDim" selectText />
                      </Row>
                    </Column>
                  </Column>
                </Column>
              </Column>
            </Card>
          </Row>
        </Column>
        <InputInfo inputInfos={inputInfos} />
        <OutputInfo outputInfos={outputInfos} />

        <PayloadComp payload={decodedPskt?.payload} />
        {feeAmount > 0 && (
          <Row justifyCenter my="md">
            <Text text={`${feeAmount} ${t('transaction fee')}`} preset="sub" textCenter selectText />
          </Row>
        )}

        <Column gap="sm">
          <Text
            mt="md"
            mb="md"
            text={
              'Disclaimer: This transaction might involve the transfer of assets from unknown protocols. KasWare Wallet shall not be liable for any financial losses incurred.'
            }
            preset="xsub"
            color="textDim"
            selectText
          />
        </Column>
      </>
    );
  }
  if (
    type == TxType.SIGN_KRC20_DEPLOY ||
    type == TxType.SIGN_KRC20_MINT ||
    type == TxType.SIGN_KRC20_TRANSFER_BATCH ||
    type == TxType.SIGN_KRC20_TRANSFER ||
    type == TxType.SIGN_KNS_TRANSFER ||
    type == TxType.SIGN_KSPRNFT_TRANSFER
  ) {
    return (
      <Column gap="lg">
        <Text
          text={title}
          preset="title-bold"
          textCenter
          mt="lg"
          mb={
            type == TxType.SIGN_KRC20_TRANSFER ||
            type == TxType.SIGN_KNS_TRANSFER ||
            type == TxType.SIGN_KSPRNFT_TRANSFER
              ? 'zero'
              : 'md'
          }
          selectText
        />
        {type == TxType.SIGN_KNS_TRANSFER && knsAsset !== undefined && (
          <Row style={{ flexWrap: 'wrap' }} gap="lg" justifyCenter mb="lg">
            <KnsPreview data={knsAsset} preset="medium" />
          </Row>
        )}
        {type == TxType.SIGN_KSPRNFT_TRANSFER && ksprAsset !== undefined && (
          <Row style={{ flexWrap: 'wrap' }} gap="lg" justifyCenter mb="lg">
            <KsprNftPreview tick={ksprAsset.tick} id={ksprAsset.tokenId} preset="medium" />
          </Row>
        )}

        {type == TxType.SIGN_KRC20_TRANSFER && (
          <Row justifyCenter fullX>
            <Card style={{ backgroundColor: '#272626' }} fullX>
              <Column gap="lg">
                <Column>
                  <Column>
                    <Text
                      text={`Transfer ${formatLocaleString(
                        sompiToAmount(
                          (inscribeJson as KasplexData<'transfer'>)?.amt,
                          txInfo?.decimal ? txInfo?.decimal : krc20Dec ? krc20Dec : '8'
                        )
                      )} ${krc20Tick} to ${(inscribeJson as KasplexData<'transfer'>)?.to}`}
                      style={{
                        userSelect: 'text',
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        flexWrap: 'wrap'
                      }}
                    />
                  </Column>
                </Column>
              </Column>
            </Card>
          </Row>
        )}

        <Row justifyCenter fullX mt={type == TxType.SIGN_KRC20_TRANSFER ? 'xxl' : 'zero'} mb="sm">
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
              {type !== TxType.SIGN_KRC20_TRANSFER_BATCH && prettyInscribeJsonString}
              {type == TxType.SIGN_KRC20_TRANSFER_BATCH &&
                batchTransferList &&
                batchTransferList?.length > 0 &&
                batchTransferList?.map((item, index) => {
                  return (
                    <Text
                      key={index}
                      text={`${formatLocaleString(item.amount)} ${item?.tick} to ${shortAddress(item.to)}`}
                      style={{
                        userSelect: 'text',
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        flexWrap: 'wrap'
                      }}
                    />
                  );
                })}
            </div>
          </Card>
        </Row>
      </Column>
    );
  }

  return (
    <Column gap="lg">
      <Text text={t('Sign Transaction') as string} preset="title-bold" textCenter mt="lg" selectText />
      <Row justifyCenter>
        <Card style={{ backgroundColor: '#272626', maxWidth: 320, width: 320 }}>
          <Column gap="lg">
            <Column>
              {rawTxInfo?.toAddressInfo !== undefined && <SendToComp toAddressInfo={rawTxInfo.toAddressInfo} />}
              {txInfo.destAddr !== undefined && txInfo.destAddr?.length > 0 && (
                <SendToComp toAddressInfo={{ address: txInfo.destAddr }} />
              )}

              <Column>
                <Text text={t('Spend Amount') as string} textCenter color="textDim" selectText />

                <Column justifyCenter>
                  <Text
                    text={`${formatLocaleString(spendAmount)} ${kasTick}`}
                    color="white"
                    preset="bold"
                    textCenter
                    size="xxl"
                    selectText
                  />
                  {isCurrentToPayFee && (
                    <Text text={`${feeAmount} ${t('transaction fee')}`} preset="sub" textCenter selectText />
                  )}
                  {/* {isCurrentToPayFee && priorityFeeAmount > 0 && (
                    <Text text={`${priorityFeeAmount} (${t('priority fee')})`} preset="sub" textCenter />
                  )} */}
                </Column>
              </Column>
            </Column>
          </Column>
        </Card>
      </Row>

      {payload != undefined && payload?.length > 0 && <PayloadComp payload={payload} />}
      {/* rawTxInfo?.payload is from the inside of wallet */}
      {rawTxInfo?.payload != undefined && rawTxInfo?.payload.length > 0 && <PayloadComp payload={rawTxInfo?.payload} />}
    </Column>
  );
}

function Section({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <Column>
      <Text text={title} preset="bold" selectText />
      <Card>
        <Row full justifyBetween itemsCenter>
          {children}
        </Row>
      </Card>
    </Column>
  );
}

interface ITxInfo {
  changedBalance: number;
  rawtx: string;
  psbtHex: string;
  toSignInputs: ToSignInput[];
  txError: string;
  decodedPsbt: DecodedPsbt;
  isScammer: boolean;
  inscribeJsonString: string;
  destAddr?: string;
  decimal?: string;
}

const initTxInfo: ITxInfo = {
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
    priorityFee: 0,
    risks: [],
    features: {
      rbf: false
    }
  },
  inscribeJsonString: '',
  destAddr: '',
  decimal: '8'
};

export default function SignPsbt({
  params: {
    data: {
      list,
      psbtHex,
      options,
      psktJsonString,
      psktOptions,
      type,
      tokenType,
      toAddress,
      sompi,
      priorityFee,
      payload,
      rawTxInfo,
      inscribeJsonString,
      destAddr,
      ...rest
    },
    session
  },
  header,
  handleCancel,
  handleConfirm
}: Props) {
  const [getApproval, resolveApproval, rejectApproval] = useApproval();

  const [txInfo, setTxInfo] = useState<ITxInfo>(initTxInfo);
  const [decodedPskt, setDecodedPskt] = useState<DecodedPskt>();

  const [errors, setErrors] = useState<string[]>([]);

  const prepareSendKAS = usePrepareSendKASCallback();
  const kasTick = useAppSelector(selectKasTick);

  const wallet = useWallet();
  const [loading, setLoading] = useState(true);
  const tools = useTools();

  const address = useAccountAddress();
  const currentAccount = useCurrentAccount();
  const [disabled, setDisabled] = useState(false);
  const [signPercent, setSignPercent] = useState<{ percent: number; msg: string }>({ percent: 0, msg: '' });

  const [isWarningVisible, setIsWarningVisible] = useState(false);

  const init = async () => {
    let txError = '';
    if (type === TxType.SEND_KASPA) {
      // request from kasware provider
      if (!psbtHex && toAddress && sompi) {
        try {
          const rawTxInfo = await prepareSendKAS({
            toAddressInfo: { address: toAddress, domain: '' },
            toAmount: Number(sompiToAmount(sompi, 8)),
            priorityFee
          });
          psbtHex = rawTxInfo.psbtHex;
          destAddr = toAddress;
        } catch (e) {
          log.debug(e);
          txError = (e as any).message;
          tools.toastError(txError);
          setErrors([txError]);
        }
      }
    }
    if (!psbtHex) {
      setLoading(false);
      if (
        type == TxType.SIGN_KRC20_TRANSFER ||
        type == TxType.SIGN_KRC20_MINT ||
        type == TxType.SIGN_KRC20_TRANSFER_BATCH ||
        type == TxType.SIGN_KRC20_DEPLOY ||
        type == TxType.SIGN_KNS_TRANSFER ||
        type == TxType.SIGN_KSPRNFT_TRANSFER
      ) {
        let dec: string | undefined;
        if (type == TxType.SIGN_KRC20_DEPLOY && inscribeJsonString) {
          const json = JSON.parse(inscribeJsonString);
          dec = json?.dec;
        }
        if (type !== TxType.SIGN_KRC20_DEPLOY && inscribeJsonString) {
          const json = JSON.parse(inscribeJsonString);
          const tokenInfos = await wallet.getKRC20TokenInfo(json?.tick || json?.ca).catch((e) => {
            log.debug(e);
          });
          if (tokenInfos && Array.isArray(tokenInfos) && tokenInfos.length > 0) {
            if (tokenInfos[0].state !== 'unused') {
              dec = tokenInfos[0].dec;
            }
          }
        }
        setTxInfo(Object.assign({}, initTxInfo, { inscribeJsonString, destAddr, txError, decimal: dec }));
      } else {
        setTxInfo(Object.assign({}, initTxInfo, { txError }));
      }

      if (type === TxType.SIGN_TX && psktJsonString) {
        const decodedPskt = await wallet.decodePskt(psktJsonString, psktOptions);
        setDecodedPskt(decodedPskt);
      }
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
      isScammer,
      inscribeJsonString,
      destAddr
    });

    setLoading(false);
  };

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (type == TxType.SIGN_KRC20_TRANSFER_BATCH) setDisabled(true);
  }, [type]);

  if (!handleCancel) {
    handleCancel = () => {
      rejectApproval();
    };
  }

  if (!handleConfirm) {
    handleConfirm = () => {
      if (
        type === TxType.SIGN_KRC20_DEPLOY ||
        type === TxType.SIGN_KRC20_MINT ||
        type == TxType.SIGN_KRC20_TRANSFER_BATCH ||
        type === TxType.SIGN_KRC20_TRANSFER ||
        type == TxType.SIGN_KNS_TRANSFER ||
        type == TxType.SIGN_KSPRNFT_TRANSFER
      ) {
        resolveApproval({
          list: list,
          inscribeJsonString: txInfo.inscribeJsonString,
          type,
          destAddr: txInfo.destAddr,
          priorityFee
        });
      } else if (type === TxType.SIGN_TX) {
        resolveApproval({
          psktJsonString,
          psktOptions
        });
      } else {
        resolveApproval({
          psbtHex: txInfo.psbtHex,
          payload: payload
        });
      }
    };
  }

  const networkFee = useMemo(() => txInfo.decodedPsbt.fee, [txInfo.decodedPsbt]);
  const detailsComponent = useMemo(() => {
    return (
      <SignTxDetails
        txInfo={txInfo}
        rawTxInfo={rawTxInfo}
        type={type}
        tokenType={tokenType}
        batchTransferList={list}
        payload={payload}
        decodedPskt={decodedPskt}
      />
    );
  }, [txInfo, rawTxInfo, type, list, payload, decodedPskt]);

  const onChange = (e: CheckboxChangeEvent) => {
    const val = e.target.checked;
    setDisabled(!val);
  };

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
  useEffect(() => {
    eventBus.addEventListener('signkrc20process', (e: string) => {
      setSignPercent(JSON.parse(e));
    });
    return () => {
      eventBus.removeEventListener('signkrc20process', () => {
        setSignPercent({ percent: 0, msg: '' });
      });
    };
  }, []);

  if (loading) {
    if (
      type === TxType.SIGN_KRC20_DEPLOY ||
      type === TxType.SIGN_KRC20_TRANSFER ||
      type === TxType.SIGN_KRC20_MINT ||
      type === TxType.SIGN_KNS_TRANSFER ||
      type === TxType.SIGN_KSPRNFT_TRANSFER
    ) {
      return (
        <Layout>
          <Content itemsCenter justifyCenter>
            <Progress percent={signPercent.percent} status="active" strokeColor={{ from: '#108ee9', to: '#87d068' }} />
            <Text text={signPercent.msg} color="textDim" style={{ wordWrap: 'break-word' }} selectText />
          </Content>
        </Layout>
      );
    }

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
            <Text text="Phishing Detection" preset="title-bold" textCenter mt="xxl" selectText />
            <Text text="Malicious behavior and suspicious activity have been detected." mt="md" selectText />
            <Text
              text="Your access to this page has been restricted by KasWare Wallet as it might be unsafe."
              mt="md"
              selectText
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
              <Text text={networkFee} selectText />
              <Text text={kasTick} color="textDim" selectText />
            </Section>
          )}

          {canChanged == false && (
            <Section title="Network Fee Rate:">
              <Text text={txInfo.decodedPsbt.feeRate.toString()} selectText />
              <Text text="sat/vB" color="textDim" selectText />
            </Section>
          )}
          {errors &&
            errors.map((error, index) => {
              if (errors.length == 1) {
                return <Text key={index} text={`${error}`} color="error" mt="md" selectText />;
              }
              return <Text key={index} text={`${index + 1}: ${error}`} color="error" selectText />;
            })}
        </Column>
      </Content>

      <Footer>
        {type == TxType.SIGN_KRC20_TRANSFER_BATCH && (
          <Row my="md" mx="md" fullX>
            <Checkbox onChange={onChange} checked={!disabled} style={{ fontSize: fontSizes.sm }}>
              <Text text="I agree to batch transfer KRC20 token." selectText />
            </Checkbox>
          </Row>
        )}
        <Row full>
          <Button preset="default" text="Reject" onClick={handleCancel} full />
          {hasHighRisk == false && (
            <Button
              preset="primary"
              text={type == TxType.SIGN_TX ? 'Sign' : 'Sign & Pay'}
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
