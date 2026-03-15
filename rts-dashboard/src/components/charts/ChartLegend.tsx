import React from 'react';

interface ChartLegendProps {
  items: { label: string; color: string }[];
  className?: string;
}

const ChartLegend: React.FC<ChartLegendProps> = ({ items, className = 'legend-bar' }) => (
  <div className={className}>
    {items.map(item => (
      <span key={item.label} className="sl-item">
        <span className="sl-dot" style={{ background: item.color }} />
        {item.label}
      </span>
    ))}
  </div>
);

export default ChartLegend;
