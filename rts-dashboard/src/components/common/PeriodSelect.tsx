import React from 'react';
import { ymLabel } from '../../utils/formatters';

interface PeriodSelectProps {
  ymList: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const PeriodSelect: React.FC<PeriodSelectProps> = ({ ymList, value, onChange, className = 'fi' }) => (
  <select
    className={className}
    value={value}
    onChange={e => onChange(e.target.value)}
  >
    {ymList.map(ym => (
      <option key={ym} value={ym}>{ymLabel(ym)}</option>
    ))}
  </select>
);

export default PeriodSelect;
