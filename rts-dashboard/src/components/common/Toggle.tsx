import React from 'react';

interface ToggleOption {
  value: string;
  label: string;
}

interface ToggleProps {
  options: ToggleOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const Toggle: React.FC<ToggleProps> = ({ options, value, onChange, className = 'tgl' }) => (
  <div className={className}>
    {options.map(opt => (
      <button
        key={opt.value}
        className={value === opt.value ? 'on' : ''}
        onClick={() => onChange(opt.value)}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export default Toggle;
