import { useMemo } from 'react';

import type { Account } from '@/shared/types';
import { formatLocaleString, shortAddress } from '@/ui/utils';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Button } from '../Button';
import { Card } from '../Card';
import { Column } from '../Column';
import { Popover } from '../Popover';
import { Row } from '../Row';
import { Text } from '../Text';

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
  const displayAddress = useMemo(() => {
    const address = account.address;
    return shortAddress(address);
  }, []);
  return (
    <Popover onClose={onClose}>
      <Column justifyCenter itemsCenter>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '1.5rem',
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'row',
            backgroundColor: '#CC3333',
            justifyContent: 'center'
          }}
        >
          <FontAwesomeIcon icon={faTrashCan} style={{ height: '1rem' }} />
        </div>

        <Card preset="style2" style={{ width: 300 }}>
          <Column my="xl">
            <Row>
              <Text text="Name: " textCenter />
              <Text text={account.alianName} textCenter />
            </Row>
            <Row>
              <Text text="Balance: " textCenter />
              <Text text={formatLocaleString(amount)} textCenter />
            </Row>
            <Row>
              <Text text="Address: " textCenter />
              <Text text={displayAddress} textCenter />
            </Row>
            {/* <Text text={account.alianName} textCenter />
            <Text text={displayAddress} preset="sub" textCenter /> */}
          </Column>
        </Card>
        {/* <Text
          text="Please pay attention to whether you have backed up the mnemonic/private key to prevent asset loss"
          textCenter
        /> */}

        {/* <Text text="This action is not reversible." color="danger" /> */}
        <Row full>
          <Button
            text="Cancel"
            full
            onClick={() => {
              if (onClose) {
                onClose();
              }
            }}
          />
          <Button
            text="Hide"
            preset="primary"
            full
            onClick={() => {
              onConfirm();
            }}
          />
        </Row>
      </Column>
    </Popover>
  );
};
