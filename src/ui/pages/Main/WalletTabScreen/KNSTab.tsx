import { useEffect, useState } from 'react';

import type { IKNSAsset } from '@/shared/types';
import { Column, Row, Text } from '@/ui/components';
import { Empty } from '@/ui/components/Empty';
import KnsPreview from '@/ui/components/KnsPreview';
import { Pagination } from '@/ui/components/Pagination';
import { useKnsAssetsQuery } from '@/ui/hooks/kns';
import { useCurrentAccount } from '@/ui/state/accounts/hooks';
import { useAppSelector } from '@/ui/state/hooks';
import { selectNetworkId } from '@/ui/state/settings/reducer';
import { LoadingOutlined } from '@ant-design/icons';

import { useNavigate } from '../../MainRoute';

export function KNSTab() {
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const networkId = useAppSelector(selectNetworkId);

  const [inscriptions, setInscriptions] = useState<IKNSAsset[]>([]);
  const [total, setTotal] = useState(-1);
  const [pagination, setPagination] = useState({ currentPage: 1, pageSize: 20 });
  const { data, isLoading, isError, error, isFetching } = useKnsAssetsQuery(
    networkId,
    currentAccount.address,
    pagination.currentPage,
    pagination.pageSize
  );

  useEffect(() => {
    if (data) {
      setInscriptions(data?.assets || []);
      setTotal(data?.pagination.totalItems || 0);
    }
  }, [data]);
  if (isLoading || isFetching) {
    return (
      <Column style={{ minHeight: 150 }} itemsCenter justifyCenter>
        <LoadingOutlined />
      </Column>
    );
  }

  if (isError) {
    <Column justifyCenter>
      <Text text={error?.message} textCenter preset="sub" color="error" selectText />
    </Column>;
  }
  if (total === 0) {
    return (
      <Column style={{ minHeight: 150 }} itemsCenter justifyCenter>
        <Empty text="Empty" />
      </Column>
    );
  }

  return (
    <Column>
      <Row style={{ flexWrap: 'wrap' }} gap="lg" justifyCenter>
        {inscriptions?.map((data, index) => (
          <KnsPreview
            key={index}
            data={data}
            preset="medium"
            onClick={() => {
              navigate('KNSDetailScreen', { knsAsset: data });
            }}
          />
        ))}
      </Row>
      <Row justifyCenter mt="lg">
        <Pagination
          pagination={pagination}
          total={total}
          onChange={(pagination) => {
            setPagination(pagination);
          }}
        />
      </Row>
    </Column>
  );
}
