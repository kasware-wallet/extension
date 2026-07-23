import type { ReactNode } from 'react';

import { ExportOutlined } from '@ant-design/icons';

import { Column, Content, Row, Text } from '..';
import { CopyableAddress } from '../CopyableAddress';
import { Icon } from '../Icon';
import { colors } from '@/ui/theme/colors';
import { spacingGap } from '@/ui/theme/spacing';

export interface TxLinkRowProps {
  label: string;
  txId: string;
  blockstreamUrl: string;
}

/**
 * Transaction link row for displaying commit/reveal transaction links.
 */
export const TxLinkRow = ({ label, txId, blockstreamUrl }: TxLinkRowProps) => (
  <Row
    justifyCenter
    onClick={() => {
      window.open(`${blockstreamUrl}/transactions/${txId}`);
    }}
  >
    <Text preset="regular-bold" text={label} color="aqua" size="md" selectText />
    <Text preset="regular-bold" text={txId ? `${txId.slice(0, 8)}...${txId.slice(-6)}` : ''} color="aqua" size="md" />
    <ExportOutlined style={{ color: colors.aqua, fontSize: 12 }} />
  </Row>
);

export interface TxSuccessLayoutProps {
  /** Icon name (default: 'success') */
  icon?: string;
  /** Title text */
  title: string;
  /** Main description text */
  description: ReactNode;
  /** Destination address to display */
  destAddress?: string;
  /** Additional content between description and tx links */
  extraContent?: ReactNode;
  /** Transaction links to display */
  txLinks?: TxLinkRowProps[];
  /** Footer buttons */
  footer: ReactNode;
}

/**
 * Unified layout for transaction success screens.
 * Previously duplicated across SendKaspaTxSuccess, KRC20DeployTxSuccess, etc.
 */
export const TxSuccessLayout = ({
  icon = 'success',
  title,
  description,
  destAddress,
  extraContent,
  txLinks,
  footer
}: TxSuccessLayoutProps) => {
  return (
    <>
      <Content style={{ gap: spacingGap.lg }}>
        <Column justifyCenter mt="xxl" gap="xl">
          <Row justifyCenter mt="xxl">
            <Icon icon={icon} size={60} style={{ alignSelf: 'center' }} />
          </Row>
          <Text preset="title" text={title} textCenter size="xxxl" selectText />
          {typeof description === 'string' ? (
            <Text text={description} color="textDim" textCenter selectText />
          ) : (
            description
          )}
          {destAddress && (
            <Row justifyCenter>
              <CopyableAddress address={destAddress} />
            </Row>
          )}
          {extraContent}
          {txLinks?.map((link, index) => (
            <TxLinkRow key={index} {...link} />
          ))}
        </Column>
      </Content>
      {footer}
    </>
  );
};
