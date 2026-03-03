import { formatLocaleString } from '@/ui/utils';

import { Button } from '../Button';
import { Card } from '../Card';
import { Column } from '../Column';
import { Popover } from '../Popover';
import { Row } from '../Row';
import { Text } from '../Text';
import type { IKrc20MarketInfo } from '@/ui/hooks/kasplex';
import { useKrc20DecName } from '@/ui/utils/hooks/kasplex/fetchKrc20AddressTokenList';
import { useAppSelector } from '@/ui/state/hooks';
import { selectNetworkId } from '@/ui/state/settings/reducer';
import { UnlockOutlined } from '@ant-design/icons';
import { fontSizes } from '@/ui/theme/font';
import { colors } from '@/ui/theme/colors';
import { sompiToAmount } from '@/shared/utils/format';

export const UnlockKRC20TokenPopover = ({
  order,
  onClose,
  onConfirm
}: {
  order: IKrc20MarketInfo;

  onClose: () => void;
  onConfirm: () => void;
}) => {
  const kasNetworkId = useAppSelector(selectNetworkId);
  const { name, dec } = useKrc20DecName(kasNetworkId, (order?.tick as string) ?? (order?.ca as string));
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
            backgroundColor: colors.green,
            justifyContent: 'center'
          }}
        >
          <Row itemsCenter>
            <UnlockOutlined
              style={{
                fontSize: fontSizes.xl
              }}
            />
          </Row>
        </div>

        <Card preset="style2" style={{ width: 300 }}>
          <Column my="xl">
            <Row>
              <Text text="Name: " textCenter />
              <Text text={name} textCenter />
            </Row>
            <Row>
              <Text text="Order Amount: " textCenter />
              <Text text={formatLocaleString(sompiToAmount(order.amount, dec ?? '8'))} textCenter />
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
            text="Cancel Order"
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
