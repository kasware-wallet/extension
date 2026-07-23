import { Layout } from 'antd';
import { Content } from 'antd/lib/layout/layout';
import { useLocation, useNavigate as useNavigateOrigin } from 'react-router-dom';

import type { TxType } from '@/shared/types';
import { Header } from '@/ui/components';
import { colors } from '@/ui/theme/colors';
import { selectCurrentKaspaAddress } from '@/ui/state/accounts/reducer';
import { useAppSelector } from '@/ui/state/hooks';
import { selectNetworkId } from '@/ui/state/settings/reducer';
import { useWallet } from '@/ui/utils';

import { BatchSignPsbt } from '../Approval/components';

export default function KRC20BatchTxConfirmScreen() {
  const wallet = useWallet();
  const currentAddress = useAppSelector(selectCurrentKaspaAddress);
  const sourceAddr = useAppSelector(selectCurrentKaspaAddress);
  const navigateOrigin = useNavigateOrigin();
  const networkId = useAppSelector(selectNetworkId);
  const { state } = useLocation();
  const { inscribeJsonString, type, times, destAddr } = state as {
    inscribeJsonString: string;
    type: TxType;
    times: number;
    destAddr: string;
  };

  return (
    <Layout>
      <Content style={{ backgroundColor: colors.bg5 }} className="overflow-auto">
        <BatchSignPsbt
          header={
            <Header
              onBack={() => {
                window.history.go(-1);
              }}
              title="KRC20 TX Confirm"
            />
          }
          params={{ data: { inscribeJsonString, type, destAddr } }}
          handleCancel={() => {
            // navigate('WalletTabScreen');
            window.history.go(-1);
          }}
          handleConfirm={() => {
            wallet.updateKRC20History(networkId, currentAddress, inscribeJsonString);
            navigateOrigin(
              `/krc20/batchmintprocess?inscribeJsonString=${inscribeJsonString}&times=${times}&sourceAddr=${sourceAddr}&networkId=${networkId}`
            );
          }}
        />
      </Content>
    </Layout>
  );
}
