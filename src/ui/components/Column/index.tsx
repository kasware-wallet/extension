import type { CSSProperties } from 'react';
import React from 'react';

import { spacingGap } from '@/ui/theme/spacing';

import type { BaseViewProps } from '../BaseView';
import { BaseView } from '../BaseView';

export type ColumnProps = BaseViewProps;
const $columnStyle = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  gap: spacingGap.md
} as CSSProperties;

export function Column(props: ColumnProps) {
  const { style: $styleOverride, ...rest } = props;
  const $style = Object.assign({}, $columnStyle, $styleOverride);
  return <BaseView style={$style} {...rest} />;
}
