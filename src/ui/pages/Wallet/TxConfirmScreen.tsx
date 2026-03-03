import type { RawTxInfo, TTokenType } from '@/shared/types';
import { TxType } from '@/shared/types';
import { Header } from '@/ui/components';
import { useLocationState } from '@/ui/utils';

import { usePushKaspaTxCallback } from '@/ui/state/transactions/hooks';
import { SignPsbt } from '../Approval/components';
import { useNavigate } from '../MainRoute';

interface LocationState {
  rawTxInfo: RawTxInfo;
  type: TxType;
  tokenType: TTokenType;
  isRBF: boolean;
}

export default function TxConfirmScreen() {
  const { rawTxInfo, type, tokenType, isRBF } = useLocationState<LocationState>();
  const navigate = useNavigate();
  const pushKaspaTx = usePushKaspaTxCallback();
  return (
    <SignPsbt
      header={
        <Header
          onBack={() => {
            navigate('TxCreateScreen', { rawTxInfo, type, tokenType });
          }}
        />
      }
      params={{ data: { psbtHex: rawTxInfo.psbtHex, type: TxType.SEND_KASPA, tokenType, rawTxInfo } }}
      handleCancel={() => {
        // window.history.go(-1);
        navigate('TxCreateScreen', { rawTxInfo, type, tokenType });
      }}
      handleConfirm={() => {
        pushKaspaTx(rawTxInfo.rawtx, isRBF, { payload: rawTxInfo.payload }).then(
          ({ success, txSeralizedJSON, error, type }) => {
            if (success) {
              const txObj = JSON.parse(txSeralizedJSON);
              navigate('TxSuccessScreen', { txid: txObj?.id, rawtx: rawTxInfo.rawtx, type });
            } else {
              navigate('TxFailScreen', { error });
            }
          }
        );
      }}
    />
  );
}
