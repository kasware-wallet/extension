/* eslint-disable @typescript-eslint/no-explicit-any */

import type { InputNumberProps } from 'antd';
import { Checkbox, InputNumber, Slider, Tabs } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import BigNumber from 'bignumber.js';
import log from 'loglevel';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { KASPLEX } from '@/shared/constant';
import type { IKRC20TokenInfo } from '@/shared/types';
import { TxType } from '@/shared/types';
import { constructKRC20MintJsonStrLowerCase } from '@/shared/utils';
import { Button, Card, Column, Content, Footer, Header, Input, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { FeeRateBar } from '@/ui/components/FeeRateBar';
import { useNavigate } from '@/ui/pages/MainRoute';
import { useAccountBalance } from '@/ui/state/accounts/hooks';
import { selectCurrentKaspaAddress } from '@/ui/state/accounts/reducer';
import { useRpcStatus } from '@/ui/state/global/hooks';
import { useAppDispatch, useAppSelector } from '@/ui/state/hooks';
import { useKRC20MintDeployTabKey } from '@/ui/state/ui/hooks';
import { KRC20MintDeployTabKey, uiActions } from '@/ui/state/ui/reducer';
import { fontSizes } from '@/ui/theme/font';
import { useLocationState, useWallet } from '@/ui/utils';
import { RightOutlined } from '@ant-design/icons';

interface LocationState {
  tick?: string;
}

export default function KRC20MintDeployScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const dispatch = useAppDispatch();
  const krc20MintDeployTabKey = useKRC20MintDeployTabKey();
  const dataFromForward = useLocationState<LocationState>();

  const tabItems = [
    {
      key: KRC20MintDeployTabKey.MINT,
      label: t('Mint a KRC20 token'),
      children: <MintKRC20Tab tick={dataFromForward?.tick} />
    }
  ];

  return (
    <Layout>
      <Header
        onBack={() => {
          navigate('AppTabScreen');
        }}
        title={`KRC20 ${t('Mint')}/${t('Deploy')}`}
      />
      <Content>
        <Tabs
          size={'small'}
          defaultActiveKey="0"
          activeKey={krc20MintDeployTabKey as unknown as string}
          items={tabItems as unknown as any[]}
          onTabClick={(key) => {
            dispatch(
              uiActions.updateKRC20MintDeployTab({
                krc20MintDeployTabKey: key as unknown as KRC20MintDeployTabKey
              })
            );
          }}
        />
        <Text
          preset="link"
          color="textDim"
          text={'Retrieve Incomplete KRC20 UTXOs'}
          onClick={() => navigate('RetrieveP2SHUTXOScreen')}
          textCenter
        />
      </Content>
      <Footer>
        <Card
          classname="card-select"
          mt="lg"
          onClick={() => {
            navigate('KRC20DeployScreen');
          }}
        >
          <Row full justifyBetween>
            <Column justifyCenter>
              <Text text={'Deploy a KRC20 token'} preset="regular-bold" />
            </Column>
            <Column justifyCenter>
              <RightOutlined style={{ transform: 'scale(1.2)', color: '#AAA' }} />
            </Column>
          </Row>
        </Card>
      </Footer>
    </Layout>
  );
}

function MintKRC20Tab({ tick }: { tick: string | undefined }) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [ticker, setTicker] = useState(tick ? tick : '');
  const tools = useTools();

  const navigate = useNavigate();
  const [inscribeJsonString, setInscribeJsonString] = useState('');
  const [disabled, setDisabled] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const accountBalance = useAccountBalance();
  const wallet = useWallet();
  const rpcStatus = useRpcStatus();
  const [feeBarChecked, setFeeBarChecked] = useState(true);
  const currrentAddress = useAppSelector(selectCurrentKaspaAddress);
  const [txFee, setTxFee] = useState(0);
  const onChange = (e: CheckboxChangeEvent) => {
    const val = e.target.checked;
    setFeeBarChecked(val);
  };
  const [priorityFee, setPriorityFee] = useState(0);
  useEffect(() => {
    const fetchTxFee = async () => {
      // fee kaspa unit
      const fee = await wallet
        .getTxFee(
          currrentAddress,
          currrentAddress,
          currrentAddress,
          20,
          0,
          accountBalance.amount == '20' ? true : false
        )
        .catch((e) => {
          console.error(e);
          setTxFee(0.0001);
        });
      if (fee) {
        setTxFee(fee);
      } else {
        setTxFee(0.0001);
      }
    };
    fetchTxFee();
  }, [accountBalance.amount, currrentAddress, rpcStatus, wallet]);

  useEffect(() => {
    setErrors([]);
    if (!ticker) return;
    if (Number(accountBalance.amount) < 11) {
      const tempErr = 'Need at least 11 KAS to mint KRC20 token';
      setErrors([tempErr]);
      setDisabled(true);
      return;
    }
    if (!ticker || ticker.length < 4 || ticker.length > 6) {
      setErrors(['Ticker should be 4 to 6 letter.']);
      setDisabled(true);
      return;
    }
    const jsonStr = constructKRC20MintJsonStrLowerCase(ticker);
    setInscribeJsonString(jsonStr);
    setDisabled(false);
  }, [ticker, accountBalance.amount]);

  const inscribeObj = useMemo(() => {
    if (inscribeJsonString && inscribeJsonString.length > 0) {
      return JSON.parse(inscribeJsonString);
    } else {
      return null;
    }
  }, [inscribeJsonString]);

  const checkMintDeployErrors = async () => {
    const tempErrs: string[] = [];
    const type = TxType.SIGN_KRC20_MINT;
    if (inscribeObj?.tick) {
      const tokenInfos = await wallet.getKRC20TokenInfo(inscribeObj?.tick).catch((e) => {
        log.debug(e);
        tools.toastWarning(e.message);
      });
      if (tokenInfos && Array.isArray(tokenInfos) && tokenInfos.length > 0) {
        const tokenInfo = tokenInfos[0];
        const tick = (tokenInfo as IKRC20TokenInfo)?.tick;
        if (tokenInfo?.state) {
          switch (tokenInfo.state) {
            case 'unused':
              // if(type ==TxType.SIGN_KRC20_DEPLOY){}
              if (type == TxType.SIGN_KRC20_MINT) {
                const err = `Token ${tick} is not deployed yet.`;
                tempErrs.push(err);
              }
              break;
            case 'deployed':
              // if (type == TxType.SIGN_KRC20_DEPLOY) {
              //   const err = `Token ${tick} is already deployed. However, you can mint it now.`;
              //   tempErrs.push(err);
              // }
              // if(type == TxType.SIGN_KRC20_MINT){}
              break;
            case 'finished':
              // if (type == TxType.SIGN_KRC20_DEPLOY) {
              //   const err = `Token ${tick} is already deployed. And 100% of the token has been minted.`;
              //   tempErrs.push(err);
              // }
              if (type == TxType.SIGN_KRC20_MINT) {
                const err = `100% of token ${tick} has been minted.`;
                tempErrs.push(err);
              }
              break;
            case 'ignored':
              // if (type == TxType.SIGN_KRC20_DEPLOY) {
              //   const err = `Token ${tick} is ignored and cannot be deployed.`;
              //   tempErrs.push(err);
              // }
              if (type == TxType.SIGN_KRC20_MINT) {
                const err = `Token ${tick} is ignored and cannot be minted.`;
                tempErrs.push(err);
              }
              break;
            default:
            // setErrors(['Token state is not supported'])
          }
        }
      }
    }
    if (tempErrs && tempErrs.length > 0) {
      setErrors(tempErrs);
    } else {
      dispatch(uiActions.updateKRC20MintDeployScreen({ mint: { ticker } }));
      if (mintTimes == 1) {
        navigate('KRC20TxConfirmScreen', {
          inscribeJsonString,
          type: TxType.SIGN_KRC20_MINT,
          tokenType: 'KRC20Mint',
          priorityFee,
          isRBF: false,
          protocol: KASPLEX
        });
      }
      if (mintTimes > 1) {
        navigate('KRC20BatchTxConfirmScreen', {
          inscribeJsonString,
          type: TxType.SIGN_KRC20_MINT_BATCH,
          times: mintTimes,
          priorityFee
        });
      }
    }
  };
  const onNext = async () => {
    try {
      tools.showLoading(true);
      await checkMintDeployErrors().finally(() => {
        tools.showLoading(false);
      });
    } catch (e) {
      tools.toastError((e as any).message);
    }
  };

  const [mintTimes, setMintTimes] = useState(1);

  const onChangeSlider: InputNumberProps['onChange'] = (newValue) => {
    const num = newValue?.toString().replace(/[^0-9]/g, '');
    setMintTimes(Number(num));
  };
  return (
    <>
      <Text text={'Ticker:'} preset="regular" color="textDim" my="md" />
      <Row justifyBetween>
        <Column full>
          <Input
            autoFocus={true}
            // defaultValue={ticker}
            value={ticker}
            onChange={(e) => {
              const replacedValue = e.target.value.replace(/[^a-zA-Z]/g, '');
              setTicker(replacedValue);
            }}
          ></Input>
        </Column>
      </Row>
      <Text text={'Amount:'} preset="regular" color="textDim" mt="md" />
      <Row justifyBetween mt="zero" mb="md" selfItemsCenter>
        <Column full justifyCenter>
          <Slider min={1} max={1000} onChange={onChangeSlider} value={typeof mintTimes === 'number' ? mintTimes : 0} />
        </Column>
        <InputNumber bordered={true} width={50} min={1} max={1000000} value={mintTimes} onChange={onChangeSlider} />
      </Row>

      <Column mt="md">
        <Row>
          <Checkbox onChange={onChange} checked={feeBarChecked} style={{ fontSize: fontSizes.sm }}>
            <Text text={`${t('Upper limit transaction fee')}`} preset="xsub" color="textDim" />
          </Checkbox>
        </Row>
        {feeBarChecked && (
          <Column mt="md">
            <FeeRateBar
              txFee={txFee}
              onChange={(val) => {
                setPriorityFee(val - txFee > 0 ? Number(new BigNumber(val).minus(txFee).decimalPlaces(8)) : 0);
              }}
            />
            <Text
              mt="md"
              mb="md"
              color="white"
              text={`${t('Upper limit transaction fee:')} ${new BigNumber(priorityFee).plus(txFee).toNumber()} KAS`}
              textCenter
            />
          </Column>
        )}
      </Column>
      <Column gap="sm">
        <Text
          mt="md"
          mb="sm"
          text={'1 KAS will be paid to miners per mint according to the protocol and 0.1 KAS as a service fee'}
          preset="xsub"
          color="textDim"
        />
      </Column>
      {errors &&
        errors.map((error, index) => {
          if (errors.length == 1) {
            return <Text key={index} text={`${error}`} color="error" mb="sm" mt="md" />;
          }
          return <Text key={index} text={`${index + 1}: ${error}`} color="error" mb="sm" mt="md" />;
        })}
      <Row full mt="xl">
        <Button
          full
          disabled={disabled}
          preset="primary"
          text={t('Next')}
          onClick={() => {
            onNext();
          }}
        ></Button>
      </Row>
    </>
  );
}
