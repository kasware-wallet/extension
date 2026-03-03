import { Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { colors } from '@/ui/theme/colors';
import { useLocationState } from '@/ui/utils';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function TxFailScreen() {
  const { t } = useTranslation();
  const { error } = useLocationState<{ error: string }>();
  const [isMassResaon, setIsMassResaon] = useState(false);
  const [isInTheMempool, setIsInTheMempool] = useState(false);
  const [donotRBF, setDonotRBF] = useState(false);
  useEffect(() => {
    if (error && error.includes('is larger than max allowed size of 100000')) {
      setIsMassResaon(true);
    } else if (error && error.includes('replace by fee found no')) {
      setDonotRBF(true);
    } else if (error && error.includes('in the mempool')) {
      setIsInTheMempool(true);
    }
  }, [error]);
  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
      />
      <Content>
        <Column justifyCenter mt="xxl" gap="xl">
          <Row justifyCenter>
            <Icon icon="delete" size={50} />
          </Row>

          <Text preset="title" text={t('Payment Failed')} textCenter />
          {isMassResaon && (
            <Text
              text={t('Your transfer amount is too small.')}
              textCenter
              style={{
                userSelect: 'text',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                flexWrap: 'wrap'
              }}
            />
          )}
          {donotRBF && (
            <>
              <Text
                textCenter
                text={'disable RBF and try again'}
                style={{
                  userSelect: 'text',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  flexWrap: 'wrap'
                }}
              />
            </>
          )}
          {isInTheMempool && (
            <>
              <Text
                textCenter
                text={'A previous transaction is in the mempool and will be included into a block soon.'}
                style={{
                  userSelect: 'text',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  flexWrap: 'wrap'
                }}
              />
              <Text
                textCenter
                text={'Or you can enable RBF and try again to replace the previous transaction.'}
                style={{
                  userSelect: 'text',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  flexWrap: 'wrap'
                }}
              />
            </>
          )}
          <Text
            preset="sub"
            style={{
              color: colors.red,
              wordWrap: 'break-word',
              userSelect: 'text',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              flexWrap: 'wrap'
            }}
            text={error}
            textCenter
            selectText
          />
        </Column>
      </Content>
    </Layout>
  );
}
