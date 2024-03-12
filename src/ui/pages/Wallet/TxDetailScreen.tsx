import { useMemo } from 'react';

import { Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';

import { useBlockstreamUrl } from '@/ui/state/settings/hooks';
import { fontSizes } from '@/ui/theme/font';
import { satoshisToAmount, shortAddress } from '@/ui/utils';
import { useLocation } from 'react-router-dom';

export default function TxDetailScreen() {
  const { state } = useLocation();
  const { txDetail, txId } = state as {
    txDetail: typeof Object;
    txId: string;
  };
  const blockstreamUrl = useBlockstreamUrl();

  // const Transaction = useMemo(() => {
  //   const data = {}
  //   Object.entries(txDetail).map(([key, value]) => {
  //     if(key =='is_accepted'){
  //       data.Sta
  //     }
  //   })
  //   // return data;
  // }, []);

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title="History"
      />
      <Content>
        <Column>
          {Object.entries(txDetail).map(([key, value]) => {
            if (key == 'transaction_id') {
              return (
                <Row justifyBetween key={key}>
                  <Text text="Transaction ID" />
                  <Row
                    onClick={() => {
                      window.open(`${blockstreamUrl}/transaction/${value}`);
                    }}>
                    <Text text={shortAddress(value)} preset="sub" />
                    <Icon icon="link" size={fontSizes.xs} />
                  </Row>
                </Row>
              );
            }
            if (key == 'hash') {
              return (
                <Row justifyBetween key={key}>
                  <Text text="Hash" />
                  <Text text={shortAddress(value)} preset="sub" />
                </Row>
              );
            }
            if (key == 'is_accepted') {
              return (
                <Row justifyBetween key={key}>
                  <Text text="Detail" />
                  <Text text={value ? 'confirmed' : 'unconfirmed'} preset="sub" />
                </Row>
              );
            }
            if (key == 'mass') {
              return (
                <Row justifyBetween key={key}>
                  <Text text="Mass" />
                  <Text text={value} preset="sub" />
                </Row>
              );
            }
            if (key == 'block_time') {
              return (
                <Row justifyBetween key={key}>
                  <Text text="Time" />
                  <Text text={new Date(value).toLocaleString()} preset="sub" />
                </Row>
              );
            }
            if (key == 'subnetwork_id') {
              return (
                <Row justifyBetween key={key}>
                  <Text text="Subnetwork ID" />
                  <Text text={shortAddress(value)} preset="sub" />
                </Row>
              );
            }
            if (key == 'accepting_block_blue_score') {
              return (
                <Row justifyBetween key={key}>
                  <Text text="Accepting Block Blue Score" />
                  <Text text={value} preset="sub" />
                </Row>
              );
            }
            if (key == 'accepting_block_hash') {
              return (
                <Row justifyBetween key={key}>
                  <Text text="Accepting Block Hash" />
                  <Text text={shortAddress(value)} preset="sub" />
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
              <Row key={key}>
                <Text text={key} />
                <Text text={value} preset="sub" />
              </Row>
            );
          })}
        </Column>{' '}
      </Content>
    </Layout>
  );
}
function BlockHash({ blockhashs }) {
  return (
    <div>
      <div>Block Hash</div>
      {blockhashs.map((blockhash: string, index: number) => (
        <Column key={index}>
          <Row justifyBetween>
            <Text text={index} />
            <Text text={shortAddress(blockhash)} preset="sub" />
          </Row>
        </Column>
      ))}
    </div>
  );
}
function Inputs({ inputs }: { inputs: Array<any> }) {
  const senders = useMemo(() => {
    const data: any[] = [];
    inputs.forEach((i) => {
      const address = i.previous_outpoint_address;
      const amount = satoshisToAmount(i.previous_outpoint_amount).replace(/\.0+$/, '');
      data.push({
        address,
        amount
      });
    });
    return data;
  }, []);
  return (
    <div>
      <div>Inputs</div>
      {senders.map((sender, index: number) => (
        <Column key={index}>
          <Row justifyBetween>
            <Text text={shortAddress(sender.address)} />
            <Row>
              <Text text={'-'} color={'red'} />
              <Text text={`${sender.amount} kas`} preset="sub" />
            </Row>
          </Row>
        </Column>
      ))}
    </div>
  );
}

function Outputs({ outputs }: { outputs: Array<any> }) {
  const recipients = useMemo(() => {
    const data: any[] = [];
    outputs.forEach((i) => {
      const address = i.script_public_key_address;
      const amount = satoshisToAmount(i.amount).replace(/\.0+$/, '');
      data.push({
        address,
        amount
      });
    });
    return data;
  }, []);
  return (
    <div>
      <div>Outputs</div>
      {recipients.map((sender, index: number) => (
        <Column key={index}>
          <Row justifyBetween>
            <Text text={shortAddress(sender.address)} />
            <Row>
              <Text text={'+'} color={'green'} />
              <Text text={`${sender.amount} kas`} preset="sub" />
            </Row>
          </Row>
        </Column>
      ))}
    </div>
  );
}
