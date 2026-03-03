import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import type {
  IKRC20Blacklist,
  IKRC20Burn,
  IKRC20BurnIssue,
  IKRC20Chown,
  IKRC20ChownIssue,
  IKRC20Deploy,
  IKRC20DeployIssue,
  IKRC20Issue,
  IKRC20List,
  IKRC20ListIssue,
  IKRC20Mint,
  IKRC20Send,
  IKRC20SendIssue,
  IKRC20Transfer,
  IKRC20TransferIssue,
  IToken,
  TKasplexOp,
  TKRC20History,
  TKRC20HistoryIssue
} from '@/shared/types';
import { Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { EndCard, MiddleCard, StartCard } from '@/ui/components/Card';
import { useAppSelector } from '@/ui/state/hooks';
import { selectBlockstreamUrl, selectKasTick } from '@/ui/state/settings/reducer';
import { fontSizes } from '@/ui/theme/font';
import { copyToClipboard, formatLocaleString, shortAddress } from '@/ui/utils';
import { CopyOutlined } from '@ant-design/icons';
import { sompiToAmount } from '@/shared/utils/format';

interface IInfo {
  name: string;
  value: string;
}

export default function KRC20TxDetailScreen() {
  const { state } = useLocation();
  const { txDetail, op, token } = state as {
    txDetail: TKRC20History | TKRC20HistoryIssue;
    op: TKasplexOp;
    token: IToken;
  };
  const { t } = useTranslation();
  const [title, setTitle] = useState<string>('');
  useEffect(() => {
    if (op == 'mint') setTitle('Mint');
    if (op == 'deploy') setTitle('Deploy');
    if (op == 'transfer') setTitle('Transfer');
    if (op == 'list') setTitle('List');
    if (op == 'send') setTitle('Send');
    const titleName = op.charAt(0)?.toUpperCase() + op?.slice(1);
    setTitle(titleName ?? '');
  }, [op]);

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={t(title ?? '')}
      />
      <Content>
        {op == 'deploy' && <DeployTxInfo deployInfo={txDetail as IKRC20Deploy | IKRC20DeployIssue} token={token} />}
        {op == 'burn' && <BurnTxInfo transferInfo={txDetail as IKRC20Burn | IKRC20BurnIssue} token={token} />}
        {op == 'chown' && <ChownTxInfo transferInfo={txDetail as IKRC20Chown | IKRC20ChownIssue} token={token} />}
        {op == 'transfer' && (
          <TransferTxInfo transferInfo={txDetail as IKRC20Transfer | IKRC20TransferIssue} token={token} />
        )}
        {op == 'list' && <ListTxInfo transferInfo={txDetail as IKRC20List | IKRC20ListIssue} token={token} />}
        {op == 'send' && <SendTxInfo transferInfo={txDetail as IKRC20Send | IKRC20SendIssue} token={token} />}

        {op == 'mint' && <MintTxInfo mintInfo={txDetail as IKRC20Mint} token={token} />}

        {op == 'issue' && <IssueTxInfo transferInfo={txDetail as IKRC20Issue} token={token} />}
        {op == 'blacklist' && <BlacklistTxInfo transferInfo={txDetail as IKRC20Blacklist} />}
      </Content>
    </Layout>
  );
}

function DeployTxInfo({ deployInfo, token }: { deployInfo: IKRC20Deploy | IKRC20DeployIssue; token: IToken }) {
  const tokenTick = token?.tick;

  const [infoArray, setInfoArray] = useState<IInfo[]>([]);
  const tools = useTools();
  const { t } = useTranslation();

  useEffect(() => {
    if (deployInfo) {
      const infoA: IInfo[] = [];
      if ((deployInfo as IKRC20DeployIssue).ca) {
        infoA.push({
          name: 'Contract',
          value: (deployInfo as IKRC20DeployIssue).ca
        });
      }
      if (deployInfo.dec) {
        infoA.push({
          name: 'Decimal',
          value: deployInfo.dec
        });
      }

      let dec = deployInfo?.dec;
      if (dec == undefined || Number(dec) <= 0) {
        dec = '8';
      }
      if (deployInfo.max) {
        const max = sompiToAmount(deployInfo.max, dec);
        infoA.push({
          name: 'Max Supply',
          value: formatLocaleString(max)
        });
      }
      if ((deployInfo as IKRC20Deploy).lim && !(deployInfo as IKRC20DeployIssue).ca) {
        const lim = sompiToAmount((deployInfo as IKRC20Deploy).lim, dec);
        infoA.push({
          name: 'Amount per mint',
          value: formatLocaleString(lim)
        });
      }
      infoA.push({
        name: 'Decimal',
        value: dec
      });
      if (deployInfo?.from) {
        infoA.push({
          name: 'From',
          value: deployInfo?.from
        });
      }
      if (deployInfo?.to) {
        infoA.push({
          name: 'To',
          value: deployInfo?.to
        });
      }

      setInfoArray(infoA);
    }
  }, [deployInfo]);

  return (
    <Column gap="zero">
      <StartCard key="tick">
        <Row justifyBetween full itemsCenter py="sm">
          <Text text="Tick" preset="sub" />
          <Text text={tokenTick} />
        </Row>
      </StartCard>
      {infoArray &&
        infoArray.length > 0 &&
        infoArray.map((info, index) => {
          if (info.name == 'From' || info.name == 'To' || info.name == 'Contract') {
            return (
              <MiddleCard key={index}>
                <Row justifyBetween full itemsCenter py="sm">
                  <Text text={info.name} preset="sub" />
                  <Row
                    justifyCenter
                    itemsCenter
                    gap="xs"
                    onClick={() => {
                      copyToClipboard(info.value).then(() => {
                        tools.toastSuccess(t('Copied'));
                      });
                    }}
                  >
                    <Text text={shortAddress(info.value, 8)} wrap />
                    <CopyOutlined style={{ color: '#888', fontSize: 14 }} />
                  </Row>
                </Row>
              </MiddleCard>
            );
          }
          return (
            <MiddleCard key={index}>
              <Row justifyBetween full itemsCenter py="sm">
                <Text text={info.name} preset="sub" />
                <Text text={info.value} wrap />
              </Row>
            </MiddleCard>
          );
        })}

      <CommonTxInfo transferInfo={deployInfo} />
    </Column>
  );
}

function MintTxInfo({ mintInfo, token }: { mintInfo: IKRC20Mint; token: IToken }) {
  const tokenTick = token.tick;

  const tools = useTools();
  const { t } = useTranslation();

  const [infoArray, setInfoArray] = useState<IInfo[]>([]);

  useEffect(() => {
    if (mintInfo) {
      const infoA: IInfo[] = [];

      if (mintInfo.amt) {
        const max = sompiToAmount(mintInfo.amt, token.decimals);
        infoA.push({
          name: 'Amount',
          value: formatLocaleString(max)
        });
      }
      if (mintInfo.from) {
        infoA.push({
          name: 'From',
          value: mintInfo.from
        });
      }
      if (mintInfo.to) {
        infoA.push({
          name: 'To',
          value: mintInfo.to
        });
      }

      setInfoArray(infoA);
    }
  }, [mintInfo, token.decimals]);

  return (
    <Column gap="zero">
      <StartCard key="tick">
        <Row justifyBetween full itemsCenter py="sm">
          <Text text="Tick" preset="sub" />
          <Text text={tokenTick} />
        </Row>
      </StartCard>
      {infoArray &&
        infoArray.length > 0 &&
        infoArray.map((info, index) => {
          if (info.name == 'From' || info.name == 'To') {
            return (
              <MiddleCard key={index}>
                <Row justifyBetween full itemsCenter py="sm">
                  <Text text={info.name} preset="sub" />
                  <Row
                    justifyCenter
                    itemsCenter
                    gap="xs"
                    onClick={() => {
                      copyToClipboard(info.value).then(() => {
                        tools.toastSuccess(t('Copied'));
                      });
                    }}
                  >
                    <Text text={shortAddress(info.value, 8)} wrap />
                    <CopyOutlined style={{ color: '#888', fontSize: 14 }} />
                  </Row>
                </Row>
              </MiddleCard>
            );
          }
          return (
            <MiddleCard key={index}>
              <Row justifyBetween full itemsCenter py="sm">
                <Text text={info.name} preset="sub" />
                <Text text={info.value} wrap />
              </Row>
            </MiddleCard>
          );
        })}

      <CommonTxInfo transferInfo={mintInfo} />
    </Column>
  );
}
function BlacklistTxInfo({ transferInfo }: { transferInfo: IKRC20Blacklist }) {
  const tokenTick = transferInfo?.name;

  const tools = useTools();
  const { t } = useTranslation();

  const [infoArray, setInfoArray] = useState<IInfo[]>([]);

  useEffect(() => {
    if (transferInfo) {
      const infoA: IInfo[] = [];

      if (transferInfo.ca) {
        infoA.push({
          name: 'Contract',
          value: transferInfo.ca
        });
      }
      if (transferInfo.mod) {
        infoA.push({
          name: 'Mod',
          value: transferInfo.mod
        });
      }
      if (transferInfo.from) {
        infoA.push({
          name: 'From',
          value: transferInfo.from
        });
      }
      if (transferInfo.to) {
        infoA.push({
          name: 'To',
          value: transferInfo.to
        });
      }

      setInfoArray(infoA);
    }
  }, [transferInfo]);

  return (
    <Column gap="zero">
      <StartCard key="tick">
        <Row justifyBetween full itemsCenter py="sm">
          <Text text="Tick" preset="sub" selectText />
          <Text text={tokenTick} selectText />
        </Row>
      </StartCard>
      {infoArray &&
        infoArray.length > 0 &&
        infoArray.map((info, index) => {
          if (info.name == 'From' || info.name == 'To' || info.name == 'Contract') {
            return (
              <MiddleCard key={index}>
                <Row justifyBetween full itemsCenter py="sm">
                  <Text text={info.name} preset="sub" selectText />
                  <Row
                    justifyCenter
                    itemsCenter
                    gap="xs"
                    onClick={() => {
                      copyToClipboard(info.value).then(() => {
                        tools.toastSuccess(t('Copied'));
                      });
                    }}
                  >
                    <Text text={shortAddress(info.value, 8)} wrap selectText />
                    <CopyOutlined style={{ color: '#888', fontSize: 14 }} />
                  </Row>
                </Row>
              </MiddleCard>
            );
          }
          return (
            <MiddleCard key={index}>
              <Row justifyBetween full itemsCenter py="sm">
                <Text text={info.name} preset="sub" selectText />
                <Text text={info.value} wrap selectText />
              </Row>
            </MiddleCard>
          );
        })}
      <CommonTxInfo transferInfo={transferInfo} />
    </Column>
  );
}
function BurnTxInfo({ transferInfo, token }: { transferInfo: IKRC20BurnIssue | IKRC20Burn; token: IToken }) {
  const tokenTick = token.tick;

  const tools = useTools();
  const { t } = useTranslation();

  const [infoArray, setInfoArray] = useState<IInfo[]>([]);

  useEffect(() => {
    if (transferInfo) {
      const infoA: IInfo[] = [];
      if ((transferInfo as IKRC20BurnIssue).ca) {
        infoA.push({
          name: 'Contract',
          value: (transferInfo as IKRC20BurnIssue).ca
        });
      }
      if (transferInfo.amt) {
        const max = sompiToAmount(transferInfo.amt, token.decimals);
        infoA.push({
          name: 'Amount',
          value: formatLocaleString(max)
        });
      }
      if (transferInfo.from) {
        infoA.push({
          name: 'From',
          value: transferInfo.from
        });
      }

      setInfoArray(infoA);
    }
  }, [token.decimals, transferInfo]);

  return (
    <Column gap="zero">
      <StartCard key="tick">
        <Row justifyBetween full itemsCenter py="sm">
          <Text text="Tick" preset="sub" selectText />
          <Text text={tokenTick} selectText />
        </Row>
      </StartCard>
      {infoArray &&
        infoArray.length > 0 &&
        infoArray.map((info, index) => {
          if (info.name == 'From' || info.name == 'To' || info.name == 'Contract') {
            return (
              <MiddleCard key={index}>
                <Row justifyBetween full itemsCenter py="sm">
                  <Text text={info.name} preset="sub" selectText />
                  <Row
                    justifyCenter
                    itemsCenter
                    gap="xs"
                    onClick={() => {
                      copyToClipboard(info.value).then(() => {
                        tools.toastSuccess(t('Copied'));
                      });
                    }}
                  >
                    <Text text={shortAddress(info.value, 8)} wrap selectText />
                    <CopyOutlined style={{ color: '#888', fontSize: 14 }} />
                  </Row>
                </Row>
              </MiddleCard>
            );
          }
          return (
            <MiddleCard key={index}>
              <Row justifyBetween full itemsCenter py="sm">
                <Text text={info.name} preset="sub" selectText />
                <Text text={info.value} wrap selectText />
              </Row>
            </MiddleCard>
          );
        })}
      <CommonTxInfo transferInfo={transferInfo} />
    </Column>
  );
}
function ChownTxInfo({ transferInfo, token }: { transferInfo: IKRC20Chown | IKRC20ChownIssue; token: IToken }) {
  const tokenTick = token?.tick;

  const tools = useTools();
  const { t } = useTranslation();

  const [infoArray, setInfoArray] = useState<IInfo[]>([]);

  useEffect(() => {
    if (transferInfo) {
      const infoA: IInfo[] = [];

      if ((transferInfo as IKRC20ChownIssue).ca) {
        infoA.push({
          name: 'Contract',
          value: (transferInfo as IKRC20ChownIssue).ca
        });
      }
      if (transferInfo.from) {
        infoA.push({
          name: 'From',
          value: transferInfo.from
        });
      }
      if (transferInfo.to) {
        infoA.push({
          name: 'To',
          value: transferInfo.to
        });
      }

      setInfoArray(infoA);
    }
  }, [transferInfo]);

  return (
    <Column gap="zero">
      <StartCard key="tick">
        <Row justifyBetween full itemsCenter py="sm">
          <Text text="Tick" preset="sub" selectText />
          <Text text={tokenTick} selectText />
        </Row>
      </StartCard>
      {infoArray &&
        infoArray.length > 0 &&
        infoArray.map((info, index) => {
          if (info.name == 'From' || info.name == 'To' || info.name == 'Contract') {
            return (
              <MiddleCard key={index}>
                <Row justifyBetween full itemsCenter py="sm">
                  <Text text={info.name} preset="sub" selectText />
                  <Row
                    justifyCenter
                    itemsCenter
                    gap="xs"
                    onClick={() => {
                      copyToClipboard(info.value).then(() => {
                        tools.toastSuccess(t('Copied'));
                      });
                    }}
                  >
                    <Text text={shortAddress(info.value, 8)} wrap selectText />
                    <CopyOutlined style={{ color: '#888', fontSize: 14 }} />
                  </Row>
                </Row>
              </MiddleCard>
            );
          }
          return (
            <MiddleCard key={index}>
              <Row justifyBetween full itemsCenter py="sm">
                <Text text={info.name} preset="sub" selectText />
                <Text text={info.value} wrap selectText />
              </Row>
            </MiddleCard>
          );
        })}
      <CommonTxInfo transferInfo={transferInfo} />
    </Column>
  );
}
function IssueTxInfo({ transferInfo, token }: { transferInfo: IKRC20Issue; token: IToken }) {
  const tokenTick = transferInfo?.name ?? token.tick;

  const tools = useTools();
  const { t } = useTranslation();

  const [infoArray, setInfoArray] = useState<IInfo[]>([]);

  useEffect(() => {
    if (transferInfo) {
      const infoA: IInfo[] = [];
      if (transferInfo.ca) {
        infoA.push({
          name: 'Contract',
          value: transferInfo.ca
        });
      }
      if (transferInfo.amt) {
        const max = sompiToAmount(transferInfo.amt, token.decimals);
        infoA.push({
          name: 'Amount',
          value: formatLocaleString(max)
        });
      }
      if (transferInfo.from) {
        infoA.push({
          name: 'From',
          value: transferInfo.from
        });
      }
      if (transferInfo.to) {
        infoA.push({
          name: 'To',
          value: transferInfo.to
        });
      }

      setInfoArray(infoA);
    }
  }, [token.decimals, transferInfo]);

  return (
    <Column gap="zero">
      <StartCard key="tick">
        <Row justifyBetween full itemsCenter py="sm">
          <Text text="Tick" preset="sub" selectText />
          <Text text={tokenTick} selectText />
        </Row>
      </StartCard>
      {infoArray &&
        infoArray.length > 0 &&
        infoArray.map((info, index) => {
          if (info.name == 'From' || info.name == 'To' || info.name == 'Contract') {
            return (
              <MiddleCard key={index}>
                <Row justifyBetween full itemsCenter py="sm">
                  <Text text={info.name} preset="sub" selectText />
                  <Row
                    justifyCenter
                    itemsCenter
                    gap="xs"
                    onClick={() => {
                      copyToClipboard(info.value).then(() => {
                        tools.toastSuccess(t('Copied'));
                      });
                    }}
                  >
                    <Text text={shortAddress(info.value, 8)} wrap selectText />
                    <CopyOutlined style={{ color: '#888', fontSize: 14 }} />
                  </Row>
                </Row>
              </MiddleCard>
            );
          }
          return (
            <MiddleCard key={index}>
              <Row justifyBetween full itemsCenter py="sm">
                <Text text={info.name} preset="sub" selectText />
                <Text text={info.value} wrap selectText />
              </Row>
            </MiddleCard>
          );
        })}
      <CommonTxInfo transferInfo={transferInfo} />
    </Column>
  );
}

function TransferTxInfo({
  transferInfo,
  token
}: {
  transferInfo: IKRC20Transfer | IKRC20TransferIssue;
  token: IToken;
}) {
  const tokenTick = token.tick;

  const tools = useTools();
  const { t } = useTranslation();

  const [infoArray, setInfoArray] = useState<IInfo[]>([]);

  useEffect(() => {
    if (transferInfo) {
      const infoA: IInfo[] = [];
      if ((transferInfo as IKRC20TransferIssue).ca) {
        infoA.push({
          name: 'Contract',
          value: (transferInfo as IKRC20TransferIssue).ca
        });
      }
      if (transferInfo.amt) {
        const max = sompiToAmount(transferInfo.amt, token.decimals);
        infoA.push({
          name: 'Amount',
          value: formatLocaleString(max)
        });
      }
      if (transferInfo.from) {
        infoA.push({
          name: 'From',
          value: transferInfo.from
        });
      }
      if (transferInfo.to) {
        infoA.push({
          name: 'To',
          value: transferInfo.to
        });
      }

      setInfoArray(infoA);
    }
  }, [token.decimals, transferInfo]);

  return (
    <Column gap="zero">
      <StartCard key="tick">
        <Row justifyBetween full itemsCenter py="sm">
          <Text text="Tick" preset="sub" />
          <Text text={tokenTick} />
        </Row>
      </StartCard>
      {infoArray &&
        infoArray.length > 0 &&
        infoArray.map((info, index) => {
          if (info.name == 'From' || info.name == 'To' || info.name == 'Contract') {
            return (
              <MiddleCard key={index}>
                <Row justifyBetween full itemsCenter py="sm">
                  <Text text={info.name} preset="sub" />
                  <Row
                    justifyCenter
                    itemsCenter
                    gap="xs"
                    onClick={() => {
                      copyToClipboard(info.value).then(() => {
                        tools.toastSuccess(t('Copied'));
                      });
                    }}
                  >
                    <Text text={shortAddress(info.value, 8)} wrap />
                    <CopyOutlined style={{ color: '#888', fontSize: 14 }} />
                  </Row>
                </Row>
              </MiddleCard>
            );
          }
          return (
            <MiddleCard key={index}>
              <Row justifyBetween full itemsCenter py="sm">
                <Text text={info.name} preset="sub" />
                <Text text={info.value} wrap />
              </Row>
            </MiddleCard>
          );
        })}
      <CommonTxInfo transferInfo={transferInfo} />
    </Column>
  );
}

function ListTxInfo({ transferInfo, token }: { transferInfo: IKRC20List | IKRC20ListIssue; token: IToken }) {
  const tokenTick = token.tick;

  const tools = useTools();
  const { t } = useTranslation();
  const kasTick = useAppSelector(selectKasTick);

  const [infoArray, setInfoArray] = useState<IInfo[]>([]);

  useEffect(() => {
    if (transferInfo) {
      const infoA: IInfo[] = [];
      if ((transferInfo as IKRC20ListIssue).ca) {
        infoA.push({
          name: 'Contract',
          value: (transferInfo as IKRC20ListIssue).ca
        });
      }

      if (transferInfo.amt) {
        const max = sompiToAmount(transferInfo.amt, token.decimals);
        infoA.push({
          name: 'Amount',
          value: formatLocaleString(max)
        });
      }
      if (transferInfo.from) {
        infoA.push({
          name: 'From',
          value: transferInfo.from
        });
      }
      if (transferInfo.utxo) {
        const arr = transferInfo.utxo.split('_');
        const amt = sompiToAmount(Number(arr[2]), 8);
        infoA.push({
          name: 'UTXO',
          value: formatLocaleString(amt) + ' ' + kasTick
        });
      }

      setInfoArray(infoA);
    }
  }, [kasTick, token.decimals, transferInfo]);

  return (
    <Column gap="zero">
      <StartCard key="tick">
        <Row justifyBetween full itemsCenter py="sm">
          <Text text="Tick" preset="sub" />
          <Text text={tokenTick} />
        </Row>
      </StartCard>
      {infoArray &&
        infoArray.length > 0 &&
        infoArray.map((info, index) => {
          if (info.name == 'From' || info.name == 'To' || info.name == 'Contract') {
            return (
              <MiddleCard key={index}>
                <Row justifyBetween full itemsCenter py="sm">
                  <Text text={info.name} preset="sub" />
                  <Row
                    justifyCenter
                    itemsCenter
                    gap="xs"
                    onClick={() => {
                      copyToClipboard(info.value).then(() => {
                        tools.toastSuccess(t('Copied'));
                      });
                    }}
                  >
                    <Text text={shortAddress(info.value, 8)} wrap />
                    <CopyOutlined style={{ color: '#888', fontSize: 14 }} />
                  </Row>
                </Row>
              </MiddleCard>
            );
          }
          // if (info.name == 'UTXO') {
          //   const utxoTxid = transferInfo?.utxo.split('_')[0];
          //   return (
          //     <Card
          //       mt="xs"
          //       mb="zero"
          //       key="revealtx"
          //       classname="card-select"
          //       full
          //       justifyBetween
          //       style={{
          //         borderTopLeftRadius: 0,
          //         borderTopRightRadius: 0
          //       }}>
          //       <Row justifyBetween full itemsCenter>
          //         <Text text="UTXO" preset="sub" />
          //         <Text
          //           preset="link"
          //           text={info.value}
          //           onClick={() => {
          //             // setFeeDrawerVisible(true);
          //             window.open(`${blockstreamUrl}/txs/${utxoTxid}`);
          //           }}
          //         />
          //       </Row>
          //     </Card>
          //   );
          // }

          return (
            <MiddleCard key={index}>
              <Row justifyBetween full itemsCenter py="sm">
                <Text text={info.name} preset="sub" />
                <Text text={info.value} wrap />
              </Row>
            </MiddleCard>
          );
        })}
      <CommonTxInfo transferInfo={transferInfo} />
    </Column>
  );
}

function SendTxInfo({ transferInfo, token }: { transferInfo: IKRC20Send | IKRC20SendIssue; token: IToken }) {
  const dec = token?.decimals;
  const tokenTick = token.tick;

  const tools = useTools();
  const { t } = useTranslation();
  const kasTick = useAppSelector(selectKasTick);

  const [infoArray, setInfoArray] = useState<IInfo[]>([]);

  useEffect(() => {
    if (transferInfo) {
      const infoA: IInfo[] = [];
      if ((transferInfo as IKRC20SendIssue).ca) {
        infoA.push({
          name: 'Contract',
          value: (transferInfo as IKRC20SendIssue).ca
        });
      }

      if (transferInfo.amt) {
        const max = sompiToAmount(transferInfo.amt, dec);
        infoA.push({
          name: 'Amount',
          value: formatLocaleString(max)
        });
      }
      if (transferInfo.from) {
        infoA.push({
          name: 'From',
          value: transferInfo.from
        });
      }
      if (transferInfo.to) {
        infoA.push({
          name: 'To',
          value: transferInfo.to
        });
      }
      if (transferInfo.price) {
        const price = transferInfo.price;
        infoA.push({
          name: 'Price',
          value: formatLocaleString(price) + ' ' + kasTick
        });
      }

      setInfoArray(infoA);
    }
  }, [dec, kasTick, transferInfo]);

  return (
    <Column gap="zero">
      <StartCard key="tick">
        <Row justifyBetween full itemsCenter py="sm">
          <Text text="Tick" preset="sub" />
          <Text text={tokenTick} />
        </Row>
      </StartCard>
      {infoArray &&
        infoArray.length > 0 &&
        infoArray.map((info, index) => {
          if (info.name == 'From' || info.name == 'To' || info.name == 'Contract') {
            return (
              <MiddleCard key={index}>
                <Row justifyBetween full itemsCenter py="sm">
                  <Text text={info.name} preset="sub" />
                  <Row
                    justifyCenter
                    itemsCenter
                    gap="xs"
                    onClick={() => {
                      copyToClipboard(info.value).then(() => {
                        tools.toastSuccess(t('Copied'));
                      });
                    }}
                  >
                    <Text text={shortAddress(info.value, 8)} wrap />
                    <CopyOutlined style={{ color: '#888', fontSize: 14 }} />
                  </Row>
                </Row>
              </MiddleCard>
            );
          }
          return (
            <MiddleCard key={index}>
              <Row justifyBetween full itemsCenter py="sm">
                <Text text={info.name} preset="sub" />
                <Text text={info.value} wrap />
              </Row>
            </MiddleCard>
          );
        })}
      <CommonTxInfo transferInfo={transferInfo} />
    </Column>
  );
}
function CommonTxInfo({ transferInfo }: { transferInfo: TKRC20History | TKRC20HistoryIssue }) {
  const [revealTx, setRevealTx] = useState('');
  const tools = useTools();
  const { t } = useTranslation();

  const blockstreamUrl = useAppSelector(selectBlockstreamUrl);
  const [infoArray, setInfoArray] = useState<IInfo[]>([]);

  useEffect(() => {
    if (transferInfo) {
      setRevealTx(transferInfo.hashRev);
      const infoA: IInfo[] = [];

      if (transferInfo.p) {
        infoA.push({
          name: 'Protocol',
          value: transferInfo.p
        });
      }
      if (transferInfo.op) {
        infoA.push({
          name: 'OP',
          value: transferInfo.op
        });
      }

      if (transferInfo?.opScore) {
        infoA.push({
          name: 'OP Score',
          value: transferInfo?.opScore
        });
      }

      if (transferInfo?.feeRev) {
        const fee = sompiToAmount(transferInfo?.feeRev, 8);
        infoA.push({
          name: 'Reveal Fee',
          value: formatLocaleString(fee) + ' KAS'
        });
      }
      if (transferInfo?.txAccept) {
        let state = 'Confirmed';
        if (transferInfo?.txAccept !== '1') {
          state = 'Unconfirmed';
        }
        infoA.push({
          name: 'TX State',
          value: state
        });
      }
      if (transferInfo?.opAccept) {
        let state = 'Implemented';
        if (transferInfo?.txAccept == '0') state = 'Unimplemented';
        if (transferInfo?.txAccept == '-1') state = 'Failed';
        infoA.push({
          name: 'TX State',
          value: state
        });
      }
      if (transferInfo?.opError) {
        infoA.push({
          name: 'OP Error',
          value: transferInfo?.opError
        });
      }
      if (transferInfo?.checkpoint) {
        infoA.push({
          name: 'Check Point',
          value: transferInfo?.checkpoint
        });
      }
      if (transferInfo?.mtsAdd) {
        infoA.push({
          name: 'OP Created at',
          value: new Date(Number(transferInfo?.mtsAdd)).toLocaleString()
        });
      }
      if (transferInfo?.mtsMod) {
        infoA.push({
          name: 'OP Updated at',
          value: new Date(Number(transferInfo?.mtsMod)).toLocaleString()
        });
      }

      setInfoArray(infoA);
    }
  }, [transferInfo]);

  return (
    <>
      {infoArray &&
        infoArray.length > 0 &&
        infoArray.map((info, index) => {
          if (info.name == 'From' || info.name == 'To' || info.name == 'Check Point') {
            return (
              <MiddleCard key={index}>
                <Row justifyBetween full itemsCenter py="sm">
                  <Text text={info.name} preset="sub" selectText />
                  <Row
                    justifyCenter
                    itemsCenter
                    gap="xs"
                    onClick={() => {
                      copyToClipboard(info.value).then(() => {
                        tools.toastSuccess(t('Copied'));
                      });
                    }}
                  >
                    <Text text={shortAddress(info.value, 8)} wrap selectText />
                    <CopyOutlined style={{ color: '#888', fontSize: 14 }} />
                  </Row>
                </Row>
              </MiddleCard>
            );
          }
          return (
            <MiddleCard key={index}>
              <Row justifyBetween full itemsCenter py="sm">
                <Text text={info.name} preset="sub" selectText />
                <Text text={info.value} wrap selectText color={info.name == 'OP Error' ? 'red' : undefined} />
              </Row>
            </MiddleCard>
          );
        })}
      <EndCard>
        <Row justifyBetween full itemsCenter>
          <Text text="Reveal TX" preset="sub" selectText />
          <Row
            gap="xs"
            itemsCenter
            onClick={() => {
              window.open(`${blockstreamUrl}/txs/${revealTx}`);
            }}
          >
            <Text preset="link" text={shortAddress(revealTx, 12)} selectText />
            <Icon icon="link" size={fontSizes.xxs} color="blue" />
          </Row>
        </Row>
      </EndCard>
    </>
  );
}
