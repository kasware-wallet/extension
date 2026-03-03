import React from 'react';

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string; // New prop for custom class names
}

export default function ActionButton({ icon, label, onClick, disabled = false, className = '' }: ActionButtonProps) {
  return (
    <button
      className={`flex flex-col items-center justify-center group ${className} ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      }`}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
    >
      <div
        style={{ width: '72px', height: '72px' }}
        className={`flex flex-col items-center justify-center rounded-[15px] transition ${
          disabled ? 'bg-darkmuted' : 'bg-darkmuted hover:bg-slightmuted'
        }`}
      >
        <div className={`h-8 w-8 ${disabled ? 'text-mutedtext' : 'text-primary'}`}>{icon}</div>
        <span
          className={`text-sm mt-1 transition ${
            disabled ? 'text-mutedtext' : 'text-mutedtext group-hover:text-primary'
          }`}
        >
          {label}
        </span>
      </div>
    </button>
  );
}
