/* eslint-disable @typescript-eslint/no-explicit-any */

import { Checkbox } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import BigNumber from 'bignumber.js';
import log from 'loglevel';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { KASPLEX } from '@/shared/constant';
import { TxType, type IKRC20TokenInfo } from '@/shared/types';
import { constructKRC20DeployJsonStrLowerCase } from '@/shared/utils';
import { Button, Column, Content, Header, Input, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { FeeRateBar } from '@/ui/components/FeeRateBar';
import { WarningPopover } from '@/ui/components/WarningPopover';
import { useNavigate } from '@/ui/pages/MainRoute';
import { selectAccountBalance, selectCurrentKaspaAddress } from '@/ui/state/accounts/reducer';
import { useRpcStatus } from '@/ui/state/global/hooks';
import { useAppDispatch, useAppSelector } from '@/ui/state/hooks';
import { selectNetworkId } from '@/ui/state/settings/reducer';
import { useAvgFeeRate, useFetchFeeRateOptionCallback } from '@/ui/state/ui/hooks';
import { uiActions } from '@/ui/state/ui/reducer';
import { fontSizes } from '@/ui/theme/font';
import { formatCompactNumber, useWallet } from '@/ui/utils';

export default function KRC20DeployScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  // const krc20MintDeploy = useKRC20MintDeployScreen();
  // const previousDeployInfo = useMemo(() => {
  //   if (krc20MintDeploy?.deploy) {
  //     return krc20MintDeploy.deploy;
  //   }
  //   return undefined;
  // }, [krc20MintDeploy?.deploy]);

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={`${t('Deploy')} a KRC20 Token`}
      />
      <Content>
        <DeployKRC20Tab deployInfo={undefined} />
        <Text
          preset="link"
          color="textDim"
          text={'Retrieve Incomplete KRC20 UTXOs'}
          onClick={() => navigate('RetrieveP2SHUTXOScreen')}
          textCenter
        />
      </Content>
    </Layout>
  );
}

function DeployKRC20Tab({
  deployInfo
}: {
  deployInfo: { ticker: string; supply: number; lim: number; pre?: number; dec?: number } | undefined;
}) {
  const { t } = useTranslation();
  const [ticker, setTicker] = useState(deployInfo?.ticker ? deployInfo?.ticker : '');
  const [supply, setSupply] = useState(deployInfo?.supply ? deployInfo?.supply : 100000000);
  const [lim, setLim] = useState(deployInfo?.lim ? deployInfo?.lim : 1000);
  const [pre, setPre] = useState(deployInfo?.pre != undefined ? deployInfo?.pre : undefined);
  const [dec, setDec] = useState(deployInfo?.dec ? deployInfo?.dec : undefined);
  const navigate = useNavigate();
  const [inscribeJsonString, setInscribeJsonString] = useState('');
  const [disabled, setDisabled] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const dispatch = useAppDispatch();
  const networkId = useAppSelector(selectNetworkId);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const accountBalance = useAppSelector((s) => selectAccountBalance(s, undefined));
  const [riskDesc, setRiskDesc] = useState('');
  const [feeBarChecked, setFeeBarChecked] = useState(true);
  const onChange = (e: CheckboxChangeEvent) => {
    const val = e.target.checked;
    setFeeBarChecked(val);
  };
  const avgFeeRate = useAvgFeeRate();
  const rpcStatus = useRpcStatus();
  const [txFee, setTxFee] = useState(0);
  const [priorityFee, setPriorityFee] = useState(0);
  const tools = useTools();
  const wallet = useWallet();
  const currrentAddress = useAppSelector(selectCurrentKaspaAddress);
  const fetchFeeRateOption = useFetchFeeRateOptionCallback();

  const checkMintDeployErrors = async () => {
    const tempErrs: string[] = [];
    const type = TxType.SIGN_KRC20_DEPLOY;
    let desc = '';
    if (ticker) {
      const tokenInfos = await wallet.getKRC20TokenInfo(ticker).catch((e) => {
        log.debug(e);
        tools.toastWarning(e.message);
      });
      if (tokenInfos && Array.isArray(tokenInfos) && tokenInfos.length > 0) {
        const tokenInfo = tokenInfos[0];
        const tick = (tokenInfo as IKRC20TokenInfo).tick;
        if (tokenInfo?.state) {
          switch (tokenInfo.state) {
            case 'unused':
              // if (type == TxType.SIGN_KRC20_MINT) {
              //   const err = `Token ${tick} is not deployed yet. Try to deploy it first.`;
              //   tempErrs.push(err);
              // }
              break;
            case 'deployed':
              if (type == TxType.SIGN_KRC20_DEPLOY) {
                const err = `Token ${tick} is already deployed. However, you can mint it now.`;
                tempErrs.push(err);
              }
              break;
            case 'reserved':
              if (type == TxType.SIGN_KRC20_DEPLOY && tokenInfo?.to && tokenInfo?.to?.length > 0) {
                const err = `${tick} is reserved for ${tokenInfo?.to} only. Make sure your address is it.`;
                setRiskDesc(err);
                desc = err;
              }
              break;
            case 'finished':
              if (type == TxType.SIGN_KRC20_DEPLOY) {
                const err = `Token ${tick} is already deployed. And 100% of the token has been minted.`;
                tempErrs.push(err);
              }
              // if (type == TxType.SIGN_KRC20_MINT) {
              //   const err = `100% of token ${tick} has been minted.`;
              //   tempErrs.push(err);
              // }
              break;
            case 'ignored':
              if (type == TxType.SIGN_KRC20_DEPLOY) {
                const err = `Token ${tick} is ignored and cannot be deployed.`;
                tempErrs.push(err);
              }
              // if (type == TxType.SIGN_KRC20_MINT) {
              //   const err = `Token ${tick} is ignored and cannot be minted.`;
              //   tempErrs.push(err);
              // }
              break;
            default:
            // setErrors(['Token state is not supported'])
          }
        }
      }
    }
    if (tempErrs && tempErrs.length > 0) {
      setErrors(tempErrs);
    } else if (desc.length > 0) {
      setIsWarningVisible(true);
    } else {
      dispatch(uiActions.updateKRC20MintDeployScreen({ deploy: { ticker, supply, lim, pre, dec } }));
      navigate('KRC20TxConfirmScreen', {
        inscribeJsonString,
        type: TxType.SIGN_KRC20_DEPLOY,
        tokenType: 'KRC20Mint',
        priorityFee,
        isRBF: false,
        protocol: KASPLEX
      });
    }
  };
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
        .catch((error) => {
          console.error(error);
          setTxFee(0.0001);
        });
      if (fee) {
        setTxFee(fee);
        if (avgFeeRate > 1) {
          const f = new BigNumber(fee)
            .multipliedBy(avgFeeRate - 1)
            .decimalPlaces(8)
            .toNumber();
          setPriorityFee(f);
        }
      } else {
        setTxFee(0.0001);
      }
    };
    fetchTxFee();
  }, [currrentAddress, avgFeeRate, rpcStatus]);

  useEffect(() => {
    fetchFeeRateOption();
  }, [networkId]);

  useEffect(() => {
    if (deployInfo) {
      setTicker(deployInfo?.ticker);
      setSupply(deployInfo?.supply);
      setLim(deployInfo?.lim);
      if (deployInfo?.pre) {
        setPre(deployInfo?.pre);
      } else {
        setPre(undefined);
      }
      if (deployInfo?.dec) {
        setDec(deployInfo?.dec);
      } else {
        setDec(undefined);
      }
      const jsonStr = constructKRC20DeployJsonStrLowerCase(
        deployInfo?.ticker,
        deployInfo?.supply,
        deployInfo?.lim,
        deployInfo?.pre ? deployInfo?.pre : undefined,
        deployInfo?.dec ? deployInfo?.dec : undefined
      );
      setInscribeJsonString(jsonStr);
    } else {
      // const tempTick = randomString();
      // setTicker(tempTick);
      // setSupply(100000000);
      // setLim(1000);
      // setPre(0);
      // const jsonStr = constructKRC20DeployJsonStrLowerCase(tempTick, 100000000, 1000, 0);
      // setInscribeJsonString(jsonStr);
    }
  }, []);
  useEffect(() => {
    setErrors([]);
    if (!ticker) return;
    if (Number(accountBalance.amount) < 1011) {
      const tempErr = 'Need at least 1011 KAS to deploy a KRC20 token';
      setErrors([tempErr]);
      setDisabled(true);
      return;
    }
    if (!ticker || ticker.length < 4 || ticker.length > 6) {
      setErrors(['Ticker should be 4 to 6 letter.']);
      setDisabled(true);
      return;
    }
    if (!supply || typeof supply != 'number' || supply < 0) {
      setErrors(['Supply should be a number and greater than 0']);
      setDisabled(true);
      return;
    }
    if (!lim || typeof lim != 'number' || lim < 0) {
      setErrors(['Amount per mint should be a number and greater than 0']);
      setDisabled(true);
      return;
    }
    if (lim > supply) {
      setErrors([t('Amount per mint should be less than Max Supply')]);
      setDisabled(true);
      return;
    }
    if (pre && pre > supply) {
      setErrors([t('Pre mint amount should be less than Max Supply')]);
      setDisabled(true);
      return;
    }
    const jsonStr = constructKRC20DeployJsonStrLowerCase(ticker, supply, lim, pre, dec);
    setInscribeJsonString(jsonStr);

    setDisabled(false);
  }, [ticker, lim, supply, pre, dec, accountBalance.amount]);
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
  return (
    <>
      <Text text={'Ticker:'} preset="regular" color="textDim" mb="sm" />
      <Row justifyBetween>
        <Column full>
          <Input
            value={ticker}
            onChange={(e) => {
              const replacedValue = e.target.value.replace(/[^a-zA-Z]/g, '');
              setTicker(replacedValue);
            }}
          ></Input>
        </Column>
      </Row>
      <Text
        mt="md"
        mb="sm"
        text={`Max Supply: ${formatCompactNumber(supply) == '0' ? '' : formatCompactNumber(supply)}`}
        preset="regular"
        color="textDim"
      />
      <Row justifyBetween>
        <Column full>
          <Input
            preset="amount"
            placeholder={'max supply'}
            defaultValue={supply?.toString()}
            onAmountInputChange={(val) => {
              setSupply(Number(val));
            }}
            onBlur={() => {
              if (supply?.toString()) {
                setSupply(supply);
              }
            }}
            // autoFocus={true}
          />
        </Column>
      </Row>
      <Text
        mt="md"
        mb="sm"
        text={`Amount per mint: ${formatCompactNumber(lim) == '0' ? '' : formatCompactNumber(lim)}`}
        preset="regular"
        color="textDim"
      />
      <Row full justifyBetween>
        <Column full>
          <Input
            preset="amount"
            placeholder={'lim'}
            defaultValue={lim.toString()}
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
      <Text
        mt="md"
        mb="sm"
        text={`Pre-allocation amount  (Optional): ${pre ? formatCompactNumber(pre) : ''}`}
        preset="regular"
        color="textDim"
      />
      <Row full justifyBetween>
        <Column full>
          <Input
            preset="amount"
            placeholder={'pre-allocation amount'}
            defaultValue={pre?.toString()}
            onAmountInputChange={(val) => {
              if (val && val.length > 0) {
                setPre(Number(val));
              } else {
                setPre(0);
              }
            }}
            onBlur={() => {
              if (pre?.toString()) {
                setPre(pre);
              }
            }}
          />
        </Column>
      </Row>
      <Text
        mt="md"
        mb="sm"
        text={`Decimal  (Optional): ${dec ? formatCompactNumber(dec) : ''}`}
        preset="regular"
        color="textDim"
        selectText
      />
      <Row full justifyBetween>
        <Column full>
          <Input
            preset="amount"
            disableDecimal
            placeholder={'decimal'}
            defaultValue={dec?.toString()}
            onAmountInputChange={(val) => {
              if (val && val.length > 0) {
                setDec(Number(val));
              } else {
                setDec(undefined);
              }
            }}
            onBlur={() => {
              if (dec?.toString()) {
                setDec(dec);
              } else {
                setDec(undefined);
              }
            }}
          />
        </Column>
      </Row>
      <Column mt="md">
        <Row>
          <Checkbox onChange={onChange} checked={feeBarChecked} style={{ fontSize: fontSizes.sm }}>
            <Text text={`${t('Transaction Fee')}`} preset="xsub" color="textDim" selectText />
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
              text={`${t('Transaction Fee:')} ${priorityFee + txFee} KAS`}
              textCenter
              selectText
            />
          </Column>
        )}
      </Column>
      <Column gap="sm">
        <Text
          mt="md"
          text={'1000 KAS will be paid to miners per deployment according to the protocol and 1 KAS as a service fee'}
          preset="xsub"
          color="textDim"
          selectText
        />
      </Column>
      {errors &&
        errors.map((error, index) => {
          if (errors.length == 1) {
            return <Text key={index} text={`${error}`} color="error" mt="md" mb="sm" selectText />;
          }
          return <Text key={index} text={`${index + 1}: ${error}`} color="error" mt="md" mb="sm" selectText />;
        })}
      {isWarningVisible && (
        <WarningPopover
          risks={[{ level: 'high', desc: riskDesc }]}
          onClose={() => {
            setIsWarningVisible(false);
            dispatch(uiActions.updateKRC20MintDeployScreen({ deploy: { ticker, supply, lim, pre, dec } }));
            navigate('KRC20TxConfirmScreen', {
              inscribeJsonString,
              type: TxType.SIGN_KRC20_DEPLOY,
              tokenType: 'KRC20Mint',
              priorityFee,
              isRBF: false,
              protocol: KASPLEX
            });
          }}
        />
      )}
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
