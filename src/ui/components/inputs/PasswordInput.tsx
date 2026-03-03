import React, { ChangeEvent, useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  isError?: boolean;
}

const PasswordInput: React.FC<PasswordInputProps> = ({ id, value, onChange, placeholder = '', isError = false }) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleClick = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative w-full my-2 inline-block">
      <input
        type={showPassword ? 'text' : 'password'}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={
          'w-full p-2 pl-4 border h-[52px] bg-bgdarker text-lg text-primarytext placeholder-muted rounded ' +
          (isError ? 'border-error' : 'border-slightmuted')
        }
      />
      {showPassword ? (
        <EyeSlashIcon
          className="absolute h-6 w-6 text-lightmuted right-4 top-1/2 transform -translate-y-1/2 cursor-pointer"
          onClick={handleClick}
        />
      ) : (
        <EyeIcon
          className="absolute h-6 w-6 text-lightmuted right-4 top-1/2 transform -translate-y-1/2 cursor-pointer"
          onClick={handleClick}
        />
      )}
    </div>
  );
};

export default PasswordInput;
