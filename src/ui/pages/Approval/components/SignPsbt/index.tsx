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
import { Button, Card, Column, Content, Footer, Header, Layout, Row, Text } from '@/ui/components';
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
import { colors } from '@/ui/theme/colors';
import { formatLocaleString, shortAddress, useApproval, useWallet } from '@/ui/utils';
import { useKrc20DecName } from '@/ui/utils/hooks/kasplex/fetchKrc20AddressTokenList';
import { sompiToAmount } from '@/shared/utils/format';
import PayloadComp from '../PayloadComp';
import { SendToComp } from '@/ui/components/SendTo';
import { Section, LoadingView, ScammerView } from '../common';

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
  if (inputInfos === undefined) return null;
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
  if (outputInfos === undefined) return null;
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
    if (type === TxType.SIGN_KRC20_MINT) {
      return t('Mint KRC20 Token') as string;
    }
    if (type === TxType.SIGN_KRC20_TRANSFER) {
      return t('Transfer KRC20 Token') as string;
    }
    if (type === TxType.SIGN_KNS_TRANSFER) {
      return t('Transfer KNS') as string;
    }
    if (type === TxType.SIGN_KSPRNFT_TRANSFER) {
      return t('Transfer') as string;
    }
    if (type === TxType.SIGN_KRC20_TRANSFER_BATCH) {
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
    // Use BigNumber for financial calculations to avoid floating-point precision errors
    const safeReduce = (infos: { address: string; value: number }[] | undefined) =>
      (infos || [])
        .filter((v) => v.address === address && typeof v.value === 'number' && Number.isFinite(v.value))
        .reduce((pre, cur) => pre.plus(cur.value), new BigNumber(0));
    const inValue = safeReduce(decodedPskt?.inputInfos);
    const outValue = safeReduce(decodedPskt?.outputInfos);
    const amt = outValue.minus(inValue);
    return amt.isFinite() ? amt : new BigNumber(0);
  }, [address, decodedPskt?.inputInfos, decodedPskt?.outputInfos]);

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

  // Parse once and reuse
  const parsedInscribeJson = useMemo(() => {
    if (txInfo?.inscribeJsonString) {
      try {
        return JSON.parse(txInfo.inscribeJsonString);
      } catch {
        return null;
      }
    }
    return null;
  }, [txInfo?.inscribeJsonString]);

  const knsAsset = useMemo(() => {
    if (parsedInscribeJson && type === TxType.SIGN_KNS_TRANSFER) {
      return knsAssets.find((v) => v.assetId === parsedInscribeJson?.id);
    }
    return undefined;
  }, [parsedInscribeJson, knsAssets, type]);

  const ksprAsset = useMemo(() => {
    if (parsedInscribeJson && type === TxType.SIGN_KSPRNFT_TRANSFER) {
      return { tokenId: parsedInscribeJson?.tokenId, tick: parsedInscribeJson?.tick };
    }
    return undefined;
  }, [parsedInscribeJson, type]);

  const prettyInscribeJsonString = useMemo(() => {
    if (parsedInscribeJson) {
      return JSON.stringify(parsedInscribeJson, null, 2);
    }
    return '';
  }, [parsedInscribeJson]);

  const inscribeJson = parsedInscribeJson ?? '';

  const feeAmount = useMemo(() => {
    if (txInfo.decodedPsbt.fee && txInfo.decodedPsbt.fee > 0) {
      return new BigNumber(txInfo.decodedPsbt.fee).plus(txInfo.decodedPsbt.priorityFee || 0).toNumber();
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
            <Card style={{ backgroundColor: colors.card, maxWidth: 320, width: 320 }}>
              <Column gap="lg">
                <Column>
                  <Column>
                    <Column justifyCenter>
                      <Row itemsCenter>
                        <Text
                          text={
                            'Balance Change: ' +
                            (balanceChangedAmount.isGreaterThan(0) ? '+' : '') +
                            formatLocaleString(balanceChangedAmount)
                          }
                          color="white"
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
              'Disclaimer: This transaction might involve the transfer of assets ' +
              'from unknown protocols. KasWare Wallet shall not be liable for ' +
              'any financial losses incurred.'
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
    type === TxType.SIGN_KRC20_DEPLOY ||
    type === TxType.SIGN_KRC20_MINT ||
    type === TxType.SIGN_KRC20_TRANSFER_BATCH ||
    type === TxType.SIGN_KRC20_TRANSFER ||
    type === TxType.SIGN_KNS_TRANSFER ||
    type === TxType.SIGN_KSPRNFT_TRANSFER
  ) {
    return (
      <Column gap="lg">
        <Text
          text={title}
          preset="title-bold"
          textCenter
          mt="lg"
          mb={
            type === TxType.SIGN_KRC20_TRANSFER ||
            type === TxType.SIGN_KNS_TRANSFER ||
            type === TxType.SIGN_KSPRNFT_TRANSFER
              ? 'zero'
              : 'md'
          }
          selectText
        />
        {type === TxType.SIGN_KNS_TRANSFER && knsAsset !== undefined && (
          <Row style={{ flexWrap: 'wrap' }} gap="lg" justifyCenter mb="lg">
            <KnsPreview data={knsAsset} preset="medium" />
          </Row>
        )}
        {type === TxType.SIGN_KSPRNFT_TRANSFER && ksprAsset !== undefined && (
          <Row style={{ flexWrap: 'wrap' }} gap="lg" justifyCenter mb="lg">
            <KsprNftPreview tick={ksprAsset.tick} id={ksprAsset.tokenId} preset="medium" />
          </Row>
        )}

        {type === TxType.SIGN_KRC20_TRANSFER && (
          <Row justifyCenter fullX>
            <Card style={{ backgroundColor: colors.card, alignItems: 'stretch' }} fullX>
              <Column gap="lg" fullX>
                <Row justifyBetween itemsCenter>
                  <Text text="Token" color="textDim" preset="sub" selectText />
                  <Text text={krc20Tick} preset="bold" selectText />
                </Row>
                <Row justifyBetween itemsCenter>
                  <Text text="Amount" color="textDim" preset="sub" selectText />
                  <Column itemsEnd>
                    <Text
                      text={`${formatLocaleString(
                        sompiToAmount(
                          (inscribeJson as KasplexData<'transfer'>)?.amt,
                          txInfo?.decimal ? txInfo?.decimal : krc20Dec ? krc20Dec : '8'
                        )
                      )}`}
                      color="white"
                      preset="bold"
                      size="xl"
                      selectText
                    />
                    <Text
                      text={`Raw: ${(inscribeJson as KasplexData<'transfer'>)?.amt}`}
                      preset="xsub"
                      color="textDim"
                      selectText
                    />
                  </Column>
                </Row>
                <Row justifyBetween itemsCenter>
                  <Text text="To" color="textDim" preset="sub" selectText />
                  <AddressText address={(inscribeJson as KasplexData<'transfer'>)?.to || ''} textCenter />
                </Row>
              </Column>
            </Card>
          </Row>
        )}

        {feeAmount > 0 && (
          <Row justifyCenter fullX mt="xl">
            <Card fullX style={{ backgroundColor: colors.card, paddingLeft: '4px', paddingRight: '4px' }}>
              <Row justifyBetween itemsCenter>
                <Text text="Network Fee" color="textDim" preset="sub" selectText />
                <Row itemsCenter gap="sm">
                  <Text text={formatLocaleString(feeAmount)} preset="bold" selectText />
                  <Text text={kasTick} color="textDim" preset="sub" selectText />
                </Row>
              </Row>
            </Card>
          </Row>
        )}

        <Row justifyCenter fullX mt="zero" mb="zero">
          <Card fullX style={{ paddingLeft: '4px', paddingRight: '4px' }}>
            <Column gap="md" fullX>
              <Column gap="xs">
                <Text text="Raw Transaction Data (JSON)" preset="sub" color="textDim" selectText />
                <Text
                  text="This is the exact data that will be inscribed on the blockchain"
                  preset="xsub"
                  color="textDim"
                  selectText
                />
              </Column>
              <div
                style={{
                  userSelect: 'text',
                  maxHeight: 320,
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  flexWrap: 'wrap',
                  fontSize: '0.875rem',
                  backgroundColor: colors.bg3,
                  padding: '8px 12px',
                  borderRadius: '6px'
                }}
              >
                {type !== TxType.SIGN_KRC20_TRANSFER_BATCH && prettyInscribeJsonString}
                {type === TxType.SIGN_KRC20_TRANSFER_BATCH &&
                  batchTransferList &&
                  batchTransferList.length > 0 &&
                  batchTransferList.map((item, index) => {
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
            </Column>
          </Card>
        </Row>
      </Column>
    );
  }

  return (
    <Column gap="lg">
      <Text text={t('Sign Transaction') as string} preset="title-bold" textCenter mt="lg" selectText />
      <Row justifyCenter>
        <Card style={{ backgroundColor: colors.card, maxWidth: 320, width: 320 }}>
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
                </Column>
              </Column>
            </Column>
          </Column>
        </Card>
      </Row>

      {payload !== undefined && payload?.length > 0 && <PayloadComp payload={payload} />}
      {rawTxInfo?.payload !== undefined && rawTxInfo?.payload.length > 0 && (
        <PayloadComp payload={rawTxInfo?.payload} />
      )}
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
      feeRate,
      priorityFee,
      payload,
      rawTxInfo,
      inscribeJsonString,
      destAddr
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

  // i18n labels
  const LABELS = useMemo(
    () => ({
      TRANSACTION_FEE: t('Transaction Fee:'),
      NETWORK_FEE_RATE: t('Network Fee Rate:'),
      SAT_VB: t('sat/vB'),
      AGREE_BATCH_TRANSFER: t('I agree to batch transfer KRC20 token.'),
      REJECT: t('Reject'),
      SIGN: t('Sign'),
      SIGN_AND_PAY: t('Sign & Pay')
    }),
    []
  );
  const init = async () => {
    let txError = '';
    if (type === TxType.SEND_KASPA) {
      // request from kasware provider
      if (!psbtHex && toAddress && sompi) {
        try {
          const rawTxInfo = await prepareSendKAS({
            toAddressInfo: { address: toAddress, domain: '' },
            toAmount: Number(sompiToAmount(sompi, 8)),
            priorityFee,
            feeRate
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
        type === TxType.SIGN_KRC20_TRANSFER ||
        type === TxType.SIGN_KRC20_MINT ||
        type === TxType.SIGN_KRC20_TRANSFER_BATCH ||
        type === TxType.SIGN_KRC20_DEPLOY ||
        type === TxType.SIGN_KNS_TRANSFER ||
        type === TxType.SIGN_KSPRNFT_TRANSFER
      ) {
        let dec: string | undefined;
        if (type === TxType.SIGN_KRC20_DEPLOY && inscribeJsonString) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (type === TxType.SIGN_KRC20_TRANSFER_BATCH) setDisabled(true);
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
        type === TxType.SIGN_KRC20_TRANSFER_BATCH ||
        type === TxType.SIGN_KRC20_TRANSFER ||
        type === TxType.SIGN_KNS_TRANSFER ||
        type === TxType.SIGN_KSPRNFT_TRANSFER
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
  }, [txInfo, rawTxInfo, type, tokenType, list, payload, decodedPskt]);

  const onChange = (e: CheckboxChangeEvent) => {
    const val = e.target.checked;
    setDisabled(!val);
  };

  const canChanged = useMemo(() => {
    let val = true;
    txInfo.decodedPsbt.inputInfos.forEach((v) => {
      if (v.address === address && (!v.sighashType || v.sighashType === 1)) {
        val = false;
      }
    });
    return val;
  }, [address, txInfo.decodedPsbt.inputInfos]);

  const hasHighRisk = useMemo(() => {
    if (txInfo && txInfo.decodedPsbt) {
      return txInfo.decodedPsbt.risks.find((v) => v.level === 'high') ? true : false;
    } else {
      return false;
    }
  }, [txInfo]);
  useEffect(() => {
    const handler = (e: string) => {
      setSignPercent(JSON.parse(e));
    };
    eventBus.addEventListener('signkrc20process', handler);
    return () => {
      eventBus.removeEventListener('signkrc20process', handler);
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

    return <LoadingView />;
  }

  if (!header && session) {
    header = (
      <Header>
        <WebsiteBar session={session} />
      </Header>
    );
  }

  if (txInfo.isScammer) {
    return <ScammerView onCancel={handleCancel} />;
  }

  return (
    <Layout>
      {header}
      <Content>
        <Column gap="xxs">
          {detailsComponent}
          {canChanged === false && (
            <>
              <Section title={LABELS.TRANSACTION_FEE}>
                <Text text={networkFee} selectText />
                <Text text={kasTick} color="textDim" selectText />
              </Section>
              <Section title={LABELS.NETWORK_FEE_RATE}>
                <Text text={txInfo.decodedPsbt.feeRate.toString()} selectText />
                <Text text={LABELS.SAT_VB} color="textDim" selectText />
              </Section>
            </>
          )}

          {errors &&
            errors.map((error, index) => {
              if (errors.length === 1) {
                return <Text key={index} text={`${error}`} color="error" mt="md" selectText />;
              }
              return <Text key={index} text={`${index + 1}: ${error}`} color="error" selectText />;
            })}
        </Column>
      </Content>

      <Footer>
        {type === TxType.SIGN_KRC20_TRANSFER_BATCH && (
          <Row my="md" mx="md" fullX>
            <Checkbox onChange={onChange} checked={!disabled} style={{ fontSize: fontSizes.sm }}>
              <Text text={LABELS.AGREE_BATCH_TRANSFER} selectText />
            </Checkbox>
          </Row>
        )}
        <Row full>
          <Button preset="default" text={LABELS.REJECT} onClick={handleCancel} full />
          {hasHighRisk === false && (
            <Button
              preset="primary"
              text={type === TxType.SIGN_TX ? LABELS.SIGN : LABELS.SIGN_AND_PAY}
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
