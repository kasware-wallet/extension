import React from 'react';

import { CloseOutlined } from '@ant-design/icons';

import { colors } from '@/ui/theme/colors';

import { Row } from '../Row';

export const Popover = ({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) => {
  return (
    <div
      className="popover-container"
      style={{
        backgroundColor: colors.border
      }}
    >
      <div style={{ backgroundColor: colors.bg5, width: 340, padding: 20, borderRadius: 5, position: 'relative' }}>
        {onClose && (
          <Row
            style={{ position: 'absolute', top: 10, right: 10 }}
            justifyEnd
            onClick={() => {
              onClose();
            }}
          >
            <CloseOutlined />
          </Row>
        )}

        {children}
      </div>
    </div>
  );
};
