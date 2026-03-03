import { Empty } from 'antd';
import log from 'loglevel';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { TKRC20History, TKRC20HistoryIssue } from '@/shared/types';
import { Card, Column, Icon, Row, Text } from '@/ui/components';
import { selectCurrentKaspaAddress } from '@/ui/state/accounts/reducer';
import { useAppSelector } from '@/ui/state/hooks';
import { selectNetworkId } from '@/ui/state/settings/reducer';
import { shortAddress } from '@/ui/utils';
import { useKrc721ActivitiesQuery } from '@/ui/utils/hooks/krc721';
import { LoadingOutlined } from '@ant-design/icons';

import { useNavigate } from '../../MainRoute';

export function KRC721Histories() {
  const networkId = useAppSelector(selectNetworkId);
  const address = useAppSelector(selectCurrentKaspaAddress);
  const { t } = useTranslation();
  const { activities, isLoading, isError, error } = useKrc721ActivitiesQuery(networkId, address);
  log.debug('krc721 activities', activities);
  if (activities && activities.length > 0) {
    return (
      <div>
        {activities.map((e, index) => (
          <KRC721HistoryCard history={e} key={e?.txAccept ? e?.hashRev : index} />
        ))}

        {/* {networkId == 'mainnet' && (
          <Card
            key={'more-tx'}
            classname="card-select"
            mt="sm"
            onClick={() => {
              //   window.open(`https://kas.fyi/addresses/${address}?view=token_transfer`);
              log.debug('to do');
            }}>
            <Row full justifyCenter itemsCenter>
              <Text preset="link" text={t('More')} size="md" />
              <Icon icon="link" size={fontSizes.xs} color="blue" />
            </Row>
          </Card>
        )} */}
      </div>
    );
  } else if (isLoading) {
    <Row justifyCenter mt="sm">
      <Icon>
        <LoadingOutlined />
      </Icon>
    </Row>;
  } else if (isError) {
    <Column justifyCenter>
      <Text text={error?.message} textCenter preset="sub" color="error" selectText />
    </Column>;
  } else {
    return <Empty />;
  }
}

function KRC721HistoryCard({ history }: { history: any }) {
  const navigate = useNavigate();
  return (
    <Card
      classname="card-select"
      mt="sm"
      onClick={() => {
        navigate('KSPR721TxDetailScreen', { txDetail: history, op: history.op });
      }}
    >
      <Row full justifyBetween>
        <Column full>
          <Row justifyBetween>
            <KRC721OpAddress history={history} />
            <KRC721TxConfirmState opError={history?.opError} />
          </Row>
          <Row justifyBetween>
            <KRC721OpAmount history={history} />
            <Text text={new Date(Number(history?.mtsAdd)).toLocaleString()} preset="sub" />
          </Row>
          {/* {history?.op == 'deploy' && (history as IKRC20Deploy)?.pre && Number((history as IKRC20Deploy)?.pre) > 0 && (
            <Row justifyBetween>
              <KRC20OpAmountPreAllocation history={history as IKRC20Deploy} token={token} />
              <Text text={new Date(Number(history.mtsAdd)).toLocaleString()} preset="sub" />
            </Row>
          )} */}
        </Column>
      </Row>
    </Card>
  );
}

function KRC721OpAddress({ history }: { history: TKRC20History | TKRC20HistoryIssue }) {
  const content = useMemo(() => {
    // Check if history has 'to' property and it's not undefined
    if ('to' in history && history.to) {
      return `${history.op} to ${shortAddress(history.to)}`;
    } else {
      return history.op;
    }
  }, [history]);
  return (
    <Row>
      <Text text={content} preset="sub" />
    </Row>
  );
}

function KRC721TxConfirmState({ opError }: { opError: string }) {
  if (opError && opError?.length > 0) {
    return (
      <Row>
        <Text text={'Failed'} preset="sub" color="red" />
      </Row>
    );
  } else {
    return (
      <Row>
        <Text text={'Success'} preset="sub" />
      </Row>
    );
  }
}

function KRC721OpAmount({ history }: { history: TKRC20History | TKRC20HistoryIssue }) {
  return (
    <Row itemsCenter>
      <Text text={history?.tick} />
    </Row>
  );
}
