import { Spin } from 'antd';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate as useNavigateReact } from 'react-router-dom';

import type { IChaingeToken, TChaingeOrderResponse } from '@/shared/types';
import { Column, Icon, Row, Text } from '@/ui/components';
import CloseButton from '@/ui/components/buttons/CloseButton';
import NextButton from '@/ui/components/buttons/NextButton';
import BottomFixedContainer from '@/ui/components/containers/BottomFixedContainer';
import ErrorMessage from '@/ui/components/messages/ErrorMessage';
import { useNavigate } from '@/ui/pages/MainRoute';
import { useAppSelector } from '@/ui/state/hooks';
import { selectBlockstreamUrl } from '@/ui/state/settings/reducer';
import useOrderStatus from '@/ui/state/transactions/chainge/useOrderStatus';
import { colors } from '@/ui/theme/colors';
import { formatLocaleString, useLocationState } from '@/ui/utils';
import { ExportOutlined } from '@ant-design/icons';
import { getChaingeTicker } from '@/shared/utils/chainge';
import { sompiToAmount } from '@/shared/utils/format';

interface LocationState {
  order: TChaingeOrderResponse;
  receiveToken: IChaingeToken;
}

const SwapConfirmed: React.FC = () => {
  const navigate = useNavigate();
  const navigateReact = useNavigateReact();
  const blockstreamUrl = useAppSelector(selectBlockstreamUrl);
  const { t } = useTranslation();

  const { order, receiveToken } = useLocationState<LocationState>();

  const { status, txId, recieveSompi, loading, error } = useOrderStatus({ order });
  const ticker = getChaingeTicker(receiveToken);
  // const [recieveAmount, setRecieveAmount] = useState<string | null>(null);
  const receiveAmount = useMemo(() => {
    if (!recieveSompi) return '';
    const amount = sompiToAmount(recieveSompi, receiveToken.decimals);
    return formatLocaleString(amount);
  }, [recieveSompi, receiveToken?.decimals]);

  return (
    <div className="p-4">
      {loading && !error && order?.data?.id && (
        <div className="flex flex-col items-center space-y-2 pt-10">
          <Spin tip="Loading" size="large" />
          <p className="text-lg text-mutedtext text-center">
            {ticker} will be sent into your wallet once the transaction is complete.
          </p>
          <Text
            mt="md"
            text="Recent swap history"
            preset="link"
            onClick={() => {
              navigateReact('/krc20/swap/history');
            }}
            selectText
          />
        </div>
      )}
      {error && (
        <div className="pt-20">
          <ErrorMessage message={error} />
        </div>
      )}
      {!loading && !error && status === 'Succeeded' && (
        <Column justifyCenter mt="xl" gap="xl">
          <Row justifyCenter mt="xl">
            <Icon icon="success" size={60} style={{ alignSelf: 'center' }} />
          </Row>
          <Text preset="title" text={'Swap'} textCenter size="xxxl" selectText />
          <Text
            text={`${receiveAmount} ${receiveToken.ticker?.toUpperCase()} is sent to your wallet`}
            color="textDim"
            textCenter
            selectText
          />
          {txId !== null && txId != undefined && (
            <Row
              justifyCenter
              onClick={() => {
                window.open(`${blockstreamUrl}/txs/${txId}`);
              }}
            >
              <ExportOutlined style={{ color: colors.aqua, fontSize: 14 }} />
              <Text preset="regular-bold" text={t('View transaction')} color="aqua" size="lg" />
            </Row>
          )}
        </Column>
      )}
      <BottomFixedContainer className="p-4" shadow={false}>
        {loading ? (
          <CloseButton onClick={() => navigate('KRC20SwapScreen')} />
        ) : (
          <NextButton onClick={() => navigate('WalletTabScreen')} text="Close" />
        )}
      </BottomFixedContainer>
    </div>
  );
};

export default SwapConfirmed;
