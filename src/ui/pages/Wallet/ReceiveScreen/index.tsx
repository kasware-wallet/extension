import QRCode from 'qrcode.react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TxType } from '@/shared/types';
import { AddressBar, Column, Content, Header, Layout } from '@/ui/components';
import { KasAmountInput } from '@/ui/components/Input';
import { SubInputAmount } from '@/ui/components/SubInputAmount';
import { useCurrentAccount } from '@/ui/state/accounts/hooks';
import { selectCurrentKaspaAddress } from '@/ui/state/accounts/reducer';
import { useAppSelector } from '@/ui/state/hooks';
import { selectKasTick } from '@/ui/state/settings/reducer';
import { sizes } from '@/ui/theme/spacing';
import { formatLocaleString, useLocationState } from '@/ui/utils';
import { useKaspaPrice } from '@/ui/utils/hooks/price/usePrice';

import './index.less';

interface LocationState {
  type: TxType;
}

export default function ReceiveScreen() {
  const currentAccount = useCurrentAccount();
  const { type } = useLocationState<LocationState>();
  const address = useAppSelector(selectCurrentKaspaAddress);
  const { t } = useTranslation();
  const [inputAmount, setInputAmount] = useState('');
  const [inputAmountUsd, setInputAmountUsd] = useState('');
  const [inputAmountType, setInputAmountType] = useState<'kas' | 'usd'>('kas');
  const [autoAdjust, setAutoAdjust] = useState(false);
  const kasPrice = useKaspaPrice();
  const kasTick = useAppSelector(selectKasTick);
  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={currentAccount?.alianName}
      />
      <Content>
        <Column gap="xl" mt="lg">
          <Column
            justifyCenter
            rounded
            style={{ backgroundColor: 'white', alignSelf: 'center', alignItems: 'center', padding: 10 }}>
            <QRCode
              value={Number(inputAmount) > 0 ? address + '?amount=' + inputAmount : address}
              renderAs="svg"
              size={sizes.qrcode}></QRCode>
          </Column>

          {/* <Row justifyCenter>
            <Icon icon="user" />
            <Text preset="regular-bold" text={currentAccount?.alianName} />
          </Row> */}
          <AddressBar length={6} showEvmAddress={false}/>
          {type && type == TxType.SEND_KASPA && (
            <>
              <KasAmountInput
                preset="amount"
                inputAmountType={inputAmountType}
                placeholder={t('Enter the amount (Optional)')}
                // defaultValue={inputAmount}
                value={inputAmountType == 'kas' ? inputAmount : inputAmountUsd}
                onAmountInputChange={(amount) => {
                  if (autoAdjust == true) {
                    setAutoAdjust(false);
                  }
                  if (inputAmountType == 'usd' && kasPrice > 0) {
                    setInputAmountUsd(amount);
                    setInputAmount(formatLocaleString(Number(amount) / kasPrice));
                  } else {
                    setInputAmount(amount);
                    setInputAmountUsd(formatLocaleString(Number(amount) * kasPrice));
                  }
                }}
              />
              <SubInputAmount
                inputAmountType={inputAmountType}
                setInputAmountType={setInputAmountType}
                inputAmountUsd={inputAmountUsd}
                tokenPrice={kasPrice}
                tokenTick={kasTick}
                inputAmount={inputAmount}
              />
            </>
          )}
        </Column>
      </Content>
    </Layout>
  );
}
