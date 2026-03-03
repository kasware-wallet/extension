import React, { useEffect, useState } from 'react';

import { Button } from '../Button';
import { Column } from '../Column';
import { Input } from '../Input';
import { Popover } from '../Popover';
import { Row } from '../Row';
import { Text } from '../Text';

export const ResetWalletPopover = ({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) => {
  const [alianName, setAlianName] = useState('');
  const [disabled, setDisabled] = useState(true);
  const handleOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ('Enter' == e.key && disabled == false) {
      onConfirm();
    }
  };
  useEffect(() => {
    if (alianName === 'RESET') {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  }, [alianName]);
  return (
    <Popover onClose={onClose}>
      <Text text="Reset wallet" preset="title-bold" textCenter my="xl" />

      <Row mb="xs">
        <Text text={'To confirm wallet reset, please enter:'} color="textDim" />
        <Text text="RESET" color="error" />
      </Row>
      <Input
        placeholder={'RESET'}
        onChange={(e) => {
          setAlianName(e.target.value);
        }}
        onKeyUp={(e) => handleOnKeyUp(e)}
        autoFocus={true}
      />

      <Column justifyCenter itemsCenter>
        <Row full mt="xl">
          <Button
            text="Cancel"
            full
            onClick={() => {
              if (onClose) {
                onClose();
              }
            }}
          />
          <Button text="Reset" disabled={disabled} full onClick={onConfirm} preset="primary" />
        </Row>
      </Column>
    </Popover>
  );
};
