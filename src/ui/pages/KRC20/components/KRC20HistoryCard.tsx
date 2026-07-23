import { useMemo } from 'react';

import type {
  IKRC20Blacklist,
  IKRC20Deploy,
  IKRC20DeployIssue,
  IKRC20Send,
  IKRC20Transfer,
  IToken,
  TKRC20History,
  TKRC20HistoryIssue
} from '@/shared/types';
import { Card, Column, Row, Text } from '@/ui/components';
import { colors } from '@/ui/theme/colors';
import { fontSizes } from '@/ui/theme/font';
import { formatLocaleString, formatTimeAgo, shortAddress } from '@/ui/utils';
import { sompiToAmount } from '@/shared/utils/format';
import { useCurrentAccount } from '@/ui/state/accounts/hooks';
import { useNavigate } from '@/ui/pages/MainRoute';
import { LockOutlined } from '@ant-design/icons';

interface KRC20HistoryCardProps {
  token: IToken;
  history: TKRC20History | TKRC20HistoryIssue;
}

export function KRC20HistoryCard({ token, history }: KRC20HistoryCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      classname="card-select"
      mt="sm"
      onClick={() => {
        navigate('KRC20TxDetailScreen', { txDetail: history, op: history.op, token: token });
      }}
    >
      <Row full justifyBetween>
        <Column full>
          <Row justifyBetween>
            <KRC20OpAddress history={history} />
            <KRC20TxConfirmState txAccept={history.txAccept} opAccept={history.opAccept} opError={history.opError} />
          </Row>
          <Row justifyBetween>
            <KRC20OpAmount history={history} token={token} />
            <Text text={formatTimeAgo(Number(history.mtsAdd))} preset="sub" />
          </Row>
          {history?.op == 'deploy' && (history as IKRC20Deploy)?.pre && Number((history as IKRC20Deploy)?.pre) > 0 && (
            <Row justifyBetween>
              <KRC20OpAmountPreAllocation history={history as IKRC20Deploy} token={token} />
              <Text text={formatTimeAgo(Number(history.mtsAdd))} preset="sub" />
            </Row>
          )}
        </Column>
      </Row>
    </Card>
  );
}

function KRC20OpAddress({ history }: { history: TKRC20History | TKRC20HistoryIssue }) {
  const currentAccount = useCurrentAccount();

  if (history.op == 'transfer' || history.op == 'issue' || history.op == 'chown') {
    if (history.from == currentAccount.address) {
      return (
        <Row>
          <Text text={`${history.op} to ${shortAddress((history as IKRC20Transfer).to)}`} preset="sub" />
        </Row>
      );
    }
    if ((history as IKRC20Transfer).to == currentAccount.address) {
      return (
        <Row>
          <Text text={`${history.op} from ${shortAddress(history.from)}`} preset="sub" />
        </Row>
      );
    }
  }

  if (history.op == 'mint') {
    return (
      <Row>
        <Text text="Mint" preset="sub" />
      </Row>
    );
  }

  if (history.op == 'deploy') {
    return (
      <Row>
        <Text text={Number((history as IKRC20Deploy)?.pre) > 0 ? 'Deploy & Pre-Allocation' : 'Deploy'} preset="sub" />
      </Row>
    );
  }

  if (history.op == 'send') {
    if ((history as IKRC20Send).to == currentAccount.address) {
      return (
        <Row>
          <Text text={`${history.op} from ${shortAddress(history.from)}`} preset="sub" />
        </Row>
      );
    }
    if (history.from == currentAccount.address) {
      return (
        <Row>
          <Text text={`${history.op} to ${shortAddress((history as IKRC20Send).to)}`} preset="sub" />
        </Row>
      );
    }
  }

  if (history.op == 'burn') {
    return (
      <Row>
        <Text text={`${history.op} from ${shortAddress(history.from)}`} preset="sub" />
      </Row>
    );
  }

  if (history.op == 'blacklist') {
    return (
      <Row>
        <Text text={`${history.op} ${shortAddress((history as IKRC20Blacklist).to)}`} preset="sub" />
      </Row>
    );
  }

  if (history.op == 'list') {
    return (
      <Row>
        <Text text={`${history.op} for sale`} preset="sub" />
      </Row>
    );
  }

  return (
    <Row>
      <Text text={history.op} preset="sub" />
    </Row>
  );
}

function KRC20TxConfirmState({ opAccept }: { txAccept: string; opAccept: string; opError: string }) {
  if (opAccept == '1') {
    return (
      <Row>
        <Text text={'Success'} preset="sub" />
      </Row>
    );
  }
  if (opAccept == '-1') {
    return (
      <Row>
        <Text text={'Failed'} preset="sub" color="red" />
      </Row>
    );
  }
  if (opAccept == '0') {
    return (
      <Row>
        <Text text={'Unconfirmed'} preset="sub" />
      </Row>
    );
  }
  return null;
}

function KRC20OpAmount({ history, token }: { history: TKRC20History | TKRC20HistoryIssue; token: IToken }) {
  const currentAccount = useCurrentAccount();
  const formattedAmount = useMemo(() => {
    return formatLocaleString(sompiToAmount((history as IKRC20Transfer)?.amt, token?.decimals ?? '8'));
  }, [token?.decimals, history]);

  if (history.op == 'transfer') {
    if (history.from == currentAccount.address) {
      return (
        <Row itemsCenter>
          <Text text={'-'} color={'red'} />
          <Text text={`${formattedAmount} ${token.tick}`} />
        </Row>
      );
    }
    if ((history as IKRC20Transfer).to == currentAccount.address) {
      return (
        <Row itemsCenter>
          <Text text={'+'} color={'green'} />
          <Text text={`${formattedAmount} ${token.tick}`} />
        </Row>
      );
    }
  }

  if (history.op == 'send') {
    if ((history as IKRC20Send).to == currentAccount.address) {
      return (
        <Row itemsCenter>
          <Text text={'+'} color={'green'} />
          <Text text={`${formattedAmount} ${token.tick}`} />
        </Row>
      );
    } else if (history.from == currentAccount.address) {
      return (
        <Row itemsCenter>
          <Text text={'-'} color={'red'} />
          <Text text={`${formattedAmount} ${token.tick}`} />
        </Row>
      );
    } else {
      return (
        <Row itemsCenter>
          <Text text={''} />
          <Text text={`${formattedAmount} ${token.tick}`} />
        </Row>
      );
    }
  }

  if (history.op == 'list') {
    return (
      <Row itemsCenter>
        <LockOutlined
          style={{
            fontSize: fontSizes.icon,
            color: colors.red
          }}
        />
        <Text text={`${formattedAmount} ${token.tick}`} />
      </Row>
    );
  }

  if (history.op == 'mint') {
    return (
      <Row itemsCenter>
        <Text text={'+'} color={'green'} />
        <Text text={`${formattedAmount} ${token.tick}`} />
      </Row>
    );
  }

  if (history.op == 'deploy') {
    return (
      <Column full>
        <Text
          text={`${formatLocaleString(sompiToAmount((history as IKRC20Deploy)?.max, token?.decimals ?? '8'))} ${
            token.tick
          }`}
        />
      </Column>
    );
  }

  if (history.op == 'burn') {
    return (
      <Row itemsCenter>
        <Text text={'-'} color={'red'} />
        <Text text={`${formattedAmount} ${token.tick}`} />
      </Row>
    );
  }

  if (history.op == 'blacklist') {
    if ((history as IKRC20Blacklist).mod == 'add') {
      return (
        <Row itemsCenter>
          <Text text={'blocked'} color={'red'} />
          <Text text={`${token.tick}`} />
        </Row>
      );
    }
    if ((history as IKRC20Blacklist).mod == 'remove') {
      return (
        <Row itemsCenter>
          <Text text={'unblocked'} color={'green'} />
          <Text text={`${token.tick}`} />
        </Row>
      );
    }
  }

  if (history.op == 'issue') {
    return (
      <Row itemsCenter>
        <Text text={'+'} color={'green'} />
        <Text text={`${formattedAmount} ${token.tick}`} />
      </Row>
    );
  }

  if (history.op == 'chown') {
    return (
      <Row itemsCenter>
        <Text text={`${token.tick}`} />
      </Row>
    );
  }

  return null;
}

function KRC20OpAmountPreAllocation({ token, history }: { token: IToken; history: IKRC20Deploy | IKRC20DeployIssue }) {
  if (history.op == 'deploy') {
    return (
      <Column full>
        <Text text={`${formatLocaleString(sompiToAmount(history?.pre, token?.decimals ?? '8'))} ${token.tick}`} />
      </Column>
    );
  }
  return null;
}
