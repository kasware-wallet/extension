import type { CSSProperties, ReactNode } from 'react';

import { colors } from '@/ui/theme/colors';
import { spacingGap } from '@/ui/theme/spacing';

import type { BaseViewProps } from '../BaseView';
import { BaseView } from '../BaseView';

export interface CardProps extends BaseViewProps {
  preset?: Presets;
}
// Shared base style for all card presets
const $baseViewStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  gap: spacingGap.md,
  backgroundColor: 'var(--r-neutral-card-1)',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'var(--r-radius-md, 6px)'
};

type Presets = 'auto' | 'style1' | 'style2' | 'style3';

const $viewPresets: Record<Presets, CSSProperties> = {
  auto: {
    ...$baseViewStyle,
    paddingTop: spacingGap.lg,
    paddingBottom: spacingGap.lg,
    paddingLeft: spacingGap.lg,
    paddingRight: spacingGap.lg,
    minHeight: 50
  },
  style1: {
    ...$baseViewStyle,
    height: '75px',
    paddingTop: spacingGap.sm,
    paddingBottom: spacingGap.sm,
    paddingLeft: spacingGap.lg,
    paddingRight: spacingGap.lg
  },
  style2: {
    ...$baseViewStyle,
    paddingTop: spacingGap.sm,
    paddingBottom: spacingGap.sm,
    paddingLeft: spacingGap.lg,
    paddingRight: spacingGap.lg
  },
  style3: {
    ...$baseViewStyle,
    paddingTop: spacingGap.xs,
    paddingBottom: spacingGap.xs,
    paddingLeft: spacingGap.sm,
    paddingRight: spacingGap.sm
  }
};

export function Card(props: CardProps) {
  const { style: $styleOverride, preset = 'auto', ...rest } = props;
  const $style = { ...$viewPresets[preset], ...$styleOverride };
  return <BaseView style={$style} {...rest} />;
}

export interface StartCardProps extends CardProps {
  children?: ReactNode;
}

// Shared config for card group components
const CARD_GROUP_COMMON_PROPS = {
  classname: 'card-select',
  full: true,
  justifyBetween: true,
  mt: 'xxs' as const,
  mb: 'zero' as const,
  py: 'xs' as const
};

const CARD_MIN_HEIGHT: CSSProperties = { minHeight: 40 };

export function StartCard(props: StartCardProps) {
  const { children, style: styleOverride, ...rest } = props;

  return (
    <Card
      {...CARD_GROUP_COMMON_PROPS}
      style={{
        ...CARD_MIN_HEIGHT,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        ...styleOverride
      }}
      {...rest}
    >
      {children}
    </Card>
  );
}

export function MiddleCard(props: StartCardProps) {
  const { children, style: styleOverride, ...rest } = props;

  return (
    <Card
      {...CARD_GROUP_COMMON_PROPS}
      style={{
        ...CARD_MIN_HEIGHT,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        ...styleOverride
      }}
      {...rest}
    >
      {children}
    </Card>
  );
}

export function EndCard(props: StartCardProps) {
  const { children, style: styleOverride, ...rest } = props;

  return (
    <Card
      {...CARD_GROUP_COMMON_PROPS}
      style={{
        ...CARD_MIN_HEIGHT,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        ...styleOverride
      }}
      {...rest}
    >
      {children}
    </Card>
  );
}
