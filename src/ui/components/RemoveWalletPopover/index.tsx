import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ExclamationCircleFilled } from '@ant-design/icons';

import type { WalletKeyring } from '@/shared/types';
import { useNavigate } from '@/ui/pages/MainRoute';
import { accountsActions } from '@/ui/state/accounts/reducer';
import { useAppDispatch } from '@/ui/state/hooks';
import { keyringsActions } from '@/ui/state/keyrings/reducer';
import { colors } from '@/ui/theme/colors';
import { shortAddress, useWallet } from '@/ui/utils';

import { Card } from '../Card';
import { Column } from '../Column';
import { ConfirmationPopover } from '../ConfirmationPopover';
import { Row } from '../Row';
import { Text } from '..';

export const RemoveWalletPopover = ({ keyring, onClose }: { keyring: WalletKeyring; onClose: () => void }) => {
  const { t } = useTranslation();
  const wallet = useWallet();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const displayAddress = useMemo(() => {
    if (!keyring.accounts[0]) {
      return 'Invalid';
    }
    return shortAddress(keyring.accounts[0].address, 9);
  }, [keyring.accounts]);

  const handleRemove = async () => {
    const nextKeyring = await wallet.removeKeyring(keyring);
    const keyrings = await wallet.getKeyrings();
    dispatch(keyringsActions.setKeyrings(keyrings));

    if (nextKeyring) {
      dispatch(accountsActions.setCurrent(nextKeyring.accounts[0]));
      return;
    }

    if (keyrings[0]) {
      dispatch(keyringsActions.setCurrent(keyrings[0]));
      return;
    }

    navigate('WelcomeScreen');
  };

  const extraContent = (
    <Column gap="lg" mt="lg" style={{ maxWidth: 280 }}>
      <Row
        itemsCenter
        gap="sm"
        style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(237, 51, 75, 0.1)',
          borderRadius: 8,
          border: `1px solid ${colors.red_dark}`
        }}
      >
        <ExclamationCircleFilled style={{ color: colors.red, fontSize: 18, flexShrink: 0 }} />
        <Column>
          <Text
            text={t(
              'Please pay attention to whether you have backed up the mnemonic/private key to prevent asset loss'
            )}
            preset="sub"
          />
          <Text text={t('This action is not reversible.')} color="danger" preset="regular-bold" />
        </Column>
      </Row>
    </Column>
  );

  const walletCard = (
    <Card preset="style2" style={{ width: 280, backgroundColor: colors.bg5, border: `1px solid ${colors.border}` }}>
      <Column gap="xs">
        <Text text={keyring.alianName} preset="title-bold" textCenter />
        <Text text={displayAddress} preset="sub" textCenter />
      </Column>
    </Card>
  );

  return (
    <ConfirmationPopover
      onClose={onClose}
      confirmText={t('Remove')}
      confirmPreset="danger"
      onConfirm={handleRemove}
      extraContent={extraContent}
      cardWidth={280}
    >
      {walletCard}
    </ConfirmationPopover>
  );
};
