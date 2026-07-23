import { spacingGap } from '@/ui/theme/spacing';
import type { CSSProperties } from 'react';
import type { BaseViewProps } from '../BaseView';
import { BaseView } from '../BaseView';

type Presets = keyof typeof $viewPresets;
export interface ContentProps extends BaseViewProps {
  preset?: Presets;
}
const $contentStyle = {
  backgroundColor: 'var(--r-neutral-bg1)',
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  justifyItems: 'center',
  gap: spacingGap.lg,

  alignSelf: 'stretch',
  overflowY: 'auto',
  overflowX: 'hidden'
} as CSSProperties;

const $viewPresets = {
  large: Object.assign({}, $contentStyle, {
    alignItems: 'stretch',
    padding: spacingGap.xl,
    paddingTop: 0
  }),
  middle: Object.assign({}, $contentStyle, {
    alignItems: 'center',
    justifyContent: 'center',
    width: 315,
    alignSelf: 'center'
  } as CSSProperties)
};

export function Content(props: ContentProps) {
  const { style: $styleOverride, preset, ...rest } = props;

  const $style = Object.assign({}, $viewPresets[preset || 'large'], $styleOverride);
  return <BaseView style={$style} {...rest} />;
}
