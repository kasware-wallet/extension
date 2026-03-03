import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { KasplexData } from '@/shared/types';
import { parseKRC20Json } from '@/shared/utils';
import { Card, Content, Header, Layout, Row, Text } from '@/ui/components';
import { Empty } from '@/ui/components/Empty';
import { selectCurrentKaspaAddress } from '@/ui/state/accounts/reducer';
import { useAppSelector } from '@/ui/state/hooks';
import { selectNetworkId } from '@/ui/state/settings/reducer';
import { useKRC20History } from '@/ui/state/ui/hooks';
import { colors } from '@/ui/theme/colors';
import { fontSizes } from '@/ui/theme/font';
import { shortAddress, useWallet } from '@/ui/utils';
import { sompiToAmount } from '@/shared/utils/format';

export default function KRC20HistoryScreen() {
  const wallet = useWallet();
  const { t } = useTranslation();
  const networkId = useAppSelector(selectNetworkId);
  const currentAddress = useAppSelector(selectCurrentKaspaAddress);
  const krc20History = useKRC20History();
  const [krc20Actions, setKrc20Actions] = useState<string[]>([]);
  useEffect(() => {
    wallet.getKRC20HistoryLocalStorage(networkId, currentAddress).then((res) => {
      setKrc20Actions(res);
    });
  }, [networkId, currentAddress, wallet]);
  const mintStr = useMemo(() => {
    let tickArr: string[] = [];
    if (krc20History[networkId]?.mintArr) {
      tickArr = krc20History[networkId].mintArr.map((item) => {
        const itemObj: KasplexData<'mint'> = JSON.parse(item);
        return itemObj.tick;
      });
    }
    krc20Actions.forEach((item) => {
      const { mint } = parseKRC20Json(item);
      if (mint && mint.length > 0) {
        const json: KasplexData<'mint'> = JSON?.parse(mint);
        const tick = json?.tick;
        if (tick && !tickArr.includes(tick)) {
          tickArr.push(tick);
        }
      }
    });
    return tickArr.join(',');
  }, [krc20History, networkId, krc20Actions]);
  // const deployArr = useMemo(() => {
  //   let arr: KasplexData<'deploy'>[] = [];
  //   if (krc20History[networkId]?.deployArr) {
  //     arr = krc20History[networkId].deployArr.map((item) => {
  //       const itemObj: KasplexData<'deploy'> = JSON.parse(item);
  //       const dec = itemObj?.dec || '8';
  //       const multiplier = Math.pow(10, dec);
  //       return {
  //         p: itemObj.p,
  //         op: itemObj.op,
  //         tick: itemObj.tick,
  //         max: new BigNumber(itemObj.max).dividedBy(multiplier).toString(),
  //         lim: new BigNumber(itemObj.lim).dividedBy(multiplier).toString(),
  //         pre: new BigNumber(itemObj.pre).dividedBy(multiplier).toString()
  //       };
  //     });
  //   }
  //   return arr;
  // }, [krc20History]);

  const deployStrArr = useMemo(() => {
    let deployArr: string[] = [];
    if (krc20History[networkId]?.deployArr) {
      deployArr = krc20History[networkId]?.deployArr;
    }
    krc20Actions.forEach((item) => {
      const { deploy } = parseKRC20Json(item);
      if (deploy && deploy.length > 0) {
        if (deployArr.includes(deploy)) {
          deployArr.push(deploy);
        }
      }
    });
    return deployArr;
  }, [krc20History, networkId, krc20Actions]);
  const transferArr = useMemo(() => {
    let arr: {
      tick: string;
      amt: string;
      to?: string;
    }[] = [];
    if (krc20History[networkId]?.transferArr) {
      arr = krc20History[networkId].transferArr.map((item) => {
        const itemObj: KasplexData<'transfer'> = JSON.parse(item);
        return {
          tick: itemObj.tick,
          amt: sompiToAmount(itemObj.amt, 8),
          to: itemObj?.to
        };
      });
    }
    krc20Actions.forEach((item) => {
      const { transfer } = parseKRC20Json(item);
      if (transfer && transfer.length > 0) {
        const json: KasplexData<'transfer'> = JSON?.parse(transfer);
        arr.push({
          tick: json?.tick,
          amt: sompiToAmount(json?.amt, 8),
          to: json?.to
        });
      }
    });
    return arr;
  }, [krc20History, networkId, krc20Actions]);

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={`Latest KRC20 ${t('History')}`}
      />
      <Content>
        {mintStr.length == 0 && deployStrArr.length == 0 && transferArr.length == 0 && <Empty />}
        {mintStr.length > 0 && (
          <>
            <Text preset="large" text={'Mint'} />
            <Row fullX mb="lg">
              <Card fullX justifyBetween>
                <div
                  style={{
                    userSelect: 'text',
                    maxHeight: 384,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    flexWrap: 'wrap',
                    fontSize: fontSizes.sm
                  }}
                >
                  {mintStr}
                </div>
              </Card>
            </Row>
          </>
        )}
        {deployStrArr.length > 0 && (
          <>
            <Text preset="large" text={'Deploy'} />
            <Row fullX mb="lg">
              <Card fullX justifyBetween>
                <div
                  style={{
                    userSelect: 'text',
                    maxHeight: 384,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    flexWrap: 'wrap'
                  }}
                >
                  {deployStrArr.map((item, index) => {
                    return (
                      <div key={`deploy-${item}-${index}`}>
                        <Text text={item} preset="sub" selectText />
                        <Row style={{ borderTopWidth: 1, borderColor: colors.border }} my="md" />
                      </div>
                    );
                  })}
                </div>
              </Card>
            </Row>
          </>
        )}
        {transferArr.length > 0 && (
          <>
            <Text preset="large" text={'Transfer'} />

            <Row fullX mb="lg">
              <Card fullX justifyBetween>
                <div
                  style={{
                    userSelect: 'text',
                    maxHeight: 384,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    flexWrap: 'wrap'
                  }}
                >
                  <table
                    border={1}
                    style={{
                      fontSize: 15,
                      tableLayout: 'fixed',
                      width: '100%'
                    }}
                  >
                    <thead>
                      <tr>
                        <th>Tick</th>
                        <th>Amount</th>
                        <th>To</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transferArr.map((item, index) => {
                        return (
                          <tr key={`transfer-${item.tick}-${item.amt}-${item.to || ''}-${index}`}>
                            <td>{item.tick}</td>
                            <td>{item.amt}</td>
                            <td>{shortAddress(item?.to)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </Row>
          </>
        )}
      </Content>
    </Layout>
  );
}
