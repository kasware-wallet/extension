import clsx from 'clsx';
import type { MouseEventHandler, ReactNode } from 'react';
import React from 'react';
import { copyToClipboard } from '@/shared/utils/clipboard';

interface CopyProps {
  className?: string;
  data: string;
  style?: React.CSSProperties;
  children?: ReactNode;
  icon?: ReactNode;
  onClick?: MouseEventHandler;
  onCopySuccess?: () => void;
  onCopyError?: (error: Error) => void;
}

const Copy = ({ data, className, style, children, icon, onClick, onCopySuccess, onCopyError }: CopyProps) => {
  const handleClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      onClick(e);
    }
    try {
      await copyToClipboard(data);
      onCopySuccess?.();
    } catch (error) {
      onCopyError?.(error as Error);
    }
  };

  return (
    <div className={clsx('cursor-pointer', className)} style={style} onClick={handleClick}>
      {children || icon || (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="5" y="5" width="9" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <path d="M3 10V3C3 2.44772 3.44772 2 4 2H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
};

export default Copy;
