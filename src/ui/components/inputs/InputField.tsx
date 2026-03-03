import React from 'react';

interface InputFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder: string;
  type?: string;
  className?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  value,
  onChange,
  onKeyDown,
  placeholder,
  type = 'text',
  className = ''
}) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    onKeyDown={onKeyDown}
    placeholder={placeholder}
    className={`w-full p-2 border border-muted bg-transparent text-base text-primarytext placeholder-mutedtext rounded ${className}`}
  />
);

export default InputField;
