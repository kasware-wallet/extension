import { useCacheKrc721StreamUrl } from '@/ui/state/settings/hooks';

import { useMemo } from 'react';
import { Column } from '../Column';
import { Image } from '../Image';
import { Row } from '../Row';
import type { Sizes } from '../Text';
import { Text } from '../Text';

// import './index.less';

const $viewPresets = {
  large: {},

  medium: {},

  small: {}
};

const $stylePresets: {
  [key: string]: {
    width: number;
    height: number;
    borderRadius: number;
    textSize: Sizes;
  };
} = {
  large: {
    width: 300,
    height: 300,
    borderRadius: 20,
    textSize: 'md'
  },
  medium: {
    width: 156,
    height: 156,
    borderRadius: 15,
    textSize: 'sm'
  },
  small: {
    width: 80,
    height: 80,
    borderRadius: 10,
    textSize: 'xxs'
  }
};

type Presets = keyof typeof $viewPresets;

export interface InscriptionProps {
  tick: string;
  id: string | undefined;
  onClick?: (data: any) => void;
  preset: Presets;
}

export default function CAT721Preview({ tick, id, onClick, preset }: InscriptionProps) {
  const style = $stylePresets[preset];

  const cacheKrc721StreamUrl = useCacheKrc721StreamUrl();
  const imageUrl = useMemo(() => {
    if (id === undefined) return `${cacheKrc721StreamUrl}/thumbnail/${tick}`;

    return `${cacheKrc721StreamUrl}/thumbnail/${tick}/${id}`;
  }, [tick, id, cacheKrc721StreamUrl]);

  return (
    <Column gap="zero" onClick={onClick} style={{}} justifyCenter itemsCenter>
      <Image
        src={imageUrl}
        width={style.width}
        height={style.height}
        style={{
          borderTopLeftRadius: style.borderRadius,
          borderTopRightRadius: style.borderRadius
        }}
      />
      <Row
        px="lg"
        py="sm"
        gap="zero"
        bg="bg4"
        style={{
          borderBottomLeftRadius: style.borderRadius,
          borderBottomRightRadius: style.borderRadius
        }}
      >
        <Row my="sm">
          {/* <Text text={'Id:'} color="textDim" size={style.textSize} /> */}

          <Text text={id ? `${tick}#${id}` : tick} color="white" size={style.textSize} />
        </Row>
      </Row>
    </Column>
  );
}
