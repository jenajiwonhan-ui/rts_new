import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { hexLum } from '../../utils/colors';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ChartDataLabels
);

/* ─── Custom tooltip positioner: center of hovered segment ─── */
(Tooltip.positioners as any).segmentCenter = function (elements: any, eventPosition: any) {
  if (elements.length === 0) return false as any;
  const el = elements[0].element as any;
  return {
    x: el.x,
    y: (el.y + el.base) / 2,
  };
};

/* ─── gpdTopLabel plugin ─── */
const gpdTopLabelPlugin = {
  id: 'gpdTopLabel',
  afterDatasetsDraw(chart: ChartJS) {
    if ((chart.config as any).type !== 'bar') return;
    const dlOpts = chart.options?.plugins?.datalabels;
    if (!dlOpts || (dlOpts as any).display !== false) return;
    if ((chart.options as any).__personInline) return;

    const ctx = chart.ctx;
    const dsCount = chart.data.datasets.length;
    if (dsCount === 0) return;
    const lastMeta = chart.getDatasetMeta(dsCount - 1);
    if (!lastMeta || !lastMeta.data.length) return;

    const barCount = lastMeta.data.length;
    const customOpts = (chart.options as any).__custom || {};
    const orgDepth = customOpts.orgDepth || 'l';
    const isSvc = !!customOpts.isSvc;
    const hl = customOpts.highlightedLabel || null;
    const lbWeeks = customOpts.lastBarWeeks || 0;
    const lbDayOfWeek = customOpts.lastBarDayOfWeek || 7;
    const showLastBar = lbWeeks > 0 ? lbWeeks >= 3 : lbDayOfWeek > 3;
    const isWeekly = customOpts.timeMode === 'weekly';
    const ff = '-apple-system, BlinkMacSystemFont, SF Pro Text, Pretendard, sans-serif';
    const totalFont = isWeekly ? `500 10px ${ff}` : `500 12px ${ff}`;
    const diffFont = isWeekly ? `400 9px ${ff}` : `400 10px ${ff}`;
    const segFont = isWeekly ? `500 10px ${ff}` : `500 12px ${ff}`;
    const segDiffFont = isWeekly ? `400 9px ${ff}` : `400 10px ${ff}`;

    // ── Pre-compute per-bar totals ──
    const barTotals: number[] = [];
    for (let bi = 0; bi < barCount; bi++) {
      let total = 0;
      for (let di = 0; di < dsCount; di++) {
        total += (chart.data.datasets[di].data[bi] as number) || 0;
      }
      barTotals.push(total);
    }

    // ── Last bar is excluded (incomplete period) ──
    const lastBar = barCount - 1;

    // ── Pre-compute which datasets qualify for labels (75% of bars must pass) ──
    const dsVisible: boolean[] = [];
    const checkBars = showLastBar ? barCount : lastBar;
    for (let di = 0; di < dsCount; di++) {
      if (hl && chart.data.datasets[di].label !== hl) { dsVisible.push(false); continue; }
      const isHl = hl && chart.data.datasets[di].label === hl;
      if (isHl) { dsVisible.push(true); continue; }
      let passCount = 0;
      for (let bi = 0; bi < checkBars; bi++) {
        const v = (chart.data.datasets[di].data[bi] as number) || 0;
        if (v <= 0) continue;
        const bar = chart.getDatasetMeta(di).data[bi] as any;
        if (!bar) continue;
        const segH = Math.abs(bar.base - bar.y);
        if (segH < 4) continue;
        const total = barTotals[bi];
        const pct = total > 0 ? (v / total) * 100 : 0;
        if (pct >= 10 && segH >= 20) passCount++;
      }
      dsVisible.push(checkBars > 0 && passCount >= checkBars * 0.75);
    }

    for (let bi = 0; bi < barCount; bi++) {
      let topY = Infinity;
      const total = barTotals[bi];
      let prevTotal = 0;
      for (let di = 0; di < dsCount; di++) {
        const val = (chart.data.datasets[di].data[bi] as number) || 0;
        const bar = chart.getDatasetMeta(di).data[bi] as any;
        if (val > 0 && bar && bar.y < topY) topY = bar.y;
        if (bi > 0) {
          prevTotal += (chart.data.datasets[di].data[bi - 1] as number) || 0;
        }
      }
      if (total <= 0 || topY === Infinity) continue;

      ctx.save();

      // ── Total label (always shown) ──
      ctx.font = totalFont;
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';

      const totalText = total.toFixed(1);
      if (bi > 0) {
        const diff = total - prevTotal;
        const diffText = ` (${diff >= 0 ? '▲' : '▼'}${Math.abs(diff).toFixed(1)})`;

        {
          ctx.font = totalFont;
          const totalW = ctx.measureText(totalText).width;
          ctx.font = diffFont;
          const diffW = ctx.measureText(diffText).width;
          const fullW = totalW + diffW;
          const startX = lastMeta.data[bi].x - fullW / 2;

          ctx.textAlign = 'left';
          ctx.font = totalFont;
          ctx.fillStyle = 'rgba(0,0,0,0.8)';
          ctx.fillText(totalText, startX, topY - 10);

          ctx.font = diffFont;
          ctx.fillStyle = diff >= 0 ? 'rgba(0,0,0,0.48)' : 'rgba(0,0,0,0.48)';
          ctx.fillText(diffText, startX + totalW, topY - 10);
        }
      } else if (barCount > 1) {
        const diffText = ' (-)';
        ctx.font = totalFont;
        const totalW = ctx.measureText(totalText).width;
        ctx.font = diffFont;
        const diffW = ctx.measureText(diffText).width;
        const fullW = totalW + diffW;
        const startX = lastMeta.data[bi].x - fullW / 2;

        ctx.textAlign = 'left';
        ctx.font = totalFont;
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillText(totalText, startX, topY - 10);

        ctx.font = diffFont;
        ctx.fillStyle = 'rgba(0,0,0,0.48)';
        ctx.fillText(diffText, startX + totalW, topY - 10);
      } else {
        ctx.fillText(totalText, lastMeta.data[bi].x, topY - 10);
      }

      // ── Per-segment labels ──
      for (let di = 0; di < dsCount; di++) {
        if (!dsVisible[di]) continue;
        const v = (chart.data.datasets[di].data[bi] as number) || 0;
        const isHl = hl && chart.data.datasets[di].label === hl;
        // Last bar: hide segments if < 3 weeks, unless highlighted
        if (bi === lastBar && !showLastBar && !isHl) continue;
        const bar = chart.getDatasetMeta(di).data[bi] as any;
        if (!bar) continue;
        const segH = Math.abs(bar.base - bar.y);

        const pct = (v / total) * 100;

        const bgc = (chart.data.datasets[di].backgroundColor as string) || '#888';
        const needChip = segH < 18;
        const lum = hexLum(bgc);
        const isDark = lum < 0.45;
        const valColor = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)';
        const posColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.48)';
        const negColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.48)';

        // For zero-height segments, compute y from scale + stack sum
        let cy: number;
        if (v <= 0) {
          const yScale = chart.scales.y;
          let cumSum = 0;
          for (let d = 0; d <= di; d++) {
            cumSum += (chart.data.datasets[d].data[bi] as number) || 0;
          }
          cy = yScale.getPixelForValue(cumSum) - 12;
        } else {
          cy = (bar.y + bar.base) / 2;
        }

        if (bi > 0) {
          const prevV = (chart.data.datasets[di].data[bi - 1] as number) || 0;
          const segDiff = v - prevV;

          const valText = v.toFixed(1);
          const diffText = ` (${segDiff >= 0 ? '▲' : '▼'}${Math.abs(segDiff).toFixed(1)})`;

          ctx.font = segFont;
          const valW = ctx.measureText(valText).width;
          ctx.font = segDiffFont;
          const diffW = ctx.measureText(diffText).width;
          const fullW = valW + diffW;
          const startX = bar.x - fullW / 2;

          if (needChip) {
            const chipH = isWeekly ? 14 : 18, chipPad = isWeekly ? 4 : 5, r = chipH / 2;
            const chipW = fullW + chipPad * 2;
            const cx = bar.x - chipW / 2;
            const cyTop = cy - chipH / 2;

            // frosted pill background
            ctx.save();
            ctx.globalAlpha = 0.92;
            ctx.beginPath();
            ctx.roundRect(cx, cyTop, chipW, chipH, r);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.globalAlpha = 1;
            // subtle border
            ctx.beginPath();
            ctx.roundRect(cx, cyTop, chipW, chipH, r);
            ctx.strokeStyle = 'rgba(0,0,0,0.08)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.restore();

            const chipStartX = cx + chipPad;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            ctx.font = segFont;
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillText(valText, chipStartX, cy);

            ctx.font = segDiffFont;
            ctx.fillStyle = 'rgba(0,0,0,0.48)';
            ctx.fillText(diffText, chipStartX + valW, cy);
          } else {
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            ctx.font = segFont;
            ctx.fillStyle = valColor;
            ctx.fillText(valText, startX, cy);

            ctx.font = segDiffFont;
            ctx.fillStyle = segDiff >= 0 ? posColor : negColor;
            ctx.fillText(diffText, startX + valW, cy);
          }
        } else {
          ctx.font = segFont;
          const valText = v.toFixed(1);

          if (needChip) {
            const tw = ctx.measureText(valText).width;
            const chipH = isWeekly ? 14 : 18, chipPad = isWeekly ? 4 : 5, r = chipH / 2;
            const chipW = tw + chipPad * 2;
            const cx = bar.x - chipW / 2;
            const cyTop = cy - chipH / 2;

            ctx.save();
            ctx.globalAlpha = 0.92;
            ctx.beginPath();
            ctx.roundRect(cx, cyTop, chipW, chipH, r);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.roundRect(cx, cyTop, chipW, chipH, r);
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
};

/* ─── segLabels plugin ─── */
const segLabelsPlugin = {
  id: 'segLabels',
  afterDatasetsDraw(chart: ChartJS) {
    if ((chart.config as any).type !== 'bar') return;
    const dlOpts = chart.options?.plugins?.datalabels;
    if (dlOpts && (dlOpts as any).display === false) return;

    const ctx = chart.ctx;
    const dsCount = chart.data.datasets.length;
    const customOpts2 = (chart.options as any).__custom || {};
    const hl = customOpts2.highlightedLabel || null;
    const lbWeeks2 = customOpts2.lastBarWeeks || 0;
    const lbDayOfWeek2 = customOpts2.lastBarDayOfWeek || 7;
    const showLastBar2 = lbWeeks2 > 0 ? lbWeeks2 >= 3 : lbDayOfWeek2 > 3;
    const isWeekly2 = customOpts2.timeMode === 'weekly';
    const ff2 = '-apple-system, BlinkMacSystemFont, SF Pro Text, Pretendard, sans-serif';
    const segFont2 = isWeekly2 ? `500 10px ${ff2}` : `500 12px ${ff2}`;

    const barCount2 = chart.getDatasetMeta(0)?.data.length || 0;
    const lastBar2 = barCount2 - 1;

    // Pre-compute which datasets qualify (75% of bars must pass)
    const checkBars2 = showLastBar2 ? barCount2 : lastBar2;
    const dsVis2: boolean[] = [];
    for (let di = 0; di < dsCount; di++) {
      if (hl && chart.data.datasets[di].label !== hl) { dsVis2.push(false); continue; }
      const isHl = hl && chart.data.datasets[di].label === hl;
      if (isHl) { dsVis2.push(true); continue; }
      let passCount = 0;
      const meta = chart.getDatasetMeta(di);
      for (let bi = 0; bi < checkBars2; bi++) {
        const v = (chart.data.datasets[di].data[bi] as number) || 0;
        if (v <= 0) continue;
        const bar = meta.data[bi] as any;
        if (!bar) continue;
        const segH = Math.abs(bar.base - bar.y);
        if (segH < 4) continue;
        let total = 0;
        for (let d = 0; d < dsCount; d++) {
          total += (chart.data.datasets[d].data[bi] as number) || 0;
        }
        const pct = total > 0 ? (v / total) * 100 : 0;
        if (pct >= 10 && segH >= 20) passCount++;
      }
      dsVis2.push(checkBars2 > 0 && passCount >= checkBars2 * 0.75);
    }

    for (let di = 0; di < dsCount; di++) {
      if (!dsVis2[di]) continue;
      const isHl = hl && chart.data.datasets[di].label === hl;
      const meta = chart.getDatasetMeta(di);
      for (let bi = 0; bi < meta.data.length; bi++) {
        if (bi === lastBar2 && !isHl && !showLastBar2) continue; // skip incomplete last period unless highlighted or 3+ weeks
        const v = (chart.data.datasets[di].data[bi] as number) || 0;
        const bar = meta.data[bi] as any;
        if (!bar) continue;
        const segH = Math.abs(bar.base - bar.y);

        let total = 0;
        for (let d = 0; d < dsCount; d++) {
          total += (chart.data.datasets[d].data[bi] as number) || 0;
        }
        const pct = total > 0 ? (v / total) * 100 : 0;

        const bgc = (chart.data.datasets[di].backgroundColor as string) || '#888';
        const needChip = segH < 18;
        const isDark = hexLum(bgc) < 0.45;

        ctx.save();
        ctx.font = segFont2;
        const valText = v.toFixed(1);
        let cy: number;
        if (v <= 0) {
          const yScale = chart.scales.y;
          let cumSum = 0;
          for (let d = 0; d <= di; d++) {
            cumSum += (chart.data.datasets[d].data[bi] as number) || 0;
          }
          cy = yScale.getPixelForValue(cumSum) - 12;
        } else {
          cy = (bar.y + bar.base) / 2;
        }

        if (needChip) {
          const tw = ctx.measureText(valText).width;
          const chipH = 18, chipPad = 5, r = chipH / 2;
          const chipW = tw + chipPad * 2;
          const cx2 = bar.x - chipW / 2;
          const cyTop2 = cy - chipH / 2;

          ctx.save();
          ctx.globalAlpha = 0.92;
          ctx.beginPath();
          ctx.roundRect(cx2, cyTop2, chipW, chipH, r);
          ctx.fillStyle = '#fff';
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.roundRect(cx2, cyTop2, chipW, chipH, r);
          ctx.strokeStyle = 'rgba(0,0,0,0.08)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
          ctx.restore();
        }

        ctx.fillStyle = needChip ? 'rgba(0,0,0,0.8)' : (isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(valText, bar.x, cy);
        ctx.restore();
      }
    }
  },
};

ChartJS.register(gpdTopLabelPlugin, segLabelsPlugin);

export type BarChartMode = 'prodOrg' | 'svcGpd';
export type TimeMode = 'monthly' | 'weekly';

interface StackedBarChartProps {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
  }[];
  yTitle?: string;
  height?: number;
  mode?: BarChartMode;
  timeMode?: TimeMode;
  maxY?: number;
  orgDepth?: string;
  isSvc?: boolean;
  highlightedLabel?: string | null;
  onHighlight?: (label: string | null) => void;
  lastBarWeeks?: number;
  lastBarDayOfWeek?: number;
}

/* ─── helper: apply highlight opacity to a hex color ─── */
function applyAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const DIM_ALPHA = 0.20;

const StackedBarChart: React.FC<StackedBarChartProps> = ({
  labels, datasets, yTitle = 'M/M', height = 350,
  mode = 'svcGpd', timeMode = 'monthly', maxY,
  orgDepth = 'l', isSvc = false, highlightedLabel, onHighlight,
  lastBarWeeks = 0,
  lastBarDayOfWeek = 7,
}) => {
  const [interacted, setInteracted] = React.useState(false);

  /* ─── data includes highlight colors so react-chartjs-2 stays in sync ─── */
  const data = useMemo(() => {
    if (highlightedLabel == null) return { labels, datasets };
    return {
      labels,
      datasets: datasets.map(ds => ({
        ...ds,
        backgroundColor: ds.label === highlightedLabel
          ? ds.backgroundColor
          : applyAlpha(ds.backgroundColor, DIM_ALPHA),
      })),
    };
  }, [labels, datasets, highlightedLabel]);

  const isSvcGpd = mode === 'svcGpd';
  const isWeekly = timeMode === 'weekly';
  const weekCount = labels.length;

  /* ─── chart-level hover → set highlight via parent state ─── */
  const onHighlightRef = React.useRef(onHighlight);
  onHighlightRef.current = onHighlight;
  const hlRef = React.useRef(highlightedLabel);
  hlRef.current = highlightedLabel;

  const handleHover = React.useCallback((_evt: any, elements: any[], chart: any) => {
    if (!onHighlightRef.current) return;
    let label: string | null = null;
    if (elements.length > 0) {
      const dsIndex = elements[0].datasetIndex;
      label = chart.data.datasets[dsIndex]?.label || null;
    }
    if (label === hlRef.current) return;
    if (!interacted) setInteracted(true);
    onHighlightRef.current(label);
  }, [interacted]);

  const options = useMemo(() => {
    const animationOpts = { duration: 0 };
    const transitionOpts = {
      active: { animation: { duration: 0 } },
      resize: { animation: { duration: 0 } },
    };

    const commonHover = {
      mode: 'nearest' as const,
      intersect: true,
    };

    if (isSvcGpd) {
      return {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { bottom: 12 } },
        __custom: { orgDepth, isSvc, highlightedLabel, lastBarWeeks, lastBarDayOfWeek, timeMode },
        animation: animationOpts,
        transitions: transitionOpts,
        onHover: handleHover,
        hover: commonHover,
        plugins: {
          legend: { display: false },
          datalabels: { display: false } as any,
          tooltip: { enabled: false },
        },
        datasets: {
          bar: { categoryPercentage: isWeekly ? 0.85 : 0.6 },
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: {
              color: 'rgba(0,0,0,0.8)',
              font: { size: 12, weight: '500', family: '-apple-system, BlinkMacSystemFont, SF Pro Text, Pretendard, sans-serif' },
              maxRotation: isWeekly ? 60 : 0,
            },
          },
          y: {
            stacked: true,
            grace: '25%',
                        title: {
              display: true,
              text: yTitle,
              color: 'rgba(0,0,0,0.8)',
              font: { size: 10, weight: '600', family: '-apple-system, BlinkMacSystemFont, SF Pro Text, Pretendard, sans-serif' },
              padding: { top: 0, bottom: 10 },
            },
            ...(maxY !== undefined ? { max: maxY } : {}),
            ticks: { color: 'rgba(0,0,0,0.8)', font: { size: 12, weight: '500', family: '-apple-system, BlinkMacSystemFont, SF Pro Text, Pretendard, sans-serif' } },
          },
        },
      };
    } else {
      return {
        responsive: true,
        maintainAspectRatio: false,
        animation: animationOpts,
        __custom: { highlightedLabel, lastBarWeeks, lastBarDayOfWeek, timeMode },
        onHover: handleHover,
        hover: commonHover,
        plugins: {
          legend: { display: false },
          datalabels: {
            display: true,
            anchor: 'end' as const,
            align: 'end' as const,
            color: 'rgba(0,0,0,0.48)',
            font: { size: 12, weight: '500', family: '-apple-system, BlinkMacSystemFont, SF Pro Text, Pretendard, sans-serif' },
            formatter: (value: number, ctx: any) => {
              if (ctx.datasetIndex !== ctx.chart.data.datasets.length - 1) return null;
              let t = 0;
              for (const ds of ctx.chart.data.datasets) {
                t += (ds.data[ctx.dataIndex] as number) || 0;
              }
              return t > 0 ? t.toFixed(1) : null;
            },
          } as any,
          tooltip: { enabled: false },
        },
        datasets: {
          bar: { categoryPercentage: isWeekly ? 0.85 : 0.6 },
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: {
              color: 'rgba(0,0,0,0.8)',
              font: { size: 12, weight: '500', family: '-apple-system, BlinkMacSystemFont, SF Pro Text, Pretendard, sans-serif' },
              maxRotation: isWeekly ? 60 : 0,
            },
          },
          y: {
            stacked: true,
            grace: '15%',
                        title: { display: true, text: yTitle, color: 'rgba(0,0,0,0.8)', font: { size: 10, weight: '600', family: '-apple-system, BlinkMacSystemFont, SF Pro Text, Pretendard, sans-serif' } },
            ...(maxY !== undefined ? { max: maxY } : {}),
            ticks: { color: 'rgba(0,0,0,0.8)', font: { size: 12, weight: '500', family: '-apple-system, BlinkMacSystemFont, SF Pro Text, Pretendard, sans-serif' } },
          },
        },
      };
    }
  }, [yTitle, isSvcGpd, isWeekly, maxY, orgDepth, isSvc, weekCount, highlightedLabel, handleHover, interacted]);

  const chartKey = `${mode}-${timeMode}-${orgDepth}-${labels.length}`;

  const handleMouseLeave = React.useCallback(() => {
    if (onHighlightRef.current && hlRef.current != null) {
      onHighlightRef.current(null);
    }
  }, []);

  return (
    <div style={{ position: 'relative', height }} onMouseLeave={handleMouseLeave}>
      <Bar key={chartKey} data={data} options={options as any} />
    </div>
  );
};

export default StackedBarChart;
