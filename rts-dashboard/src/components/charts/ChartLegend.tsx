import React from 'react';

interface ChartLegendProps {
  items: { label: string; color: string }[];
  className?: string;
  highlightedLabel?: string | null;
  onHighlight?: (label: string | null) => void;
}

const ChartLegend: React.FC<ChartLegendProps> = ({
  items, className = 'legend-bar',
  highlightedLabel, onHighlight,
}) => {
  const interactive = !!onHighlight;

  return (
    <div className={className}>
      {items.map(item => {
        const dimmed = interactive && highlightedLabel != null && highlightedLabel !== item.label;
        const active = interactive && highlightedLabel === item.label;
        return (
          <span
            key={item.label}
            className={`sl-item${interactive ? ' sl-interactive' : ''}${active ? ' sl-active' : ''}`}
            style={{ opacity: dimmed ? 0.25 : 1 }}
            onMouseEnter={interactive ? () => onHighlight(item.label) : undefined}
            onMouseLeave={interactive ? () => onHighlight(null) : undefined}
            onClick={interactive ? (e) => {
              e.stopPropagation();
              // click toggles lock: if already active, clear; else set
              onHighlight(active ? null : item.label);
            } : undefined}
          >
            <span className="sl-dot" style={{ background: item.color }} />
            {item.label}
          </span>
        );
      })}
    </div>
  );
};

export default ChartLegend;
