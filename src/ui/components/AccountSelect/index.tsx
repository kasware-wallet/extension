/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useNavigate } from '@/ui/pages/MainRoute';
import { useCurrentAccount } from '@/ui/state/accounts/hooks';
import { shortAddress } from '@/ui/utils';
import { RightOutlined } from '@ant-design/icons';

import { Icon } from '../Icon';
import { Row } from '../Row';
import { Text } from '../Text';
import './index.less';

const AccountSelect = () => {
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();

  return (
    <Row
      justifyBetween
      itemsCenter
      px="md"
      py="md"
      bg="card"
      rounded
      onClick={(e) => {
        navigate('SwitchAccountScreen');
      }}>
      <Icon icon="kaspa-white" size={20}/>
      <Text text={shortAddress(currentAccount?.alianName, 8)} />
      {/* <Icon icon="down" /> */}
      <RightOutlined />
    </Row>
  );
};

export default AccountSelect;
