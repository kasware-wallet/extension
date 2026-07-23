import { useEffect, useState } from 'react';

import type { IKRC20TokenIntro, Inscription } from '@/shared/types';
import { Card, Icon, Row, Text } from '@/ui/components';
import { MiddleCard } from '@/ui/components/Card';
import { useAppDispatch } from '@/ui/state/hooks';
import { uiActions } from '@/ui/state/ui/reducer';
import { fontSizes } from '@/ui/theme/font';
import { useKrc20TokenSocialInfosQuery } from '@/ui/hooks/kasware';
import { LoadingSpinner } from '@/ui/components';

interface TokenInfoItem {
  name: string;
  value: string;
}

interface TokenSocialInfoProps {
  krc20Token: Inscription;
}

export function TokenSocialInfo({ krc20Token }: TokenSocialInfoProps) {
  const dispatch = useAppDispatch();
  const [tokenWebs, setTokenWebs] = useState<TokenInfoItem[]>([]);
  const [tokenIntro, setTokenIntro] = useState<IKRC20TokenIntro | undefined>(undefined);
  const { data, isLoading } = useKrc20TokenSocialInfosQuery();

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      dispatch(uiActions.updateKRC20TokenIntro({ krc20TokenIntro: data }));
      if (data && krc20Token?.ca?.toLowerCase() && data[krc20Token?.ca?.toLowerCase()]) {
        setTokenIntro(data[krc20Token?.ca?.toLowerCase()]);
      } else if (data && krc20Token?.tick?.toLowerCase() && data[krc20Token?.tick?.toLowerCase()]) {
        setTokenIntro(data[krc20Token?.tick?.toLowerCase()]);
      }
    }
  }, [data, dispatch, krc20Token]);

  useEffect(() => {
    if (tokenIntro) {
      const infoA: TokenInfoItem[] = [];
      if (tokenIntro?.website && tokenIntro?.website.length > 0) {
        infoA.push({
          name: 'Website',
          value: tokenIntro?.website
        });
      }
      if (tokenIntro?.twitter && tokenIntro?.twitter.length > 0) {
        infoA.push({
          name: 'X/Twitter',
          value: tokenIntro?.twitter
        });
      }
      if (tokenIntro?.telegram && tokenIntro?.telegram.length > 0) {
        infoA.push({
          name: 'Telegram',
          value: tokenIntro?.telegram
        });
      }
      if (tokenIntro?.discord && tokenIntro?.discord.length > 0) {
        infoA.push({
          name: 'Discord',
          value: tokenIntro?.discord
        });
      }
      setTokenWebs(infoA);
    }
  }, [tokenIntro]);

  if (isLoading) {
    return (
      <Row justifyCenter mt="sm">
        <LoadingSpinner size="medium" />
      </Row>
    );
  }

  return (
    <>
      {tokenIntro?.desc != undefined && tokenIntro?.desc?.length > 0 && (
        <Row justifyCenter fullX mt={'xl'} mb="sm">
          <Card fullX>
            <Text
              size="sm"
              color="textDim"
              preset="sub"
              text={tokenIntro?.desc}
              style={{
                userSelect: 'text',
                maxHeight: 384,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                flexWrap: 'wrap'
              }}
            />
          </Card>
        </Row>
      )}
      {tokenWebs &&
        tokenWebs.length > 0 &&
        tokenWebs.map((info, index) => (
          <MiddleCard key={index}>
            <Row justifyBetween full itemsCenter py="sm">
              <Text text={info.name} preset="sub" selectText />
              <Row
                gap="xxs"
                itemsCenter
                onClick={() => {
                  window.open(info.value);
                }}
              >
                <Text preset="link" text={info.value} selectText />
                <Icon icon="link" size={fontSizes.xxs} color="blue" />
              </Row>
            </Row>
          </MiddleCard>
        ))}
    </>
  );
}
