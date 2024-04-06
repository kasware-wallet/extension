import { Button, Card, Column, Content, Header, Layout } from '@/ui/components';
import { useTranslation } from 'react-i18next';

const UPGRADE_NOTICE = '...';
export default function UpgradeNoticeScreen() {
  const { t } = useTranslation();
  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={t('Notice')}
      />
      <Content>
        <Column>
          <Card>
            <div
              style={{
                userSelect: 'text',
                maxHeight: 384,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                flexWrap: 'wrap'
              }}>
              {UPGRADE_NOTICE}
            </div>
          </Card>
          <Button
            text="OK"
            preset="danger"
            onClick={async () => {
              window.history.go(-1);
            }}
          />
        </Column>
      </Content>
    </Layout>
  );
}
