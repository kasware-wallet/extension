import { useNavigate } from '@/ui/pages/MainRoute';
import { useCurrentAccount } from '@/ui/state/accounts/hooks';
import { useDisplayName } from '@/ui/hooks/useDisplayName';
import { RightOutlined } from '@ant-design/icons';

import { Icon } from '../Icon';
import { Row } from '../Row';
import { Text } from '../Text';
import './index.less';

const AccountSelect = () => {
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const displayName = useDisplayName(currentAccount?.alianName);

  return (
    <Row
      justifyBetween
      itemsCenter
      px="md"
      py="md"
      bg="card"
      rounded
      onClick={() => {
        navigate('SwitchAccountScreen');
      }}
    >
      <Icon icon="kaspa-white" size={20} />
      <Text text={displayName} />
      {/* <Icon icon="down" /> */}
      <RightOutlined />
    </Row>
  );
};

export default AccountSelect;
