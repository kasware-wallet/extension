import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { Account } from '@/shared/types';
import { colors } from '@/ui/theme/colors';
import { formatLocaleString, shortAddress } from '@/ui/utils';

import { Column, Icon, Row, Text } from '..';
import { ConfirmationPopover } from '../ConfirmationPopover';

export const HideAccountPopover = ({
  account,
  amount,
  onClose,
  onConfirm
}: {
  account: Account;
  amount: string;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  const { t } = useTranslation();

  const displayAddress = useMemo(() => {
    return shortAddress(account.address);
  }, [account.address]);

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
        <Text text={t('Hide Account')} preset="title-bold" textCenter />

        <Column gap="sm" style={{ backgroundColor: colors.bg5, borderRadius: 8, padding: '12px 16px' }}>
          <Row justifyBetween>
            <Text text={t('Name')} preset="sub" />
            <Text text={account.alianName || '-'} preset="regular-bold" />
          </Row>

          <Row justifyBetween>
            <Text text={t('Balance')} preset="sub" />
            <Text text={`${formatLocaleString(amount)} KAS`} preset="regular-bold" />
          </Row>

          <Row justifyBetween>
            <Text text={t('Address')} preset="sub" />
            <Text text={displayAddress} preset="regular-bold" />
          </Row>
        </Column>

        <Row itemsCenter gap="sm" style={{ backgroundColor: 'rgba(255, 123, 33, 0.1)', borderRadius: 8, padding: 10 }}>
          <Icon icon="info" size={14} color="orange" />
          <Text
            text={t('You can restore this account later using your seed phrase or private key.')}
            preset="xsub"
            wrap
          />
        </Row>
      </Column>
    </ConfirmationPopover>
  );
};
