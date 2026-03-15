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

/* ─── gpdTopLabel plugin ─── */
const gpdTopLabelPlugin = {
  id: 'gpdTopLabel',
  afterDatasetsDraw(chart: ChartJS) {
    if (chart.config.type !== 'bar') return;
    const dlOpts = chart.options?.plugins?.datalabels;
    if (!dlOpts || (dlOpts as any).display !== false) return;
    const canvasId = (chart.canvas?.id || '');
    if (canvasId.startsWith('person-inline')) return;

    const ctx = chart.ctx;
    const dsCount = chart.data.datasets.length;
    if (dsCount === 0) return;
    const lastMeta = chart.getDatasetMeta(dsCount - 1);
    if (!lastMeta || !lastMeta.data.length) return;

    const barCount = lastMeta.data.length;
    const customOpts = (chart.options as any).__custom || {};
    const orgDepth = customOpts.orgDepth || 'l';
    const isSvc = !!customOpts.isSvc;

    for (let bi = 0; bi < barCount; bi++) {
      let topY = Infinity;
      let total = 0;
      let prevTotal = 0;
      for (let di = 0; di < dsCount; di++) {
        const val = (chart.data.datasets[di].data[bi] as number) || 0;
        total += val;
        const bar = chart.getDatasetMeta(di).data[bi] as any;
        if (val > 0 && bar && bar.y < topY) topY = bar.y;
        if (bi > 0) {
          prevTotal += (chart.data.datasets[di].data[bi - 1] as number) || 0;
        }
      }
      if (total <= 0 || topY === Infinity) continue;

      ctx.save();

      // ── Total label ──
      ctx.font = '600 13px Pretendard, sans-serif';
      ctx.fillStyle = '#5f6280';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';

      // Total + diff on single line
      if (bi > 0) {
        const diff = total - prevTotal;
        const totalText = total.toFixed(1);
        const diffText = ` ${diff >= 0 ? '+' : ''}${diff.toFixed(1)}`;

        {
          ctx.font = '600 13px Pretendard, sans-serif';
          const totalW = ctx.measureText(totalText).width;
          ctx.font = '400 11.5px Pretendard, sans-serif';
          const diffW = ctx.measureText(diffText).width;
          const fullW = totalW + diffW;
          const startX = lastMeta.data[bi].x - fullW / 2;

          ctx.textAlign = 'left';
          ctx.font = '600 13px Pretendard, sans-serif';
          ctx.fillStyle = '#5f6280';
          ctx.fillText(totalText, startX, topY - 10);

          ctx.font = '400 11.5px Pretendard, sans-serif';
          ctx.fillStyle = diff >= 0 ? '#4a8cb8' : '#c07060';
          ctx.fillText(diffText, startX + totalW, topY - 10);
        }
      } else {
        ctx.fillText(total.toFixed(1), lastMeta.data[bi].x, topY - 10);
      }

      // ── Per-segment labels (always single line: value + diff) ──
      for (let di = 0; di < dsCount; di++) {
        const v = (chart.data.datasets[di].data[bi] as number) || 0;
        if (v <= 0) continue;
        const bar = chart.getDatasetMeta(di).data[bi] as any;
        if (!bar) continue;
        const segH = Math.abs(bar.base - bar.y);
        if (segH < 4) continue;

        const pct = (v / total) * 100;
        if (orgDepth !== 'l' || isSvc) {
          if (pct < 10 || segH < 20) continue;
        }

        const bgc = (chart.data.datasets[di].backgroundColor as string) || '#888';
        const isDark = hexLum(bgc) < 0.25;
        const valColor = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(58,61,74,0.75)';
        const posColor = isDark ? '#90d0f0' : '#4a8cb8';
        const negColor = isDark ? '#f0b8b0' : '#c07060';

        const cy = (bar.y + bar.base) / 2;

        if (bi > 0) {
          const prevV = (chart.data.datasets[di].data[bi - 1] as number) || 0;
          const segDiff = v - prevV;

          const valText = v.toFixed(1);
          const diffText = ` ${segDiff >= 0 ? '+' : ''}${segDiff.toFixed(1)}`;

          ctx.font = '600 11.5px Pretendard, sans-serif';
          const valW = ctx.measureText(valText).width;
          ctx.font = '400 10px Pretendard, sans-serif';
          const diffW = ctx.measureText(diffText).width;
          const fullW = valW + diffW;
          const startX = bar.x - fullW / 2;

          ctx.textBaseline = 'middle';
          ctx.textAlign = 'left';
          ctx.font = '600 11.5px Pretendard, sans-serif';
          ctx.fillStyle = valColor;
          ctx.fillText(valText, startX, cy);

          ctx.font = '400 10px Pretendard, sans-serif';
          ctx.fillStyle = segDiff >= 0 ? posColor : negColor;
          ctx.fillText(diffText, startX + valW, cy);
        } else {
          ctx.font = '600 11.5px Pretendard, sans-serif';
          ctx.fillStyle = valColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(v.toFixed(1), bar.x, cy);
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
    if (chart.config.type !== 'bar') return;
    const dlOpts = chart.options?.plugins?.datalabels;
    if (dlOpts && (dlOpts as any).display === false) return;

    const ctx = chart.ctx;
    const dsCount = chart.data.datasets.length;

    for (let di = 0; di < dsCount; di++) {
      const meta = chart.getDatasetMeta(di);
      for (let bi = 0; bi < meta.data.length; bi++) {
        const v = (chart.data.datasets[di].data[bi] as number) || 0;
        if (v <= 0) continue;
        const bar = meta.data[bi] as any;
        if (!bar) continue;
        const segH = Math.abs(bar.base - bar.y);
        if (segH < 14) continue;

        let total = 0;
        for (let d = 0; d < dsCount; d++) {
          total += (chart.data.datasets[d].data[bi] as number) || 0;
        }
        const pct = total > 0 ? (v / total) * 100 : 0;
        if (pct < 10) continue;

        const bgc = (chart.data.datasets[di].backgroundColor as string) || '#888';
        const isDark = hexLum(bgc) < 0.30;

        ctx.save();
        ctx.font = '500 11px Pretendard, sans-serif';
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.88)' : 'rgba(58,61,74,0.70)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(v.toFixed(1), bar.x, (bar.y + bar.base) / 2);
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
}

const StackedBarChart: React.FC<StackedBarChartProps> = ({
  labels, datasets, yTitle = 'M/M', height = 350,
  mode = 'svcGpd', timeMode = 'monthly', maxY,
  orgDepth = 'l', isSvc = false,
}) => {
  const data = useMemo(() => ({ labels, datasets }), [labels, datasets]);

  const isSvcGpd = mode === 'svcGpd';
  const isWeekly = timeMode === 'weekly';
  const weekCount = labels.length;

  const options = useMemo(() => {
    const diffSuffix = isWeekly ? ' w-w' : ' m-m';

    const tooltipLabel = (ctx: any) => {
      const val = ctx.parsed?.y ?? ctx.raw;
      if (val === 0) return '';
      let total = 0;
      for (const ds of ctx.chart.data.datasets) {
        total += (ds.data[ctx.dataIndex] as number) || 0;
      }
      const pct = total > 0 ? Math.round((val / total) * 100) : 0;

      let diffStr = '';
      if (ctx.dataIndex > 0) {
        const prev = (ctx.dataset.data[ctx.dataIndex - 1] as number) || 0;
        const diff = val - prev;
        const sign = diff >= 0 ? '+' : '';
        diffStr = ` (${sign}${diff.toFixed(1)}${diffSuffix}, ${pct}%)`;
      } else {
        diffStr = ` (${pct}%)`;
      }

      return [ctx.dataset.label, `${val.toFixed(2)} MM${diffStr}`];
    };

    const yFromBottom = {
      type: 'number' as const,
      from: (ctx: any) => {
        if (ctx.type === 'data') {
          return ctx.chart.chartArea?.bottom ?? ctx.chart.height;
        }
        return undefined;
      },
      duration: 800,
      easing: 'easeOutCubic' as const,
    };
    const animationOpts = { y: yFromBottom };
    const transitionOpts = {
      active: { animation: { duration: 200 } },
      resize: { animation: { duration: 0 } },
    };

    if (isSvcGpd) {
      return {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { bottom: 12 } },
        __custom: { orgDepth, isSvc },
        animation: animationOpts,
        plugins: {
          legend: { display: false },
          datalabels: { display: false } as any,
          tooltip: {
            mode: 'nearest' as const,
            intersect: true,
            callbacks: { label: tooltipLabel },
          },
        },
        datasets: {
          bar: { categoryPercentage: 0.6 },
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: {
              font: { size: isWeekly ? 12 : 14, family: 'Pretendard' },
              maxRotation: isWeekly ? 60 : 0,
            },
          },
          y: {
            stacked: true,
            grace: '25%',
            title: {
              display: true,
              text: yTitle,
              font: { size: 14, family: 'Pretendard' },
              padding: { top: 0, bottom: 10 },
            },
            ...(maxY !== undefined ? { max: maxY } : {}),
            ticks: { font: { size: 12, family: 'Pretendard' } },
          },
        },
      };
    } else {
      const fontSize = isWeekly ? 11 : 12.5;
      return {
        responsive: true,
        maintainAspectRatio: false,
        animation: animationOpts,
        plugins: {
          legend: { display: false },
          datalabels: {
            display: true,
            anchor: 'end' as const,
            align: 'end' as const,
            color: '#7a7d98',
            font: { size: fontSize, weight: 500, family: 'Pretendard' },
            formatter: (value: number, ctx: any) => {
              if (ctx.datasetIndex !== ctx.chart.data.datasets.length - 1) return null;
              let t = 0;
              for (const ds of ctx.chart.data.datasets) {
                t += (ds.data[ctx.dataIndex] as number) || 0;
              }
              return t > 0 ? t.toFixed(1) : null;
            },
          } as any,
          tooltip: {
            mode: 'nearest' as const,
            intersect: true,
            callbacks: { label: tooltipLabel },
          },
        },
        datasets: {
          bar: { categoryPercentage: 0.6 },
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: {
              font: {
                size: isWeekly ? (weekCount > 20 ? 9 : 11) : 13,
                family: 'Pretendard',
              },
              maxRotation: isWeekly ? 60 : 0,
            },
          },
          y: {
            stacked: true,
            grace: '15%',
            title: { display: true, text: yTitle, font: { size: 13, family: 'Pretendard' } },
            ...(maxY !== undefined ? { max: maxY } : {}),
            ticks: { font: { size: 12, family: 'Pretendard' } },
          },
        },
      };
    }
  }, [yTitle, isSvcGpd, isWeekly, maxY, orgDepth, isSvc, weekCount]);

  const chartKey = `${mode}-${timeMode}-${orgDepth}-${labels.length}`;

  return (
    <div style={{ position: 'relative', height }}>
      <Bar key={chartKey} data={data} options={options as any} />
    </div>
  );
};

export default StackedBarChart;
