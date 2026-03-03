import React from 'react';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'large' }) => {
  const spinnerSize = size === 'large' ? 'h-10 w-10' : size === 'medium' ? 'h-4 w-4' : 'h-3 w-3';

  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full ${spinnerSize} border-t-2 border-primary`}></div>
    </div>
  );
};

export default Spinner;
