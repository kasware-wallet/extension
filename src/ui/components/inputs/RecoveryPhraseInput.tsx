import React from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface RecoveryPhraseInputProps {
  value: string;
  onChange: (value: string) => void;
  onPaste?: (event: React.ClipboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  index: number;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

const RecoveryPhraseInput: React.FC<RecoveryPhraseInputProps> = ({
  value,
  onChange,
  onPaste,
  disabled = false,
  index,
  isVisible,
  onToggleVisibility
}) => (
  <div className="relative w-full">
    <input
      type={isVisible ? 'text' : 'password'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onPaste={onPaste}
      disabled={disabled}
      className="bg-bgdarker border border-muted rounded px-2 text-primarytext text-sm focus:outline-none w-full h-8"
      tabIndex={index + 1}
    />
    <button type="button" onClick={onToggleVisibility} className="absolute right-2 top-1/2 transform -translate-y-1/2">
      {isVisible ? <EyeIcon className="h-5 w-5 text-mutedtext" /> : <EyeSlashIcon className="h-5 w-5 text-mutedtext" />}
    </button>
  </div>
);

export default RecoveryPhraseInput;
