import ActionButton from '@/ui/components/buttons/ActionButton';
import { QrCodeIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ReceiveButtonProps {
  className?: string;
}

const ReceiveButton: React.FC<ReceiveButtonProps> = ({ className }) => {
  const navigate = useNavigate();

  const handleReceiveClick = () => {
    navigate('/receive');
  };

  return (
    <ActionButton
      icon={<QrCodeIcon strokeWidth={2} />}
      label="Receive"
      onClick={handleReceiveClick}
      className={className}
    />
  );
};

export default ReceiveButton;
