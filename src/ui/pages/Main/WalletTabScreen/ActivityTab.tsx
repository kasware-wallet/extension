import { Segmented } from 'antd';

import { useTranslation } from 'react-i18next';

import { ActivityTabKey, NetworkType } from '@/shared/types';
import { Card, Column, Icon, LoadingSpinner, Row, Text } from '@/ui/components';

import { Empty } from '@/ui/components/Empty';

import { useAppDispatch, useAppSelector } from '@/ui/state/hooks';

import { selectNetworkId, selectNetworkType } from '@/ui/state/settings/reducer';
import { selectCurrentKaspaAddress } from '@/ui/state/accounts/reducer';
import { useActivityTabKey } from '@/ui/state/ui/hooks';
import { uiActions } from '@/ui/state/ui/reducer';
import { fontSizes } from '@/ui/theme/font';
import { useKrc20ActivitiesQuery } from '@/ui/utils/hooks/kasplex/fetchKrc20AddressTokenList';

import { KRC20HistoryCardWithoutToken } from '../../KRC20/components';

import { EVMActivityTab } from './EVMActivityTab';
import KASActivityTab from '@/ui/components/KASActivityTab';

export default function ActivityTab() {
  const dispatch = useAppDispatch();
  const activityTabKey = useActivityTabKey();
  const currentNetworkType = useAppSelector(selectNetworkType);
  // Devnet and simnet have no Kasplex indexer, so only native KAS activity
  // (from the Kaspa RPC) is available. Render the KAS list directly with no
  // sub-tab selector.
  if (currentNetworkType === NetworkType.Devnet || currentNetworkType === NetworkType.Simnet) {
    return <KASActivityTab />;
  }
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
          defaultValue={activityTabKey}
          onChange={(value) => {
            dispatch(uiActions.updateActivityTab({ activityTabKey: value as ActivityTabKey }));
          }}
          options={[ActivityTabKey.KAS, ActivityTabKey.KRC20, ActivityTabKey.EVM]}
          style={{ fontSize: '1rem' }}
        />
      </Row>
      {activityTabKey === ActivityTabKey.KAS && <KASActivityTab />}
      {activityTabKey === ActivityTabKey.KRC20 && <KRC20Histories />}
      {activityTabKey === ActivityTabKey.EVM && <EVMActivityTab />}
    </>
  );
}

function KRC20Histories() {
  const networkId = useAppSelector(selectNetworkId);
  const address = useAppSelector(selectCurrentKaspaAddress);
  const { t } = useTranslation();
  const { activities, isLoading, isError, error } = useKrc20ActivitiesQuery(networkId, address);
  if (activities && activities.length > 0) {
    return (
      <div>
        {activities.map((e, index) => (
          <KRC20HistoryCardWithoutToken history={e} key={e?.txAccept ? e?.hashRev + index : index} />
        ))}
        {networkId == 'mainnet' && (
          <Card
            key={'more-tx'}
            classname="card-select"
            mt="sm"
            onClick={() => {
              window.open(`https://kaspa.stream/addresses/addresses/${address}?view=token_transfer`);
            }}
          >
            <Row full justifyCenter itemsCenter>
              <Text preset="link" text={t('More')} size="md" />
              <Icon icon="link" size={fontSizes.xs} color="blue" />
            </Row>
          </Card>
        )}
      </div>
    );
  } else if (isLoading) {
    return (
      <Row justifyCenter mt="sm">
        <LoadingSpinner size="medium" />
      </Row>
    );
  } else if (isError) {
    return (
      <Column justifyCenter>
        <Text text={error?.message} textCenter preset="sub" color="error" selectText />
      </Column>
    );
  } else {
    return <Empty />;
  }
}
