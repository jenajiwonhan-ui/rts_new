import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { DetailRecord } from '../../types';
import {
  getWeeksPerMonth, buildOrgColors,
  getOrgKey, getWeeksInRange,
} from '../../utils/aggregation';
import { ymLabel, getLastNMonths, fmtVal } from '../../utils/formatters';
import { LV1_COLORS, LV1_ORDER, darkenHex } from '../../utils/colors';
import Toggle from '../common/Toggle';
import StackedBarChart from '../charts/StackedBarChart';
import DoughnutChart from '../charts/DoughnutChart';
import ChartLegend from '../charts/ChartLegend';
import GpdTree from './GpdTree';

interface GpdViewProps {
  org: string;
  product: string | null;
  gpdConfig: Record<string, { products: Record<string, string> }>;
  npdProducts?: string[];
}

const GpdView: React.FC<GpdViewProps> = ({ org, product, gpdConfig, npdProducts }) => {
  const { detail: allDetail, ymList: YM, weekMondays: WM } = useData();
  const [tmMode, setTmMode] = useState<'monthly' | 'weekly'>('monthly');
  const [orgDepth, setOrgDepth] = useState<'l' | 'd'>('l');
  const [hlLabel, setHlLabel] = useState<string | null>(null);
  const [snapYm, setSnapYm] = useState<string | null>(null);

  const isNpd = !!npdProducts;
  const cfg = gpdConfig[org];
  const productNames = isNpd ? npdProducts! : (cfg ? Object.values(cfg.products) : []);

  const detail = useMemo(() => {
    const prods = product ? new Set([product]) : new Set(productNames);
    return allDetail.filter(d => prods.has(d.p) && d.lv1 !== 'Other');
  }, [product, productNames, allDetail]);

  const mRange = useMemo(() => getLastNMonths(YM, 4), []);
  const rangeDetail = useMemo(() => detail.filter(d => mRange.includes(d.ym)), [detail, mRange]);
  const wpm = useMemo(() => getWeeksPerMonth(rangeDetail), [rangeDetail]);
  const lastMonthWeeks = mRange.length > 0 ? (wpm[mRange[mRange.length - 1]] || 0) : 0;

  // Bar chart data
  const barData = useMemo(() => {
    const orgColors = buildOrgColors(rangeDetail, orgDepth);
    if (tmMode === 'monthly') {
      const labels = mRange.map(ymLabel);
      const orgTimes: Record<string, Record<string, number>> = {};
      for (const d of rangeDetail) {
        const k = getOrgKey(d, orgDepth);
        if (!orgTimes[k]) orgTimes[k] = {};
        const w = wpm[d.ym] || 1;
        orgTimes[k][d.ym] = (orgTimes[k][d.ym] || 0) + d.tot / w;
      }
      const datasets = orgColors.allItems.map(k => ({
        label: k,
        data: mRange.map(ym => orgTimes[k]?.[ym] || 0),
        backgroundColor: orgColors.colorMap[k],
      }));
      return { labels, datasets, legendItems: orgColors.allItems.map(k => ({ label: k, color: orgColors.colorMap[k] })) };
    } else {
      const weeks = getWeeksInRange(allDetail, mRange).sort();
      const labels = weeks.map(w => WM[w] || w);
      const orgTimes: Record<string, Record<string, number>> = {};
      for (const d of rangeDetail) {
        const k = getOrgKey(d, orgDepth);
        if (!orgTimes[k]) orgTimes[k] = {};
        for (const [wk, v] of Object.entries(d.wk)) {
          if (weeks.includes(wk)) {
            orgTimes[k][wk] = (orgTimes[k][wk] || 0) + v;
          }
        }
      }
      const datasets = orgColors.allItems.map(k => ({
        label: k,
        data: weeks.map(w => orgTimes[k]?.[w] || 0),
        backgroundColor: orgColors.colorMap[k],
      }));
      return { labels, datasets, legendItems: orgColors.allItems.map(k => ({ label: k, color: orgColors.colorMap[k] })) };
    }
  }, [rangeDetail, tmMode, orgDepth, mRange, wpm]);

  // Snapshot month: default to previous month
  const defaultSnapYm = useMemo(() => mRange.length >= 2 ? mRange[mRange.length - 2] : mRange[mRange.length - 1], [mRange]);
  const activeSnapYm = snapYm || defaultSnapYm;

  // Pie chart data (snapshot month, always Lv.1)
  const pieData = useMemo(() => {
    const prevYm = activeSnapYm;
    const prevDetail = rangeDetail.filter(d => d.ym === prevYm);
    const prevWpm = getWeeksPerMonth(prevDetail);
    const orgTotals: Record<string, number> = {};
    for (const d of prevDetail) {
      const w = prevWpm[d.ym] || 1;
      orgTotals[d.lv1] = (orgTotals[d.lv1] || 0) + d.tot / w;
    }
    const sorted = Object.entries(orgTotals).sort((a, b) => b[1] - a[1]);
    return {
      labels: sorted.map(e => e[0]),
      data: sorted.map(e => e[1]),
      colors: sorted.map(e => LV1_COLORS[e[0]] || '#ccc'),
      pieCM: Object.fromEntries(sorted.map(e => [e[0], LV1_COLORS[e[0]] || '#ccc'])),
      title: 'Monthly Snapshot',
    };
  }, [rangeDetail, activeSnapYm]);

  // Previous month data for diff
  const prevSnapLv1Totals = useMemo(() => {
    const snapIdx = mRange.indexOf(activeSnapYm);
    if (snapIdx <= 0) return {};
    const prevYm = mRange[snapIdx - 1];
    const prevDetail = rangeDetail.filter(d => d.ym === prevYm);
    const prevWpm = getWeeksPerMonth(prevDetail);
    const wc = prevWpm[prevYm] || 1;
    const totals: Record<string, number> = {};
    for (const d of prevDetail) {
      totals[d.lv1] = (totals[d.lv1] || 0) + d.tot / wc;
    }
    return totals;
  }, [rangeDetail, activeSnapYm, mRange]);

  // Ranking data: Lv.1 > Lv.2 breakdown (matching original HTML)
  const rankingData = useMemo(() => {
    const prevYm = activeSnapYm;
    const prevDetail = rangeDetail.filter(d => d.ym === prevYm);
    const prevWpm = getWeeksPerMonth(prevDetail);
    const wcPie = prevWpm[prevYm] || 1;

    const lv1Data: Record<string, { total: number; subs: Record<string, { total: number }> }> = {};
    for (const d of prevDetail) {
      if (!lv1Data[d.lv1]) lv1Data[d.lv1] = { total: 0, subs: {} };
      lv1Data[d.lv1].total += d.tot;
      const lv2 = d.lv2;
      if (lv2 !== '-') {
        if (!lv1Data[d.lv1].subs[lv2]) lv1Data[d.lv1].subs[lv2] = { total: 0 };
        lv1Data[d.lv1].subs[lv2].total += d.tot;
      }
    }

    // Normalize by weeks-per-month
    for (const lv of Object.values(lv1Data)) {
      lv.total /= wcPie;
      for (const s2 of Object.values(lv.subs)) {
        s2.total /= wcPie;
      }
    }

    const sorted = Object.entries(lv1Data).sort((a, b) => b[1].total - a[1].total);

    return sorted.map(([lv1, data], i) => {
      const clr = pieData.pieCM[lv1] || LV1_COLORS[lv1] || '#ccc';
      const lv2Sorted = Object.entries(data.subs).sort((a, b) => b[1].total - a[1].total);
      const lv2Str = lv2Sorted.slice(0, 3).map(([name, s2], si) =>
        `${si + 1}. ${name} (${s2.total.toFixed(1)})`
      ).join('  |  ');
      const prev = prevSnapLv1Totals[lv1];
      const diff = prev != null ? data.total - prev : null;

      return { rank: i + 1, name: lv1, total: data.total, diff, color: clr, darkColor: darkenHex(clr, 60), detail: lv2Str };
    });
  }, [rangeDetail, activeSnapYm, pieData.pieCM, prevSnapLv1Totals]);

  return (
    <div className="content">
      {/* Section 1: Overview */}
      <div className="sec">
        <div className="sec-title"><span className="sec-num">1</span>Overview</div>
        <div className="gpd-panels">
          {/* Panel 1: Mix + Ranking */}
          <div className="gpd-panel">
            <div className="gpd-panel-header">
              <h3>{pieData.title}</h3>
              <select className="fi" value={activeSnapYm} onChange={e => setSnapYm(e.target.value)}>
                {mRange.map(ym => <option key={ym} value={ym}>{ymLabel(ym)}</option>)}
              </select>
            </div>
            <div className="gpd-mix-row">
              <div className="gpd-mix-rank">
                {rankingData.map(item => (
                  <div key={item.name} className="div-card" style={{ borderLeftColor: item.color }}>
                    <div className="div-card-title">
                      <span className="div-card-rank">{item.rank}. {item.name}</span>
                      <span className="div-card-mm" style={{ color: item.darkColor }}>
                        {item.total.toFixed(1)} M/M
                        {item.diff != null && <span className="div-card-diff" style={{ color: item.darkColor }}>({item.diff >= 0 ? '▲' : '▼'}{Math.abs(item.diff).toFixed(1)})</span>}
                      </span>
                    </div>
                    {item.detail && (
                      <div className="div-card-detail">{item.detail}</div>
                    )}
                  </div>
                ))}
              </div>
              <div className="gpd-mix-pie">
                <DoughnutChart
                  labels={pieData.labels}
                  data={pieData.data}
                  colors={pieData.colors}
                  variant="gpdMix"
                />
              </div>
            </div>
          </div>

          {/* Panel 2: 4M Trend */}
          <div className="gpd-panel">
            <div className="gpd-panel-header">
              <h3>4M Trend</h3>
              <div className="gpd-controls">
                <Toggle
                  options={[
                    { value: 'l', label: 'Lv.1' },
                    { value: 'd', label: 'Lv.2' },
                  ]}
                  value={orgDepth}
                  onChange={v => setOrgDepth(v as 'l' | 'd')}
                  className="depth-tgl"
                />
                <Toggle
                  options={[
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'weekly', label: 'Weekly' },
                  ]}
                  value={tmMode}
                  onChange={v => setTmMode(v as 'monthly' | 'weekly')}
                />
              </div>
            </div>
            <ChartLegend items={barData.legendItems} className="gpd-legend" highlightedLabel={hlLabel} onHighlight={setHlLabel} />
            <div style={{ padding: '0 16px' }}>
              <div style={{ position: 'relative', height: 380 }}>
                <StackedBarChart
                  labels={barData.labels}
                  datasets={barData.datasets}
                  yTitle={tmMode === 'monthly' ? 'M/M' : 'Weekly RTS'}
                  height={380}
                  mode="svcGpd"
                  timeMode={tmMode}
                  orgDepth={orgDepth}
                  highlightedLabel={hlLabel}
                  onHighlight={setHlLabel}
                  lastBarWeeks={tmMode === 'monthly' ? lastMonthWeeks : 0}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Details Tree */}
      <div className="sec">
        <GpdTree detail={detail} org={org} product={product} />
      </div>
    </div>
  );
};

export default GpdView;
