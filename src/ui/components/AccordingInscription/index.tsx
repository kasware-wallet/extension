import { useMemo } from 'react';

import type { IKNSDomain } from '@/shared/types';
import { getKnsWebsite } from '@/shared/utils';
import { useAppSelector } from '@/ui/state/hooks';
import { selectNetworkId } from '@/ui/state/settings/reducer';

import { Text } from '../Text';

export function AccordingInscription({ knsDomain }: { knsDomain: IKNSDomain }) {
  const networkId = useAppSelector(selectNetworkId);
  const host = useMemo(() => {
    return getKnsWebsite(networkId);
  }, [networkId]);
  return (
    <Text
      text={`By inscription #${knsDomain.id} `}
      preset="link"
      onClick={() => {
        window.open(`${host}/asset/${knsDomain.assetId}`);
      }}
    />
  );
}
