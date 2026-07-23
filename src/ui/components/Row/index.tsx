import { spacingGap } from '@/ui/theme/spacing';
import type { CSSProperties } from 'react';
import type { BaseViewProps } from '../BaseView';
import { BaseView } from '../BaseView';

export type RowProps = BaseViewProps;

const $rowStyle = {
  display: 'flex',
  flexDirection: 'row',
  gap: spacingGap.md
} as CSSProperties;

export function Row(props: RowProps) {
  const { style: $styleOverride, classname, ...rest } = props;
  const $style = Object.assign({}, $rowStyle, $styleOverride);
  const $classname = ['row-container', classname].filter(Boolean).join(' ');
  return <BaseView style={$style} {...rest} classname={$classname} />;
}
