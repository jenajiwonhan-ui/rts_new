import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { DetailRecord } from '../../types';
import {
  getWeeksPerMonth, buildProdColors, getWeeksInRange,
} from '../../utils/aggregation';
import { ymLabel, getLastNMonths } from '../../utils/formatters';
import { NPC, OOF, GPD_PALETTES, darkenHex } from '../../utils/colors';
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
  productLabelMap: Record<string, string>;
}

const GPD_CLR = (name: string) => GPD_PALETTES[name]?.[0] || '#7c6dd8';

const SvcView: React.FC<SvcViewProps> = ({ org, lv2, lvl, onLv2Change, productLabelMap }) => {
  const { detail: allDetail, ymList: YM, weekMondays: WM, gpdGroups, productColors } = useData();
  const pLabel = (name: string) => productLabelMap[name] || name;
  const [tmMode, setTmMode] = useState<'monthly' | 'weekly'>('monthly');
  const [hlLabel, setHlLabel] = useState<string | null>(null);

  // Filter detail for this service org
  const detail = useMemo(() => {
    let filtered = allDetail.filter(d => d.lv1 === org);
    if (lv2 && lv2 !== '__all') {
      if (lvl === '2') {
        filtered = filtered.filter(d => d.lv2 === lv2);
      } else if (lvl === '3') {
        filtered = filtered.filter(d => d.lv3 === lv2);
      }
    }
    return filtered;
  }, [org, lv2, lvl]);

  const mRange = useMemo(() => getLastNMonths(YM, 4), []);
  const rangeDetail = useMemo(() => detail.filter(d => mRange.includes(d.ym)), [detail, mRange]);
  const wpm = useMemo(() => getWeeksPerMonth(rangeDetail), [rangeDetail]);

  // Bar chart data
  const barData = useMemo(() => {
    const prodColors = buildProdColors(rangeDetail, gpdGroups, productColors);
    if (tmMode === 'monthly') {
      const labels = mRange.map(ymLabel);
      const prodTimes: Record<string, Record<string, number>> = {};
      for (const d of rangeDetail) {
        if (!prodTimes[d.p]) prodTimes[d.p] = {};
        const w = wpm[d.ym] || 1;
        prodTimes[d.p][d.ym] = (prodTimes[d.p][d.ym] || 0) + d.tot / w;
      }
      const datasets = prodColors.allItems.map(p => ({
        label: pLabel(p), data: mRange.map(ym => prodTimes[p]?.[ym] || 0), backgroundColor: prodColors.colorMap[p],
      }));
      return { labels, datasets, legendItems: prodColors.allItems.map(p => ({ label: pLabel(p), color: prodColors.colorMap[p] })) };
    } else {
      const weeks = getWeeksInRange(allDetail, mRange).sort();
      const labels = weeks.map(w => WM[w] || w);
      const prodTimes: Record<string, Record<string, number>> = {};
      for (const d of rangeDetail) {
        if (!prodTimes[d.p]) prodTimes[d.p] = {};
        for (const [wk, v] of Object.entries(d.wk)) {
          if (weeks.includes(wk)) prodTimes[d.p][wk] = (prodTimes[d.p][wk] || 0) + v;
        }
      }
      const datasets = prodColors.allItems.map(p => ({
        label: pLabel(p), data: weeks.map(w => prodTimes[p]?.[w] || 0), backgroundColor: prodColors.colorMap[p],
      }));
      return { labels, datasets, legendItems: prodColors.allItems.map(p => ({ label: pLabel(p), color: prodColors.colorMap[p] })) };
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
    const isNP = (n: string) => n === 'Non-product';
    const isOOF = (n: string) => n.indexOf('Out of Office') >= 0;
    const sorted = Object.entries(prodTotals).sort((a, b) => {
      const aOrd = isOOF(a[0]) ? 2 : isNP(a[0]) ? 1 : 0;
      const bOrd = isOOF(b[0]) ? 2 : isNP(b[0]) ? 1 : 0;
      if (aOrd !== bOrd) return aOrd - bOrd;
      return b[1] - a[1];
    });
    const prodColors = buildProdColors(prevDetail, gpdGroups, productColors);
    return {
      labels: sorted.map(e => pLabel(e[0])),
      data: sorted.map(e => e[1]),
      colors: sorted.map(e => prodColors.colorMap[e[0]] || '#ccc'),
      top: sorted,
      title: `${ymLabel(prevYm)} Snapshot`,
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
      const grp = gpdGroups[pName];
      if (grp) {
        if (!gpdTotals[grp.gpd]) gpdTotals[grp.gpd] = { total: 0, products: [] };
        gpdTotals[grp.gpd].total += pVal;
        gpdTotals[grp.gpd].products.push({ name: pLabel(pName), val: pVal });
      } else {
        etcProducts[pName] = (etcProducts[pName] || 0) + pVal;
      }
    }

    let etcTotal = 0;
    Object.values(etcProducts).forEach(v => { etcTotal += v; });
    const etcSorted = Object.entries(etcProducts).sort((a, b) => b[1] - a[1]);

    const items: { name: string; total: number; sub: string; clr: string }[] = [];

    // product_owner 그룹별: M/M 기준 내림차순 순위 (1~4)
    const gpdOrder = Object.keys(gpdTotals).sort((a, b) => gpdTotals[b].total - gpdTotals[a].total);
    gpdOrder.forEach((g, idx) => {
      const prods = gpdTotals[g].products.sort((a, b) => b.val - a.val);
      const subStr = prods.map((p, i) => `${i + 1}. ${p.name} (${p.val.toFixed(1)})`).join('  |  ');
      items.push({ name: `${idx + 1}. ${g}`, total: gpdTotals[g].total, sub: subStr, clr: GPD_CLR(g) });
    });
    // 하단 고정: Other → Non-product → Out of Office
    if (etcTotal > 0) {
      const etcSub = etcSorted.slice(0, 3).map((e, i) => `${i + 1}. ${pLabel(e[0])} (${e[1].toFixed(1)})`).join('  |  ');
      items.push({ name: 'Other', total: etcTotal, sub: etcSub, clr: '#8e9aaf' });
    }
    if (npTotal > 0) items.push({ name: pLabel('Non-product'), total: npTotal, sub: '', clr: NPC });
    if (oofTotal > 0) items.push({ name: pLabel('휴가(Out of Office)'), total: oofTotal, sub: '', clr: OOF });

    return items;
  }, [pieData.top, gpdGroups, productLabelMap]);

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
            </div>
            <div className="gpd-mix-row">
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
              <div className="gpd-mix-pie">
                <DoughnutChart
                  labels={pieData.labels}
                  data={pieData.data}
                  colors={pieData.colors}
                  variant="svcMix"
                />
              </div>
            </div>
          </div>

          {/* Panel 2: 3M Trend */}
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
                  isSvc={true}
                  highlightedLabel={hlLabel}
                  onHighlight={setHlLabel}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Detail Table */}
      <div className="sec">
        <SvcDetail detail={detail} org={org} productLabelMap={productLabelMap} />
      </div>
    </div>
  );
};

export default SvcView;
