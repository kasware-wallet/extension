/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CSSProperties } from 'react';

import type { IKNSAsset } from '@/shared/types';
import { colors } from '@/ui/theme/colors';

import { formatDate, shortAddress } from '../../utils';
import { Column } from '../Column';
import Iframe from '../Iframe';
import { Row } from '../Row';
import { Text } from '../Text';
import './index.less';

function getDateShowdate(date: Date) {
  if (date.getTime() < 100) {
    return 'unconfirmed';
  } else {
    const old = Date.now() - date.getTime();
    if (old < 60 * 1000) {
      return `${Math.floor(old / 1000)} secs ago`;
    }
    if (old < 1000 * 60 * 60) {
      return `${Math.floor(old / 60000)} mins ago`;
    }
    if (old < 1000 * 60 * 60 * 24) {
      return `${Math.floor(old / 3600000)} hours ago`;
    }
    if (old < 1000 * 60 * 60 * 24 * 30) {
      return `${Math.floor(old / 86400000)} days ago`;
    }
  }
  return formatDate(date, 'yyyy-MM-dd');
}

const $viewPresets = {
  large: {},

  medium: {},

  small: {}
};

const $containerPresets: Record<Presets, CSSProperties> = {
  large: {
    backgroundColor: colors.black,
    width: 300
  },
  medium: {
    backgroundColor: colors.black,
    width: 144,
    height: 180
  },
  small: {
    backgroundColor: colors.black,
    width: 80
  }
};

const $iframePresets: Record<Presets, CSSProperties> = {
  large: {
    width: 300,
    height: 300
  },
  medium: {
    width: 144,
    height: 144
  },
  small: {
    width: 80,
    height: 80
  }
};

const $timePresets: Record<Presets, string> = {
  large: 'sm',
  medium: 'sm',
  small: 'xxs'
};

const $numberPresets: Record<Presets, string> = {
  large: 'md',
  medium: 'sm',
  small: 'xxs'
};

type Presets = keyof typeof $viewPresets;

export interface InscriptionProps {
  data: IKNSAsset;
  onClick?: () => void;
  preset: Presets;
  asLogo?: boolean;
}

export default function KnsPreview({ data, onClick, preset, asLogo }: InscriptionProps) {
  const date = new Date(data.creationBlockTime);
  const time = getDateShowdate(date);
  const isUnconfirmed = date.getTime() < 100;
  const numberStr = isUnconfirmed ? 'unconfirmed' : `# ${data.id}`;

  const url = '';
  // let preview = data.preview;
  let preview = '';
  if (!preview) {
    preview = url + '/preview/' + data.assetId;
  }
  if (asLogo) {
    return <Iframe preview={preview} style={$iframePresets[preset]} />;
  }
  return (
    <Column gap="zero" onClick={onClick} style={Object.assign({ position: 'relative' }, $containerPresets[preset])}>
      {data?.isVerifiedDomain == true && (
        <div className="absolute top-2 right-2 bg-teal-600 text-white text-xs px-2 py-1 rounded">Verified</div>
      )}
      <div className="flex text-center justify-center bg-primary h-3/4 text-white text-lg p-6 overflow-hidden">
        <div className="w-full overflow-hidden text-ellipsis whitespace-pre-wrap m-auto">{data.asset}</div>
      </div>

      <Column px="md" py="sm" gap="zero" full classname="bg-teal-500">
        <Text text={numberStr} color="white" size={$numberPresets[preset] as any} />
        <Text text={shortAddress(data.assetId, 4)} color="white" size={$numberPresets[preset] as any} />
        {isUnconfirmed == false && data?.creationBlockTime && (
          <Row justifyBetween itemsCenter>
            <Text text={time} preset="sub" size={$timePresets[preset] as any} />
            {data?.status == 'listed' && (
              <Text text="List" color="yellow" preset="xsub" size={$timePresets[preset] as any} />
            )}
          </Row>
        )}
      </Column>
    </Column>
  );
}
