// import moment from 'moment';

import { TxType } from '@/shared/types';
import { Button, Column, Content, Header, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { useKsprNftMetadataQuery } from '@/ui/hooks/KsprNft/fetchKsprNft';
import { useCacheKrc721StreamUrl } from '@/ui/state/settings/hooks';
import { useResetUiTxCreateScreen } from '@/ui/state/ui/hooks';
import type { ColorTypes } from '@/ui/theme/colors';
import { copyToClipboard, useLocationState } from '@/ui/utils';
import log from 'loglevel';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '../../MainRoute';

interface LocationState {
  tokenId: string;
  tick: string;
}
export default function KsprDetailScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { tokenId, tick } = useLocationState<LocationState>();
  const resetUiTxCreateScreen = useResetUiTxCreateScreen();
  const cacheKrc721StreamUrl = useCacheKrc721StreamUrl();
  const { data } = useKsprNftMetadataQuery(tick, tokenId);
  log.debug('data', data);

  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [attributes, setAttributes] = useState<any[]>([{}]);

  useEffect(() => {
    if (!data) return;
    if (data.name) setName(data.name);
    if (data.description) setDescription(data.description);
    if (data.attributes) setAttributes(data.attributes);
  }, [data]);

  return (
    <Layout>
      <Header
        title={name}
        onBack={() => {
          window.history.go(-1);
        }}
      />
      <Content>
        <Column>
          <Row justifyCenter itemsCenter selfItemsCenter>
            <img
              src={`${cacheKrc721StreamUrl}/optimized/${tick}/${tokenId}`}
              alt="KASPUNKS #5"
              className="w-3/5 h-auto"
            />
          </Row>
          <Row justifyEnd fullX>
            <Button
              text={t('Send')}
              preset="default"
              icon="send"
              onClick={() => {
                resetUiTxCreateScreen();
                navigate('SendKNSnKSPRScreen', { type: TxType.SIGN_KSPRNFT_TRANSFER, ksprAsset: { tokenId, tick } });
              }}
            />
          </Row>

          <Column gap="lg">
            <Section title="Name" value={`${name}`} valueColor={'aqua'} />
            <Section title="Description" value={description} />
            <Text text={'Attribute'} preset="sub" />
            <Row justifyBetween>
              <Column justifyCenter fullX>
                {attributes
                  .filter((item, index) => index % 2 === 0)
                  .map((attr, index) => (
                    <Attribute key={index} {...attr} />
                  ))}
              </Column>
              <Column justifyCenter fullX>
                {attributes
                  .filter((item, index) => index % 2 === 1)
                  .map((attr, index) => (
                    <Attribute key={index} {...attr} />
                  ))}
              </Column>
            </Row>
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
    </Column>
  );
}

function Attribute({ trait_type, value }: { trait_type: string; value: string }) {
  return (
    <Column gap="xs">
      <Text text={trait_type} size="sm" color="grey" />
      <Text text={value} />
    </Column>
  );
}
