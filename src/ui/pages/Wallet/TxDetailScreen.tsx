/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import type { IKRC20Transfer, TKRC20History } from '@/shared/types';
import { Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { useKrc20ActivityByTxidQuery } from '@/ui/hooks/kasplex';
import { useCurrentAccount } from '@/ui/state/accounts/hooks';
import { selectCurrentKaspaAddress } from '@/ui/state/accounts/reducer';
import { useAppSelector } from '@/ui/state/hooks';
import { selectBlockstreamUrl, selectKasTick, selectNetworkId } from '@/ui/state/settings/reducer';
import { fontSizes } from '@/ui/theme/font';
import { formatLocaleString, shortAddress } from '@/ui/utils';
import { LoadingOutlined } from '@ant-design/icons';

import { KRC20HistoryCardWithoutToken } from '../KRC20/KRC20TokenScreen';
import { decodePayload } from '@/ui/utils/payload';
import { colors } from '@/ui/theme/colors';
import { sompiToAmount } from '@/shared/utils/format';
import PayloadComp from '../Approval/components/PayloadComp';

export default function TxDetailScreen() {
  const kasTick = useAppSelector(selectKasTick);
  const { state } = useLocation();
  const { txDetail, txId } = state as {
    txDetail: { [key: string]: any };
    txId: string;
    // token: IToken;
  };
  const blockstreamUrl = useAppSelector(selectBlockstreamUrl);
  const [isDecoded, setIsDecoded] = useState(false);

  const { t } = useTranslation();
  const txFee = useMemo(() => {
    if (!txDetail?.inputs || !txDetail?.outputs) return '0';

    const inputAmount = txDetail.inputs.reduce(
      (sum: number, input: { previous_outpoint_amount: any }) => sum + Number(input.previous_outpoint_amount),
      0
    );

    const outputAmount = txDetail.outputs.reduce(
      (sum: number, output: { amount: any }) => sum + Number(output.amount),
      0
    );

    return sompiToAmount(inputAmount - outputAmount, 8);
  }, [txDetail?.inputs, txDetail?.outputs]);

  const payload = useMemo(() => txDetail?.payload, [txDetail?.payload]);

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={t('History')}
      />
      <Content>
        <Column>
          {Object.entries(txDetail).map(([key, value]) => {
            if (key == 'transaction_id') {
              return (
                <Row justifyBetween key={key}>
                  <Text text="Transaction ID" selectText />
                  <Row
                    gap="xs"
                    justifyBetween
                    itemsCenter
                    onClick={() => {
                      window.open(`${blockstreamUrl}/txs/${value}`);
                    }}
                  >
                    <div className="text-select">
                      <Text text={shortAddress(value)} preset="link" selectText />
                    </div>
                    <Icon icon="link" size={fontSizes.xxs} color="blue" />
                  </Row>
                </Row>
              );
            }
            if (key == 'hash') {
              return (
                <Row justifyBetween key={key}>
                  <Text text="Hash" selectText />
                  <Text text={shortAddress(value)} preset="sub" selectText />
                </Row>
              );
            }
            if (key == 'is_accepted') {
              return (
                <Row justifyBetween key={key}>
                  <Text text="Detail" selectText />
                  <Text text={value ? 'Accepted' : 'Not Accepted'} preset="sub" selectText />
                </Row>
              );
            }
            if (key == 'mass') {
              return (
                <Row justifyBetween key={key}>
                  <Text text="Mass" selectText />
                  <Text text={value} preset="sub" selectText />
                </Row>
              );
            }
            if (key == 'payload') return null;
            if (key == 'block_time') {
              return (
                <Row justifyBetween key={key}>
                  <Text text="Time" selectText />
                  <Text text={new Date(value).toLocaleString()} preset="sub" selectText />
                </Row>
              );
            }
            if (key == 'subnetwork_id') {
              return (
                <Row justifyBetween key={key}>
                  <Text text="Subnetwork ID" selectText />
                  <Text text={shortAddress(value)} preset="sub" selectText />
                </Row>
              );
            }
            if (key == 'accepting_block_blue_score') {
              return (
                <Row justifyBetween key={key}>
                  <Text text="Accepting Block Blue Score" selectText />
                  <Text text={value} preset="sub" selectText />
                </Row>
              );
            }
            if (key == 'accepting_block_hash') {
              return (
                <Row justifyBetween key={key}>
                  <Text text="Accepting Block Hash" selectText />
                  <Text text={shortAddress(value)} preset="sub" selectText />
                </Row>
              );
            }
            if (key == 'block_hash') {
              return <BlockHash key={key} blockhashs={value} />;
            }

            if (key == 'inputs') {
              return <Inputs key={key} inputs={value} />;
            }
            if (key == 'outputs') {
              return <Outputs key={key} outputs={value} />;
            }
            return (
              <Row key={key} justifyBetween>
                <Text text={key} selectText />
                <Text
                  text={value}
                  preset="sub"
                  selectText
                  style={{
                    userSelect: 'text',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    flexWrap: 'wrap'
                  }}
                />
              </Row>
            );
          })}
          {txFee && Number(txFee) > 0 && (
            <Row justifyBetween key={'txFee'}>
              <Text text="Transaction fee" selectText />
              <Text text={`${txFee} ${kasTick}`} preset="sub" selectText />
            </Row>
          )}

          <div className="space-y-2">
            <Text text="Payload" selectText />
            <div style={{ float: 'left' }}>
              <span
                className="rounded whitespace-pre-wrap break-all"
                style={{
                  fontSize: fontSizes.xs,
                  color: colors.white_muted
                }}
              >
                {payload}
              </span>
              {payload?.length > 0 && (
                <button
                  className="ml-2 px-2 py-0.5 rounded bg-cyan-600 text-white text-xs hover:bg-cyan-700"
                  onClick={() => {
                    setIsDecoded(!isDecoded);
                  }}
                >
                  {isDecoded ? 'Decoded' : 'Decode'}
                </button>
              )}
            </div>
          </div>
          {payload?.length > 0 && isDecoded == true && <DecodedPayload payload={payload} />}

          <Krc20HistoryCard txId={txId} />
        </Column>
      </Content>
    </Layout>
  );
}

function DecodedPayload({ payload }: { payload: string }) {
  const [decoded, setDecoded] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const data = decodePayload(payload);
    if (data?.error) {
      setError(data.error);
      setDecoded(null);
    } else {
      setDecoded(data);
      setError(null);
    }
  }, [payload]);

  return (
    <Row>
      {error && <Text text={`Error: ${error}`} preset="sub" color="red" />}
      {!error && !decoded && <Text text="Decoding..." preset="sub" />}
      {!error && decoded && (
        <PayloadComp
          payload={
            decoded?.txType == 'KASPLEX_L2_BRIDGE'
              ? decoded?.address
              : JSON.stringify(decoded, null, 2) || 'Decoding failed'
          }
        />
      )}
    </Row>
  );
}
function BlockHash({ blockhashs }) {
  return (
    <div>
      <div>Block Hash</div>
      {blockhashs?.map((blockhash: string, index: number) => (
        <Column key={index}>
          <Row justifyBetween>
            <Text text={index} selectText />
            <Text text={shortAddress(blockhash)} preset="sub" selectText />
          </Row>
        </Column>
      ))}
    </div>
  );
}
function Inputs({ inputs }: { inputs: Array<any> }) {
  const kasTick = useAppSelector(selectKasTick);
  const currentAccount = useCurrentAccount();
  const senders = useMemo(() => {
    const data: any[] = [];
    inputs.forEach((i) => {
      const address = i.previous_outpoint_address;
      const amount = sompiToAmount(i.previous_outpoint_amount, 8).replace(/\.0+$/, '');
      const alianName = currentAccount.address == address ? 'Self' : undefined;
      data.push({
        address,
        amount,
        alianName
      });
    });
    return data;
  }, [currentAccount.address, inputs]);
  const blockstreamUrl = useAppSelector(selectBlockstreamUrl);
  return (
    <div>
      <div>Inputs</div>
      {senders.map((sender, index: number) => (
        <Column key={index}>
          <Row justifyBetween>
            <Row
              gap="xs"
              itemsCenter
              onClick={() => {
                window.open(`${blockstreamUrl}/addresses/${sender.address}`);
              }}
            >
              <div className="text-select">
                <Text text={shortAddress(sender.address)} preset="link" selectText />
              </div>
              <Icon icon="link" size={fontSizes.xxs} color="blue" />
            </Row>
            <Row>
              <Text text={'-'} color={'red'} />
              <Text text={`${formatLocaleString(sender.amount)} ${kasTick}`} preset="sub" />
            </Row>
          </Row>
        </Column>
      ))}
    </div>
  );
}

function Outputs({ outputs }: { outputs: Array<any> }) {
  const kasTick = useAppSelector(selectKasTick);
  const currentAccount = useCurrentAccount();
  const recipients = useMemo(() => {
    const data: any[] = [];
    outputs.forEach((i) => {
      const address = i.script_public_key_address;
      const amount = sompiToAmount(i.amount, 8).replace(/\.0+$/, '');
      const alianName = currentAccount.address == address ? 'Self' : undefined;
      data.push({
        address,
        amount,
        alianName
      });
    });
    return data;
  }, [currentAccount.address, outputs]);
  const blockstreamUrl = useAppSelector(selectBlockstreamUrl);
  return (
    <div>
      <div>Outputs</div>
      {recipients.map((sender, index: number) => (
        <Column key={index}>
          <Row justifyBetween>
            <Row
              gap="xs"
              itemsCenter
              onClick={() => {
                window.open(`${blockstreamUrl}/addresses/${sender.address}`);
              }}
            >
              <div className="text-select">
                <Text text={shortAddress(sender.address)} preset="link" />
              </div>
              <Icon icon="link" size={fontSizes.xxs} color="blue" />
            </Row>
            <Row>
              <Text text={'+'} color={'green'} />
              <Text text={`${formatLocaleString(sender.amount)} ${kasTick}`} preset="sub" />
            </Row>
          </Row>
        </Column>
      ))}
    </div>
  );
}
function Krc20HistoryCard({ txId }: { txId: string }) {
  const networkId = useAppSelector(selectNetworkId);
  const [krc20History, setkrc20History] = useState<TKRC20History | null>();
  const address = useAppSelector(selectCurrentKaspaAddress);
  const { activity, isLoading } = useKrc20ActivityByTxidQuery(networkId, txId, true);
  useEffect(() => {
    if (activity) {
      const to = (activity as IKRC20Transfer)?.to;
      const from = activity?.from;
      if (to == address || from == address) setkrc20History(activity);
    }
  }, [activity, address]);
  if (isLoading) {
    return (
      <Row justifyCenter mt="sm">
        <Icon>
          <LoadingOutlined />
        </Icon>
      </Row>
    );
  }
  return <>{krc20History && <KRC20HistoryCardWithoutToken history={krc20History} />}</>;
}
