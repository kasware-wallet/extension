import type { CSSProperties } from 'react';

import { colors } from '@/ui/theme/colors';
import { spacingGap } from '@/ui/theme/spacing';

import { LoadingSpinner } from '../../LoadingSpinner';

import { Text } from '../../Text';

export interface LoadingProps {
  text?: string;
  onClose?: () => void;
}

const $baseViewStyle: CSSProperties = {
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  gap: spacingGap.lg
};

export function Loading(props: LoadingProps) {
  const { text } = props;
  return (
    <div className="popover-container">
      <div style={$baseViewStyle}>
        <LoadingSpinner size="small" color={colors.orange} text={text} />
      </div>
    </div>
  );
}
