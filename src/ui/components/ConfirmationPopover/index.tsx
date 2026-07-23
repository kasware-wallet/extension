import React from 'react';

import { Button } from '../Button';
import { Card } from '../Card';
import { Column } from '../Column';
import { Icon } from '../Icon';
import { Popover } from '../Popover';
import { Row } from '../Row';

export type ButtonPreset = 'primary' | 'danger' | 'default';

export interface ConfirmationPopoverProps {
  /** Callback when popover is closed */
  onClose: () => void;
  /** Content inside the card */
  children: React.ReactNode;
  /** Text for the confirm button */
  confirmText?: string;
  /** Preset style for confirm button */
  confirmPreset?: ButtonPreset;
  /** Callback when confirm button is clicked */
  onConfirm?: () => void | Promise<void>;
  /** Additional content below the card (warnings, etc.) */
  extraContent?: React.ReactNode;
  /** Icon to show (defaults to trash can) */
  icon?: React.ReactNode;
  /** Card width */
  cardWidth?: number;
}

const defaultIcon = (
  <div
    style={{
      width: 30,
      height: 30,
      borderRadius: '1.5rem',
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center'
    }}
  >
    <Icon icon="trash-can" color="danger_muted" size={16} />
  </div>
);

/**
 * Unified confirmation popover component.
 * Previously split into HideAccountPopover, HideTokenPopover, RemoveContactPopover, RemoveWalletPopover.
 */
export const ConfirmationPopover = ({
  onClose,
  children,
  confirmText = 'Confirm',
  confirmPreset = 'primary',
  onConfirm,
  extraContent,
  icon = defaultIcon,
  cardWidth = 300
}: ConfirmationPopoverProps) => {
  return (
    <Popover onClose={onClose}>
      <Column justifyCenter itemsCenter>
        {icon}
        <Card preset="style2" style={{ width: cardWidth }}>
          <Column my="xl">{children}</Column>
        </Card>
        {extraContent}
        <Row full>
          <Button
            text="Cancel"
            full
            onClick={() => {
              onClose();
            }}
          />
          <Button
            text={confirmText}
            preset={confirmPreset}
            full
            onClick={async () => {
              if (onConfirm) {
                await onConfirm();
              }
            }}
          />
        </Row>
      </Column>
    </Popover>
  );
};
