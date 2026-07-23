import React from 'react';

import { colors } from '@/ui/theme/colors';

import { Column } from '../Column';
import { Footer } from '../Footer';
import { Row } from '../Row';

export function FooterButtonContainer({ children }: { children: React.ReactNode }) {
  return (
    <Column>
      <Row style={{ height: 60 }}></Row>
      <Footer style={{ position: 'absolute', height: 60, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg5 }}>
        {children}
      </Footer>
    </Column>
  );
}
