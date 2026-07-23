import clsx from 'clsx';
import type { ReactNode } from 'react';
import React from 'react';
import './style.less';

interface EmptyProps {
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
  title?: ReactNode;
  desc?: ReactNode;
  text?: string;
}

const Empty = ({ className, style, children, title, desc, text }: EmptyProps) => {
  const displayText = text || desc;
  return (
    <div className={clsx('kasware-empty', className)} style={style}>
      <img className="kasware-empty-image" src="./images/nodata-tx.png" alt="empty" />
      <div className="kasware-empty-content">
        {title && <div className="kasware-empty-title">{title}</div>}
        <div className="kasware-empty-desc">{children ? children : displayText}</div>
      </div>
    </div>
  );
};

export default Empty;
