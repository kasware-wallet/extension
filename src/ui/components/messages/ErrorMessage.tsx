import { Text } from '@/ui/components';
import React from 'react';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, className = '' }) => {
  return (
    <div className={`${className}`}>
      {message ? (
        <Text text={message} preset="sub" color="error" selectText textCenter />
      ) : (
        <Text text={message} preset="sub" color="grey" selectText textCenter />
      )}
    </div>
  );
};

export default ErrorMessage;
