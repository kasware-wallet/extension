import { useNavigate } from '@/ui/pages/MainRoute';
import { useWallet } from '@/ui/utils';
import { Icon } from '../Icon';

import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import Checkbox from 'antd/es/checkbox';
import { useState } from 'react';
import { Button } from '../Button';
import { Column } from '../Column';
import { Popover } from '../Popover';
import { Row } from '../Row';
import { Text } from '../Text';
import { colors } from '@/ui/theme/colors';

export const LogoutPopover = ({ onClose }: { onClose: () => void }) => {
  const wallet = useWallet();
  const navigate = useNavigate();
  const [checkedOne, setCheckedOne] = useState(false);
  const [checkedTwo, setCheckedTwo] = useState(false);
  const [checkedThree, setCheckedThree] = useState(false);
  const onChangeOne = (e: CheckboxChangeEvent) => {
    const val = e.target.checked;
    setCheckedOne(val);
  };
  const onChangeTwo = (e: CheckboxChangeEvent) => {
    const val = e.target.checked;
    setCheckedTwo(val);
  };
  const onChangeThree = (e: CheckboxChangeEvent) => {
    const val = e.target.checked;
    setCheckedThree(val);
  };

  return (
    <Popover onClose={onClose}>
      <Column itemsCenter classname="flex flex-none items-center justify-around">
        <Icon icon="trash-can" color="danger_muted" size={24} />
        <div className="pb-[10px] space-y-[10px]">
          <Row>
            <Checkbox
              onChange={onChangeOne}
              checked={checkedOne}
              style={{ width: '100%', minWidth: 0 }}
              className="[&_.ant-checkbox]:!flex-shrink-0"
            >
              <Text text="By logout, all data stored locally will be erased." size="md" />
            </Checkbox>
          </Row>
          <Row>
            <Checkbox
              onChange={onChangeTwo}
              checked={checkedTwo}
              style={{ width: '100%', minWidth: 0 }}
              className="[&_.ant-checkbox]:!flex-shrink-0"
            >
              <Text
                text="Please pay attention to whether you have backed up the mnemonic or private key to prevent asset loss."
                size="md"
              />
            </Checkbox>
          </Row>
          <Row>
            <Checkbox
              onChange={onChangeThree}
              checked={checkedThree}
              style={{ width: '100%', minWidth: 0 }}
              className="[&_.ant-checkbox]:!flex-shrink-0"
            >
              <Text text="This action is not reversible." color="danger" size="lg" />
            </Checkbox>
          </Row>
        </div>

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
            disabled={!checkedOne || !checkedTwo || !checkedThree}
            text="Logout"
            preset="danger"
            full
            onClick={async () => {
              await wallet.logout();
              navigate('WelcomeScreen');
            }}
          />
        </Row>
      </Column>
    </Popover>
  );
};
