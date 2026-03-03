import type { TokenHistoryItem } from '@/evm/ui/views/Approval/components/AddAsset';
import { HistoryItem } from '@/evm/ui/views/Dashboard/components/TokenDetailPopup/HistoryItem';
import { useCurrentAccount } from '@/ui/state/accounts/hooks';
import { useWallet } from '@/ui/utils';
import { Spin, Drawer } from 'antd';
import { Empty } from '@/ui/components/Empty';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Column, Content, Footer, Header, Icon, Layout, Row, Text } from '@/ui/components';
import TransactionHistory from '@/evm/ui/views/TransactionHistory';
import { TabsStyled } from '@/evm/ui/views/NFTView';
import { ChainSelectDropdown, useChainSelect, ChainSelectDrawer } from '@/evm/ui/component/ChainSelectDropdown';
import { BrowserAPIByChainId } from '@kasware-wallet/common';

export function EVMActivityTab() {
  const { t } = useTranslation();
  const [tokenTxHistory, setTokenTxHistory] = useState<TokenHistoryItem[]>([]);
  const [isTokenHistoryLoaded, setIsTokenHistoryLoaded] = useState(false);
  const wallet = useWallet();
  const currentAccount = useCurrentAccount();
  // const networkId = useAppSelector(selectNetworkId);
  const { chainList, selectedChain, isChainSelectOpen, openChainSelect, closeChainSelect, selectTestnetChain } =
    useChainSelect();
  // const testnetList = useAppSelector((store) => store.chains.testnetList).filter(
  //   (chain) => BrowserAPIByChainId[chain.id]
  // );
  // Memoize the filtered chain list to prevent recalculation on every render
  // const chainList = useMemo(() => {
  //   return networkId === NETWORK_ID.mainnet
  //     ? testnetList.filter((chain) => !isCustomTestnet(chain))
  //     : testnetList.filter(isCustomTestnet);
  // }, [testnetList, networkId]);
  // const [selectedChain, setSelectedChain] = useState<TestnetChain>(chainList[0]);
  // const selectTestnetChain = (chain: TestnetChain) => {
  //   setSelectedChain(chain);
  //   setIsChainSelectOpen(false);
  // };
  const fetchTokenHistory = useCallback(async () => {
    if (selectedChain) {
      setIsTokenHistoryLoaded(false);
      const history = await wallet.openapiEVM.listTxHistory({
        id: currentAccount.evmAddress,
        chain_id: selectedChain.id
        // page_count: 10,
        // token_id: token.id
      });
      const { project_dict, cate_dict, token_dict, history_list: list } = history;
      const displayList = list
        ?.map((item) => ({
          ...item,
          projectDict: project_dict,
          cateDict: cate_dict,
          tokenDict: token_dict
        }))
        .sort((v1, v2) => v2.time_at - v1.time_at);
      setTokenTxHistory(displayList);
      setIsTokenHistoryLoaded(true);
    }
  }, [selectedChain, currentAccount, wallet]);
  useEffect(() => {
    fetchTokenHistory();
  }, [fetchTokenHistory]);
  //tabs config
  const [tab, setTab] = useState('local');
  const tabsItems = [
    {
      key: 'local',
      label: t('Local View'),
      children: <TransactionHistory chainId={selectedChain?.id} />
    },
    {
      key: 'tokens',
      label: t('Token View'),
      children: (
        <>
          {!isTokenHistoryLoaded && (
            <div className="flex justify-center mt-2">
              <Spin size="default" />
            </div>
          )}
          <div className="token-history flex flex-col">
            {isTokenHistoryLoaded && (tokenTxHistory?.length <= 0 || !tokenTxHistory) && (
              <Empty
                text={
                  selectedChain && BrowserAPIByChainId[selectedChain?.id]
                    ? t('No Transactions')
                    : t('This network is not supported')
                }
              />
            )}
            {tokenTxHistory?.map((item, index) => (
              <HistoryItem
                data={item}
                projectDict={item.projectDict}
                cateDict={item.cateDict}
                tokenDict={item.tokenDict}
                canClickToken={false}
                key={item.id + index}
              />
            ))}
          </div>
        </>
      )
    }
  ];
  return (
    <Column>
      <ChainSelectDropdown chain={selectedChain} openChainSelect={openChainSelect} />
      <div>
        <TabsStyled defaultActiveKey={tab} centered onChange={setTab} items={tabsItems} />
      </div>
      <ChainSelectDrawer
        isOpen={isChainSelectOpen}
        onClose={closeChainSelect}
        chainList={chainList}
        onSelectChain={selectTestnetChain}
      />
    </Column>
  );
}
