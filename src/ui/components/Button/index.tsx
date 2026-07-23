import type { CSSProperties } from 'react';
import React, { useState } from 'react';

import { Loading3QuartersOutlined } from '@ant-design/icons';
import { colors } from '@/ui/theme/colors';
import { spacingGap } from '@/ui/theme/spacing';

import { Column } from '../Column';
import type { IconTypes } from '../Icon';
import { Icon } from '../Icon';
import { Row } from '../Row';
import { Text } from '../Text';

type Presets = keyof typeof $viewPresets;
export interface ButtonProps {
  /**
   * The text to display if not using `tx` or nested components.
   */
  text?: string;
  subText?: string;
  title?: string;
  /**
   * An optional style override useful for padding & margin.
   */
  style?: CSSProperties;
  /**
   * An optional style override for the "pressed" state.
   */
  pressedStyle?: CSSProperties;
  /**
   * An optional style override for the button text.
   */
  textStyle?: CSSProperties;
  /**
   * An optional style override for the button text when in the "pressed" state.
   */
  pressedTextStyle?: CSSProperties;
  /**
   * One of the different types of button presets.
   */
  preset?: Presets;
  /**
   * An optional component to render on the right side of the text.
   * Example: `RightAccessory={(props) => <View {...props} />}`
   */
  RightAccessory?: React.ReactNode;
  /**
   * An optional component to render on the left side of the text.
   * Example: `LeftAccessory={(props) => <View {...props} />}`
   */
  LeftAccessory?: React.ReactNode;
  /**
   * Children components.
   */
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  icon?: IconTypes;
  disabled?: boolean;
  full?: boolean;
  loading?: boolean;
}

const $baseViewStyle: CSSProperties = {
  display: 'flex',
  minHeight: 36,
  borderRadius: 'var(--r-radius-sm, 4px)',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'row',
  // paddingVertical: spacingGap.lg,
  // paddingHorizontal: spacingGap.lg,
  overflow: 'hidden',
  cursor: 'pointer',
  alignSelf: 'stretch',
  paddingLeft: spacingGap.lg,
  paddingRight: spacingGap.lg
};

const $viewPresets = {
  default: Object.assign({}, $baseViewStyle, {
    backgroundColor: colors.black_dark
  }) as CSSProperties,

  primary: Object.assign({}, $baseViewStyle, {
    backgroundColor: colors.aqua,
    height: '40px'
  } as CSSProperties),

  danger: Object.assign({}, $baseViewStyle, {
    backgroundColor: colors.red,
    height: '40px'
  } as CSSProperties),

  bar: Object.assign({}, $baseViewStyle, {
    backgroundColor: colors.black_dark,
    height: '75px',
    justifyContent: 'space-between',

    paddingTop: spacingGap.xl,
    paddingBottom: spacingGap.xl
  } as CSSProperties)
};

const $hoverViewPresets: Record<Presets, CSSProperties> = {
  default: {
    backgroundColor: colors.bg4
  },
  primary: {
    backgroundColor: colors.aqua_dark
  },
  danger: {
    backgroundColor: colors.red_dark
  },
  bar: {
    backgroundColor: colors.bg4
  }
};

const $baseTextStyle: CSSProperties = {
  // fontSize: 16,
  // lineHeight: 20,
  // fontFamily: typography.primary.medium,
  textAlign: 'center',
  flexShrink: 1,
  flexGrow: 0,
  zIndex: 2,
  color: colors.white,
  paddingLeft: spacingGap.sm,
  paddingRight: spacingGap.sm
};

const $textPresets: Record<Presets, CSSProperties> = {
  default: $baseTextStyle,
  primary: Object.assign({}, $baseTextStyle, { color: colors.black }),
  danger: Object.assign({}, $baseTextStyle, { color: colors.white }),
  bar: Object.assign({}, $baseTextStyle, { textAlign: 'left', fontWeight: 'bold' } as CSSProperties)
};

const $pressedTextPresets: Record<Presets, CSSProperties> = {
  default: { opacity: 0.9 },
  primary: { opacity: 0.9 },
  danger: { opacity: 0.9 },
  bar: { opacity: 0.9 }
};

const $rightAccessoryStyle: CSSProperties = { marginLeft: spacingGap.md, zIndex: 1 };
const $leftAccessoryStyle: CSSProperties = { marginRight: spacingGap.md, zIndex: 1 };
const $baseDisabledViewStyle: CSSProperties = { cursor: 'not-allowed', opacity: 0.5 };
const $baseLoadingViewStyle: CSSProperties = { cursor: 'wait', opacity: 0.7 };
export function Button(props: ButtonProps) {
  const {
    text,
    subText,
    style: $viewStyleOverride,
    pressedStyle: $pressedViewStyleOverride,
    textStyle: $textStyleOverride,
    pressedTextStyle: $pressedTextStyleOverride,
    children,
    RightAccessory,
    LeftAccessory,
    onClick,
    icon,
    disabled,
    full,
    title,
    loading,
    ...rest
  } = props;

  const preset: Presets = props.preset || 'default';
  const [hover, setHover] = useState(false);
  const $viewStyle = Object.assign(
    {},
    $viewPresets[preset],
    $viewStyleOverride,
    hover && !disabled && !loading ? $hoverViewPresets[preset] : {},
    disabled ? $baseDisabledViewStyle : {},
    loading && !disabled ? $baseLoadingViewStyle : {},
    full ? { flex: 1 } : {}
  );
  const $textStyle = Object.assign({}, $textPresets[preset], $textStyleOverride);

  const $subTextStyle = Object.assign({}, $textPresets[preset], {
    color: colors.white_muted,
    marginTop: 5,
    fontWeight: 'normal'
  } as CSSProperties);
  if (preset === 'bar') {
    return (
      <div
        style={$viewStyle}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={disabled || loading ? undefined : onClick}
        title={title}
      >
        <Row>
          {LeftAccessory && <div style={$leftAccessoryStyle}>{LeftAccessory}</div>}
          {icon && <Icon icon={icon} color={'white'} style={{ marginRight: spacingGap.sm }} />}
          {loading ? (
            <Loading3QuartersOutlined className="animate-spin" style={{ marginRight: spacingGap.sm }} />
          ) : null}
          <Column justifyCenter gap="zero">
            {text && <Text text={text} style={$textStyle} />}
            {subText && <Text text={subText} style={$subTextStyle} />}
          </Column>

          {children}
        </Row>

        {RightAccessory && <div style={$rightAccessoryStyle}>{RightAccessory}</div>}
      </div>
    );
  }

  return (
    <div
      style={$viewStyle}
      onClick={disabled || loading ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={title}
    >
      {LeftAccessory && <div style={$leftAccessoryStyle}>{LeftAccessory}</div>}
      {icon && <Icon icon={icon} style={{ marginRight: spacingGap.sm }} />}
      {loading ? <Loading3QuartersOutlined className="animate-spin" style={{ marginRight: spacingGap.sm }} /> : null}
      {text && <Text style={$textStyle} text={text} preset="regular-bold" />}
      {children}
      {RightAccessory && <div style={$rightAccessoryStyle}>{RightAccessory}</div>}
    </div>
  );
}

export function ButtonColumn(props: ButtonProps) {
  const {
    text,
    style: $viewStyleOverride,
    textStyle: $textStyleOverride,
    children,
    LeftAccessory,
    onClick,
    icon,
    disabled,
    full,
    title,
    loading
  } = props;

  const preset: Presets = props.preset || 'default';
  const [hover, setHover] = useState(false);
  const $viewStyle = Object.assign(
    {},
    $viewPresets[preset],
    $viewStyleOverride,
    hover && !disabled && !loading ? $hoverViewPresets[preset] : {},
    disabled ? $baseDisabledViewStyle : {},
    loading && !disabled ? $baseLoadingViewStyle : {},
    full ? { flex: 1 } : {},
    { padding: '10px 0px' },
    { flexDirection: 'column' },
    { gap: 5 },
    { borderRadius: 8 }
  );
  const $textStyle = Object.assign({}, $textPresets[preset], $textStyleOverride);

  return (
    <div
      style={$viewStyle}
      onClick={disabled || loading ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={title}
    >
      {LeftAccessory && <div>{LeftAccessory}</div>}
      {icon && <Icon icon={icon} />}
      {loading ? <Loading3QuartersOutlined className="animate-spin" /> : null}
      {text && <Text style={$textStyle} text={text} preset="regular-bold" />}
      {children}
    </div>
  );
}
