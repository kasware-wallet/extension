import { Column, Text } from '@/ui/components';
import React from 'react';

interface WarningMessageProps {
  message: string;
}

const WarningMessage: React.FC<WarningMessageProps> = ({ message }) => {
  return (
    <Column itemsCenter>
      {/* <WarningOutlined style={{ fontSize: '100%', color: colors.orange }} /> */}
      <Text text={message} color="warning" selectText />
    </Column>
  );
};

export default WarningMessage;
