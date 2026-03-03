import { Button } from '@/ui/components';
import Spinner from '@/ui/components/loaders/Spinner';
import React from 'react';

interface NextButtonProps {
  buttonEnabled?: boolean;
  showError?: boolean;
  onClick: () => void;
  text?: string;
  loading?: boolean;
}

const NextButton: React.FC<NextButtonProps> = ({
  buttonEnabled = true,
  showError = false,
  onClick,
  text = 'Next',
  loading = false
}) => (
  <Button
    full
    onClick={onClick}
    preset="primary"
    text={loading ? undefined : text}
    disabled={!buttonEnabled || showError || loading}
    // className={`w-full h-[52px] text-lg font-semibold rounded-lg flex items-center justify-center ${
    //   buttonEnabled && !showError && !loading
    //     ? 'bg-primary text-secondarytext cursor-pointer hover:bg-hoverprimary'
    //     : 'bg-muted text-mutedtext cursor-not-allowed'
    // }`}
  >
    {loading ? <Spinner /> : undefined}
  </Button>
);

export default NextButton;
