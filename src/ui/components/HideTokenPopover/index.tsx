import { useTranslation } from 'react-i18next';

import type { CustomTestnetToken } from '@/shared/types/token';
import { colors } from '@/ui/theme/colors';
import { shortAddress } from '@/ui/utils';

import { Column, Icon, Row, Text } from '..';
import { ConfirmationPopover } from '../ConfirmationPopover';

export const HideTokenPopover = ({
  token,
  onClose,
  onConfirm
}: {
  token: CustomTestnetToken | null | undefined;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  const { t } = useTranslation();

  const eyeIcon = (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: colors.orange,
        justifyContent: 'center'
      }}
    >
      <Icon icon="eye-slash" size={20} color="white" />
    </div>
  );

  return (
    <ConfirmationPopover
      onClose={onClose}
      confirmText={t('Hide')}
      confirmPreset="primary"
      onConfirm={onConfirm}
      icon={eyeIcon}
      cardWidth={300}
    >
      <Column gap="lg">
        <Text text={t('Hide Token')} preset="title-bold" textCenter />

        <Column gap="sm" style={{ backgroundColor: colors.bg5, borderRadius: 8, padding: '12px 16px' }}>
          <Row justifyBetween>
            <Text text={t('Token')} preset="sub" />
            <Text text={token?.symbol || '-'} preset="regular-bold" />
          </Row>

          <Row justifyBetween>
            <Text text={t('Contract Address')} preset="sub" />
            <Text text={shortAddress(token?.id)} preset="regular-bold" />
          </Row>

          <Row justifyBetween>
            <Text text={t('Chain')} preset="sub" />
            <Text text={token?.chainId || '-'} preset="regular-bold" />
          </Row>
        </Column>

        <Row itemsCenter gap="sm" style={{ backgroundColor: 'rgba(74, 222, 197, 0.1)', borderRadius: 8, padding: 10 }}>
          <Icon icon="info" size={14} color="green" />
          <Text
            text={t("You can add this token back in the future by going to 'Add token' in default page.")}
            preset="xsub"
            wrap
          />
        </Row>
      </Column>
    </ConfirmationPopover>
  );
};
