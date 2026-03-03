import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@/ui/state/hooks';
import { selectBlockstreamUrl } from '@/ui/state/settings/reducer';
import { colors } from '@/ui/theme/colors';
import { ExportOutlined } from '@ant-design/icons';

import { Row, Text } from '../';

export const ViewTx = ({ txId }: { txId: string }) => {
  const { t } = useTranslation();
  const blockstreamUrl = useAppSelector(selectBlockstreamUrl);
  return (
    <Row
      justifyCenter
      onClick={() => {
        window.open(`${blockstreamUrl}/txs/${txId}`);
      }}>
      <ExportOutlined style={{ color: colors.aqua, fontSize: 10 }} />
      <Text preset="regular-bold" text={t('View transaction')} color="aqua" size="lg" />
    </Row>
  );
};
