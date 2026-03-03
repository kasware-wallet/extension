// RecipientInput.tsx
import React from 'react';

interface RecipientInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const RecipientInput: React.FC<RecipientInputProps> = ({ value, onChange }) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    placeholder="Recipient's Kaspa address"
    className="w-full p-3 border border-slightmuted bg-bgdarker text-base text-primarytext placeholder-lightmuted rounded"
  />
);

export default RecipientInput;
