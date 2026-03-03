import React from 'react';
import { Checkbox as HeadlessCheckbox } from '@headlessui/react';
import { CheckIcon } from '@heroicons/react/24/outline';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange }) => (
  <HeadlessCheckbox
    checked={checked}
    onChange={onChange}
    className={`relative h-6 w-6 aspect-square rounded border-2 border-bgdarker hover:cursor-pointer ${
      checked ? 'bg-primary' : 'bg-white'
    }`}
  >
    <span
      className={`absolute inset-0 flex items-center justify-center ${
        checked ? 'text-secondarytext' : 'text-transparent'
      }`}
    >
      <CheckIcon style={{ strokeWidth: 3 }} className="w-4 h-4" />
    </span>
  </HeadlessCheckbox>
);

export default Checkbox;
