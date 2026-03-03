import type { CSSProperties, ReactNode } from 'react';

import { colors } from '@/ui/theme/colors';
import { spacingGap } from '@/ui/theme/spacing';

import type { BaseViewProps } from '../BaseView';
import { BaseView } from '../BaseView';

export interface CardProps extends BaseViewProps {
  preset?: Presets;
}

const $baseViewStyle = {
  display: 'flex',
  flexDirection: 'row',
  gap: spacingGap.md,
  backgroundColor: colors.black_dark,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 5
} as CSSProperties;

const $viewPresets = {
  auto: Object.assign({}, $baseViewStyle, {
    paddingTop: spacingGap.lg,
    paddingBottom: spacingGap.lg,
    paddingLeft: spacingGap.lg,
    paddingRight: spacingGap.lg,
    minHeight: 50
  } as CSSProperties) as CSSProperties,
  style1: Object.assign({}, $baseViewStyle, {
    height: '75px',
    paddingTop: spacingGap.sm,
    paddingBottom: spacingGap.sm,
    paddingLeft: spacingGap.lg,
    paddingRight: spacingGap.lg
  }) as CSSProperties,
  style2: Object.assign({}, $baseViewStyle, {
    paddingTop: spacingGap.sm,
    paddingBottom: spacingGap.sm,
    paddingLeft: spacingGap.lg,
    paddingRight: spacingGap.lg
  }) as CSSProperties,
  style3: Object.assign({}, $baseViewStyle, {
    paddingTop: spacingGap.xs,
    paddingBottom: spacingGap.xs,
    paddingLeft: spacingGap.sm,
    paddingRight: spacingGap.sm
  }) as CSSProperties
};

type Presets = keyof typeof $viewPresets;

export function Card(props: CardProps) {
  const { style: $styleOverride, preset, ...rest } = props;
  const $style = Object.assign({}, $viewPresets[preset || 'auto'], $styleOverride);
  return <BaseView style={$style} {...rest} />;
}

export function StartCard({ children }: { children?: ReactNode }) {
  return (
    <Card
      classname="card-select"
      full
      justifyBetween
      py="xs"
      mt="xxs"
      mb="zero"
      style={{ minHeight: 40, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
    >
      {children}
    </Card>
  );
}

export function MiddleCard({ children }: { children?: ReactNode }) {
  return (
    <Card
      py="sm"
      mt="xxs"
      mb="zero"
      classname="card-select"
      full
      justifyBetween
      style={{
        minHeight: 40,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0
      }}
    >
      {children}
    </Card>
  );
}
export function EndCard({ children }: { children?: ReactNode }) {
  return (
    <Card
      classname="card-select"
      full
      justifyBetween
      py="xs"
      mt="xxs"
      mb="zero"
      style={{ minHeight: 40, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
    >
      {children}
    </Card>
  );
}
