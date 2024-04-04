import { useEffect, useMemo, useRef, useState } from 'react';

import { ADDRESS_TYPES, KEYRING_TYPE } from '@/shared/constant';
import { Column, Content, Header, Layout } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { AddressTypeCard } from '@/ui/components/AddressTypeCard';
import { useCurrentAccount, useReloadAccounts } from '@/ui/state/accounts/hooks';
import { useCurrentKeyring } from '@/ui/state/keyrings/hooks';
import { sompiToAmount, useWallet } from '@/ui/utils';

import { useTranslation } from 'react-i18next';
import { useNavigate } from '../MainRoute';

export default function AddressTypeScreen() {
  const wallet = useWallet();
  const currentKeyring = useCurrentKeyring();
  const account = useCurrentAccount();
  const { t } = useTranslation();

  const navigate = useNavigate();
  const reloadAccounts = useReloadAccounts();
  const [addresses, setAddresses] = useState<string[]>([]);
  const [addressAssets, setAddressAssets] = useState<{
    [key: string]: { total_kas: string; sompi: number};
  }>({});

  const selfRef = useRef<{
    addressAssets: { [key: string]: { total_kas: string; sompi: number } };
  }>({
    addressAssets: {}
  });
  const self = selfRef.current;

  const tools = useTools();
  const loadAddresses = async () => {
    tools.showLoading(true);

    const _res = await wallet.getAllAddresses(currentKeyring, account.index || 0);
    setAddresses(_res);
    const balances = await wallet.getMultiAddressAssets(_res.join(','));
    for (let i = 0; i < _res.length; i++) {
      const address = _res[i];
      const balance = balances[i];
      const sompi = balance.totalSompi;
      self.addressAssets[address] = {
        total_kas: sompiToAmount(balance.totalSompi),
        sompi,
      };
    }
    setAddressAssets(self.addressAssets);

    tools.showLoading(false);
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const addressTypes = useMemo(() => {
    if (currentKeyring.type === KEYRING_TYPE.HdKeyring) {
      return ADDRESS_TYPES.filter((v) => {
        if (v.displayIndex < 0) {
          return false;
        }
        const address = addresses[v.value];
        const balance = addressAssets[address];
        if (v.isKaswareLegacy) {
          if (!balance || balance.sompi == 0) {
            return false;
          }
        }
        return true;
      }).sort((a, b) => a.displayIndex - b.displayIndex);
    } else {
      return ADDRESS_TYPES.filter((v) => v.displayIndex >= 0 && v.isKaswareLegacy != true).sort(
        (a, b) => a.displayIndex - b.displayIndex
      );
    }
  }, [currentKeyring.type, addressAssets, addresses]);
  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={t('Address Type')}
      />
      <Content>
        <Column>
          {addressTypes.map((item, index) => {
            const address = addresses[item.value];
            const assets = addressAssets[address] || {
              total_kas: '--',
              sompi: 0,
            };
            let name = `${item.name} (${item.hdPath}/${account.index})`;
            if (currentKeyring.type === KEYRING_TYPE.SimpleKeyring) {
              name = `${item.name}`;
            }
            return (
              <AddressTypeCard
                key={index}
                label={name}
                address={address}
                assets={assets}
                checked={item.value == currentKeyring.addressType}
                onClick={async () => {
                  if (item.value == currentKeyring.addressType) {
                    return;
                  }
                  await wallet.changeAddressType(item.value);
                  reloadAccounts();
                  navigate('MainScreen');
                  tools.toastSuccess(t('Address type changed'));
                }}
              />
            );
          })}
        </Column>
      </Content>
    </Layout>
  );
}
