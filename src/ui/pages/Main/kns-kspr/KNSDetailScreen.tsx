// import moment from 'moment';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { IKNSAsset } from '@/shared/types';
import { TxType } from '@/shared/types';
import { Button, Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { useQueryConfigJSON } from '@/ui/hooks/kasware';
import { useCurrentAccount } from '@/ui/state/accounts/hooks';
import { useAppSelector } from '@/ui/state/hooks';
import { selectBlockstreamUrl, selectNetworkId } from '@/ui/state/settings/reducer';
import { useResetUiTxCreateScreen } from '@/ui/state/ui/hooks';
import type { ColorTypes } from '@/ui/theme/colors';
import { fontSizes } from '@/ui/theme/font';
import { copyToClipboard, useLocationState } from '@/ui/utils';
import { useNavigate } from '../../MainRoute';

// import { useNavigate } from '../MainRoute';

// const HIGH_BALANCE = 10000;
export default function KNSDetailScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { knsAsset } = useLocationState<{ knsAsset: IKNSAsset }>();
  const resetUiTxCreateScreen = useResetUiTxCreateScreen();

  const currentAccount = useCurrentAccount();
  // const withSend = currentAccount.pubkey.includes(inscription.owner);

  // const dispatch = useAppDispatch();
  // const krc20LaunchStatus = useKRC20LaunchStatus();
  const networkId = useAppSelector(selectNetworkId);
  const [enableSend, setEnableSend] = useState(false);
  const configJSON = useQueryConfigJSON();
  const krc20LaunchStatus = useMemo(
    () => ({
      mainnet: configJSON.data?.mainnet ?? true,
      testnet: configJSON.data?.testnet ?? true
    }),
    [configJSON.data?.mainnet, configJSON.data?.testnet]
  );
  const isUnconfirmed = knsAsset.creationBlockTime == '0';
  const isListed = knsAsset?.status == 'listed';

  const blockstreamUrl = useAppSelector(selectBlockstreamUrl);
  const contentType = useMemo(() => {
    if (knsAsset.mimeType == '1') {
      return 'Text (Plain)';
    } else {
      return knsAsset.mimeType;
    }
  }, [knsAsset.mimeType]);

  useEffect(() => {
    if (networkId == 'mainnet' && krc20LaunchStatus.mainnet) {
      setEnableSend(true);
    } else if (networkId == 'testnet-10' && krc20LaunchStatus.testnet) {
      setEnableSend(true);
    }
  }, [networkId, krc20LaunchStatus]);

  return (
    <Layout>
      <Header
        title={'KNS'}
        onBack={() => {
          window.history.go(-1);
        }}
      />
      <Content>
        <Column>
          <Column justifyCenter>
            <h1 className="text-3xl font-bold text-primary overflow-hidden text-ellipsis break-words flex justify-center max-w-full">
              {knsAsset.asset}
            </h1>
          </Column>
          {enableSend == true && (
            <Row justifyEnd fullX>
              <Button
                text={t('Send')}
                disabled={isListed}
                icon="send"
                onClick={() => {
                  resetUiTxCreateScreen();
                  navigate('SendKNSnKSPRScreen', { type: TxType.SIGN_KNS_TRANSFER, knsAsset });
                }}
              />
            </Row>
          )}
          {isListed == true && <Text text={'Your domain is listed for sale'} color="warning" textCenter selectText />}

          <Column gap="lg">
            <Section title="Inscription Number" value={`#${knsAsset.id}`} valueColor={'aqua'} />
            <Section title="Inscription Id" value={knsAsset.assetId} />

            <Section title="Owner Address" value={currentAccount.address} />

            {contentType !== undefined && contentType?.length > 0 && (
              <Section title="Content Type" value={contentType} />
            )}
            <Section
              title="Timestamp"
              value={isUnconfirmed ? 'unconfirmed' : new Date(knsAsset.creationBlockTime).toLocaleString()}
            />

            <Section
              title="View on"
              value={'Explorer'}
              link={`${blockstreamUrl}/txs/${knsAsset.assetId?.slice(0, -2)}`}
            />
          </Column>
        </Column>
      </Content>
    </Layout>
  );
}

function Section({
  value,
  title,
  link,
  valueColor
}: {
  value: string | number;
  title: string;
  link?: string;
  valueColor?: ColorTypes;
}) {
  const tools = useTools();
  return (
    <Column>
      <Text text={title} preset="sub" />
      <Row itemsCenter gap="xs">
        <Text
          text={value}
          preset={link ? 'link' : 'regular'}
          size="xs"
          color={valueColor || undefined}
          wrap
          onClick={() => {
            if (link) {
              window.open(link);
            } else {
              copyToClipboard(value).then(() => {
                tools.toastSuccess('Copied');
              });
            }
          }}
        />
        {link !== undefined && <Icon icon="link" size={fontSizes.xxs} color="blue" />}
      </Row>
    </Column>
  );
}
