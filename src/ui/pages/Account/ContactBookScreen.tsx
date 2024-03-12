import VirtualList from 'rc-virtual-list';
import { forwardRef, useEffect, useState } from 'react';

import { Account } from '@/shared/types';
import { Card, Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { copyToClipboard, shortAddress, useWallet } from '@/ui/utils';
import { EllipsisOutlined, PlusCircleOutlined } from '@ant-design/icons';

import { ContactBookItem } from '@/background/service/contactBook';
import { useNavigate } from '../MainRoute';

export interface ItemData {
  key: string;
  account?: Account;
}

interface MyItemProps {
  account?: ContactBookItem;
  autoNav?: boolean;
}

export function MyItem({ account, autoNav }: MyItemProps, ref) {
  const navigate = useNavigate();
  if (!account?.address) {
    return <div />;
  }
  const tools = useTools();

  return (
    <Card justifyBetween mt="md">
      <Row>
        <Column
          onClick={async (e) => {
            copyToClipboard(account.address);
            tools.toastSuccess('copied address');
          }}>
          <Text text={account.name} />
          <Text text={`${shortAddress(account.address, 15)}`} preset="sub" />
        </Column>
      </Row>
      <Column relative>
        <Icon
          onClick={async (e) => {
            navigate('EditContactNameScreen', { account });
          }}>
          <EllipsisOutlined />
        </Icon>
      </Column>
    </Card>
  );
}

export default function ContackBookScreen() {
  const wallet = useWallet();
  const navigate = useNavigate();
  const [items, setItems] = useState<ContactBookItem[]>([]);
  // const items = useMemo(async () => {
  //   const _items: ItemData[] = keyring.accounts.map((v) => {
  //     return {
  //       key: v.address,
  //       account: v
  //     };
  //   });
  //   return _items;
  // }, []);
  const ForwardMyItem = forwardRef(MyItem);
  const getList = async () => {
    const list = await wallet.listContact();
    // const list2 = await wallet.getContactsByMap()
    setItems(list);
  };
  useEffect(() => {
    getList();
  }, [wallet]);

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title="My Contacts"
        RightComponent={
          <Icon
            onClick={() => {
              navigate('CreateContactScreen');
            }}>
            <PlusCircleOutlined />
          </Icon>
        }
      />
      {(items && items.length > 0) ? (
        <Content>
          <VirtualList data={items} data-id="list" itemHeight={20} itemKey={(item) => item.address}>
            {(item, index) => <ForwardMyItem account={item} autoNav={true} />}
          </VirtualList>
        </Content>
      ) : (
        <Row justifyCenter>
          <Text text="No contacts" mt="md" />
        </Row>
      )}
    </Layout>
  );
}
