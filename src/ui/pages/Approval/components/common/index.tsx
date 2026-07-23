import React from 'react';

import { Button, Card, Column, Content, Footer, Layout, Row, Text } from '@/ui/components';
import { LoadingSpinner } from '@/ui/components';

interface SectionProps {
  title: string;
  children?: React.ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <Column>
      <Text text={title} preset="bold" />
      <Card>
        <Row full justifyBetween itemsCenter>
          {children}
        </Row>
      </Card>
    </Column>
  );
}

interface LoadingViewProps {
  loadingText?: string;
}

export function LoadingView({ loadingText }: LoadingViewProps) {
  return (
    <Layout>
      <Content itemsCenter justifyCenter>
        <LoadingSpinner size="xlarge" text={loadingText} />
      </Content>
    </Layout>
  );
}

interface ScammerViewProps {
  onCancel: () => void;
}

export function ScammerView({ onCancel }: ScammerViewProps) {
  return (
    <Layout>
      <Content>
        <Column>
          <Text text="Phishing Detection" preset="title-bold" textCenter mt="xxl" selectText />
          <Text text="Malicious behavior and suspicious activity have been detected." mt="md" selectText />
          <Text
            text="Your access to this page has been restricted by KasWare Wallet as it might be unsafe."
            mt="md"
            selectText
          />
        </Column>
      </Content>

      <Footer>
        <Row full>
          <Button text="Reject (blocked by KasWare Wallet)" preset="danger" onClick={onCancel} full />
        </Row>
      </Footer>
    </Layout>
  );
}
