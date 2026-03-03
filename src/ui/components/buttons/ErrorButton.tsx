import React from 'react';

interface ErrorButtonProps {
  text?: string;
}

const ErrorButton: React.FC<ErrorButtonProps> = ({ text = 'Error' }) => (
  <button
    disabled={true}
    className="w-full h-[52px] text-lg font-semibold rounded-lg flex items-center justify-center bg-error text-darkmuted cursor-not-allowed"
  >
    {text}
  </button>
);

export default ErrorButton;
