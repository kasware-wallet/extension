/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ADDRESS_TYPES } from '@/shared/constant';
import { AddressType } from '@/shared/types';
import { Button, Column, Content, Header, Input, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { AddressTypeCard } from '@/ui/components/AddressTypeCard';
import { FooterButtonContainer } from '@/ui/components/FooterButtonContainer';
import { TabBar } from '@/ui/components/TabBar';
import { sompiToAmount, useWallet } from '@/ui/utils';

import { t } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '../MainRoute';

function Step1({
  contextData,
  updateContextData
}: {
  contextData: ContextData;
  updateContextData: (params: UpdateContextDataParams) => void;
}) {
  const { t } = useTranslation();
  const [wif, setWif] = useState('');
  const [disabled, setDisabled] = useState(true);
  const wallet = useWallet();
  useEffect(() => {
    setDisabled(true);

    if (!wif) {
      return;
    }

    setDisabled(false);
  }, [wif]);

  const onChange = (e) => {
    const val = e.target.value;
    setWif(val);
    updateContextData({ step1Completed: val });
  };

  const tools = useTools();

  const btnClick = async () => {
    try {
      const _res = await wallet.createTmpKeyringWithPrivateKey(wif, AddressType.KASPA_44_111111);
      if (_res.accounts.length == 0) {
        throw new Error(t('Invalid PrivateKey'));
      }
    } catch (e) {
      if (e == null || e == undefined || Object.keys(e).length == 0) {
        tools.toastError(t('Invalid PrivateKey'));
      } else {
        tools.toastError((e as Error).message);
      }
      return;
    }
    updateContextData({
      wif,
      tabType: TabType.STEP2
    });
  };

  return (
    <Column gap="lg">
      <Text text={t('Private Key')} textCenter preset="bold" />

      <Input
        placeholder={t('HEX Private Key')}
        onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if ('Enter' == e.key) {
            btnClick();
          }
        }}
        onChange={onChange}
        autoFocus={true}
      />
      <FooterButtonContainer>
        <Button disabled={disabled} text={t('Continue')} preset="primary" onClick={btnClick} />
      </FooterButtonContainer>
    </Column>
  );
}

function Step2({
  contextData,
  updateContextData
}: {
  contextData: ContextData;
  updateContextData: (params: UpdateContextDataParams) => void;
}) {
  const wallet = useWallet();
  const tools = useTools();

  const hdPathOptions = useMemo(() => {
    return ADDRESS_TYPES.filter((v) => {
      if (v.displayIndex < 0) {
        return false;
      }
      if (v.isKaswareLegacy) {
        return false;
      }
      return true;
    })
      .sort((a, b) => a.displayIndex - b.displayIndex)
      .map((v) => {
        return {
          label: v.name,
          hdPath: v.hdPath,
          addressType: v.value,
          isKaswareLegacy: v.isKaswareLegacy
        };
      });
  }, [contextData]);

  const [previewAddresses, setPreviewAddresses] = useState<string[]>(hdPathOptions.map((v) => ''));

  const [addressAssets, setAddressAssets] = useState<{
    [key: string]: { total_kas: string; sompi: number };
  }>({});

  const selfRef = useRef({
    maxSompi: 0,
    recommended: 0,
    count: 0,
    addressBalances: {}
  });
  const self = selfRef.current;
  const run = async () => {
    const addresses: string[] = [];
    // for (let i = 0; i < hdPathOptions.length; i++) {
    for (let i = 0; i < 1; i++) {
      const options = hdPathOptions[i];
      const keyring = await wallet.createTmpKeyringWithPrivateKey(contextData.wif, options.addressType);
      const address = keyring.accounts[0].address;
      addresses.push(address);
    }

    const balances = await wallet.getMultiAddressAssets(addresses.join(','));
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i];
      const balance = balances[i];
      const sompi = balance.totalSompi;
      self.addressBalances[address] = {
        total_kas: sompiToAmount(balance.totalSompi),
        sompi,
      };
      if (sompi > self.maxSompi) {
        self.maxSompi = sompi;
        self.recommended = i;
      }

      updateContextData({ addressType: hdPathOptions[self.recommended].addressType });
      setAddressAssets(self.addressBalances);
    }
    setPreviewAddresses(addresses);
  };
  useEffect(() => {
    run();
  }, [contextData.wif]);

  const pathIndex = useMemo(() => {
    return hdPathOptions.findIndex((v) => v.addressType === contextData.addressType);
  }, [hdPathOptions, contextData.addressType]);

  const navigate = useNavigate();

  const onNext = async () => {
    try {
      await wallet.createKeyringWithPrivateKey(contextData.wif, contextData.addressType);
      navigate('MainScreen');
    } catch (e) {
      tools.toastError((e as any).message);
    }
  };
  return (
    <Column gap="lg">
      <Text text={t('Address Type') as string} preset="bold" />
      {hdPathOptions.map((item, index) => {
        const address = previewAddresses[index];
        const assets = addressAssets[address] || {
          total_kas: '--',
          sompi: 0,
        };
        const hasVault = assets.sompi > 0;
        if (item.isKaswareLegacy && !hasVault) {
          return null;
        }
        // only show the first address type
        return index == 0 ? (
          <AddressTypeCard
            key={index}
            label={`${item.label}`}
            address={address}
            assets={assets}
            checked={index == pathIndex}
            onClick={() => {
              updateContextData({ addressType: item.addressType });
            }}
          />
        ) : null;
      })}

      <FooterButtonContainer>
        <Button text={t('Coninue')} preset="primary" onClick={onNext} />
      </FooterButtonContainer>
    </Column>
  );
}
enum TabType {
  STEP1 = 'STEP1',
  STEP2 = 'STEP2',
  STEP3 = 'STEP3'
}

interface ContextData {
  wif: string;
  addressType: AddressType;
  step1Completed: boolean;
  tabType: TabType;
}

interface UpdateContextDataParams {
  wif?: string;
  addressType?: AddressType;
  step1Completed?: boolean;
  tabType?: TabType;
}

export default function CreateSimpleWalletScreen() {
  const [contextData, setContextData] = useState<ContextData>({
    wif: '',
    addressType: AddressType.KASPA_44_111111,
    step1Completed: false,
    tabType: TabType.STEP1
  });

  const updateContextData = useCallback(
    (params: UpdateContextDataParams) => {
      setContextData(Object.assign({}, contextData, params));
    },
    [contextData, setContextData]
  );

  const items = [
    {
      key: TabType.STEP1,
      label: 'Step 1',
      children: <Step1 contextData={contextData} updateContextData={updateContextData} />
    },
    {
      key: TabType.STEP2,
      label: 'Step 2',
      children: <Step2 contextData={contextData} updateContextData={updateContextData} />
    }
  ];

  const renderChildren = items.find((v) => v.key == contextData.tabType)?.children;

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={t('Create Single Wallet')}
      />
      <Content>
        <Row justifyCenter>
          <TabBar
            progressEnabled
            defaultActiveKey={TabType.STEP1}
            items={items}
            activeKey={contextData.tabType}
            onTabClick={(key) => {
              const toTabType = key as TabType;
              if (toTabType === TabType.STEP2) {
                if (!contextData.step1Completed) {
                  setTimeout(() => {
                    updateContextData({ tabType: contextData.tabType });
                  }, 200);
                  return;
                }
              }
              updateContextData({ tabType: toTabType });
            }}
          />
        </Row>

        {renderChildren}
      </Content>
    </Layout>
  );
}
