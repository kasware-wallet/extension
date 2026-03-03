import { formatPercentage } from '@/ui/utils';
import { AdjustmentsVerticalIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface SlippageButtonProps {
  setIsSlippageOpen: (open: boolean) => void;
  slippage: number;
}

const SlippageButton: React.FC<SlippageButtonProps> = ({ setIsSlippageOpen, slippage }) => {
  return (
    <button
      onClick={() => setIsSlippageOpen(true)}
      className="flex items-center space-x-1 text-mutedtext hover:text-primarytext">
      <AdjustmentsVerticalIcon className="h-5 w-5" />
      <span className="text-base">{formatPercentage(slippage)}</span>
    </button>
  );
};

export default SlippageButton;
