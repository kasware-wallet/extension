import type { ReactNode, SyntheticEvent } from 'react';
import { useEffect, useState } from 'react';
import cx from 'clsx';
import clsx from 'clsx';
import './style.less';

interface CheckboxProps {
  checked: boolean;
  defaultChecked?: boolean;
  onChange?(checked: boolean): void;
  background?: string;
  unCheckBackground?: string;
  width?: string;
  height?: string;
  className?: string;
  checkBoxClassName?: string;
  children?: ReactNode;
  checkIcon?: ReactNode;
  type?: 'circle' | 'square';
}

const Checkbox = ({
  checked,
  onChange,
  defaultChecked = false,
  background = 'var(--r-blue-default, #339999)',
  unCheckBackground = 'var(--r-neutral-line, #D3D8E0)',
  type = 'circle',
  width = '16px',
  height = '16px',
  checkBoxClassName,
  className,
  children,
  checkIcon
}: CheckboxProps) => {
  const [checkState, setCheckState] = useState(defaultChecked);

  useEffect(() => {
    setCheckState(checked);
  }, [checked]);

  const handleValueChange = (e: SyntheticEvent, newChecked: boolean) => {
    e.stopPropagation();
    onChange && onChange(newChecked);
  };

  return (
    <div
      className={cx('kasware-checkbox__wrapper', className, {
        checked: checkState
      })}
      onClick={(e) => handleValueChange(e, !checkState)}
    >
      <div
        className={clsx('kasware-checkbox', type, checkBoxClassName)}
        style={{
          width,
          height,
          backgroundColor: checkState ? background : unCheckBackground
        }}
      >
        {checkIcon ? (
          checkIcon
        ) : (
          <svg
            className="icon icon-check"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 3L4.5 8.5L2 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      {children && <div className="kasware-checkbox__label">{children}</div>}
    </div>
  );
};

export default Checkbox;
