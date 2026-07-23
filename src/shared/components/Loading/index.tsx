import clsx from 'clsx';
import type { ReactNode } from 'react';
import React from 'react';
import './style.less';

interface LoadingProps {
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
  loading?: boolean;
}

interface SpinnerProps {
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'large', color, className, style }) => {
  const validSizes = ['tiny', 'small', 'medium', 'large', 'xlarge', 'xxlarge'] as const;
  const normalizedSize = validSizes.includes(size as any) ? size : 'medium';

  const sizeMap = {
    tiny: 'h-3 w-3',
    small: 'h-3.5 w-3.5',
    medium: 'h-4.5 w-4.5',
    large: 'h-6 w-6',
    xlarge: 'h-8 w-8',
    xxlarge: 'h-10 w-10'
  };

  const spinnerStyle = color ? { ...style, borderColor: color, borderTopColor: 'transparent' } : style;
  const spinnerClassName = color ? 'animate-spin rounded-full border-t-2' : 'animate-spin rounded-full border-t-2 border-primary';

  return (
    <div className={clsx('flex justify-center items-center', className)} style={style}>
      <div className={`${spinnerClassName} ${sizeMap[normalizedSize]}`} style={color ? spinnerStyle : undefined} />
    </div>
  );
};

const Loading = ({ className, style, children, loading = true }: LoadingProps) => {
  return loading ? (
    <div className={clsx('kasware-loading', className)} style={style}>
      <Spinner size="tiny" className="kasware-loading-image" />
      <div className="kasware-loading-text">{children}</div>
    </div>
  ) : null;
};

export { Spinner };
export default Loading;
