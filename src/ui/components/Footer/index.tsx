import type { CSSProperties } from 'react';
import React from 'react';

import type { BaseViewProps } from '../BaseView';
import { BaseView } from '../BaseView';

export type FooterProps = BaseViewProps;

const $footerBaseStyle = {
  display: 'block',
  minHeight: 20,
  padding: 10,
  paddingBottom: 20,
  bottom: 0
} as CSSProperties;

export function Footer(props: FooterProps) {
  const { style: $styleOverride, ...rest } = props;
  const $style = Object.assign({}, $footerBaseStyle, $styleOverride);
  return <BaseView style={$style} {...rest} />;
}
