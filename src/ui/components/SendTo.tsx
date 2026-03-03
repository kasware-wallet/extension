import type { ToAddressInfo } from '@/shared/types';
import { colors } from '../theme/colors';
import { Column } from './Column';
import { Row } from './Row';
import { Text } from './Text';
import { AddressText } from './AddressText';
import { t } from 'i18next';

export function SendToComp({ toAddressInfo }: { toAddressInfo: ToAddressInfo }) {
  return (
    <>
      <Column>
        <Text text={t('Send to') as string} textCenter color="textDim" selectText />
        <Row justifyCenter>
          <AddressText addressInfo={toAddressInfo} textCenter />
        </Row>
      </Column>
      <Row style={{ borderTopWidth: 1, borderColor: colors.border }} my="md" />
    </>
  );
}
