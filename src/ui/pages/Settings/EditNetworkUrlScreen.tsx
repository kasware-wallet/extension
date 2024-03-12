import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { NETWORK_TYPES } from '@/shared/constant';
import { Button, Column, Content, Header, Input, Layout } from '@/ui/components';
import { useChangeRpcLinksCallback, useNetworkType, useRpcLinks } from '@/ui/state/settings/hooks';
import { useWallet } from '@/ui/utils';

export default function EditNetworkUrlScreen() {
  const { state } = useLocation();
  const { item } = state as {
    item: typeof NETWORK_TYPES[0];
  };
  const currentRpcLinks = useRpcLinks();
  const currentNetworkType = useNetworkType();
  const changeRpcLinks = useChangeRpcLinksCallback();
  const wallet = useWallet();
  const [alianName, setAlianName] = useState('');
  const defaultUrl = useMemo(() => {
    const n = NETWORK_TYPES.find((n) => n.value == item.value);
    return n?.url;
  }, []);
  const handleOnClick = async (alianName:string) => {
    try {
      const a = new URL(alianName);
      console.log(a);
    } catch (e) {
      console.log('e', e);
    }
    const newRpcLinks = currentRpcLinks.map((r) => {
      if (r.value == item.value) {
        const newR = { ...r, url: alianName };
        return newR;
      } else {
        return r;
      }
    });
    await changeRpcLinks(newRpcLinks);
    if (currentNetworkType == item.value) {
      await wallet.setNetworkType(currentNetworkType);
    }
    window.history.go(-1);
    // const newKeyring = await wallet.setKeyringAlianName(keyring, alianName || keyring.alianName);
    // dispatch(keyringsActions.updateKeyringName(newKeyring));
    // window.history.go(-1);
  };

  const handleOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ('Enter' == e.key) {
      handleOnClick(alianName);
    }
  };

  const isValidName = useMemo(() => {
    if (alianName.length == 0) {
      return false;
    }
    try {
      new URL(alianName);
      return true;
    } catch (err) {
      return false;
    }
  }, [alianName]);

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={item.label}
      />
      <Content>
        <Column gap="lg">
          <Input
            placeholder={item.url}
            defaultValue={item.url}
            onChange={(e) => {
              setAlianName(e.target.value);
            }}
            onKeyUp={(e) => handleOnKeyUp(e)}
            autoFocus={true}
          />
          <Button
            disabled={!isValidName}
            text="Change Network URL"
            preset="primary"
            onClick={(e) => {
              handleOnClick(alianName);
            }}
          />
          <Button
            disabled={item.url == defaultUrl}
            text="Reset"
            preset="primary"
            onClick={(e) => {
              handleOnClick(defaultUrl as string);
            }}
          />
        </Column>
      </Content>
    </Layout>
  );
}
