/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TabsProps } from 'antd';
import { Checkbox, Drawer, Tabs } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import log from 'loglevel';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate as useNavigateOrigin } from 'react-router-dom';

import type { IKRC20List, IKRC20TokenInfo, IKRC20TokenInfoIssue, IP2shOutput } from '@/shared/types';
import {
  capitalizeFirstLetter,
  constructKRC20DeployJsonStr,
  constructKRC20DeployJsonStr2,
  constructKRC20DeployJsonStrLowerCase,
  constructKRC20DeployJsonStrLowerCase2,
  constructKRC20ListJsonStrLowerCase,
  constructKRC20MintJsonStr,
  constructKRC20MintJsonStrLowerCase,
  constructKRC20SendJsonStrLowerCase,
  constructKRC20TransferJsonStr,
  constructKRC20TransferJsonStrLowerCase,
  parseKRC20JsonString
} from '@/shared/utils';
import { Button, Card, Column, Content, Header, Icon, Input, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { RetrieveSuccessPopover } from '@/ui/components/RetrieveSuccessPopover';
import { useExtensionIsInTab, useOpenExtensionInTab } from '@/ui/features/browser/tabs';
import { selectAccountBalance, selectCurrentKaspaAddress } from '@/ui/state/accounts/reducer';
import { useAppSelector } from '@/ui/state/hooks';
import { selectBlockstreamUrl, selectKasTick, selectNetworkId } from '@/ui/state/settings/reducer';
import { useKRC20History } from '@/ui/state/ui/hooks';
import { fontSizes } from '@/ui/theme/font';
import { formatLocaleString, shortAddress, useLocationState, useWallet } from '@/ui/utils';
import useKRC20TokenInfo from '@/ui/utils/hooks/useKRC20TokenInfo';
import { ExpandAltOutlined, HistoryOutlined } from '@ant-design/icons';
import { sompiToAmount } from '@/shared/utils/format';

interface LocationState {
  outputs: IP2shOutput[] | undefined;
}

export default function RetrieveP2SHUTXOScreen() {
  const data = useLocationState<LocationState | null>();
  const { t } = useTranslation();
  const [inscribeJsonStrings, setInscribeJsonStrings] = useState<string[]>([]);
  const [retrieveAmt, setRetrieveAmt] = useState('');
  const wallet = useWallet();
  const [p2shOutputs, setP2shOutputs] = useState<IP2shOutput[]>([]);
  const tools = useTools();
  const [removeVisible, setRemoveVisible] = useState(false);
  const [visibleUtxoDetail, setVisibleUtxoDetail] = useState<IP2shOutput | undefined>(undefined);
  const [txIds, setTxIds] = useState<string[]>([]);
  const [retrieveSuccessAmt, setRetrieveSuccessAmt] = useState('');
  const navigateOrigin = useNavigateOrigin();
  const krc20History = useKRC20History();
  const currentAddress = useAppSelector(selectCurrentKaspaAddress);
  const networkId = useAppSelector(selectNetworkId);

  const onSearch = async () => {
    try {
      let arr: any[] = [];
      if (inscribeJsonStrings && inscribeJsonStrings.length > 0) {
        arr = arr.concat(inscribeJsonStrings);
      } else {
        arr = [
          krc20History[networkId]?.mintArr,
          krc20History[networkId]?.deployArr,
          krc20History[networkId]?.transferArr
        ].flatMap((arr2) => arr2 || []);
      }
      const str3 = await wallet.getKRC20HistoryLocalStorage(networkId, currentAddress);
      arr = arr.concat(str3);
      tools.showLoading(true);
      const utxos: IP2shOutput[] = await wallet.findP2shUtxos(arr);
      if (utxos.length == 0) {
        tools.toastWarning('No UTXOs found.');
      }
      setP2shOutputs(utxos);
      const value = utxos.reduce((agg, curr) => {
        return BigInt(curr.balance) + agg;
      }, BigInt(0));
      setRetrieveAmt(sompiToAmount(value, 8));
    } catch (e) {
      tools.toastError((e as any).message);
    } finally {
      tools.showLoading(false);
    }
  };
  useEffect(() => {
    const outputs = data?.outputs || [];
    if (outputs.length > 0) {
      setP2shOutputs(outputs);
      const value = outputs.reduce((agg, curr) => {
        return BigInt(curr.balance) + agg;
      }, BigInt(0));
      setRetrieveAmt(sompiToAmount(value, 8));
    } else {
      onSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.outputs?.length]);

  const retrieveP2shUtxo = async (output: IP2shOutput) => {
    tools.showLoading(true);
    try {
      const results = await wallet.retrieveP2shUtxo([output]);
      if (results == null || results == undefined || results.length == 0) {
        tools.toastError('failed, please try again');
      } else {
        setTxIds(results);
        setRetrieveSuccessAmt(sompiToAmount(output.balance, 8));
        const newOutputs = p2shOutputs.filter(
          (item) => !(output.transaction_id == item.transaction_id && output.utxo_index == item.utxo_index)
        );
        setP2shOutputs(newOutputs);
        const newValue = newOutputs.reduce((agg, curr) => {
          return BigInt(curr.balance) + agg;
        }, BigInt(0));
        setRetrieveAmt(sompiToAmount(newValue, 8));
        setRemoveVisible(true);
        tools.toastSuccess('success');
      }
    } catch (e: any) {
      tools.toastError(e?.message ? e.message : JSON.stringify(e));
    } finally {
      tools.showLoading(false);
    }
  };

  const tabItems: TabsProps['items'] = [
    {
      key: 'mint',
      label: t('Mint'),
      children: <MintKRC20Tab setInscribeJsonStrings={setInscribeJsonStrings} />
    },
    {
      key: 'deploy',
      label: t('Deploy'),
      children: <DeployKRC20Tab setInscribeJsonStrings={setInscribeJsonStrings} />
    },
    {
      key: 'transfer',
      label: t('Transfer'),
      children: <TransferKRC20Tab setInscribeJsonStrings={setInscribeJsonStrings} />
    },
    {
      key: 'list',
      label: t('List'),
      children: <ListKRC20Tab setInscribeJsonStrings={setInscribeJsonStrings} />
    },
    {
      key: 'send',
      label: t('Send'),
      children: <SendKRC20Tab setInscribeJsonStrings={setInscribeJsonStrings} />
    }
  ];

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={'Retrieve Incomplete KRC20 UTXOs'}
        RightComponent={
          <Column
            selfItemsCenter
            classname="column-select"
            onClick={() => {
              navigateOrigin('/krc20/history');
            }}
          >
            <Icon>
              <HistoryOutlined />
            </Icon>
          </Column>
        }
      />
      <Content>
        <Tabs centered size={'small'} defaultActiveKey="mint" items={tabItems as unknown as any[]} />
        <Row fullX mt="xl">
          <Button
            full
            preset="primary"
            text={t('Search UTXOs')}
            onClick={() => {
              onSearch();
            }}
          ></Button>
        </Row>
        <P2SHOutputComp
          amount={retrieveAmt}
          p2shOutputs={p2shOutputs}
          // retrieveP2shUtxo={retrieveP2shUtxo}
          setVisibleUtxoDetail={setVisibleUtxoDetail}
        />
        {removeVisible && (
          <RetrieveSuccessPopover
            txids={txIds}
            amount={retrieveSuccessAmt}
            onClose={() => {
              setRemoveVisible(false);
            }}
          />
        )}
      </Content>
      <Drawer
        height={428}
        placement={'bottom'}
        closable={false}
        onClose={() => setVisibleUtxoDetail(undefined)}
        open={visibleUtxoDetail != undefined}
        key={'utxo-detail'}
      >
        <Column mt="md">
          {visibleUtxoDetail != undefined && (
            <P2SHUTXODetail
              p2shOutput={visibleUtxoDetail}
              setVisibleUtxoDetail={setVisibleUtxoDetail}
              retrieveP2shUtxo={retrieveP2shUtxo}
            />
          )}
        </Column>
      </Drawer>
    </Layout>
  );
}

function DeployKRC20Tab({ setInscribeJsonStrings }: { setInscribeJsonStrings: (s: string[]) => void }) {
  const [ticker, setTicker] = useState('');
  const [supply, setSupply] = useState(100000000);
  const [lim, setLim] = useState(1000);
  const [pre, setPre] = useState<number | undefined>(undefined);
  const [dec, setDec] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (!ticker) return;
    const jsonStr = constructKRC20DeployJsonStr(ticker, supply, lim, pre, dec);
    const jsonStr2 = constructKRC20DeployJsonStrLowerCase(ticker, supply, lim, pre, dec);
    const jsonStr3 = constructKRC20DeployJsonStr2(ticker, supply, lim, '');
    const jsonStr4 = constructKRC20DeployJsonStrLowerCase2(ticker, supply, lim, '');
    setInscribeJsonStrings([jsonStr, jsonStr2, jsonStr3, jsonStr4]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, lim, supply, pre, dec]);

  return (
    <>
      <Row justifyBetween itemsCenter mb="sm" style={{ backgroundColor: '#2a2626', borderRadius: 5 }}>
        <Text text={'Ticker'} preset="regular" color="textDim" my="sm" mx="md" selectText />
        <Column full>
          <Input
            style={{ textAlign: 'right' }}
            placeholder="XXXX"
            onChange={(e) => {
              setTicker(e.target.value);
            }}
          ></Input>
        </Column>
      </Row>

      <Row justifyBetween itemsCenter mt="md" mb="sm" style={{ backgroundColor: '#2a2626', borderRadius: 5 }}>
        <Column fullX>
          <Text text={'Max Supply'} preset="regular" color="textDim" my="sm" mx="md" fullX selectText />
        </Column>
        <Column full>
          <Input
            style={{ textAlign: 'right' }}
            preset="amount"
            placeholder={'1000000'}
            onAmountInputChange={(val) => {
              setSupply(Number(val));
            }}
            onBlur={() => {
              if (supply?.toString()) {
                setSupply(supply);
              }
            }}
          />
        </Column>
      </Row>

      <Row justifyBetween itemsCenter mt="md" mb="sm" style={{ backgroundColor: '#2a2626', borderRadius: 5 }}>
        <Column fullX>
          <Text text={'Amount per mint'} preset="regular" color="textDim" my="sm" mx="md" fullX selectText />
        </Column>
        <Column full>
          <Input
            style={{ textAlign: 'right' }}
            preset="amount"
            placeholder={'10000'}
            onAmountInputChange={(val) => {
              setLim(Number(val));
            }}
            onBlur={() => {
              if (lim.toString()) {
                setLim(lim);
              }
            }}
          />
        </Column>
      </Row>

      <Row itemsCenter mt="md" mb="sm" style={{ backgroundColor: '#2a2626', borderRadius: 5 }} fullX>
        <Column>
          <Text
            text={'Pre-allocation amount  (Optional)'}
            preset="regular"
            color="textDim"
            my="sm"
            mx="md"
            style={{ width: 60 }}
            selectText
          />
        </Column>
        <Column full justifyCenter>
          <Input
            style={{ textAlign: 'right' }}
            preset="amount"
            placeholder={'1000'}
            onAmountInputChange={(val) => {
              if (val && val.length > 0) {
                setPre(Number(val));
              } else {
                setPre(undefined);
              }
            }}
            onBlur={() => {
              if (pre?.toString()) {
                setPre(pre);
              } else {
                setPre(undefined);
              }
            }}
          />
        </Column>
      </Row>
      <Row itemsCenter mt="md" mb="sm" style={{ backgroundColor: '#2a2626', borderRadius: 5 }} fullX>
        <Column>
          <Text
            text={'Decimal  (Optional)'}
            preset="regular"
            color="textDim"
            my="sm"
            mx="md"
            style={{ width: 60 }}
            selectText
          />
        </Column>
        <Column full justifyCenter>
          <Input
            style={{ textAlign: 'right' }}
            disableDecimal
            preset="amount"
            placeholder={''}
            onAmountInputChange={(val) => {
              if (val && val.length > 0) {
                setDec(Number(val));
              } else {
                setDec(undefined);
              }
            }}
            onBlur={() => {
              if (dec?.toString()) {
                setDec(pre);
              } else {
                setDec(undefined);
              }
            }}
          />
        </Column>
      </Row>
    </>
  );
}

function MintKRC20Tab({ setInscribeJsonStrings }: { setInscribeJsonStrings: (jsonStr: string[]) => void }) {
  const [ticker, setTicker] = useState('');

  useEffect(() => {
    if (!ticker) return;
    const jsonStr = constructKRC20MintJsonStr(ticker);
    const jsonStr2 = constructKRC20MintJsonStrLowerCase(ticker);
    setInscribeJsonStrings([jsonStr, jsonStr2]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  return (
    <>
      <Row justifyBetween itemsCenter style={{ backgroundColor: '#2a2626', borderRadius: 5 }}>
        <Text text={'Ticker'} preset="regular" color="textDim" my="sm" mx="md" selectText />
        <Column full>
          <Input
            style={{ textAlign: 'right' }}
            placeholder="XXXX"
            onChange={(e) => {
              setTicker(e.target.value);
            }}
          ></Input>
        </Column>
      </Row>
    </>
  );
}

function SendKRC20Tab({ setInscribeJsonStrings }: { setInscribeJsonStrings: (jsonStr: string[]) => void }) {
  const [ticker, setTicker] = useState('');
  useEffect(() => {
    if (!ticker) return;
    const jsonStr = constructKRC20SendJsonStrLowerCase(ticker);
    setInscribeJsonStrings([jsonStr]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  return (
    <>
      <Row justifyBetween itemsCenter style={{ backgroundColor: '#2a2626', borderRadius: 5 }}>
        <Text text={'Ticker'} preset="regular" color="textDim" my="sm" mx="md" />
        <Column full>
          <Input
            style={{ textAlign: 'right' }}
            placeholder="XXXX"
            onChange={(e) => {
              setTicker(e.target.value);
            }}
          ></Input>
        </Column>
      </Row>
    </>
  );
}

function TransferKRC20Tab({ setInscribeJsonStrings }: { setInscribeJsonStrings: (jsonStr: string[]) => void }) {
  const [ticker, setTicker] = useState('');
  const [inputAmount, setInputAmount] = useState('');
  const [inputAddress, setInputAddress] = useState('');
  const { krc20Info } = useKRC20TokenInfo(ticker);
  useEffect(() => {
    if (!ticker || !inputAmount) return;
    const jsonStr = constructKRC20TransferJsonStr(ticker, Number(inputAmount), inputAddress, krc20Info?.dec ?? '8');
    const jsonStr2 = constructKRC20TransferJsonStrLowerCase(
      ticker,
      Number(inputAmount),
      inputAddress,
      krc20Info?.dec ?? '8'
    );
    setInscribeJsonStrings([jsonStr, jsonStr2]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, inputAmount, inputAddress, krc20Info?.dec]);

  return (
    <>
      <Row justifyBetween itemsCenter mb="sm" style={{ backgroundColor: '#2a2626', borderRadius: 5 }}>
        <Text text={'Ticker'} preset="regular" color="textDim" my="sm" mx="md" selectText />
        <Column full>
          <Input
            style={{ textAlign: 'right' }}
            placeholder="XXXX"
            onChange={(e) => {
              setTicker(e.target.value);
            }}
          ></Input>
        </Column>
      </Row>
      <Row justifyBetween itemsCenter mt="md" mb="sm" style={{ backgroundColor: '#2a2626', borderRadius: 5 }}>
        <Text text={'Amount'} preset="regular" color="textDim" my="sm" mx="md" selectText />
        <Column full>
          <Input
            style={{ textAlign: 'right' }}
            placeholder="1000"
            onChange={(e) => {
              setInputAmount(e.target.value);
            }}
          ></Input>
        </Column>
      </Row>
      <Row justifyBetween itemsCenter mt="md" mb="sm" style={{ backgroundColor: '#2a2626', borderRadius: 5 }}>
        <Text text={'Recipient'} preset="regular" color="textDim" my="sm" mx="md" selectText />
        <Column full>
          <Input
            style={{ textAlign: 'right' }}
            placeholder="Address"
            onChange={(e) => {
              setInputAddress(e.target.value);
            }}
          ></Input>
        </Column>
      </Row>
    </>
  );
}

function ListKRC20Tab({ setInscribeJsonStrings }: { setInscribeJsonStrings: (jsonStr: string[]) => void }) {
  const [ticker, setTicker] = useState('');
  const [inputAmount, setInputAmount] = useState('');
  const { krc20Info } = useKRC20TokenInfo(ticker);
  useEffect(() => {
    if (!ticker || !inputAmount) return;
    const jsonStr2 = constructKRC20ListJsonStrLowerCase(ticker, Number(inputAmount), krc20Info?.dec ?? '8');
    setInscribeJsonStrings([jsonStr2]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, inputAmount, krc20Info?.dec]);

  return (
    <>
      <Row justifyBetween itemsCenter mb="sm" style={{ backgroundColor: '#2a2626', borderRadius: 5 }}>
        <Text text={'Ticker'} preset="regular" color="textDim" my="sm" mx="md" selectText />
        <Column full>
          <Input
            style={{ textAlign: 'right' }}
            placeholder="XXXX"
            onChange={(e) => {
              setTicker(e.target.value);
            }}
          ></Input>
        </Column>
      </Row>
      <Row justifyBetween itemsCenter mt="md" mb="sm" style={{ backgroundColor: '#2a2626', borderRadius: 5 }}>
        <Text text={'Amount'} preset="regular" color="textDim" my="sm" mx="md" selectText />
        <Column full>
          <Input
            style={{ textAlign: 'right' }}
            placeholder="1000"
            onChange={(e) => {
              setInputAmount(e.target.value);
            }}
          ></Input>
        </Column>
      </Row>
    </>
  );
}

function P2SHOutputComp({
  amount,
  p2shOutputs,
  // retrieveP2shUtxo,
  setVisibleUtxoDetail
}: {
  amount: string;
  p2shOutputs: IP2shOutput[];

  // retrieveP2shUtxo: (arg0: IP2shOutput) => Promise<void>;

  setVisibleUtxoDetail: (arg0: IP2shOutput | undefined) => void;
}) {
  const kasTick = useAppSelector(selectKasTick);

  if (p2shOutputs && p2shOutputs.length > 0) {
    return (
      <>
        <div>
          {p2shOutputs.length > 0 && (
            <>
              <Row justifyBetween itemsCenter>
                <Text text={`${formatLocaleString(amount)} ${kasTick}`} preset="sub" selectText />
              </Row>
            </>
          )}
          {p2shOutputs.map((e, index) => {
            if (index > 20) return null;
            return (
              <P2SHCard
                key={e.transaction_id + e.utxo_index}
                p2shUtxo={e}
                setVisibleUtxoDetail={setVisibleUtxoDetail}
              />
            );
          })}
        </div>
      </>
    );
  }
}

function P2SHCard({
  p2shUtxo,
  setVisibleUtxoDetail
}: {
  p2shUtxo: IP2shOutput | undefined;

  setVisibleUtxoDetail: (arg0: IP2shOutput | undefined) => void;
}) {
  const kasTick = useAppSelector(selectKasTick);
  const [content, setContent] = useState('');

  useEffect(() => {
    const updateContent = () => {
      if (!p2shUtxo?.inscribeJsonString) return;
      try {
        const obj = JSON.parse(p2shUtxo?.inscribeJsonString);
        const str = obj?.op + ' ' + (obj?.tick?.toUpperCase() || '');
        if (str && str?.length > 0) setContent(str);
      } catch (e) {
        console.error('Error parsing inscribeJsonString:', e);
      }
    };
    updateContent();
  }, [p2shUtxo?.inscribeJsonString]);

  return (
    <Card
      classname="card-select"
      mt="sm"
      py="sm"
      full
      justifyBetween
      itemsCenter
      style={{ minHeight: 40 }}
      onClick={() => {
        setVisibleUtxoDetail(p2shUtxo);
      }}
    >
      <Text text={`${formatLocaleString(sompiToAmount(p2shUtxo?.balance, 8))} ${kasTick}`} selectText />
      <Text text={content} preset="sub" selectText />
    </Card>
  );
}

function P2SHUTXODetail({
  p2shOutput,
  setVisibleUtxoDetail,
  retrieveP2shUtxo
}: {
  p2shOutput: IP2shOutput;

  setVisibleUtxoDetail: (arg0: IP2shOutput | undefined) => void;

  retrieveP2shUtxo: (output: IP2shOutput) => Promise<void>;
}) {
  const navigateOrigin = useNavigateOrigin();
  const openExtensionInTab = useOpenExtensionInTab();
  const [action, setAction] = useState<string>('');
  const [actionTick, setActionTick] = useState<string>('');
  const networkId = useAppSelector(selectNetworkId);
  const currentAddress = useAppSelector(selectCurrentKaspaAddress);
  const [error, setError] = useState('');
  const [disabled, setDisabled] = useState(false);
  const accountBalance = useAppSelector((s) => selectAccountBalance(s, undefined));
  const kasTick = useAppSelector(selectKasTick);
  const isInTab = useExtensionIsInTab();
  const wallet = useWallet();

  const { t } = useTranslation();
  const blockstreamUrl = useAppSelector(selectBlockstreamUrl);
  const [tokenInfo, setTokenInfo] = useState<IKRC20TokenInfo | IKRC20TokenInfoIssue>();
  const [enableMint, setEnableMint] = useState(true);

  const inscribeJsonString = useMemo(() => {
    return p2shOutput?.inscribeJsonString;
  }, [p2shOutput?.inscribeJsonString]);
  const times = useMemo(() => {
    const amount = sompiToAmount(p2shOutput?.balance, 8);
    return Math.floor((Number(amount) - 3) / 1.1 - 2);
  }, [p2shOutput?.balance]);
  const prettyInscribeJsonString = useMemo(() => {
    if (inscribeJsonString) {
      const json = JSON.parse(inscribeJsonString);
      return JSON.stringify(json, null, 2);
    }
    return '';
  }, [inscribeJsonString]);
  useEffect(() => {
    const fetchKRC20Info = async (tick: string) => {
      if (tick) {
        try {
          const tokenInfos = await wallet.getKRC20TokenInfo(tick);
          if (tokenInfos && Array.isArray(tokenInfos) && tokenInfos.length > 0) {
            setTokenInfo(tokenInfos[0]);
          }
        } catch (e) {
          log.debug(e);
        }
      }
    };
    if (inscribeJsonString && inscribeJsonString.length > 0) {
      const res = parseKRC20JsonString(inscribeJsonString);
      if (res?.op && res?.op?.length > 0) setAction(res?.op?.toLowerCase());
      if (res?.tick && res?.tick.length > 0) setActionTick(res?.tick?.toUpperCase());
      if (res?.op == 'mint') {
        fetchKRC20Info(res?.tick?.toLowerCase());
      }
    }
  }, [inscribeJsonString, wallet]);
  useEffect(() => {
    setDisabled(true);
    if (Number(accountBalance.amount) < 0.2) {
      setError(`Balance is below 0.2 ${kasTick}. Retrieve is disabled.`);
      return;
    }
    setDisabled(false);
  }, [accountBalance.amount, kasTick]);

  useEffect(() => {
    if (
      action == 'mint' &&
      times > 3 &&
      tokenInfo?.state != 'finished' &&
      tokenInfo?.state != 'unused' &&
      tokenInfo?.state != 'ignored'
    ) {
      setEnableMint(true);
    } else {
      setEnableMint(false);
    }
  }, [action, times, tokenInfo?.state]);

  return (
    <Column>
      <Row justifyBetween fullX itemsCenter py="sm">
        <Text text={'balance: '} color="textDim" selectText />
        <Text
          text={`${formatLocaleString(sompiToAmount(p2shOutput?.balance, 8))} KAS`}
          preset="sub"
          style={{ wordWrap: 'break-word' }}
          selectText
        />
      </Row>
      <Row justifyBetween fullX itemsCenter py="sm">
        <Text text={'p2sh address: '} color="textDim" selectText />
        <Row
          gap="xs"
          itemsCenter
          onClick={() => {
            window.open(`${blockstreamUrl}/addresses/${p2shOutput?.commitAddress}`);
          }}
        >
          <div className="text-select">
            <Text text={shortAddress(p2shOutput?.commitAddress)} preset="link" selectText />
          </div>
          <Icon icon="link" size={fontSizes.xxs} color="blue" />
        </Row>
      </Row>
      <Row justifyBetween fullX itemsCenter py="sm">
        <Text text={'transaction id: '} color="textDim" selectText />
        <Row
          gap="xs"
          itemsCenter
          onClick={() => {
            window.open(`${blockstreamUrl}/txs/${p2shOutput?.transaction_id}`);
          }}
        >
          <div className="text-select">
            <Text text={shortAddress(p2shOutput?.transaction_id)} preset="link" selectText />
          </div>
          <Icon icon="link" size={fontSizes.xxs} color="blue" />
        </Row>
      </Row>
      <Row justifyCenter fullX mb="sm">
        <Card fullX>
          <div
            style={{
              userSelect: 'text',
              maxHeight: 384,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              flexWrap: 'wrap',
              fontSize: '1rem'
            }}
          >
            {prettyInscribeJsonString}
          </div>
        </Card>
      </Row>
      {error && <Text text={error} color="error" selectText />}
      {action !== 'send' && (
        <Row full>
          {enableMint == true && (
            <Button
              full
              disabled={false}
              preset="primary"
              text={`${capitalizeFirstLetter(action)}  ${actionTick}`}
              RightAccessory={isInTab ? undefined : <ExpandAltOutlined style={{ color: '#000' }} />}
              onClick={() => {
                if (isInTab) {
                  navigateOrigin(
                    `/krc20/batchmintprocess?inscribeJsonString=${inscribeJsonString}&times=${times}&priorityFee=0&sourceAddr=${currentAddress}&networkId=${networkId}`
                  );
                } else {
                  openExtensionInTab(
                    `#/krc20/batchmintprocess?inscribeJsonString=${inscribeJsonString}&times=${times}&priorityFee=0&sourceAddr=${currentAddress}&networkId=${networkId}`
                  );
                }
              }}
            ></Button>
          )}

          <Button
            full
            disabled={disabled}
            preset="primary"
            text={t('Retrieve')}
            onClick={() => {
              retrieveP2shUtxo(p2shOutput);
              setVisibleUtxoDetail(undefined);
            }}
          ></Button>
        </Row>
      )}
      {action == 'send' && <SendOpButton {...{ retrieveP2shUtxo, setVisibleUtxoDetail, p2shOutput, actionTick }} />}
    </Column>
  );
}

function SendOpButton({ retrieveP2shUtxo, setVisibleUtxoDetail, p2shOutput, actionTick }) {
  const { krc20Info } = useKRC20TokenInfo(actionTick?.toLowerCase());
  const [checked, setChecked] = useState(false);
  const [warningContent, setWarningContent] = useState(
    'Retrieving the utxo would cancel your listing order of ' + actionTick?.toUpperCase()
  );
  const [sompiAmt, setSompiAmt] = useState('');
  const [error, setError] = useState('');
  const [showWarningConent, setShowWarningConent] = useState(true);
  const onChange = (e: CheckboxChangeEvent) => {
    const val = e.target.checked;
    setChecked(val);
  };
  const wallet = useWallet();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchKRC20HistoryFromID = async (id: string) => {
      if (!id || id?.length <= 0) return;
      try {
        const history = (await wallet.getKRC20HistoryFromID(id)) as unknown as IKRC20List;
        if (history) {
          setSompiAmt(history?.amt);
          if (history?.opAccept == '-1') {
            setShowWarningConent(false);
            setChecked(true);
          }
        }
      } catch (e: any) {
        setShowWarningConent(false);
        setChecked(true);
        setError(e?.message ? e?.message : JSON.stringify(e));
      }
    };
    fetchKRC20HistoryFromID(p2shOutput?.transaction_id);
  }, [p2shOutput?.transaction_id, wallet]);
  useEffect(() => {
    const amt = sompiToAmount(sompiAmt, krc20Info?.dec || '8');
    const content =
      'Retrieving the utxo would cancel your listing order of ' +
      formatLocaleString(amt) +
      ' ' +
      actionTick?.toUpperCase();
    setWarningContent(content);
  }, [actionTick, sompiAmt, krc20Info?.dec]);

  return (
    <>
      {showWarningConent == true && (
        <Row>
          <Checkbox onChange={onChange} checked={checked} style={{ fontSize: fontSizes.sm }}>
            <Text text={warningContent} color="warning" preset="sub" selectText />
          </Checkbox>
        </Row>
      )}
      {error && <Text text={error} color="error" selectText />}
      <Button
        full
        disabled={!checked}
        preset="primary"
        text={t('Cancel Order')}
        onClick={() => {
          retrieveP2shUtxo(p2shOutput);
          setVisibleUtxoDetail(undefined);
        }}
      ></Button>
    </>
  );
}
