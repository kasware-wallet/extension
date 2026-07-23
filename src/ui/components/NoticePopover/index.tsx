import { useEffect, useRef, useState } from 'react';

import { colors } from '@/ui/theme/colors';

import { Button } from '../Button';
import { Column } from '../Column';
import { Icon } from '../Icon';
import { Popover } from '../Popover';
import { Row } from '../Row';
import { Text } from '../Text';

interface NoticePopoverProps {
  content: string;
  onClose: () => void;
  coolDownSeconds?: number;
}

export const NoticePopover = ({ content, onClose, coolDownSeconds = 10 }: NoticePopoverProps) => {
  const [coolDown, setCoolDown] = useState(coolDownSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isEnabled = coolDown === 0;

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCoolDown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return (
    <Popover>
      <Column justifyCenter itemsCenter>
        <Icon icon="info" color="icon_yellow" size={57} />

        <Column gap="zero">
          <div style={{ marginTop: 8 }}>
            <Text
              text={content}
              preset="bold"
              style={{
                userSelect: 'text',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                flexWrap: 'wrap'
              }}
            />
          </div>
          <Row style={{ borderTopWidth: 1, borderColor: colors.border }} my="md" />
        </Column>

        <Row full>
          <Button
            text={coolDown > 0 ? `OK (${coolDown}s)` : 'OK'}
            preset="primary"
            disabled={!isEnabled}
            full
            onClick={isEnabled ? onClose : undefined}
          />
        </Row>
      </Column>
    </Popover>
  );
};
