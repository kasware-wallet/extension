import type { CSSProperties } from 'react';
import React from 'react';

import type { ColorTypes } from '@/ui/theme/colors';
import { colors } from '@/ui/theme/colors';
import { fontSizes } from '@/ui/theme/font';

// Import all assets using import statements
import swapIcon from '@/assets/icons/arrow-left-right.svg';
import leftIcon from '@/assets/icons/arrow-left.svg';
import rightIcon from '@/assets/icons/arrow-right.svg';
import linkIcon from '@/assets/icons/arrow-up-right.svg';
import bridgeIcon from '@/assets/icons/bridge.svg';
import checkIcon from '@/assets/icons/check.svg';
import circleCheckIcon from '@/assets/icons/circle-check.svg';
import circleInfoIcon from '@/assets/icons/circle-info.svg';
import circleQuestionIcon from '@/assets/icons/circle-question.svg';
import historyIcon from '@/assets/icons/clock-solid.svg';
import compassIcon from '@/assets/icons/compass-solid.svg';
import copyIcon from '@/assets/icons/copy-solid.svg';
import deleteIcon from '@/assets/icons/delete.svg';
import discordIcon from '@/assets/icons/discord.svg';
import downIcon from '@/assets/icons/down.svg';
import dropletHalfIcon from '@/assets/icons/droplet-half.svg';
import eyeSlashIcon from '@/assets/icons/eye-slash.svg';
import eyeIcon from '@/assets/icons/eye.svg';
import settingsIcon from '@/assets/icons/gear-solid.svg';
import githubIcon from '@/assets/icons/github.svg';
import gridIcon from '@/assets/icons/grid-solid.svg';
import infoIcon from '@/assets/icons/info.svg';
import kaspaWhiteIcon from '@/assets/icons/kaspa-black.svg';
import kasIcon from '@/assets/icons/kaspa.svg';
import pencilIcon from '@/assets/icons/pencil.svg';
import { default as qrcodeIcon, default as receiveIcon } from '@/assets/icons/qrcode.svg';
import splitIcon from '@/assets/icons/scissors.svg';
import sendIcon from '@/assets/icons/sendtoken.svg';
import successIcon from '@/assets/icons/success.svg';
import telegramIcon from '@/assets/icons/telegram.svg';
import trashCanIcon from '@/assets/icons/trash-can.svg';
import twitterIcon from '@/assets/icons/twitter.svg';
import userIcon from '@/assets/icons/user-solid.svg';
import walletIcon from '@/assets/icons/wallet-solid.svg';
import warningIcon from '@/assets/icons/warning.svg';
import closeIcon from '@/assets/icons/xmark.svg';

export const svgRegistry = {
  history: historyIcon,
  swap: swapIcon,
  bridge: bridgeIcon,
  receive: receiveIcon,
  send: sendIcon,

  right: rightIcon,
  left: leftIcon,
  down: downIcon,
  link: linkIcon,

  discord: discordIcon,
  'droplet-half': dropletHalfIcon,
  telegram: telegramIcon,
  twitter: twitterIcon,
  github: githubIcon,

  kas: kasIcon,
  'kaspa-white': kaspaWhiteIcon,
  qrcode: qrcodeIcon,

  user: userIcon,
  wallet: walletIcon,
  compass: compassIcon,
  settings: settingsIcon,
  grid: gridIcon,

  delete: deleteIcon,
  success: successIcon,
  check: checkIcon,
  eye: eyeIcon,
  'eye-slash': eyeSlashIcon,
  copy: copyIcon,
  close: closeIcon,

  'circle-check': circleCheckIcon,
  pencil: pencilIcon,
  'circle-info': circleInfoIcon,
  'circle-question': circleQuestionIcon,
  split: splitIcon,
  info: infoIcon,
  warning: warningIcon,
  'trash-can': trashCanIcon
};

const iconImgList: Array<IconTypes> = ['success', 'delete', 'kas'];

export type IconTypes = keyof typeof svgRegistry;
interface IconProps {
  /**
   * The name of the icon
   */
  icon?: IconTypes;

  /**
   * An optional tint color for the icon
   */
  color?: ColorTypes;

  /**
   * An optional size for the icon..
   */
  size?: number | string;

  /**
   * Style overrides for the icon image
   */
  style?: CSSProperties;

  /**
   * Style overrides for the icon container
   */
  containerStyle?: CSSProperties;

  /**
   * An optional function to be called when the icon is clicked
   */
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  children?: React.ReactNode;
}

export function Icon(props: IconProps) {
  const {
    icon,
    color,
    size,
    style: $imageStyleOverride,
    containerStyle: $containerStyleOverride,
    onClick,
    children
  } = props;
  if (!icon) {
    return (
      <div
        onClick={onClick}
        style={Object.assign(
          {},
          {
            color: color ? colors[color] : colors.white,
            fontSizes: size || fontSizes.icon,
            display: 'flex'
          } as CSSProperties,
          $containerStyleOverride,
          $imageStyleOverride || {},
          onClick ? { cursor: 'pointer' } : {}
        )}
      >
        {children}
      </div>
    );
  }
  const iconPath = svgRegistry[icon as IconTypes];
  if (iconImgList.includes(icon)) {
    return (
      <img
        src={iconPath}
        alt=""
        style={Object.assign({}, $containerStyleOverride, {
          width: size || fontSizes.icon,
          height: size || fontSizes.icon
        })}
      />
    );
  }
  if (iconPath) {
    return (
      <div style={$containerStyleOverride}>
        <div
          onClick={onClick}
          style={Object.assign(
            {},
            {
              color: color ? colors[color] : colors.white,
              width: size || fontSizes.icon,
              height: size || fontSizes.icon,
              backgroundColor: color ? colors[color] : colors.white,
              maskImage: `url(${iconPath})`,
              maskSize: 'cover',
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskImage: `url(${iconPath})`,
              WebkitMaskSize: 'cover',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center'
            },
            $imageStyleOverride || {},
            onClick ? { cursor: 'pointer' } : {}
          )}
        />
      </div>
    );
  } else {
    return <div />;
  }
}
