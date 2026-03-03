import type { IChaingeToken } from '@/shared/types';
import { getChaingeTicker } from '@/shared/utils/chainge';
import { Card, Row } from '@/ui/components';
import CryptoImage from '@/ui/components/CryptoImage';
import { RightOutlined } from '@ant-design/icons';
import React from 'react';

interface ChaingeTokenDropdownProps {
  selectedToken: IChaingeToken | null;
  openTokenSelect: () => void;
}

const ChaingeTokenDropdown: React.FC<ChaingeTokenDropdownProps> = ({ selectedToken, openTokenSelect }) => {
  const ticker = getChaingeTicker(selectedToken);
  return (
    <Card
      py="xs"
      classname="card-select"
      justifyBetween
      onClick={openTokenSelect}
      style={{
        minHeight: 46.5,
        borderRadius: 15
      }}
    >
      <Row itemsCenter gap="xxs">
        {selectedToken !== null && <CryptoImage ticker={ticker} size={24} />}
        <span className="ml-1 mr-1 text-primarytext text-base">{ticker}</span>
        <RightOutlined size={20} />
      </Row>
    </Card>
  );
};

export default ChaingeTokenDropdown;
