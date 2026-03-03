import type { ReactNode } from 'react';
import React from 'react';

interface BottomFixedContainerProps {
  children: ReactNode;
  shadow?: boolean;
  className?: string;
}

const BottomFixedContainer: React.FC<BottomFixedContainerProps> = ({ children, shadow = true, className = '' }) => {
  return (
    <div
      className={`fixed bottom-0 left-0 w-full ${className}`}
      style={shadow ? { boxShadow: '0 -10px 15px rgba(0, 0, 0, 0.3)' } : {}}
    >
      {children}
    </div>
  );
};

export default BottomFixedContainer;
