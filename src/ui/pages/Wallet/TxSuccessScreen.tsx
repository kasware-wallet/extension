import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { IResultPsbtHex, ISignKRC20TX, KasplexData } from '@/shared/types';
import { TxType } from '@/shared/types';
import type { KsprTransfer } from '@/shared/types/kspr';
import { Button, Column, Content, Footer, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { ViewTx } from '@/ui/components/ViewTx';
import { useNavigate } from '@/ui/pages/MainRoute';
import { useAppDispatch, useAppSelector } from '@/ui/state/hooks';
import { selectBlockstreamUrl, selectKasTick, selectNetworkId } from '@/ui/state/settings/reducer';
import { KRC20MintDeployTabKey, uiActions } from '@/ui/state/ui/reducer';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';
import { formatLocaleString, shortAddress, useLocationState } from '@/ui/utils';
import { useKrc20DecName } from '@/ui/utils/hooks/kasplex/fetchKrc20AddressTokenList';
import { ExportOutlined } from '@ant-design/icons';
import { useUpdateRecentSendToAddressKaspa } from '@/ui/hooks/wallet';
import { sompiToAmount } from '@/shared/utils/format';
import PayloadComp from '../Approval/components/PayloadComp';

interface LocationState {
  txid: string;
  rawtx: string;
  txids: string;
  type: TxType;
  inscribeJsonString: string;
  destAddr: string;
}

export default function TxSuccessScreen() {
  const { txid, rawtx, txids, type, inscribeJsonString, destAddr } = useLocationState<LocationState>();
  const inscribeObj = useMemo(() => {
    if (inscribeJsonString && inscribeJsonString.length > 0) return JSON.parse(inscribeJsonString);
  }, [inscribeJsonString]);
  return (
    <Layout>
      <Header />
      {type && type === TxType.SEND_KASPA && <SendKaspaTxSuccess txid={txid} rawtx={rawtx} />}
      {type && type === TxType.SIGN_KRC20_DEPLOY && (
        <KRC20DeployTxSuccess txids={txids} inscribeObj={inscribeObj} destAddr={destAddr} />
      )}
      {type && (type === TxType.SIGN_KRC20_MINT || type === TxType.SIGN_KRC20_MINT_BATCH) && (
        <KRC20MintTxSuccess txids={txids} inscribeObj={inscribeObj} destAddr={destAddr} />
      )}
      {type && (type === TxType.SIGN_KRC20_TRANSFER || type === TxType.SIGN_KRC20_TRANSFER_BATCH) && (
        <KRC20TransferTxSuccess txids={txids} inscribeObj={inscribeObj} destAddr={destAddr} />
      )}
      {type && type === TxType.SIGN_KNS_TRANSFER && (
        <KnsTransferTxSuccess txids={txids} inscribeObj={inscribeObj} destAddr={destAddr} />
      )}
      {type && type === TxType.SIGN_KSPRNFT_TRANSFER && (
        <KsprNftTransferTxSuccess txids={txids} inscribeObj={inscribeObj} destAddr={destAddr} />
      )}
    </Layout>
  );
}
function SendKaspaTxSuccess({ txid, rawtx }: { txid: string; rawtx: string }) {
  const navigate = useNavigate();
  const kasTick = useAppSelector(selectKasTick);
  const { t } = useTranslation();
  const toAddress = useMemo(() => {
    if (!rawtx) return '';
    const result: IResultPsbtHex = JSON.parse(rawtx);
    return result.to;
  }, [rawtx]);
  const payload = useMemo(() => {
    if (!rawtx) return '';
    const result: IResultPsbtHex = JSON.parse(rawtx);
    return result.payload;
  }, [rawtx]);
  const inputAmount = useMemo(() => {
    const result: IResultPsbtHex = JSON.parse(rawtx);
    return result.amount;
  }, [rawtx]);
  useUpdateRecentSendToAddressKaspa(toAddress);

  return (
    <>
      <Content style={{ gap: spacing.small }}>
        <Column justifyCenter mt="xl" gap="xl">
          <Row justifyCenter mt="xl">
            <Icon icon="success" size={60} style={{ alignSelf: 'center' }} />
          </Row>
          <Text preset="title" text={t('Sent')} textCenter size="xxxl" selectText />
          <Text
            text={`${formatLocaleString(inputAmount)} ${kasTick} ${t('was successfully sent to')}`}
            color="textDim"
            textCenter
            selectText
          />
          <Text text={shortAddress(toAddress)} color="textDim" textCenter />
          {payload != undefined && payload.length > 0 && <PayloadComp payload={payload} />}
          <ViewTx txId={txid} />
        </Column>
      </Content>
      <Footer>
        <Button
          full
          text={t('Done')}
          onClick={() => {
            navigate('WalletTabScreen');
          }}
        />
      </Footer>
    </>
  );
}

function KRC20DeployTxSuccess({
  txids,
  inscribeObj,
  destAddr
}: {
  txids: string;
  inscribeObj: KasplexData<'deploy'>;
  destAddr: string;
}) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const blockstreamUrl = useAppSelector(selectBlockstreamUrl);
  const txIdsObj: ISignKRC20TX = useMemo(() => JSON.parse(txids), [txids]);
  const [inputAmount, setInputAmount] = useState('0');

  const calculatedAmount = useMemo(() => {
    if (inscribeObj?.max) {
      return sompiToAmount(inscribeObj.max, inscribeObj.dec ?? '8');
    }
    return '0';
  }, [inscribeObj?.max, inscribeObj?.dec]);

  useEffect(() => {
    setInputAmount(calculatedAmount);
  }, [calculatedAmount]);
  return (
    <>
      <Content style={{ gap: spacing.small }}>
        <Column justifyCenter mt="xxl" gap="xl">
          <Row justifyCenter mt="xxl">
            <Icon icon="success" size={60} style={{ alignSelf: 'center' }} />
          </Row>
          <Text preset="title" text={t('Deployed')} textCenter size="xxxl" selectText />
          <Text
            text={`${formatLocaleString(inputAmount)} ${inscribeObj?.tick} ${t('was successfully deployed')}`}
            color="textDim"
            textCenter
            selectText
          />
          <Text text={shortAddress(destAddr)} color="textDim" textCenter />
          <Row
            justifyCenter
            onClick={() => {
              window.open(`${blockstreamUrl}/txs/${txIdsObj?.commitId}`);
            }}
          >
            <Text preset="regular-bold" text={t('Commit Tx')} color="aqua" size="md" selectText />
            <Text preset="regular-bold" text={shortAddress(txIdsObj?.commitId)} color="aqua" size="md" />
            <ExportOutlined style={{ color: colors.aqua, fontSize: 12 }} />
          </Row>
          <Row
            justifyCenter
            onClick={() => {
              window.open(`${blockstreamUrl}/txs/${txIdsObj?.revealId}`);
            }}
          >
            <Text preset="regular-bold" text={t('Reveal Tx')} color="aqua" size="md" selectText />
            <Text preset="regular-bold" text={shortAddress(txIdsObj?.revealId)} color="aqua" size="md" />
            <ExportOutlined style={{ color: colors.aqua, fontSize: 12 }} />
          </Row>
        </Column>
      </Content>
      <Footer>
        <Row full>
          <Button
            preset="primary"
            text={`Mint ${inscribeObj?.tick}`}
            onClick={() => {
              dispatch(
                uiActions.updateKRC20MintDeployTab({
                  krc20MintDeployTabKey: KRC20MintDeployTabKey.MINT
                })
              );
              navigate('KRC20MintDeployScreen', { tick: inscribeObj?.tick });
            }}
            full
          />
          <Button
            full
            text={t('Done')}
            onClick={() => {
              navigate('WalletTabScreen');
            }}
          />
        </Row>
      </Footer>
    </>
  );
}

function KRC20MintTxSuccess({
  txids,
  inscribeObj,
  destAddr
}: {
  txids: string;
  inscribeObj: KasplexData<'mint'>;
  destAddr: string;
}) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const blockstreamUrl = useAppSelector(selectBlockstreamUrl);
  const txIdsObj: ISignKRC20TX = useMemo(() => JSON.parse(txids), [txids]);
  return (
    <>
      <Content style={{ gap: spacing.small }}>
        <Column justifyCenter mt="xxl" gap="xl">
          <Row justifyCenter mt="xxl">
            <Icon icon="success" size={60} style={{ alignSelf: 'center' }} />
          </Row>
          <Text preset="title" text={t('Minted')} textCenter size="xxxl" selectText />
          <Text text={`${inscribeObj?.tick} ${t('was successfully minted')}`} color="textDim" textCenter selectText />
          <Text text={shortAddress(destAddr)} color="textDim" textCenter />
          <Row
            justifyCenter
            onClick={() => {
              window.open(`${blockstreamUrl}/txs/${txIdsObj?.commitId}`);
            }}
          >
            <Text preset="regular-bold" text={t('Commit Tx')} color="aqua" size="md" selectText />
            <Text preset="regular-bold" text={shortAddress(txIdsObj?.commitId)} color="aqua" size="md" />
            <ExportOutlined style={{ color: colors.aqua, fontSize: 12 }} />
          </Row>
          <Row
            justifyCenter
            onClick={() => {
              window.open(`${blockstreamUrl}/txs/${txIdsObj?.revealId}`);
            }}
          >
            <Text preset="regular-bold" text={t('Reveal Tx')} color="aqua" size="md" selectText />
            <Text preset="regular-bold" text={shortAddress(txIdsObj?.revealId)} color="aqua" size="md" />
            <ExportOutlined style={{ color: colors.aqua, fontSize: 12 }} />
          </Row>
        </Column>
      </Content>
      <Footer>
        <Row full>
          <Button
            preset="primary"
            text="Mint Again"
            onClick={() => {
              dispatch(
                uiActions.updateKRC20MintDeployTab({
                  krc20MintDeployTabKey: KRC20MintDeployTabKey.MINT
                })
              );
              navigate('KRC20MintDeployScreen', { tick: inscribeObj?.tick });
            }}
            full
          />
          <Button
            full
            text={t('Done')}
            onClick={() => {
              navigate('WalletTabScreen');
            }}
          />
        </Row>
      </Footer>
    </>
  );
}
function KRC20TransferTxSuccess({
  txids,
  inscribeObj,
  destAddr
}: {
  txids: string;
  inscribeObj: KasplexData<'transfer'>;
  destAddr: string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const kasNetworkId = useAppSelector(selectNetworkId);
  const { name: krc20Tick, dec: krc20Dec } = useKrc20DecName(
    kasNetworkId,
    (inscribeObj.tick as string) || (inscribeObj.ca as string)
  );
  const blockstreamUrl = useAppSelector(selectBlockstreamUrl);
  const txIdsObj: ISignKRC20TX = useMemo(() => JSON.parse(txids), [txids]);
  useUpdateRecentSendToAddressKaspa(destAddr);

  const calculatedAmount = useMemo(() => {
    if (inscribeObj?.amt) {
      return sompiToAmount(inscribeObj.amt, krc20Dec || '8');
    }
    return '0';
  }, [inscribeObj?.amt, krc20Dec]);

  return (
    <>
      <Content style={{ gap: spacing.small }}>
        <Column justifyCenter mt="xxl" gap="xl">
          <Row justifyCenter mt="xxl">
            <Icon icon="success" size={60} style={{ alignSelf: 'center' }} />
          </Row>
          <Text preset="title" text={t('Sent')} textCenter size="xxxl" selectText />
          <Text
            text={`${formatLocaleString(calculatedAmount)} ${krc20Tick} ${t('was successfully sent to')}`}
            color="textDim"
            textCenter
            selectText
          />
          <Text text={shortAddress(destAddr)} color="textDim" textCenter selectText />
          <Row
            justifyCenter
            onClick={() => {
              window.open(`${blockstreamUrl}/txs/${txIdsObj?.commitId}`);
            }}
          >
            <Text preset="regular-bold" text={t('Commit Tx')} color="aqua" size="md" selectText />
            <Text preset="regular-bold" text={shortAddress(txIdsObj?.commitId)} color="aqua" size="md" />
            <ExportOutlined style={{ color: colors.aqua, fontSize: 12 }} />
          </Row>
          <Row
            justifyCenter
            onClick={() => {
              window.open(`${blockstreamUrl}/txs/${txIdsObj?.revealId}`);
            }}
          >
            <Text preset="regular-bold" text={t('Reveal Tx')} color="aqua" size="md" selectText />
            <Text preset="regular-bold" text={shortAddress(txIdsObj?.revealId)} color="aqua" size="md" />
            <ExportOutlined style={{ color: colors.aqua, fontSize: 12 }} />
          </Row>
        </Column>
      </Content>
      <Footer>
        <Button
          full
          text={t('Done')}
          onClick={() => {
            navigate('WalletTabScreen');
          }}
        />
      </Footer>
    </>
  );
}

function KnsTransferTxSuccess({
  txids,
  inscribeObj,
  destAddr
}: {
  txids: string;
  inscribeObj: {
    op: string;
    p: string;
    id: string;
    to: string;
  };
  destAddr: string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const blockstreamUrl = useAppSelector(selectBlockstreamUrl);
  const txIdsObj: ISignKRC20TX = useMemo(() => JSON.parse(txids), [txids]);
  useUpdateRecentSendToAddressKaspa(destAddr);

  return (
    <>
      <Content style={{ gap: spacing.small }}>
        <Column justifyCenter mt="xxl" gap="xl">
          <Row justifyCenter mt="xxl">
            <Icon icon="success" size={60} style={{ alignSelf: 'center' }} />
          </Row>
          <Text preset="title" text={t('Sent')} textCenter size="xxxl" selectText />
          <Text
            text={`${shortAddress(inscribeObj.id)} ${t('was successfully sent to')}`}
            color="textDim"
            textCenter
            selectText
          />
          <Text text={shortAddress(destAddr)} color="textDim" textCenter selectText />
          <Row
            justifyCenter
            onClick={() => {
              window.open(`${blockstreamUrl}/txs/${txIdsObj?.commitId}`);
            }}
          >
            <Text preset="regular-bold" text={t('Commit Tx')} color="aqua" size="md" selectText />
            <Text preset="regular-bold" text={shortAddress(txIdsObj?.commitId)} color="aqua" size="md" />
            <ExportOutlined style={{ color: colors.aqua, fontSize: 12 }} />
          </Row>
          <Row
            justifyCenter
            onClick={() => {
              window.open(`${blockstreamUrl}/txs/${txIdsObj?.revealId}`);
            }}
          >
            <Text preset="regular-bold" text={t('Reveal Tx')} color="aqua" size="md" selectText />
            <Text preset="regular-bold" text={shortAddress(txIdsObj?.revealId)} color="aqua" size="md" />
            <ExportOutlined style={{ color: colors.aqua, fontSize: 12 }} />
          </Row>
        </Column>
      </Content>
      <Footer>
        <Button
          full
          text={t('Done')}
          onClick={() => {
            navigate('WalletTabScreen');
          }}
        />
      </Footer>
    </>
  );
}

function KsprNftTransferTxSuccess({
  txids,
  inscribeObj,
  destAddr
}: {
  txids: string;
  inscribeObj: KsprTransfer;
  destAddr: string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const blockstreamUrl = useAppSelector(selectBlockstreamUrl);
  const txIdsObj: ISignKRC20TX = useMemo(() => JSON.parse(txids), [txids]);
  useUpdateRecentSendToAddressKaspa(destAddr);

  return (
    <>
      <Content style={{ gap: spacing.small }}>
        <Column justifyCenter mt="xxl" gap="xl">
          <Row justifyCenter mt="xxl">
            <Icon icon="success" size={60} style={{ alignSelf: 'center' }} />
          </Row>
          <Text preset="title" text={t('Sent')} textCenter size="xxxl" selectText />
          <Text
            text={`${inscribeObj.tick}#${inscribeObj.tokenId} ${t('was successfully sent to')}`}
            color="textDim"
            textCenter
            selectText
          />
          <Text text={shortAddress(destAddr)} color="textDim" textCenter selectText />
          <Row
            justifyCenter
            onClick={() => {
              window.open(`${blockstreamUrl}/txs/${txIdsObj?.commitId}`);
            }}
          >
            <Text preset="regular-bold" text={t('Commit Tx')} color="aqua" size="md" selectText />
            <Text preset="regular-bold" text={shortAddress(txIdsObj?.commitId)} color="aqua" size="md" />
            <ExportOutlined style={{ color: colors.aqua, fontSize: 12 }} />
          </Row>
          <Row
            justifyCenter
            onClick={() => {
              window.open(`${blockstreamUrl}/txs/${txIdsObj?.revealId}`);
            }}
          >
            <Text preset="regular-bold" text={t('Reveal Tx')} color="aqua" size="md" selectText />
            <Text preset="regular-bold" text={shortAddress(txIdsObj?.revealId)} color="aqua" size="md" />
            <ExportOutlined style={{ color: colors.aqua, fontSize: 12 }} />
          </Row>
        </Column>
      </Content>
      <Footer>
        <Button
          full
          text={t('Done')}
          onClick={() => {
            navigate('WalletTabScreen');
          }}
        />
      </Footer>
    </>
  );
}
