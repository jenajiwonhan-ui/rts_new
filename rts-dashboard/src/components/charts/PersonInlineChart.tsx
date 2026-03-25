import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { useData } from '../../contexts/DataContext';
import { getWeeksPerMonth, buildProdColors } from '../../utils/aggregation';
import { ymLabel } from '../../utils/formatters';
import { hexLum } from '../../utils/colors';
import { DetailRecord } from '../../types';
import ChartLegend from './ChartLegend';

interface PersonInlineChartProps {
  name: string;
  detail: DetailRecord[];
  range: string[];
  tmMode: 'monthly' | 'weekly';
  onClose?: () => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

const PersonInlineChart: React.FC<PersonInlineChartProps> = ({
  name, detail, range, tmMode, onClose, scrollRef,
}) => {
  const { weekMondays: WM, gpdGroups, productColors } = useData();
  // Measure visible width of scroll container
  const [visibleW, setVisibleW] = useState(900);
  const measure = useCallback(() => {
    if (scrollRef?.current) {
      setVisibleW(scrollRef.current.clientWidth);
    }
  }, [scrollRef]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  // Close on Escape key or click outside
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); };
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose?.();
      }
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  const personData = useMemo(() => {
    const records = detail.filter(d => d.n === name && range.includes(d.ym));
    if (records.length === 0) return null;

    const wpm = getWeeksPerMonth(records);
    const prodColors = buildProdColors(records, gpdGroups, productColors);

    if (tmMode === 'monthly') {
      const labels = range.map(ymLabel);
      const datasets = prodColors.allItems.map(p => {
        const data = range.map(ym => {
          const recs = records.filter(r => r.p === p && r.ym === ym);
          const total = recs.reduce((s, r) => s + r.tot, 0);
          return (wpm[ym] || 1) > 0 ? total / (wpm[ym] || 1) : 0;
        });
        const bgColor = prodColors.colorMap[p] || '#ccc';
        return {
          label: p,
          data,
          backgroundColor: bgColor,
        };
      });
      return { labels, datasets, legendItems: prodColors.allItems.map(p => ({ label: p, color: prodColors.colorMap[p] || '#ccc' })) };
    } else {
      // Weekly
      const weekKeys = new Set<string>();
      for (const r of records) {
        for (const w of Object.keys(r.wk)) weekKeys.add(w);
      }
      const sortedWeeks = Array.from(weekKeys).sort();
      const labels = sortedWeeks.map(w => WM[w] || w);

      const datasets = prodColors.allItems.map(p => {
        const data = sortedWeeks.map(w => {
          return records.filter(r => r.p === p).reduce((s, r) => s + (r.wk[w] || 0), 0);
        });
        const bgColor = prodColors.colorMap[p] || '#ccc';
        return { label: p, data, backgroundColor: bgColor };
      });
      return { labels, datasets, legendItems: prodColors.allItems.map(p => ({ label: p, color: prodColors.colorMap[p] || '#ccc' })) };
    }
  }, [name, detail, range, tmMode]);

  const inlinePlugin = useMemo(() => ({
    id: 'personInlineLabels',
    afterDatasetsDraw(chart: any) {
      if (chart.config.type !== 'bar') return;
      const ctx = chart.ctx;
      const dsCount = chart.data.datasets.length;
      if (dsCount === 0) return;
      const lastMeta = chart.getDatasetMeta(dsCount - 1);
      if (!lastMeta?.data?.length) return;
      const barCount = lastMeta.data.length;

      for (let bi = 0; bi < barCount; bi++) {
        let topY = Infinity;
        let total = 0;
        let prevTotal = 0;
        for (let di = 0; di < dsCount; di++) {
          const val = (chart.data.datasets[di].data[bi] as number) || 0;
          total += val;
          const bar = chart.getDatasetMeta(di).data[bi] as any;
          if (val > 0 && bar && bar.y < topY) topY = bar.y;
          if (bi > 0) prevTotal += (chart.data.datasets[di].data[bi - 1] as number) || 0;
        }
        if (total <= 0 || topY === Infinity) continue;
        const firstBar = chart.getDatasetMeta(0).data[bi] as any;
        const barW = firstBar?.width ?? 30;
        if (barW < 30) continue;

        ctx.save();

        // Per-segment labels
        for (let di = 0; di < dsCount; di++) {
          const v = (chart.data.datasets[di].data[bi] as number) || 0;
          if (v <= 0) continue;
          const bar = chart.getDatasetMeta(di).data[bi] as any;
          if (!bar) continue;
          const segH = Math.abs(bar.base - bar.y);
          const barW = bar.width ?? 30;
          if (segH < 12 || barW < 24) continue;
          const pct = (v / total) * 100;
          if (pct < 8) continue;

          const bgc = (chart.data.datasets[di].backgroundColor as string) || '#888';
          const isDark = hexLum(bgc) < 0.45;
          const valColor = isDark ? '#ffffff' : '#2a2d3a';
          const posColor = isDark ? '#a0e0ff' : '#2a6f9e';
          const negColor = isDark ? '#ffb0a0' : '#b04030';
          const cy = (bar.y + bar.base) / 2;

          if (bi > 0) {
            const prevV = (chart.data.datasets[di].data[bi - 1] as number) || 0;
            const segDiff = v - prevV;
            const valText = v.toFixed(1);
            const diffText = ` ${segDiff >= 0 ? '+' : ''}${segDiff.toFixed(1)}`;

            ctx.font = '600 14px Pretendard, sans-serif';
            const valW = ctx.measureText(valText).width;
            ctx.font = '400 12px Pretendard, sans-serif';
            const diffW = ctx.measureText(diffText).width;
            const startX = bar.x - (valW + diffW) / 2;

            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            ctx.font = '600 14px Pretendard, sans-serif';
            ctx.fillStyle = valColor;
            ctx.fillText(valText, startX, cy);

            ctx.font = '400 12px Pretendard, sans-serif';
            ctx.fillStyle = segDiff >= 0 ? posColor : negColor;
            ctx.fillText(diffText, startX + valW, cy);
          } else {
            ctx.font = '600 14px Pretendard, sans-serif';
            ctx.fillStyle = valColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(v.toFixed(1), bar.x, cy);
          }
        }

        ctx.restore();
      }
    },
  }), []);

  if (!personData) return null;

  return (
    <div className="person-inline-wrap" style={{ width: visibleW }}>
      <div className="person-inline-panel" ref={panelRef}>
        <div className="person-modal-header">
          <span className="person-modal-name">{name}</span>
          <button className="person-modal-close" onClick={onClose}>✕</button>
        </div>
        <ChartLegend items={personData.legendItems} className="person-legend" />
        <div style={{ position: 'relative', height: 240 }}>
          <Bar
            key={`${name}-${tmMode}-${personData.labels.length}-${visibleW}`}
            data={{ labels: personData.labels, datasets: personData.datasets }}
            plugins={[inlinePlugin]}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              __personInline: true,
              layout: { padding: { top: 12 } },
              animation: false as const,
              hover: { mode: null as any },
              plugins: {
                legend: { display: false },
                datalabels: { display: false },
                tooltip: { enabled: false },
              },
              datasets: {
                bar: { categoryPercentage: tmMode === 'weekly' ? 0.85 : 0.6 },
              },
              scales: {
                x: { stacked: true, grid: { display: false }, ticks: { font: { size: 12, weight: '500', family: 'Pretendard' } } },
                y: {
                  stacked: true,
                  max: 1.0,
                  title: { display: true, text: tmMode === 'monthly' ? 'M/M' : 'Weekly RTS', font: { size: 10, weight: '600', family: 'Pretendard' } },
                  ticks: { font: { size: 12, weight: '500', family: 'Pretendard' } },
                },
              },
            } as any}
          />
        </div>
      </div>
    </div>
  );
};

export default PersonInlineChart;
