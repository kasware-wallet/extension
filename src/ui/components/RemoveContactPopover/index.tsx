import { useMemo } from 'react';

import { shortAddress, useWallet } from '@/ui/utils';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ContactBookItem } from '@/background/service/contactBook';
import { Button } from '../Button';
import { Card } from '../Card';
import { Column } from '../Column';
import { Popover } from '../Popover';
import { Row } from '../Row';
import { Text } from '../Text';

export const RemoveContactPopover = ({ keyring, onClose }: { keyring: ContactBookItem; onClose: () => void }) => {
  const wallet = useWallet();
  const displayAddress = useMemo(() => {
    if (!keyring.address) {
      return 'Invalid';
    }
    const address = keyring.address;
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
          }}>
          <FontAwesomeIcon icon={faTrashCan} style={{ height: '1rem' }} />
        </div>

        <Card preset="style2" style={{ width: 200 }}>
          <Column>
            <Text text={keyring.name} textCenter />
            <Text text={displayAddress} preset="sub" textCenter />
          </Column>
        </Card>
        <Row full>
          <Button
            text="Cancel"
            full
            onClick={(e) => {
              if (onClose) {
                onClose();
              }
            }}
          />
          <Button
            text="Remove"
            preset="danger"
            full
            onClick={async () => {
              await wallet.removeContact(keyring.address)
              window.history.go(-1);
            }}
          />
        </Row>
      </Column>
    </Popover>
  );
};
