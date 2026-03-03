import { useTranslation } from 'react-i18next';

import type { CustomTestnetToken } from '@/shared/types/token';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Button } from '../Button';
import { Card } from '../Card';
import { Column } from '../Column';
import { Popover } from '../Popover';
import { Row } from '../Row';
import { Text } from '../Text';

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
        <Row justifyCenter>
          <Text text={token?.symbol} />
        </Row>
        <Card preset="style2" style={{ width: 300 }}>
          <Column my="xl">
            <Row>
              <Text
                text={t(`You can add this token back in the future by going to 'Add token' in default page.`)}
                textCenter
                wrap
                selectText
              />
            </Row>
          </Column>
        </Card>
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
