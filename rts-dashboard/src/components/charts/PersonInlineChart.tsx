import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { useData } from '../../contexts/DataContext';
import { getWeeksPerMonth, getWeeksInRange, buildProdColors } from '../../utils/aggregation';
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
  highlightProducts?: Set<string>;
  allDetail?: DetailRecord[];
}

const DIM_ALPHA = 0.20;
function applyAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const PersonInlineChart: React.FC<PersonInlineChartProps> = ({
  name, detail, range, tmMode, onClose, scrollRef, highlightProducts, allDetail,
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
    const sourceDetail = allDetail || detail;
    const records = sourceDetail.filter(d => d.n === name && range.includes(d.ym));
    if (records.length === 0) return null;

    const wpm = getWeeksPerMonth(records);
    const prodColors = buildProdColors(records, gpdGroups, productColors);
    const hl = highlightProducts;

    const getColor = (p: string) => {
      const c = prodColors.colorMap[p] || '#ccc';
      return hl && !hl.has(p) ? applyAlpha(c, DIM_ALPHA) : c;
    };

    // Sort: highlighted first (bottom of stack), then dehighlighted on top
    const sortedItems = hl
      ? [...prodColors.allItems.filter(p => hl.has(p)), ...prodColors.allItems.filter(p => !hl.has(p))]
      : prodColors.allItems;

    if (tmMode === 'monthly') {
      const labels = range.map(ymLabel);
      const datasets = sortedItems.map(p => {
        const data = range.map(ym => {
          const recs = records.filter(r => r.p === p && r.ym === ym);
          const total = recs.reduce((s, r) => s + r.tot, 0);
          return (wpm[ym] || 1) > 0 ? total / (wpm[ym] || 1) : 0;
        });
        return { label: p, data, backgroundColor: getColor(p) };
      });
      // Legend: highlighted first for readability
      const legendItems = hl
        ? [...prodColors.allItems.filter(p => hl.has(p)), ...prodColors.allItems.filter(p => !hl.has(p))]
        : prodColors.allItems;
      return { labels, datasets, legendItems: legendItems.map(p => ({ label: p, color: getColor(p) })) };
    } else {
      // 전체 데이터에서 해당 기간의 모든 주를 가져옴 (데이터 없는 주도 포함)
      const sortedWeeks = getWeeksInRange(sourceDetail, range);
      const labels = sortedWeeks.map(w => WM[w] || w);

      const datasets = sortedItems.map(p => {
        const data = sortedWeeks.map(w => {
          return records.filter(r => r.p === p).reduce((s, r) => s + (r.wk[w] || 0), 0);
        });
        return { label: p, data, backgroundColor: getColor(p) };
      });
      const legendItems = hl
        ? [...prodColors.allItems.filter(p => hl.has(p)), ...prodColors.allItems.filter(p => !hl.has(p))]
        : prodColors.allItems;
      return { labels, datasets, legendItems: legendItems.map(p => ({ label: p, color: getColor(p) })) };
    }
  }, [name, detail, allDetail, range, tmMode, highlightProducts]);

  const hlProdsRef = useRef(highlightProducts);
  hlProdsRef.current = highlightProducts;

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
      const isWk = barCount > 6;
      const valFontSize = isWk ? 11 : 14;
      const diffFontSize = isWk ? 9 : 12;
      const valFont = `600 ${valFontSize}px Pretendard, sans-serif`;
      const diffFont = `400 ${diffFontSize}px Pretendard, sans-serif`;
      const hl = hlProdsRef.current;

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
        if (barW < 20) continue;

        ctx.save();

        // Per-segment labels (highlighted products always shown)
        for (let di = 0; di < dsCount; di++) {
          const v = (chart.data.datasets[di].data[bi] as number) || 0;
          if (v <= 0) continue;
          const dsLabel = chart.data.datasets[di].label || '';
          const isHl = !hl || hl.has(dsLabel);
          const bar = chart.getDatasetMeta(di).data[bi] as any;
          if (!bar) continue;
          const segH = Math.abs(bar.base - bar.y);
          const curValFont = isHl ? valFont : `600 ${valFontSize - 2}px Pretendard, sans-serif`;
          const curDiffFont = diffFont;
          if (!isHl && segH < 10) continue;
          const pct = total > 0 ? (v / total) * 100 : 0;
          if (!isHl && (pct < 8 || segH < 12)) continue;
          const cy = (bar.y + bar.base) / 2;

          const bgc = (chart.data.datasets[di].backgroundColor as string) || '#888';
          const needChip = segH < 18;
          const isDark = isHl ? hexLum(bgc) < 0.45 : false;
          const valColor = isHl ? (isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)') : '#888';
          const posColor = isHl ? (isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.48)') : '#aaa';
          const negColor = isHl ? (isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.48)') : '#aaa';

          if (bi > 0) {
            const prevV = (chart.data.datasets[di].data[bi - 1] as number) || 0;
            const segDiff = v - prevV;
            const valText = v.toFixed(1);
            const diffText = ` (${segDiff >= 0 ? '▲' : '▼'}${Math.abs(segDiff).toFixed(1)})`;

            ctx.font = curValFont;
            const valW = ctx.measureText(valText).width;
            ctx.font = curDiffFont;
            const diffW = ctx.measureText(diffText).width;
            const fullW = valW + diffW;
            const startX = bar.x - fullW / 2;

            if (needChip) {
              const chipH = isWk ? 14 : 18, chipPad = isWk ? 4 : 5, r = chipH / 2;
              const chipW = fullW + chipPad * 2;
              const cxChip = bar.x - chipW / 2;
              const cyTopChip = cy - chipH / 2;

              ctx.save();
              ctx.globalAlpha = 0.92;
              ctx.beginPath();
              ctx.roundRect(cxChip, cyTopChip, chipW, chipH, r);
              ctx.fillStyle = '#fff';
              ctx.fill();
              ctx.globalAlpha = 1;
              ctx.beginPath();
              ctx.roundRect(cxChip, cyTopChip, chipW, chipH, r);
              ctx.strokeStyle = 'rgba(0,0,0,0.08)';
              ctx.lineWidth = 0.5;
              ctx.stroke();
              ctx.restore();

              const chipStartX = cxChip + chipPad;
              ctx.textBaseline = 'middle';
              ctx.textAlign = 'left';
              ctx.font = curValFont;
              ctx.fillStyle = 'rgba(0,0,0,0.8)';
              ctx.fillText(valText, chipStartX, cy);
              ctx.font = curDiffFont;
              ctx.fillStyle = 'rgba(0,0,0,0.48)';
              ctx.fillText(diffText, chipStartX + valW, cy);
            } else {
              ctx.textBaseline = 'middle';
              ctx.textAlign = 'left';
              ctx.font = curValFont;
              ctx.fillStyle = valColor;
              ctx.fillText(valText, startX, cy);
              ctx.font = curDiffFont;
              ctx.fillStyle = segDiff >= 0 ? posColor : negColor;
              ctx.fillText(diffText, startX + valW, cy);
            }
          } else {
            ctx.font = curValFont;
            const valText = v.toFixed(1);

            if (needChip) {
              const tw = ctx.measureText(valText).width;
              const chipH = isWk ? 14 : 18, chipPad = isWk ? 4 : 5, r = chipH / 2;
              const chipW = tw + chipPad * 2;
              const cxChip = bar.x - chipW / 2;
              const cyTopChip = cy - chipH / 2;

              ctx.save();
              ctx.globalAlpha = 0.92;
              ctx.beginPath();
              ctx.roundRect(cxChip, cyTopChip, chipW, chipH, r);
              ctx.fillStyle = '#fff';
              ctx.fill();
              ctx.globalAlpha = 1;
              ctx.beginPath();
              ctx.roundRect(cxChip, cyTopChip, chipW, chipH, r);
              ctx.strokeStyle = 'rgba(0,0,0,0.08)';
              ctx.lineWidth = 0.5;
              ctx.stroke();
              ctx.restore();
            }

            ctx.fillStyle = needChip ? 'rgba(0,0,0,0.8)' : valColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(valText, bar.x, cy);
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
                x: { stacked: true, grid: { display: false }, ticks: { color: 'rgba(0,0,0,0.48)', font: { size: 12, weight: '500', family: '-apple-system, BlinkMacSystemFont, SF Pro Text, Pretendard, sans-serif' } } },
                y: {
                  stacked: true,
                  max: 1.0,
                                    title: { display: true, text: tmMode === 'monthly' ? 'M/M' : 'Weekly RTS', color: 'rgba(0,0,0,0.48)', font: { size: 10, weight: '600', family: '-apple-system, BlinkMacSystemFont, SF Pro Text, Pretendard, sans-serif' } },
                  ticks: { color: 'rgba(0,0,0,0.48)', font: { size: 12, weight: '500', family: '-apple-system, BlinkMacSystemFont, SF Pro Text, Pretendard, sans-serif' } },
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
