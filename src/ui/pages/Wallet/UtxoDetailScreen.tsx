import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import type { IKaspaUtxoEntryReference } from '@/shared/types';
import { CopyOutlined } from '@ant-design/icons';
import { Column, Content, EndCard, Header, Icon, Layout, MiddleCard, Row, StartCard, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { useAppSelector } from '@/ui/state/hooks';
import { selectBlockstreamUrl, selectKasTick } from '@/ui/state/settings/reducer';
import { colors } from '@/ui/theme/colors';
import { fontSizes } from '@/ui/theme/font';
import { copyToClipboard, formatLocaleString, shortAddress } from '@/ui/utils';
import { sompiToAmount } from '@/shared/utils/format';

export default function UtxoDetailScreen() {
  const { t } = useTranslation();
  const { state } = useLocation();
  const { utxoDetail } = state as {
    utxoDetail: IKaspaUtxoEntryReference;
  };
  const kasTick = useAppSelector(selectKasTick);
  const blockstreamUrl = useAppSelector(selectBlockstreamUrl);
  const tools = useTools();
  if (!utxoDetail) return null;

  const { entry } = utxoDetail;
  if (!entry) return null;
  const amountFormatted = formatLocaleString(sompiToAmount(entry.amount, 8));

  const handleCopy = (text: string) => {
    copyToClipboard(text).then(() => {
      tools.toastSuccess(t('Copied'));
    });
  };

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={t('UTXO')}
      />
      <Content>
        <Column gap="zero">
          {/* Amount - most important, first row */}
          <StartCard>
            <Row justifyBetween full itemsCenter py="sm">
              <Text text={t('Amount')} preset="sub" />
              <Text text={`${amountFormatted} ${kasTick}`} />
            </Row>
          </StartCard>

          {/* Address - copyable */}
          <MiddleCard>
            <Row justifyBetween full itemsCenter py="sm" style={{ overflow: 'hidden' }}>
              <Text text={t('Address')} preset="sub" style={{ flexShrink: 0 }} />
              <Row
                itemsCenter
                gap="xs"
                onClick={() => handleCopy(entry.address)}
                style={{ cursor: 'pointer', overflow: 'hidden', minWidth: 0 }}
              >
                <Text text={shortAddress(entry.address, 8)} wrap />
                <CopyOutlined style={{ color: colors.icon_secondary, fontSize: 14, flexShrink: 0 }} />
              </Row>
            </Row>
          </MiddleCard>

          {/* Transaction ID - external link */}
          <MiddleCard>
            <Row justifyBetween full itemsCenter py="sm" style={{ overflow: 'hidden' }}>
              <Text text={t('Transaction ID')} preset="sub" style={{ flexShrink: 0 }} />
              <Row
                gap="xs"
                itemsCenter
                onClick={() => {
                  window.open(`${blockstreamUrl}/transactions/${entry.outpoint.transactionId}`);
                }}
                style={{ cursor: 'pointer', overflow: 'hidden', minWidth: 0 }}
              >
                <Text text={shortAddress(entry.outpoint.transactionId, 12)} preset="link" wrap />
                <Icon icon="link" size={fontSizes.xxs} color="blue" />
              </Row>
            </Row>
          </MiddleCard>

          {/* Outpoint Index */}
          <MiddleCard>
            <Row justifyBetween full itemsCenter py="sm">
              <Text text={t('Outpoint Index')} preset="sub" />
              <Text text={`${entry.outpoint.index}`} />
            </Row>
          </MiddleCard>

          {/* Block DAA Score */}
          <MiddleCard>
            <Row justifyBetween full itemsCenter py="sm">
              <Text text={t('Block DAA Score')} preset="sub" />
              <Text text={`${entry.blockDaaScore}`} />
            </Row>
          </MiddleCard>

          {/* Is Coinbase */}
          <MiddleCard>
            <Row justifyBetween full itemsCenter py="sm">
              <Text text={t('Coinbase')} preset="sub" />
              <Text text={entry.isCoinbase ? t('Yes') : t('No')} color={entry.isCoinbase ? 'yellow' : undefined} />
            </Row>
          </MiddleCard>

          {/* Script Public Key - copyable */}
          <EndCard>
            <Row justifyBetween full itemsCenter py="sm" style={{ overflow: 'hidden' }}>
              <Text text={t('Script Public Key')} preset="sub" style={{ flexShrink: 0 }} />
              <Row
                itemsCenter
                gap="xs"
                onClick={() => handleCopy(entry.scriptPublicKey)}
                style={{ cursor: 'pointer', overflow: 'hidden', minWidth: 0 }}
              >
                <Text text={shortAddress(entry.scriptPublicKey, 8)} wrap />
                <CopyOutlined style={{ color: colors.icon_secondary, fontSize: 14, flexShrink: 0 }} />
              </Row>
            </Row>
          </EndCard>
        </Column>
      </Content>
    </Layout>
  );
}
