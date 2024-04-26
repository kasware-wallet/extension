/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Checkbox, Radio } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import * as bip39 from 'bip39';
import bitcore from 'bitcore-lib';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { ADDRESS_TYPES, OW_HD_PATH, RESTORE_WALLETS } from '@/shared/constant';
import { AddressType, IScannedGroup, RestoreWalletType } from '@/shared/types';
import { Button, Card, Column, Content, Grid, Header, Input, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { AddressTypeCard2 } from '@/ui/components/AddressTypeCard';
import { FooterButtonContainer } from '@/ui/components/FooterButtonContainer';
import { Icon } from '@/ui/components/Icon';
import { TabBar } from '@/ui/components/TabBar';
import { useCreateAccountCallback } from '@/ui/state/global/hooks';
import { fontSizes } from '@/ui/theme/font';
import { copyToClipboard, generateHdPath, sompiToAmount, useWallet } from '@/ui/utils';
import { LoadingOutlined } from '@ant-design/icons';

import { useTranslation } from 'react-i18next';
import { useNavigate } from '../MainRoute';

function Step0({
  contextData,
  updateContextData
}: {
  contextData: ContextData;
  updateContextData: (params: UpdateContextDataParams) => void;
}) {
  return (
    <Column gap="lg">
      <Text text="Choose a wallet" preset="title-bold" textCenter mt="xl" />
      {RESTORE_WALLETS.map((item, index) => {
        if (item.value == RestoreWalletType.TANGEM) return null;
        return (
          <Button
            // disabled={item.value == RestoreWalletType.CORE_GOLANG_CLI}
            key={index}
            preset="default"
            onClick={() => {
              updateContextData({ tabType: TabType.STEP2, restoreWalletType: item.value });
            }}>
            <Text text={item.name} />
          </Button>
        );
      })}
    </Column>
  );
}

function Step1_Create({
  contextData,
  updateContextData
}: {
  contextData: ContextData;
  updateContextData: (params: UpdateContextDataParams) => void;
}) {
  const { t } = useTranslation();
  const [checked, setChecked] = useState(false);

  const wallet = useWallet();
  const tools = useTools();
  const [words, setWords] = useState([]);
  const [wordCount, setWordCount] = useState(12);

  const init = async () => {
    const _mnemonics = (await wallet.getPreMnemonics(wordCount)) || (await wallet.generatePreMnemonic(wordCount));
    updateContextData({
      mnemonics: _mnemonics
    });
    setWords(_mnemonics.split(' '));
  };

  useEffect(() => {
    init();
  }, [wordCount]);
  const wordsItems = [WORDS_12_ITEM, WORDS_24_ITEM];
  const onChange = (e: CheckboxChangeEvent) => {
    const val = e.target.checked;
    setChecked(val);
    updateContextData({ step1Completed: val });
  };

  function copy(str: string) {
    copyToClipboard(str).then(() => {
      tools.toastSuccess(t('Copied'));
    });
  }

  const btnClick = () => {
    updateContextData({
      tabType: TabType.STEP2
    });
  };

  // const words = contextData.mnemonics.split(' ');
  return (
    <Column gap="xl">
      <Text text="Seed Phrase" preset="title-bold" textCenter />
      <Text
        text="This phrase is the ONLY way to recover your wallet. Do NOT share it with anyone!"
        color="warning"
        textCenter
      />
      {wordsItems.length > 1 ? (
        <Row justifyCenter>
          <Radio.Group
            onChange={(e) => {
              const wordsType = e.target.value;
              updateContextData({ wordsType });
              setWordCount(wordsType === WordsType.WORDS_24 ? 24 : 12);
              // setKeys(new Array(wordsItems[wordsType].count).fill(''));
            }}
            value={contextData.wordsType}>
            {wordsItems.map((v) => (
              <Radio key={v.key} value={v.key}>
                {v.label}
              </Radio>
            ))}
          </Radio.Group>
        </Row>
      ) : null}

      <Row
        justifyCenter
        onClick={(e) => {
          copy(contextData.mnemonics);
        }}>
        <Icon icon="copy" color="textDim" />
        <Text text="Copy to clipboard" color="textDim" />
      </Row>

      <Row justifyCenter>
        <Grid columns={3}>
          {words.length > 0 &&
            words.map((v, index) => {
              return (
                <Row key={index}>
                  <Card preset="style2" style={{ width: 100, margin: '3px 1px', padding: '10px 15px 10px 7px' }}>
                    <Row full>
                      <Text text={`${index + 1}. `} color="textDim" />
                      <Text text={v} selectText disableTranslate />
                    </Row>
                  </Card>
                </Row>
              );
            })}
        </Grid>
      </Row>

      <Row justifyCenter>
        <Checkbox onChange={onChange} checked={checked} style={{ fontSize: fontSizes.sm }}>
          <Text text="I saved My Seed Phrase" />
        </Checkbox>
      </Row>

      <FooterButtonContainer>
        <Button disabled={!checked} text="Continue" preset="primary" onClick={btnClick} />
      </FooterButtonContainer>
    </Column>
  );
}

function Step1_Import({
  contextData,
  updateContextData
}: {
  contextData: ContextData;
  updateContextData: (params: UpdateContextDataParams) => void;
}) {
  const [curInputIndex, setCurInputIndex] = useState(0);
  const [hover, setHover] = useState(999);
  const [disabled, setDisabled] = useState(true);

  const wordsItems = useMemo(() => {
    if (contextData.restoreWalletType === RestoreWalletType.KDX) {
      return [WORDS_12_ITEM];
    } else if (contextData.restoreWalletType === RestoreWalletType.KASPANET_WEB) {
      return [WORDS_12_ITEM];
    } else if (contextData.restoreWalletType === RestoreWalletType.KASPIUM) {
      return [WORDS_24_ITEM];
    } else if (contextData.restoreWalletType === RestoreWalletType.CORE_GOLANG_CLI) {
      return [WORDS_24_ITEM];
    } else if (contextData.restoreWalletType === RestoreWalletType.OKX) {
      return [WORDS_12_ITEM];
    } else {
      return [WORDS_12_ITEM, WORDS_24_ITEM];
    }
  }, [contextData]);

  const [keys, setKeys] = useState<Array<string>>(new Array(wordsItems[contextData.wordsType].count).fill(''));

  const handleEventPaste = (event, index: number) => {
    const copyText = event.clipboardData?.getData('text/plain');
    const textArr = copyText.trim().split(' ');
    const newKeys = [...keys];
    if (textArr) {
      for (let i = 0; i < keys.length - index; i++) {
        if (textArr.length == i) {
          break;
        }
        newKeys[index + i] = textArr[i];
      }
      setKeys(newKeys);
    }

    event.preventDefault();
  };

  const onChange = (e: any, index: any) => {
    const newKeys = [...keys];
    newKeys.splice(index, 1, e.target.value);
    setKeys(newKeys);
  };

  useEffect(() => {
    setDisabled(true);

    const hasEmpty =
      keys.filter((key) => {
        return key == '';
      }).length > 0;
    if (hasEmpty) {
      return;
    }

    const mnemonic = keys.join(' ');
    if (!bip39.validateMnemonic(mnemonic)) {
      return;
    }

    setDisabled(false);
  }, [keys]);

  useEffect(() => {
    //todo
  }, [hover]);

  const createAccount = useCreateAccountCallback();
  const navigate = useNavigate();
  const tools = useTools();
  const onNext = async () => {
    try {
      const mnemonics = keys.join(' ');
      if (contextData.restoreWalletType === RestoreWalletType.OW) {
        await createAccount(mnemonics, OW_HD_PATH, '', AddressType.P2TR, 1);
        navigate('MainScreen');
      } else {
        updateContextData({ mnemonics, tabType: TabType.STEP3 });
      }
    } catch (e) {
      tools.toastError((e as any).message);
    }
  };
  const handleOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!disabled && 'Enter' == e.key) {
      onNext();
    }
  };
  const isValidWord = (word: string) => {
    if (word.length == 0) {
      return {};
    }
    const isValid = checkWords(word);
    if (isValid) {
      return {};
    }
    return { borderColor: 'rgba(255,0,0,0.8)', borderWidth: 1 };
  };

  return (
    <Column gap="lg">
      <Text text="Seed Phrase" preset="title-bold" textCenter />
      <Text text="Import an existing wallet with your seed phrase" preset="sub" textCenter />

      {wordsItems.length > 1 ? (
        <Row justifyCenter>
          <Radio.Group
            onChange={(e) => {
              const wordsType = e.target.value;
              updateContextData({ wordsType });
              setKeys(new Array(wordsItems[wordsType].count).fill(''));
            }}
            value={contextData.wordsType}>
            {wordsItems.map((v) => (
              <Radio key={v.key} value={v.key}>
                {v.label}
              </Radio>
            ))}
          </Radio.Group>
        </Row>
      ) : null}

      <Row justifyCenter>
        <Grid columns={2}>
          {keys.map((_, index) => {
            return (
              <Row key={index}>
                <Card gap="zero" style={isValidWord(_)}>
                  <Text text={`${index + 1}. `} style={{ width: 25 }} textEnd color="textDim" />
                  <Input
                    containerStyle={{ width: 80, minHeight: 25, height: 25, padding: 0 }}
                    style={{ width: 60 }}
                    value={_}
                    onPaste={(e) => {
                      handleEventPaste(e, index);
                    }}
                    onChange={(e) => {
                      onChange(e, index);
                    }}
                    // onMouseOverCapture={(e) => {
                    //   setHover(index);
                    // }}
                    // onMouseLeave={(e) => {
                    //   setHover(999);
                    // }}
                    onFocus={(e) => {
                      setCurInputIndex(index);
                    }}
                    onBlur={(e) => {
                      setCurInputIndex(999);
                    }}
                    onKeyUp={(e) => handleOnKeyUp(e)}
                    autoFocus={index == curInputIndex}
                    preset={'password'}
                    placeholder=""
                  />
                </Card>
              </Row>
            );
          })}
        </Grid>
      </Row>

      <FooterButtonContainer>
        <Button
          disabled={disabled}
          text="Continue"
          preset="primary"
          onClick={() => {
            onNext();
          }}
        />
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
    const restoreWallet = RESTORE_WALLETS[contextData.restoreWalletType];
    return ADDRESS_TYPES.filter((v) => {
      if (v.displayIndex < 0) {
        return false;
      }
      if (!restoreWallet.addressTypes.includes(v.value)) {
        return false;
      }

      if (!contextData.isRestore && v.isKaswareLegacy) {
        return false;
      }

      if (contextData.customHdPath && v.isKaswareLegacy) {
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

  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  const allHdPathOptions = useMemo(() => {
    return ADDRESS_TYPES.map((v) => v)
      .sort((a, b) => a.displayIndex - b.displayIndex)
      .map((v) => {
        return {
          label: v.name,
          hdPath: v.hdPath,
          addressType: v.value,
          isKaswareLegacy: v.isKaswareLegacy
        };
      });
  }, []);

  const [previewAddresses, setPreviewAddresses] = useState<string[]>(hdPathOptions.map((v) => ''));

  const [scannedGroups, setScannedGroups] = useState<IScannedGroup[]>([]);

  const [addressAssets, setAddressAssets] = useState<{
    [key: string]: { total_kas: string; sompi: number };
  }>({});

  const [error, setError] = useState('');
  const [pathError, setPathError] = useState('');
  const [loading, setLoading] = useState(false);
  const [discoverLoading, setDiscoverLoading] = useState(false);

  const createAccount = useCreateAccountCallback();
  const navigate = useNavigate();

  const [pathText, setPathText] = useState(contextData.customHdPath);

  useEffect(() => {
    if (scannedGroups.length > 0) {
      const itemIndex = scannedGroups.findIndex((v) => v.address_arr.length > 0);
      const item = scannedGroups[itemIndex];
      updateContextData({ addressType: item.type, addressTypeIndex: itemIndex });
    } else {
      const option = hdPathOptions[contextData.addressTypeIndex];
      updateContextData({ addressType: option.addressType });
    }
  }, [contextData.addressTypeIndex, scannedGroups]);

  const generateAddress = async () => {
    const addresses: string[] = [];
    for (let i = 0; i < hdPathOptions.length; i++) {
      const options = hdPathOptions[i];
      try {
        let startIndex = 0;
        // kaspanet wallet address starts from 1; others start from 0.
        if (contextData.restoreWalletType == RestoreWalletType.KASPANET_WEB) {
          startIndex = 1;
        }
        const keyring = await wallet.createTmpKeyringWithMnemonics(
          contextData.mnemonics,
          contextData.customHdPath || options.hdPath,
          contextData.passphrase,
          options.addressType,
          1,
          startIndex
        );
        // const address = keyring.accounts[0].address;
        // addresses.push(address);
        keyring.accounts.forEach((v) => {
          addresses.push(v.address);
        });
      } catch (e) {
        console.log(e);
        setError((e as any).message);
        return;
      }
    }
    setPreviewAddresses(addresses);
  };

  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    generateAddress();
    setScanned(false);
  }, [contextData.passphrase, contextData.customHdPath]);

  const fetchAddressesBalance = async () => {
    if (!contextData.isRestore) {
      return;
    }

    const addresses = previewAddresses;
    if (!addresses[0]) return;

    setLoading(true);
    const balances = await wallet.getMultiAddressAssets(addresses.join(','));
    setLoading(false);

    const addressAssets: { [key: string]: { total_kas: string; sompi: number } } = {};
    let maxSompi = 0;
    let recommended = 0;
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i];
      const balance = balances[i];
      const sompi = balance.totalSompi;
      addressAssets[address] = {
        total_kas: sompiToAmount(balance.totalSompi),
        sompi
      };
      if (sompi > maxSompi) {
        maxSompi = sompi;
        recommended = i;
      }
    }
    if (maxSompi > 0) {
      updateContextData({
        addressTypeIndex: recommended
      });
    }

    setAddressAssets(addressAssets);
  };

  useEffect(() => {
    fetchAddressesBalance();
  }, [previewAddresses]);

  const submitCustomHdPath = (text: string) => {
    setPathError('');
    setPathText(text);
    if (text !== '') {
      const isValid = bitcore.HDPrivateKey.isValidPath(text);
      if (!isValid) {
        setPathError('Invalid derivation path.');
        return;
      }
      updateContextData({
        customHdPath: text
      });
    } else {
      updateContextData({
        customHdPath: ''
      });
    }
  };

  const disabled = useMemo(() => {
    if (!error && !pathError) {
      return false;
    } else {
      return true;
    }
  }, [error, pathError]);

  const onNext = async () => {
    try {
      if (scannedGroups.length > 0) {
        // const option = allHdPathOptions[contextData.addressTypeIndex];
        const option = hdPathOptions[contextData.addressTypeIndex];
        const hdPath = contextData.customHdPath || option.hdPath;
        const selected = scannedGroups[contextData.addressTypeIndex];
        const startIndex = 0;
        // kaspanet wallet address starts from 1; others start from 0.
        // if (contextData.restoreWalletType == RestoreWalletType.KASPANET_WEB) {
        //   startIndex = 1;
        // }
        await createAccount(
          contextData.mnemonics,
          hdPath,
          contextData.passphrase,
          contextData.addressType,
          selected.address_arr.length,
          startIndex,
          selected
        );
      } else {
        const option = hdPathOptions[contextData.addressTypeIndex];
        const hdPath = contextData.customHdPath || option.hdPath;
        let startIndex = 0;
        // kaspanet wallet address starts from 1; others start from 0.
        if (contextData.restoreWalletType == RestoreWalletType.KASPANET_WEB) {
          startIndex = 1;
        }
        await createAccount(
          contextData.mnemonics,
          hdPath,
          contextData.passphrase,
          contextData.addressType,
          1,
          startIndex
        );
      }
      navigate('MainScreen');
    } catch (e) {
      tools.toastError((e as any).message);
    }
  };

  const scanVaultAddress = async () => {
    setScanned(true);
    // tools.showLoading(true);
    setDiscoverLoading(true);
    try {
      let groups: IScannedGroup[] = [];
      // for (let i = 0; i < allHdPathOptions.length; i++) {
      for (let i = 0; i < hdPathOptions.length; i++) {
        // const options = allHdPathOptions[i];
        const options = hdPathOptions[i];
        try {
          const sgroup = await wallet.createTmpKeyringWithMnemonicsWithAddressDiscovery(
            contextData.mnemonics,
            contextData.customHdPath || options.hdPath,
            contextData.passphrase,
            options.addressType,
            20
          );
          if (sgroup !== null) {
            groups.push(sgroup);
          }
        } catch (e) {
          console.log(e);
          setError((e as any).message);
          return;
        }
      }
      try {
        // groups = await wallet.findGroupAssets(groups);
      } catch (e) {
        tools.showTip((e as any).message);
        groups = [];
      }
      if (groups.length == 0) {
        // tools.showTip('Unable to find any addresses with assets');
        tools.toastWarning('Unable to find any addresses with balance');
      } else if (groups.length > 0) {
        // first time to scan vault address
        if (scannedGroups.length == 0) {
          tools.toastSuccess(`Found ${groups[0].address_arr.length} addresses with balance`);
          // scan valult address again.
        } else {
          const scannedGroup = scannedGroups[0];
          const scannedAddresses = scannedGroup.address_arr;
          const group = groups[0];
          const groupAddresses = group.address_arr;
          let newAddrNum = 0;
          for (let i = 0; i < groupAddresses.length; i++) {
            if (!scannedAddresses.find((v) => v == groupAddresses[i])) {
              newAddrNum++;
            }
          }
          if (newAddrNum > 0) {
            tools.toastSuccess(`Found ${newAddrNum} more addresses with balance`);
          }else{
            tools.toastWarning('No new addresses with balance found');
          }
        }
      }
      setScannedGroups(groups);
    } catch (e) {
      setError((e as any).message);
    } finally {
      // tools.showLoading(false);
      setDiscoverLoading(false);
    }
  };

  useEffect(() => {
    if (contextData.isRestore) {
      scanVaultAddress();
    }
  }, []);

  return (
    <Column>
      {contextData.isRestore && scanned == false ? (
        <Row justifyBetween>
          <Text text="Address Type" preset="bold" />
          {/* <Text
            text="Discover more addresses"
            preset="link"
            onClick={() => {
              scanVaultAddress();
            }}
          /> */}
        </Row>
      ) : (
        <Text text="Address Type" preset="bold" />
      )}

      {scannedGroups.length > 0 &&
        scannedGroups.map((item, index) => {
          // const options = allHdPathOptions[index];
          const options = hdPathOptions[index];
          if (!item.sompi_arr.find((v) => v > 0)) {
            // skip group with no vault
            return null;
          }
          return (
            <AddressTypeCard2
              key={index}
              label={`${options.label}`}
              items={item.address_arr.map((v, index) => ({
                address: v,
                sompi: item.sompi_arr[index],
                path: generateHdPath(
                  contextData.customHdPath || options.hdPath,
                  item.dtype_arr[index].toString(),
                  item.index_arr[index].toString().substring(2)
                )
              }))}
              checked={index == contextData.addressTypeIndex}
              onClick={() => {
                updateContextData({
                  addressTypeIndex: index,
                  addressType: options.addressType
                });
              }}
            />
          );
        })}
      {scannedGroups.length == 0 &&
        hdPathOptions.map((item, index) => {
          const address = previewAddresses[index];
          const assets = addressAssets[address] || {
            total_kas: '--',
            sompi: 0
          };
          const hasVault = contextData.isRestore && assets.sompi > 0;
          if (item.isKaswareLegacy && !hasVault) {
            return null;
          }
          // eslint-disable-next-line quotes
          const i = item.hdPath == "m/44'/972/0'" ? '1' : '0';
          // const hdPath = (contextData.customHdPath || item.hdPath) + '/0\'';
          const hdPath = generateHdPath(contextData.customHdPath || item.hdPath, '0', i);
          return (
            <AddressTypeCard2
              key={index}
              label={`${item.label}`}
              items={[
                {
                  address,
                  sompi: assets.sompi,
                  path: hdPath
                }
              ]}
              checked={index == contextData.addressTypeIndex}
              onClick={() => {
                updateContextData({
                  addressTypeIndex: index,
                  addressType: item.addressType
                });
              }}
            />
          );
        })}

      {/* <Text text="Custom HdPath (Optional)" preset="bold" mt="lg" />

      <Column>
        <Input
          placeholder={'Custom HD Wallet Derivation Path'}
          value={pathText}
          onChange={(e) => {
            submitCustomHdPath(e.target.value);
          }}
        />
      </Column>
      {pathError && <Text text={pathError} color="error" />}
      {error && <Text text={error} color="error" />} */}
      {!discoverLoading && contextData.isRestore && (
        <Row justifyCenter>
          <Text
            text="Discover more addresses"
            preset="link"
            size="sm"
            onClick={() => {
              scanVaultAddress();
            }}
          />
        </Row>
      )}
      {discoverLoading && (
        <Row justifyCenter>
          <Text text="Finding accounts with balance" size="sm" />
          <Icon>
            <LoadingOutlined />
          </Icon>
        </Row>
      )}
      <Text text="Passphrase (Optional)" preset="bold" mt="lg" />

      <Input
        placeholder={'Passphrase'}
        defaultValue={contextData.passphrase}
        onChange={async (e) => {
          updateContextData({
            passphrase: e.target.value
          });
        }}
      />

      <FooterButtonContainer>
        <Button text="Continue" preset="primary" onClick={onNext} disabled={disabled} />
      </FooterButtonContainer>

      {/* {loading && (
        <Icon>
          <LoadingOutlined />
        </Icon>
      )} */}
    </Column>
  );
}

enum TabType {
  STEP1 = 'STEP1',
  STEP2 = 'STEP2',
  STEP3 = 'STEP3'
}

enum WordsType {
  WORDS_12,
  WORDS_24
}

const WORDS_12_ITEM = {
  key: WordsType.WORDS_12,
  label: '12 words',
  count: 12
};

const WORDS_24_ITEM = {
  key: WordsType.WORDS_24,
  label: '24 words',
  count: 24
};

interface ContextData {
  mnemonics: string;
  hdPath: string;
  passphrase: string;
  addressType: AddressType;
  step1Completed: boolean;
  tabType: TabType;
  restoreWalletType: RestoreWalletType;
  isRestore: boolean;
  isCustom: boolean;
  customHdPath: string;
  addressTypeIndex: number;
  wordsType: WordsType;
}

interface UpdateContextDataParams {
  mnemonics?: string;
  hdPath?: string;
  passphrase?: string;
  addressType?: AddressType;
  step1Completed?: boolean;
  tabType?: TabType;
  restoreWalletType?: RestoreWalletType;
  isCustom?: boolean;
  customHdPath?: string;
  addressTypeIndex?: number;
  wordsType?: WordsType;
}

export default function CreateHDWalletScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { state } = useLocation();
  const { isImport, fromUnlock } = state as {
    isImport: boolean;
    fromUnlock: boolean;
  };

  const [contextData, setContextData] = useState<ContextData>({
    mnemonics: '',
    hdPath: '',
    passphrase: '',
    addressType: AddressType.KASPA_44_111111,
    step1Completed: false,
    tabType: TabType.STEP1,
    restoreWalletType: RestoreWalletType.KASWARE,
    isRestore: isImport,
    isCustom: false,
    customHdPath: '',
    addressTypeIndex: 0,
    wordsType: WordsType.WORDS_12
  });

  const updateContextData = useCallback(
    (params: UpdateContextDataParams) => {
      setContextData(Object.assign({}, contextData, params));
    },
    [contextData, setContextData]
  );

  const items = useMemo(() => {
    if (contextData.isRestore) {
      if (contextData.restoreWalletType === RestoreWalletType.OW) {
        return [
          {
            key: TabType.STEP1,
            label: 'Step 1',
            children: <Step0 contextData={contextData} updateContextData={updateContextData} />
          },
          {
            key: TabType.STEP2,
            label: 'Step 2',
            children: <Step1_Import contextData={contextData} updateContextData={updateContextData} />
          }
        ];
      } else {
        return [
          {
            key: TabType.STEP1,
            label: 'Step 1',
            children: <Step0 contextData={contextData} updateContextData={updateContextData} />
          },
          {
            key: TabType.STEP2,
            label: 'Step 2',
            children: <Step1_Import contextData={contextData} updateContextData={updateContextData} />
          },
          {
            key: TabType.STEP3,
            label: 'Step 3',
            children: <Step2 contextData={contextData} updateContextData={updateContextData} />
          }
        ];
      }
    } else {
      return [
        {
          key: TabType.STEP1,
          label: 'Step 1',
          children: <Step1_Create contextData={contextData} updateContextData={updateContextData} />
        },
        {
          key: TabType.STEP2,
          label: 'Step 2',
          children: <Step2 contextData={contextData} updateContextData={updateContextData} />
        }
      ];
    }
  }, [contextData, updateContextData]);

  const currentChildren = useMemo(() => {
    const item = items.find((v) => v.key === contextData.tabType);
    return item?.children;
  }, [items, contextData.tabType]);

  const activeTabIndex = useMemo(() => {
    const index = items.findIndex((v) => v.key === contextData.tabType);
    if (index === -1) {
      return 0;
    } else {
      return index;
    }
  }, [items, contextData.tabType]);
  return (
    <Layout>
      <Header
        onBack={() => {
          if (fromUnlock) {
            navigate('WelcomeScreen');
          } else {
            window.history.go(-1);
          }
        }}
        title={contextData.isRestore ? t('From seed phrase') : t('Create a new HD Wallet')}
      />
      <Content>
        <Row justifyCenter>
          <TabBar
            progressEnabled
            defaultActiveKey={contextData.tabType}
            activeKey={contextData.tabType}
            items={items.map((v) => ({
              key: v.key,
              label: v.label
            }))}
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

        {currentChildren}
      </Content>
    </Layout>
  );
}

function checkWords(seed = '', language = 'english') {
  const words = seed.split(' ');
  const wordlist = bip39.wordlists[language];
  let word: string | undefined;
  while ((word = words.pop()) != null) {
    // eslint-disable-next-line no-loop-func
    const idx = wordlist.findIndex((w) => w === word);
    if (idx === -1) {
      return false;
    }
  }
  return true;
}
