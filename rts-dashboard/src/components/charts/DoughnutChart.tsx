import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { hexLum } from '../../utils/colors';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

/*
  Doughnut variants matching the original HTML:
  - 'prodPie' / 'orgPie': cutout 50%, padding 40, shows "pct%" only (>=3%), no name
  - 'svcMix': cutout 45%, padding 20, shows "name\npct%" (>=10%)
  - 'gpdMix': cutout 45%, padding 20, shows "name\npct%" (>=3%)
*/
export type DoughnutVariant = 'prodPie' | 'orgPie' | 'svcMix' | 'gpdMix';

interface DoughnutChartProps {
  labels: string[];
  data: number[];
  colors: string[];
  height?: number;
  variant?: DoughnutVariant;
}

const VARIANT_CONFIG: Record<DoughnutVariant, {
  cutout: string; padding: number; minPct: number; showName: boolean; fontSize: number;
}> = {
  prodPie: { cutout: '46%', padding: 4, minPct: 3, showName: false, fontSize: 12 },
  orgPie:  { cutout: '46%', padding: 4, minPct: 3, showName: false, fontSize: 11 },
  svcMix:  { cutout: '42%', padding: 4, minPct: 10, showName: true, fontSize: 13 },
  gpdMix:  { cutout: '42%', padding: 4, minPct: 3, showName: true, fontSize: 13 },
};

const DoughnutChart: React.FC<DoughnutChartProps> = ({
  labels, data, colors, height = 300, variant = 'prodPie',
}) => {
  const total = data.reduce((s, v) => s + v, 0);
  const cfg = VARIANT_CONFIG[variant];

  const chartData = useMemo(() => ({
    labels,
    datasets: [{
      data,
      backgroundColor: colors,
      borderWidth: 1,
      borderColor: '#fff',
    }],
  }), [labels, data, colors]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: cfg.cutout,
    layout: { padding: cfg.padding },
    plugins: {
      legend: { display: false },
      datalabels: {
        display: (ctx: any) => {
          const val = ctx.dataset?.data?.[ctx.dataIndex];
          if (val == null || total <= 0) return false;
          const pct = (val / total) * 100;
          return pct >= cfg.minPct;
        },
        anchor: 'center' as const,
        align: 'center' as const,
        textAlign: 'center' as const,
        color: (ctx: any) => {
          const bg = ctx.dataset?.backgroundColor?.[ctx.dataIndex] || '#888';
          return hexLum(bg) >= 0.3 ? '#4a4d60' : 'rgba(255,255,255,0.9)';
        },
        font: { weight: 600, size: cfg.fontSize, family: 'Pretendard' },
        formatter: (v: number, ctx: any) => {
          if (total <= 0) return '';
          const pct = Math.round((v / total) * 100);
          if (cfg.showName) {
            const name = ctx.chart.data.labels?.[ctx.dataIndex] || '';
            return `${name}\n${pct}%`;
          }
          return `${pct}%`;
        },
      } as any,
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const val = ctx.raw as number;
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
            return [ctx.label, `${val.toFixed(2)} MM (${pct}%)`];
          },
        },
      },
    },
  }), [cfg, total]);

  return (
    <div style={{ position: 'relative', height: height ?? '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', height: '100%' }}>
        <Doughnut data={chartData} options={options as any} />
      </div>
    </div>
  );
};

export default DoughnutChart;
