import React from 'react';
import { Spinner } from '@/shared/components/Loading';

interface LoadingSpinnerProps {
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';
  color?: string;
  text?: string;
  center?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color,
  text,
  center = true,
  className,
  style
}) => {
  const containerStyle = center ? 
    { ...style, display: 'flex', justifyContent: 'center', alignItems: 'center' } : 
    style;

  return (
    <div className={className} style={containerStyle}>
      <Spinner size={size} color={color} />
      {text && <span style={{ marginLeft: 8 }}>{text}</span>}
    </div>
  );
};
