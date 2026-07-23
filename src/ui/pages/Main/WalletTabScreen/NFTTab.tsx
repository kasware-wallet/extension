import { NetworkType, NftTabKey } from '@/shared/types';
import { Row, Text } from '@/ui/components';
import { useAppDispatch, useAppSelector } from '@/ui/state/hooks';
import { selectNetworkType } from '@/ui/state/settings/reducer';
import { useNftTabKey } from '@/ui/state/ui/hooks';
import { uiActions } from '@/ui/state/ui/reducer';
import { Segmented } from 'antd';

import { KNSTab } from './KNSTab';
import { KsprNftTab } from './KsprNftTab';

export default function NFTTab() {
  const dispatch = useAppDispatch();
  const nftTabKey = useNftTabKey();
  // const networkId = useAppSelector(selectNetworkId);
  const currentNetworkType = useAppSelector(selectNetworkType);
  if (currentNetworkType !== NetworkType.Mainnet && currentNetworkType !== NetworkType.Testnet) {
    return (
      <Row justifyCenter>
        <Text text="Not Supported." mt="md" />
      </Row>
    );
  }

  return (
    <>
      <Row justifyEnd>
        <Segmented
          size="middle"
          defaultValue={nftTabKey}
          onChange={(value) => {
            dispatch(uiActions.updateNftTab({ nftTabKey: value as NftTabKey }));
          }}
          options={
            [NftTabKey.KNS, NftTabKey.KSPR]
          }
          style={{ fontSize: '1rem' }}
        />
      </Row>
      {nftTabKey === NftTabKey.KNS && <KNSTab />}
      {nftTabKey === NftTabKey.KSPR && <KsprNftTab />}
    </>
  );
}
