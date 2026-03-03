import { useTranslation } from 'react-i18next';

import { selectCurrentKaspaAddress } from '@/ui/state/accounts/reducer';
import { useAppSelector } from '@/ui/state/hooks';
import { selectBlockstreamUrl } from '@/ui/state/settings/reducer';
import { colors } from '@/ui/theme/colors';
import { formatLocaleString, shortAddress } from '@/ui/utils';
import { ExportOutlined } from '@ant-design/icons';

import { Button } from '../Button';
import { Column } from '../Column';
import { Icon } from '../Icon';
import { Popover } from '../Popover';
import { Row } from '../Row';
import { Text } from '../Text';

export const RetrieveSuccessPopover = ({
  txids,
  amount,
  onClose
}: {
  txids: string[];
  amount: string;
  onClose: () => void;
}) => {
  const toAddress = useAppSelector(selectCurrentKaspaAddress);
  const { t } = useTranslation();
  const blockstreamUrl = useAppSelector(selectBlockstreamUrl);
  return (
    <Popover onClose={onClose}>
      <Column itemsCenter>
        <Column justifyCenter mt="xl" gap="xl">
          <Row justifyCenter>
            <Icon icon="success" size={50} style={{ alignSelf: 'center' }} />
          </Row>
          {/* <Text preset="title" text={t('Retrieve')} textCenter size="xxxl" /> */}
          <Text text={`${formatLocaleString(amount)} KAS ${t('is retrieved to')}`} color="textDim" textCenter />
          <Text text={shortAddress(toAddress)} color="textDim" textCenter />
        </Column>
        {txids.length > 0 &&
          txids.slice(0, 5).map((txid) => {
            return (
              <Row
                key={txid}
                mb="sm"
                justifyCenter
                onClick={() => {
                  window.open(`${blockstreamUrl}/txs/${txid}`);
                }}
              >
                <ExportOutlined style={{ color: colors.aqua, fontSize: 10 }} />
                <Text preset="regular" text={t('View transaction')} color="aqua" />
              </Row>
            );
          })}
        {txids.length > 5 && (
          <Row mb="sm" justifyCenter>
            <Text text="..." color="textDim" textCenter />
          </Row>
        )}
        <Row full>
          <Button
            preset="primary"
            text="Done"
            full
            onClick={() => {
              if (onClose) {
                onClose();
              }
            }}
          />
        </Row>
      </Column>
    </Popover>
  );
};
