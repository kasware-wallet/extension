/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Checkbox } from 'antd';
import { useEffect, useState } from 'react';

import { colors } from '@/ui/theme/colors';

import { Button } from '../Button';
import { Column } from '../Column';
import { Icon } from '../Icon';
import { Popover } from '../Popover';
import { Row } from '../Row';
import { Text } from '../Text';

export const NoticePopover = ({ onClose }: { onClose: () => void }) => {
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);

  const [enable, setEnable] = useState(false);
  const [coolDown, setCoolDown] = useState(3);

  useEffect(() => {
    if (coolDown > 0) {
      setTimeout(() => {
        setCoolDown(coolDown - 1);
      }, 1000);
    } else {
      setEnable(true);
    }
  }, [coolDown]);

  return (
    <Popover>
      <Column justifyCenter itemsCenter>
        <Text text="Compatibility Tips" preset="title-bold" />
        <Icon icon={'info'} color={'icon_yellow'} size={57} />

        <Column gap="zero">
          <Text text={'Please be aware that:'} preset={'bold'} />
          <div style={{ marginTop: 8 }}>
            <Checkbox
              checked={checked1}
              onChange={(e) => {
                setChecked1(e.target.checked);
              }}>
            </Checkbox>
          </div>
          <Row style={{ borderTopWidth: 1, borderColor: colors.border }} my="md" />
        </Column>

        <Row full>
          <Button
            text={coolDown > 0 ? `OK (${coolDown}s)` : 'OK'}
            preset="primary"
            disabled={!checked1 || !checked2}
            full
            onClick={(e) => {
              if (!enable) return;
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
