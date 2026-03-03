import log from 'loglevel';
import { useState } from 'react';

import { Popup } from '@/evm/ui/component';
import type { Account, WalletKeyring } from '@/shared/types';
import BottomFixedContainer from '@/ui/components/containers/BottomFixedContainer';
import { selectCurrentAccount } from '@/ui/state/accounts/reducer';
import { useAppSelector } from '@/ui/state/hooks';
import { useCurrentKeyring } from '@/ui/state/keyrings/hooks';
import { selectWalletKeyrings } from '@/ui/state/keyrings/reducer';
import { shortAddress } from '@/ui/utils';
import { CheckCircleFilled } from '@ant-design/icons';

import { Button } from '../Button';
import { Card } from '../Card';
import { Column } from '../Column';
import { Icon } from '../Icon';
import { Row } from '../Row';
import { Text } from '../Text';

export const SelectAccountPopover = ({
  visible,
  onClose,
  onConfirm
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (keyring: any, accountIndex: number) => void;
}) => {
  const currentAccount = useAppSelector(selectCurrentAccount);
  const currentKeyring = useCurrentKeyring();
  const [selectedAccountIndex, setSelectedAccountIndex] = useState<number>(currentAccount.index || 0);
  const [selectedKeyring, setSelectedKeyring] = useState<WalletKeyring>(currentKeyring);
  const keyrings = useAppSelector(selectWalletKeyrings);

  return (
    <Popup
      open={visible}
      onClose={onClose}
      height={488}
      bodyStyle={{ height: '100%', padding: '20px 20px 0 20px' }}
      destroyOnClose
      className="settings-popup-wrapper"
      isSupportDarkMode
    >
      <Column style={{ marginBottom: '72px' }}>
        {keyrings
          // .filter((keyring) => keyring.type != 'Simple Key Pair')
          .map((keyring) => (
            <Column mt="lg" key={keyring.key}>
              <Text text={keyring.alianName} preset="sub" />
              {keyring.accounts
                .filter((account) => account?.evmAddress && account.evmAddress.length > 0)
                .map((account) => (
                  <MyItem
                    key={account.key}
                    account={account}
                    selected={selectedKeyring.key === keyring.key && selectedAccountIndex === account.index}
                    onClick={async () => {
                      log.debug('account index', account.index);
                      setSelectedKeyring(keyring);
                      setSelectedAccountIndex(account.index || 100);
                    }}
                  />
                ))}
            </Column>
          ))}
      </Column>

      <BottomFixedContainer className="p-4" shadow={false}>
        <Button text="Update" preset="primary" onClick={() => onConfirm(selectedKeyring, selectedAccountIndex)} full />
      </BottomFixedContainer>
    </Popup>
  );
};

interface MyItemProps {
  account?: Account;
  selected?: boolean;
  onClick?: () => void;
}

function MyItem({ account, selected, onClick }: MyItemProps, ref) {
  if (!account) {
    return <div />;
  }

  return (
    <Card justifyBetween mt="sm" onClick={onClick} classname="card-select">
      <Row>
        <Column style={{ width: 20 }} selfItemsCenter>
          {selected && (
            <Icon>
              <CheckCircleFilled />
            </Icon>
          )}
        </Column>
        <Column>
          <Text text={account.alianName} />
          <Text text={`${shortAddress(account?.evmAddress)}`} preset="sub" />
        </Column>
      </Row>
      <Column relative></Column>
    </Card>
  );
}
