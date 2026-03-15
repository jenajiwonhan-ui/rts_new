import React, { useState, useMemo } from 'react';
import D, { YM, WM } from '../../data';
import { DetailRecord } from '../../types';
import {
  getWeeksPerMonth, buildProdColors, getWeeksInRange,
} from '../../utils/aggregation';
import { ymLabel, getLastNMonths } from '../../utils/formatters';
import { NPC, OOF, darkenHex } from '../../utils/colors';
import Toggle from '../common/Toggle';
import StackedBarChart from '../charts/StackedBarChart';
import DoughnutChart from '../charts/DoughnutChart';
import ChartLegend from '../charts/ChartLegend';
import SvcDetail from './SvcDetail';

interface SvcViewProps {
  org: string;
  lv2: string | null;
  lvl: string;
  onLv2Change: (lv2: string | null, lvl: string) => void;
}

const GPD_CLR: Record<string, string> = { GPD1: '#73b7c5', GPD2: '#d59875', GPD3: '#b0b474' };

const SvcView: React.FC<SvcViewProps> = ({ org, lv2, lvl, onLv2Change }) => {
  const [tmMode, setTmMode] = useState<'monthly' | 'weekly'>('monthly');

  // Filter detail for this service org
  const detail = useMemo(() => {
    let filtered = D.detail.filter(d => d.b === org);
    if (lv2 && lv2 !== '__all') {
      if (lvl === '2') {
        filtered = filtered.filter(d => d.d === lv2 || (d.d === '-' && d.t === lv2));
      } else if (lvl === '3') {
        filtered = filtered.filter(d => d.t === lv2 || d.pt === lv2);
      }
    }
    return filtered;
  }, [org, lv2, lvl]);

  const mRange = useMemo(() => getLastNMonths(YM, 4), []);
  const rangeDetail = useMemo(() => detail.filter(d => mRange.includes(d.ym)), [detail, mRange]);
  const wpm = useMemo(() => getWeeksPerMonth(rangeDetail), [rangeDetail]);

  // Bar chart data
  const barData = useMemo(() => {
    const prodColors = buildProdColors(rangeDetail);
    if (tmMode === 'monthly') {
      const labels = mRange.map(ymLabel);
      const prodTimes: Record<string, Record<string, number>> = {};
      for (const d of rangeDetail) {
        if (!prodTimes[d.p]) prodTimes[d.p] = {};
        const w = wpm[d.ym] || 1;
        prodTimes[d.p][d.ym] = (prodTimes[d.p][d.ym] || 0) + d.tot / w;
      }
      const datasets = prodColors.allItems.map(p => ({
        label: p, data: mRange.map(ym => prodTimes[p]?.[ym] || 0), backgroundColor: prodColors.colorMap[p],
      }));
      return { labels, datasets, legendItems: prodColors.allItems.map(p => ({ label: p, color: prodColors.colorMap[p] })) };
    } else {
      const weeks = getWeeksInRange(D.detail, mRange).sort();
      const labels = weeks.map(w => WM[w] || w);
      const prodTimes: Record<string, Record<string, number>> = {};
      for (const d of rangeDetail) {
        if (!prodTimes[d.p]) prodTimes[d.p] = {};
        for (const [wk, v] of Object.entries(d.wk)) {
          if (weeks.includes(wk)) prodTimes[d.p][wk] = (prodTimes[d.p][wk] || 0) + v;
        }
      }
      const datasets = prodColors.allItems.map(p => ({
        label: p, data: weeks.map(w => prodTimes[p]?.[w] || 0), backgroundColor: prodColors.colorMap[p],
      }));
      return { labels, datasets, legendItems: prodColors.allItems.map(p => ({ label: p, color: prodColors.colorMap[p] })) };
    }
  }, [rangeDetail, tmMode, mRange, wpm]);

  // Pie data (previous month)
  const pieData = useMemo(() => {
    const prevYm = mRange.length >= 2 ? mRange[mRange.length - 2] : mRange[mRange.length - 1];
    const prevDetail = rangeDetail.filter(d => d.ym === prevYm);
    const prevWpm = getWeeksPerMonth(prevDetail);
    const prodTotals: Record<string, number> = {};
    for (const d of prevDetail) {
      const w = prevWpm[d.ym] || 1;
      prodTotals[d.p] = (prodTotals[d.p] || 0) + d.tot / w;
    }
    const sorted = Object.entries(prodTotals).sort((a, b) => b[1] - a[1]);
    const prodColors = buildProdColors(prevDetail);
    return {
      labels: sorted.map(e => e[0]),
      data: sorted.map(e => e[1]),
      colors: sorted.map(e => prodColors.colorMap[e[0]] || '#ccc'),
      top: sorted,
      title: `${ymLabel(prevYm)} Mix`,
    };
  }, [rangeDetail, mRange]);

  // Ranking by GPD group (matching original renderSvcMix)
  const rankingData = useMemo(() => {
    const gpdTotals: Record<string, { total: number; products: { name: string; val: number }[] }> = {};
    const etcProducts: Record<string, number> = {};
    let npTotal = 0;
    let oofTotal = 0;

    for (const [pName, pVal] of pieData.top) {
      if (pName === 'Non-product') { npTotal = pVal; continue; }
      if (pName.indexOf('Out of Office') >= 0) { oofTotal += pVal; continue; }
      const grp = D.gpd_groups[pName];
      if (grp) {
        if (!gpdTotals[grp.gpd]) gpdTotals[grp.gpd] = { total: 0, products: [] };
        gpdTotals[grp.gpd].total += pVal;
        gpdTotals[grp.gpd].products.push({ name: grp.short, val: pVal });
      } else {
        etcProducts[pName] = (etcProducts[pName] || 0) + pVal;
      }
    }

    let etcTotal = 0;
    Object.values(etcProducts).forEach(v => { etcTotal += v; });
    const etcSorted = Object.entries(etcProducts).sort((a, b) => b[1] - a[1]);

    const items: { name: string; total: number; sub: string; clr: string }[] = [];

    for (const g of ['GPD1', 'GPD2', 'GPD3']) {
      if (!gpdTotals[g]) continue;
      const prods = gpdTotals[g].products.sort((a, b) => b.val - a.val);
      const subStr = prods.map((p, i) => `${i + 1}. ${p.name} (${p.val.toFixed(1)})`).join('  |  ');
      items.push({ name: g, total: gpdTotals[g].total, sub: subStr, clr: GPD_CLR[g] || '#7c6dd8' });
    }
    if (etcTotal > 0) {
      const etcSub = etcSorted.slice(0, 3).map((e, i) => `${i + 1}. ${e[0]} (${e[1].toFixed(1)})`).join('  |  ');
      items.push({ name: 'Other', total: etcTotal, sub: etcSub, clr: '#8e9aaf' });
    }
    if (npTotal > 0) items.push({ name: 'Non-product', total: npTotal, sub: '', clr: NPC });
    if (oofTotal > 0) items.push({ name: '휴가(Out of Office)', total: oofTotal, sub: '', clr: OOF });

    return items;
  }, [pieData.top]);

  return (
    <div className="content">
      {/* Section 1: Overview */}
      <div className="sec">
        <div className="sec-title"><span className="sec-num">1</span>Overview</div>

        <div className="gpd-panels">
          {/* Panel 1: 3M Trend */}
          <div className="gpd-panel">
            <div className="gpd-panel-header">
              <h3>3M Trend</h3>
              <div className="gpd-controls">
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
            <ChartLegend items={barData.legendItems} className="gpd-legend" />
            <div style={{ padding: '0 16px' }}>
              <div style={{ position: 'relative', height: 380 }}>
                <StackedBarChart
                  labels={barData.labels}
                  datasets={barData.datasets}
                  yTitle={tmMode === 'monthly' ? 'M/M' : 'Weekly RTS'}
                  height={380}
                  mode="svcGpd"
                  timeMode={tmMode}
                  isSvc={true}
                />
              </div>
            </div>
          </div>

          {/* Panel 2: Mix + Ranking */}
          <div className="gpd-panel">
            <div className="gpd-panel-header">
              <h3>{pieData.title}</h3>
            </div>
            <div className="gpd-mix-row">
              <div className="gpd-mix-pie">
                <DoughnutChart
                  labels={pieData.labels}
                  data={pieData.data}
                  colors={pieData.colors}
                  variant="svcMix"
                />
              </div>
              <div className="gpd-mix-rank">
                {rankingData.map(item => (
                  <div key={item.name} className="div-card" style={{ borderLeftColor: item.clr }}>
                    <div className="div-card-title">
                      <span className="div-card-rank">{item.name}</span>
                      <span className="div-card-mm" style={{ color: darkenHex(item.clr, 40) }}>{item.total.toFixed(1)} M/M</span>
                    </div>
                    {item.sub && <div className="div-card-detail">{item.sub}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Detail Table */}
      <div className="sec">
        <SvcDetail detail={detail} org={org} />
      </div>
    </div>
  );
};

export default SvcView;
