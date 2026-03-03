import { Layout } from 'antd';
import { Content } from 'antd/lib/layout/layout';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import type { TProtocol, TTokenType } from '@/shared/types';
import { TxType } from '@/shared/types';
import { Header } from '@/ui/components';
import { selectCurrentKaspaAddress } from '@/ui/state/accounts/reducer';
import { useAppSelector } from '@/ui/state/hooks';
import { selectNetworkId } from '@/ui/state/settings/reducer';
import { useOrdinalsTx, usePushKasplexTxCallback } from '@/ui/state/transactions/hooks';
import { useWallet } from '@/ui/utils';
import { LoadingOutlined } from '@ant-design/icons';

import { SignPsbt } from '../Approval/components';
import { useNavigate } from '../MainRoute';

export default function KRC20TxConfirmScreen() {
  const wallet = useWallet();
  const { t } = useTranslation();
  const ordinalsTx = useOrdinalsTx();
  const networkId = useAppSelector(selectNetworkId);
  const currentAddress = useAppSelector(selectCurrentKaspaAddress);
  const navigate = useNavigate();
  const pushKasplexTx = usePushKasplexTxCallback();
  const { state } = useLocation();
  const { inscribeJsonString, type, tokenType, destAddr, priorityFee, protocol } = state as {
    inscribeJsonString: string;
    type: TxType;
    tokenType: TTokenType;
    priorityFee: number;
    isRBF: boolean;
    protocol: TProtocol;
    destAddr?: string;
  };
  const [title, setTitle] = useState('KRC20 TX Confirm');
  useEffect(() => {
    if (type === TxType.SIGN_KNS_TRANSFER) setTitle('KNS TX Confirm');
    if (type === TxType.SIGN_KSPRNFT_TRANSFER) setTitle('KRC721 TX Confirm');
  }, [type]);

  return (
    <Layout>
      <Content style={{ backgroundColor: '#1C1919' }} className="overflow-auto">
        {ordinalsTx.sending ? (
          <div className="flex flex-col items-strech mx-5 text-6xl mt-60 gap-3_75 text-primary">
            <LoadingOutlined />
            <span className="text-2xl text-white text-center">{t('Sending')}</span>
          </div>
        ) : (
          <SignPsbt
            header={
              <Header
                onBack={() => {
                  window.history.go(-1);
                }}
                title={title}
              />
            }
            params={{ data: { inscribeJsonString, type, tokenType, destAddr } }}
            handleCancel={() => {
              // navigate('WalletTabScreen');
              window.history.go(-1);
            }}
            handleConfirm={() => {
              wallet.updateKRC20History(networkId, currentAddress, inscribeJsonString);
              // dispatch(
              //   uiActions.updateKRC20History({ networkId, deploy: op?.deploy, mint: op?.mint, transfer: op?.transfer })
              // );
              pushKasplexTx(inscribeJsonString, type, destAddr, priorityFee, protocol).then(
                ({ success, txids, error, type, inscribeJsonString, destAddr }) => {
                  if (success) {
                    navigate('TxSuccessScreen', { txids, type, inscribeJsonString, destAddr });
                  } else {
                    navigate('TxFailScreen', { error });
                  }
                }
              );
            }}
          />
        )}
      </Content>
    </Layout>
  );
}
