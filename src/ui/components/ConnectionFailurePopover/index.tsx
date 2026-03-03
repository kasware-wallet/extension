import { useNavigate } from '@/ui/pages/MainRoute';
import { useAppSelector } from '@/ui/state/hooks';
import { selectNetworkId } from '@/ui/state/settings/reducer';

import { Button } from '../Button';
import { Column } from '../Column';
import { Icon } from '../Icon';
import { Popover } from '../Popover';
import { Row } from '../Row';
import { Text } from '../Text';

export const ConnectionFailurePopover = ({ onClose, onTryAgain }: { onClose: () => void; onTryAgain: () => void }) => {
  const navigate = useNavigate();
  const networkId = useAppSelector(selectNetworkId);

  return (
    <Popover onClose={onClose}>
      <Column justifyCenter itemsCenter>
        <Icon icon="warning" size={40} color="warning" />

        <Column mt="lg">
          <Text text={`We can't connect to ${networkId}`} size="md" selectText />
        </Column>

        <Row full mt="lg">
          <Button
            text="Switch networks"
            full
            preset="default"
            onClick={() => {
              onClose();
              navigate('NetworkTypeScreen');
            }}
          />
          <Button text="Try again" full preset="primary" onClick={onTryAgain} />
        </Row>
      </Column>
    </Popover>
  );
};
