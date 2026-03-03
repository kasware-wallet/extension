import { useEffect, useState } from 'react';

import { Column, Row, Text } from '@/ui/components';
import { Empty } from '@/ui/components/Empty';
import KsprNftPreview from '@/ui/components/KsprNftPreview';
import { Pagination } from '@/ui/components/Pagination';
import type { KsprNftResponse } from '@/ui/hooks/KsprNft/fetchKsprNft';
import useKsprNftQuery from '@/ui/hooks/KsprNft/fetchKsprNft';
import { selectCurrentKaspaAddress } from '@/ui/state/accounts/reducer';
import { useAppSelector } from '@/ui/state/hooks';
import { selectNetworkId } from '@/ui/state/settings/reducer';
import { LoadingOutlined } from '@ant-design/icons';

import { useNavigate } from '../../MainRoute';

// const address = 'kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e';
export function KsprNftTab() {
  const navigate = useNavigate();
  const address = useAppSelector(selectCurrentKaspaAddress);
  const pageSize = 50;
  const networkId = useAppSelector(selectNetworkId);
  const [pagination, setPagination] = useState({ currentPage: 1, pageSize });
  const [pageData, setPageData] = useState<{ [key: number]: KsprNftResponse }>({});
  const [pageTokens, setPageTokens] = useState<{ [key: number]: string | undefined }>({ 1: undefined });

  const { data, isLoading, isError, error, isFetching } = useKsprNftQuery(
    address,
    networkId,
    pageTokens[pagination.currentPage]
  );

  // Handle caching of new page data
  useEffect(() => {
    if (data && !pageData[pagination.currentPage]) {
      setPageData((prev) => ({ ...prev, [pagination.currentPage]: data }));
    }
  }, [data, pagination.currentPage, pageData]);

  // Record next page token for subsequent pagination
  useEffect(() => {
    if (data?.next && !pageTokens[pagination.currentPage + 1]) {
      setPageTokens((prev) => ({ ...prev, [pagination.currentPage + 1]: data.next }));
    }
  }, [data?.next, pagination.currentPage, pageTokens]);

  // Calculate total pages based on loaded pages and pages with next page token
  const totalPages = Object.keys(pageTokens).length;

  // Get NFT data for current page
  const currentNfts = pageData[pagination.currentPage]?.result || [];

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

  if (currentNfts.length === 0 && !isLoading && !isFetching) {
    return (
      <Column style={{ minHeight: 150 }} itemsCenter justifyCenter>
        <Empty text="Empty" />
      </Column>
    );
  }

  return (
    <Column>
      <Row style={{ flexWrap: 'wrap' }} gap="sm" justifyCenter>
        {currentNfts?.map((data) => (
          <KsprNftPreview
            key={data.tokenId + data.tick + data.buri}
            preset="small"
            tick={data.tick}
            id={data.tokenId}
            onClick={() => {
              navigate('KsprDetailScreen', { tokenId: data.tokenId, tick: data.tick });
            }}
          />
        ))}
      </Row>
      <Row justifyCenter mt="lg">
        <Pagination
          pagination={pagination}
          total={totalPages * pageSize}
          onChange={(newPagination) => {
            setPagination(newPagination);
          }}
        />
      </Row>
    </Column>
  );
}
