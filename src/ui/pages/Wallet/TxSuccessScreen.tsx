import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import log from 'loglevel';

import type { IResultPsbtHex, ISignKRC20TX, KasplexData } from '@/shared/types';
import { TxType } from '@/shared/types';
import type { KsprTransfer } from '@/shared/types/kspr';
import { Button, Footer, Header, Layout, Row } from '@/ui/components';
import { TxSuccessLayout, type TxLinkRowProps } from '@/ui/components/TxSuccessLayout';
import { ViewTx } from '@/ui/components/ViewTx';
import { useNavigate } from '@/ui/pages/MainRoute';
import { useAppDispatch, useAppSelector } from '@/ui/state/hooks';
import { selectBlockstreamUrl, selectKasTick, selectNetworkId } from '@/ui/state/settings/reducer';
import { KRC20MintDeployTabKey, tempUiActions } from '@/ui/state/temp-ui/reducer';
import { formatLocaleString, shortAddress, useLocationState } from '@/ui/utils';
import { useKrc20DecName } from '@/ui/utils/hooks/kasplex/fetchKrc20AddressTokenList';
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
    if (inscribeJsonString && inscribeJsonString.length > 0) {
      try {
        return JSON.parse(inscribeJsonString);
      } catch (e) {
        log.debug('Failed to parse inscribeJsonString:', e);
        return undefined;
      }
    }
    return undefined;
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

  const parsedRawTx = useMemo(() => {
    if (!rawtx) return null;
    try {
      return JSON.parse(rawtx) as IResultPsbtHex;
    } catch (e) {
      log.debug('Failed to parse rawtx:', e);
      return null;
    }
  }, [rawtx]);

  const toAddress = parsedRawTx?.to || '';
  const payload = parsedRawTx?.payload || '';
  const inputAmount = parsedRawTx?.amount || '0';

  useUpdateRecentSendToAddressKaspa(toAddress);

  const extraContent = (
    <>
      {payload != undefined && payload.length > 0 && <PayloadComp payload={payload} />}
      <ViewTx txId={txid} />
    </>
  );

  return (
    <>
      <TxSuccessLayout
        title={t('Sent')}
        description={`${formatLocaleString(inputAmount)} ${kasTick} ${t('was successfully sent to')}`}
        destAddress={shortAddress(toAddress)}
        extraContent={extraContent}
        footer={
          <Footer>
            <Button
              full
              text={t('Done')}
              onClick={() => {
                navigate('WalletTabScreen');
              }}
            />
          </Footer>
        }
      />
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
  const txIdsObj: ISignKRC20TX = useMemo(() => {
    try {
      return JSON.parse(txids);
    } catch (e) {
      log.debug('Failed to parse txids:', e);
      return { commitId: '', revealId: '' };
    }
  }, [txids]);
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

  const txLinks: TxLinkRowProps[] = [
    // { label: t('Commit Tx'), txId: txIdsObj?.commitId, blockstreamUrl },
    // { label: t('Reveal Tx'), txId: txIdsObj?.revealId, blockstreamUrl }
    { label: t('Tx'), txId: txIdsObj?.revealId, blockstreamUrl }
  ];

  return (
    <>
      <TxSuccessLayout
        title={t('Deployed')}
        description={`${formatLocaleString(inputAmount)} ${inscribeObj?.tick} ${t('was successfully deployed')}`}
        destAddress={shortAddress(destAddr)}
        txLinks={txLinks}
        footer={
          <Footer>
            <Row full>
              <Button
                preset="primary"
                text={`Mint ${inscribeObj?.tick}`}
                onClick={() => {
                  dispatch(
                    tempUiActions.updateKRC20MintDeployTab({
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
        }
      />
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
  const txIdsObj: ISignKRC20TX = useMemo(() => {
    try {
      return JSON.parse(txids);
    } catch (e) {
      log.debug('Failed to parse txids:', e);
      return { commitId: '', revealId: '' };
    }
  }, [txids]);

  const txLinks: TxLinkRowProps[] = [
    { label: t('Commit Tx'), txId: txIdsObj?.commitId, blockstreamUrl },
    { label: t('Reveal Tx'), txId: txIdsObj?.revealId, blockstreamUrl }
  ];

  return (
    <>
      <TxSuccessLayout
        title={t('Minted')}
        description={`${inscribeObj?.tick} ${t('was successfully minted')}`}
        destAddress={shortAddress(destAddr)}
        txLinks={txLinks}
        footer={
          <Footer>
            <Row full>
              <Button
                preset="primary"
                text="Mint Again"
                onClick={() => {
                  dispatch(
                    tempUiActions.updateKRC20MintDeployTab({
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
        }
      />
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
  const txIdsObj: ISignKRC20TX = useMemo(() => {
    try {
      return JSON.parse(txids);
    } catch (e) {
      log.debug('Failed to parse txids:', e);
      return { commitId: '', revealId: '' };
    }
  }, [txids]);
  useUpdateRecentSendToAddressKaspa(destAddr);

  const calculatedAmount = useMemo(() => {
    if (inscribeObj?.amt) {
      return sompiToAmount(inscribeObj.amt, krc20Dec || '8');
    }
    return '0';
  }, [inscribeObj?.amt, krc20Dec]);

  const txLinks: TxLinkRowProps[] = [
    // { label: t('Commit Tx'), txId: txIdsObj?.commitId, blockstreamUrl },
    // { label: t('Reveal Tx'), txId: txIdsObj?.revealId, blockstreamUrl }
    { label: t('Tx'), txId: txIdsObj?.revealId, blockstreamUrl }
  ];

  return (
    <>
      <TxSuccessLayout
        title={t('Sent')}
        description={`${formatLocaleString(calculatedAmount)} ${krc20Tick} ${t('was successfully sent to')}`}
        destAddress={shortAddress(destAddr)}
        txLinks={txLinks}
        footer={
          <Footer>
            <Button
              full
              text={t('Done')}
              onClick={() => {
                navigate('WalletTabScreen');
              }}
            />
          </Footer>
        }
      />
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
  const txIdsObj: ISignKRC20TX = useMemo(() => {
    try {
      return JSON.parse(txids);
    } catch (e) {
      log.debug('Failed to parse txids:', e);
      return { commitId: '', revealId: '' };
    }
  }, [txids]);
  useUpdateRecentSendToAddressKaspa(destAddr);

  const txLinks: TxLinkRowProps[] = [
    { label: t('Commit Tx'), txId: txIdsObj?.commitId, blockstreamUrl },
    { label: t('Reveal Tx'), txId: txIdsObj?.revealId, blockstreamUrl }
  ];

  return (
    <>
      <TxSuccessLayout
        title={t('Sent')}
        description={`${shortAddress(inscribeObj.id)} ${t('was successfully sent to')}`}
        destAddress={shortAddress(destAddr)}
        txLinks={txLinks}
        footer={
          <Footer>
            <Button
              full
              text={t('Done')}
              onClick={() => {
                navigate('WalletTabScreen');
              }}
            />
          </Footer>
        }
      />
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
  const txIdsObj: ISignKRC20TX = useMemo(() => {
    try {
      return JSON.parse(txids);
    } catch (e) {
      log.debug('Failed to parse txids:', e);
      return { commitId: '', revealId: '' };
    }
  }, [txids]);
  useUpdateRecentSendToAddressKaspa(destAddr);

  const txLinks: TxLinkRowProps[] = [
    { label: t('Commit Tx'), txId: txIdsObj?.commitId, blockstreamUrl },
    { label: t('Reveal Tx'), txId: txIdsObj?.revealId, blockstreamUrl }
  ];

  return (
    <>
      <TxSuccessLayout
        title={t('Sent')}
        description={`${inscribeObj.tick}#${inscribeObj.tokenId} ${t('was successfully sent to')}`}
        destAddress={shortAddress(destAddr)}
        txLinks={txLinks}
        footer={
          <Footer>
            <Button
              full
              text={t('Done')}
              onClick={() => {
                navigate('WalletTabScreen');
              }}
            />
          </Footer>
        }
      />
    </>
  );
}
