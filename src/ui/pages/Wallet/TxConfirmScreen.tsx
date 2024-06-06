import { RawTxInfo, TxType } from '@/shared/types';
import { Header } from '@/ui/components';
import { useLocationState } from '@/ui/utils';

import { usePushKaspaTxCallback } from '@/ui/state/transactions/hooks';
import { SignPsbt } from '../Approval/components';
import { useNavigate } from '../MainRoute';

interface LocationState {
  rawTxInfo: RawTxInfo;
}

export default function TxConfirmScreen() {
  const { rawTxInfo } = useLocationState<LocationState>();
  const navigate = useNavigate();
  const pushKaspaTx = usePushKaspaTxCallback();
  return (
    <SignPsbt
      header={
        <Header
          onBack={() => {
            // window.history.go(-1);
            navigate('TxCreateScreen', { rawTxInfo });
          }}
        />
      }
      params={{ data: { psbtHex: rawTxInfo.psbtHex, type: TxType.SEND_KASPA, rawTxInfo } }}
      handleCancel={() => {
        // window.history.go(-1);
        navigate('TxCreateScreen', { rawTxInfo });
      }}
      handleConfirm={() => {
        pushKaspaTx(rawTxInfo.rawtx).then(({ success, txid, error }) => {
          if (success) {
            navigate('TxSuccessScreen', { txid, rawtx: rawTxInfo.rawtx });
          } else {
            navigate('TxFailScreen', { error });
          }
        });
      }}
    />
  );
}
