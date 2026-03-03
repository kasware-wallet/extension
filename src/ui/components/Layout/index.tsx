import type { CSSProperties } from 'react';
import React from 'react';

import './index.less';

export interface LayoutProps {
  children?: React.ReactNode;
  style?: CSSProperties;
}
export function Layout(props: LayoutProps) {
  const { children, style: $styleBase } = props;
  return (
    <div
      className="layout"
      style={Object.assign(
        {
          display: 'flex',
          flexDirection: 'column',
          width: '100vw',
          maxWidth: '800px',
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          margin: '0 auto'
        },
        $styleBase
      )}
    >
      {children}
    </div>
  );
}
