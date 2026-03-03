/* eslint-disable @typescript-eslint/no-explicit-any */
import { Checkbox, Drawer, Tabs } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import BigNumber from 'bignumber.js';
import log from 'loglevel';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CONST_KSRP, KNS } from '@/shared/constant';
import type { IKNSAsset } from '@/shared/types';
import { TxType } from '@/shared/types';
import { constructKNSTransferJsonStr, constructKsprNftTransferJsonStr } from '@/shared/utils';
import { Button, Column, Content, Footer, Header, Input, Layout, Row, Text } from '@/ui/components';
import { FeeRateBar } from '@/ui/components/FeeRateBar';
import KnsPreview from '@/ui/components/KnsPreview';
import KsprNftPreview from '@/ui/components/KsprNftPreview';
import { useNavigate } from '@/ui/pages/MainRoute';
import { selectAccountBalance } from '@/ui/state/accounts/reducer';
import { useRpcStatus } from '@/ui/state/global/hooks';
import { useAppDispatch, useAppSelector } from '@/ui/state/hooks';
import { selectKasTick } from '@/ui/state/settings/reducer';
import { useAvgFeeRate, useUiTxCreateScreen, useUpdateUiTxCreateScreen } from '@/ui/state/ui/hooks';
import { fontSizes } from '@/ui/theme/font';
import { formatLocaleString, useLocationState, useWallet } from '@/ui/utils';
import { MINI_AMOUNT_FOR_COMMIT } from '@/ui/utils2/constants/constants';
import { ContactsTab, MyAccountTab, RecentTab } from '../../Wallet/TxCreateScreen';
import { uiActions } from '@/ui/state/ui/reducer';
import { useAsync } from 'react-use';

interface IKsprAsset {
  tokenId: string;
  tick: string;
}
interface LocationState {
  knsAsset?: IKNSAsset;
  ksprAsset?: IKsprAsset;
  type: TxType;
}

export default function SendKNSnKSPRScreen() {
  const { t } = useTranslation();
  const accountBalance = useAppSelector((s) => selectAccountBalance(s, undefined));

  const navigate = useNavigate();

  const [disabled, setDisabled] = useState(true);
  const setUiState = useUpdateUiTxCreateScreen();
  const uiState = useUiTxCreateScreen();
  const avgFeeRate = useAvgFeeRate();
  const rpcStatus = useRpcStatus();
  const { knsAsset, ksprAsset, type } = useLocationState<LocationState>();
  const kasTick = useAppSelector(selectKasTick);
  const [error, setError] = useState('');
  const [title, setTitle] = useState(`${t('Send')} `);
  const dispatch = useAppDispatch();

  const priorityFee = uiState.priorityFee;
  const toInfo = uiState.toInfo;

  const [txFee, setTxFee] = useState(0);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [feeDrawerVisible, setFeeDrawerVisible] = useState(false);
  const wallet = useWallet();
  const [inscribeJsonString, setInscribeJsonString] = useState('');
  useEffect(() => {
    if (type === TxType.SIGN_KNS_TRANSFER) {
      setTitle(`${t('Send')} KNS`);
    } else if (type === TxType.SIGN_KSPRNFT_TRANSFER) {
      setTitle(`${t('Send')}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);
  useEffect(() => {
    dispatch(
      uiActions.updateTxCreateScreen({
        feeRate: avgFeeRate,
        priorityFee: avgFeeRate > 1 ? Number(new BigNumber(txFee).multipliedBy(avgFeeRate - 1).decimalPlaces(8)) : 0
      })
    );
  }, [avgFeeRate, txFee, rpcStatus, dispatch]);

  // for inscription transfer
  useAsync(async () => {
    setError('');
    setDisabled(true);

    if (!(await wallet.isValidKaspaAddr(toInfo.address))) {
      return;
    }

    if (Number(accountBalance.amount) < Number(MINI_AMOUNT_FOR_COMMIT)) {
      setError(`You need to have at least ${MINI_AMOUNT_FOR_COMMIT} KAS in balance`);
      return;
    }
    if (!type) return;
    if (type && type == TxType.SIGN_KNS_TRANSFER) {
      const jsonStr = constructKNSTransferJsonStr(
        (knsAsset as IKNSAsset).assetId,
        toInfo.address,
        (knsAsset as IKNSAsset)?.isDomain
      );
      setInscribeJsonString(jsonStr);
    } else if (type && type == TxType.SIGN_KSPRNFT_TRANSFER) {
      const jsonStr = constructKsprNftTransferJsonStr(
        (ksprAsset as IKsprAsset).tick,
        (ksprAsset as IKsprAsset).tokenId,
        toInfo.address
      );
      setInscribeJsonString(jsonStr);
    } else {
      console.error('unknown type', type);
    }

    setTxFee(0.0002);
    setDisabled(false);
    return;
  }, [toInfo, priorityFee]);

  const handleAddrInput = (address: string) => {
    setUiState({ toInfo: { address, domain: '' } });
    setDrawerVisible(false);
    const input = document.getElementById('address-input');
    if (input) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      nativeInputValueSetter?.call(input, address);
      const inputEvent = new Event('input', { bubbles: true });
      input.dispatchEvent(inputEvent);
    } else {
      log.debug('address input undefine');
    }
  };
  const [RBFChecked, setRBFChecked] = useState(false);
  const onRBFChange = (e: CheckboxChangeEvent) => {
    const val = e.target.checked;
    setRBFChecked(val);
  };
  const tabItems = [
    {
      key: 'recent',
      label: t('Recent'),
      children: <RecentTab handleAddrInput={handleAddrInput} />
    },
    {
      key: 'contacts',
      label: t('Contacts'),
      children: <ContactsTab handleAddrInput={handleAddrInput} evm={false} />
      // disabled: true,
    },
    {
      key: 'my_account',
      label: t('My account'),
      children: <MyAccountTab handleAddrInput={handleAddrInput} evm={false} />
    }
  ];
  const handleConfirm = () => {
    if (type == TxType.SIGN_KNS_TRANSFER) {
      navigate('KRC20TxConfirmScreen', {
        inscribeJsonString,
        type: TxType.SIGN_KNS_TRANSFER,
        tokenType: 'KNS',
        destAddr: toInfo.address,
        priorityFee: priorityFee,
        isRBF: RBFChecked,
        protocol: KNS
      });
    } else if (type == TxType.SIGN_KSPRNFT_TRANSFER) {
      navigate('KRC20TxConfirmScreen', {
        inscribeJsonString,
        type: TxType.SIGN_KSPRNFT_TRANSFER,
        tokenType: 'KSPR',
        destAddr: toInfo.address,
        priorityFee: priorityFee,
        isRBF: RBFChecked,
        protocol: CONST_KSRP
      });
    } else {
      log.debug('type is not recongnized');
    }
  };
  const handleAddressInputChange = useCallback(
    (val) => {
      dispatch(uiActions.updateTxCreateScreen({ toInfo: val }));
    },
    [dispatch]
  );

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={title}
      />
      <Content style={{ padding: '0px 16px 24px' }}>
        <Row style={{ flexWrap: 'wrap' }} gap="lg" justifyCenter mb="lg">
          {knsAsset !== undefined && (
            <KnsPreview
              data={knsAsset}
              preset="medium"
              // onClick={() => {
              // navigate('KNSDetailScreen', { knsAsset: data });
              // }}
            />
          )}
          {ksprAsset !== undefined && (
            <KsprNftPreview
              preset="medium"
              tick={ksprAsset.tick}
              id={ksprAsset.tokenId}
              // onClick={() => {
              // navigate('KsprDetailScreen', { tokenId: data.tokenId, tick: data.tick });
              // }}
            />
          )}
        </Row>

        <Text text={t('Recipient')} preset="regular" color="textDim" />
        <Row justifyBetween style={{ gap: 2 }}>
          <Column full>
            <Input
              id="address-input"
              preset="address"
              defaultValue={toInfo.address}
              addressInputData={toInfo}
              onAddressInputChange={handleAddressInputChange}
              showContactClick={() => {
                setDrawerVisible(true);
              }}
              autoFocus={true}
            />
          </Column>
          {/* <Button
            style={{
              height: '56px'
            }}
            onClick={() => {
              setDrawerVisible(true);
            }}>
            <Icon icon={'user'} />
          </Button> */}
        </Row>

        <Row>
          <Checkbox onChange={onRBFChange} checked={RBFChecked} style={{ fontSize: fontSizes.sm }}>
            <Text text={`${t('Replace by fee(RBF)')}`} preset="xsub" color="textDim" />
          </Checkbox>
        </Row>
        {error && <Text text={error} color="error" selectText />}
      </Content>
      <Drawer
        placement={'bottom'}
        closable={false}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        key={'bottom'}
      >
        <Tabs
          size={'small'}
          defaultActiveKey="0"
          // activeKey={assetTabKey as unknown as string}
          items={tabItems as unknown as any[]}
          onTabClick={() => {
            // log.debug(key);
          }}
        />
      </Drawer>
      <Drawer
        placement={'bottom'}
        closable={false}
        onClose={() => setFeeDrawerVisible(false)}
        open={feeDrawerVisible}
        key={'fee-drawer'}
      >
        <Column mt="lg">
          <Text text={`${t('Customize TX Fee')} ( ${t('Optional')} )`} color="textDim" preset="sub" />
          <FeeRateBar
            txFee={txFee}
            onChange={(val) => {
              let _feeRate = 0;
              if (txFee > 0) {
                _feeRate = Number(new BigNumber(val).dividedBy(txFee));
              }
              setUiState({
                feeRate: _feeRate > 1 ? _feeRate : 1,
                priorityFee: val - txFee > 0 ? Number(new BigNumber(val).minus(txFee).decimalPlaces(8)) : 0
              });
            }}
          />
          <Text
            mt="xxl"
            color="white"
            text={`${t('Transaction fee:')} ${formatLocaleString(
              new BigNumber(priorityFee).plus(txFee).decimalPlaces(8)
            )} ${kasTick}`}
            textCenter
          />
          <Row mt="xxl" full></Row>
          <Button
            disabled={disabled}
            preset="primary"
            text={t('Close')}
            onClick={() => setFeeDrawerVisible(false)}
          ></Button>
        </Column>
      </Drawer>
      <Footer>
        <Column
          justifyCenter
          mb="md"
          onClick={() => {
            setFeeDrawerVisible(true);
          }}
        >
          {txFee > 0 && (
            <Text
              preset="link"
              text={`${t('Transaction Fee:')} ${formatLocaleString(
                new BigNumber(priorityFee).plus(txFee).decimalPlaces(8)
              )} ${kasTick}`}
              textCenter
            />
          )}
        </Column>
        <Button disabled={disabled} preset="primary" text={t('Next')} onClick={handleConfirm} />
      </Footer>
    </Layout>
  );
}
