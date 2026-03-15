import React, { useState, useMemo, useCallback } from 'react';
import D, { YM, WM } from '../../data';
import { DetailRecord } from '../../types';
import { getWeeksPerMonth, getSvcLv2, getSvcLv3, getWeeksInRange } from '../../utils/aggregation';
import { ymLabel, getLastNMonths, fmtVal } from '../../utils/formatters';
import Toggle from '../common/Toggle';
import PeriodSelect from '../common/PeriodSelect';
import PersonInlineChart from '../charts/PersonInlineChart';

interface SvcDetailProps {
  detail: DetailRecord[];
  org: string;
}

interface FlatRow {
  lv2: string;
  lv3: string;
  member: string;
  product: string;
  times: Record<string, number>;
  total: number;
}

const SvcDetail: React.FC<SvcDetailProps> = ({ detail, org }) => {
  const [tmMode, setTmMode] = useState<'monthly' | 'weekly'>('monthly');
  const [fromYm, setFromYm] = useState(() => {
    const last4 = getLastNMonths(YM, 4);
    return last4[0] || YM[0];
  });
  const [toYm, setToYm] = useState(() => YM[YM.length - 1]);
  const [search, setSearch] = useState('');
  const [prodFilter, setProdFilter] = useState('__all');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [expandedPersons, setExpandedPersons] = useState<Set<string>>(new Set());

  const range = useMemo(() => {
    const fromIdx = YM.indexOf(fromYm);
    const toIdx = YM.indexOf(toYm);
    if (fromIdx < 0 || toIdx < 0) return YM;
    return YM.slice(fromIdx, toIdx + 1);
  }, [fromYm, toYm]);

  // Products in this org
  const products = useMemo(() => {
    const prods = new Set<string>();
    for (const d of detail) prods.add(d.p);
    return Array.from(prods).sort();
  }, [detail]);

  // Build flat rows
  const rows = useMemo((): FlatRow[] => {
    let filtered = detail.filter(d => range.includes(d.ym));
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(d => d.n.toLowerCase().includes(q));
    }
    if (prodFilter !== '__all') {
      filtered = filtered.filter(d => d.p === prodFilter);
    }

    const wpm = getWeeksPerMonth(filtered);

    if (tmMode === 'monthly') {
      // Group by (member, product, lv2, lv3) and sum by month
      const groups: Record<string, FlatRow> = {};
      for (const d of filtered) {
        const lv2 = getSvcLv2(d);
        const lv3 = getSvcLv3(d);
        const key = `${d.n}|${d.p}|${lv2}|${lv3}`;
        if (!groups[key]) {
          groups[key] = { lv2, lv3, member: d.n, product: d.p, times: {}, total: 0 };
        }
        const w = wpm[d.ym] || 1;
        const mm = d.tot / w;
        groups[key].times[d.ym] = (groups[key].times[d.ym] || 0) + mm;
        groups[key].total += mm;
      }
      return Object.values(groups);
    } else {
      // Weekly: each record becomes a flat row
      const groups: Record<string, FlatRow> = {};
      for (const d of filtered) {
        const lv2 = getSvcLv2(d);
        const lv3 = getSvcLv3(d);
        const key = `${d.n}|${d.p}|${lv2}|${lv3}|${d.ym}`;
        if (!groups[key]) {
          groups[key] = { lv2, lv3, member: d.n, product: d.p, times: {}, total: 0 };
        }
        for (const [wk, v] of Object.entries(d.wk)) {
          groups[key].times[wk] = (groups[key].times[wk] || 0) + v;
          groups[key].total += v;
        }
      }
      return Object.values(groups);
    }
  }, [detail, range, search, prodFilter, tmMode]);

  // Time keys for columns
  const timeKeys = useMemo(() => {
    if (tmMode === 'monthly') return range;
    return getWeeksInRange(detail, range);
  }, [tmMode, range, detail]);

  // Sort
  const sortedRows = useMemo(() => {
    const sorted = [...rows];
    if (sortCol) {
      sorted.sort((a, b) => {
        let va: string, vb: string;
        if (sortCol === 'lv2') { va = a.lv2; vb = b.lv2; }
        else if (sortCol === 'lv3') { va = a.lv3; vb = b.lv3; }
        else if (sortCol === 'member') { va = a.member; vb = b.member; }
        else if (sortCol === 'product') { va = a.product; vb = b.product; }
        else { va = ''; vb = ''; }
        const cmp = va.localeCompare(vb);
        return sortDir === 'asc' ? cmp : -cmp;
      });
    } else {
      sorted.sort((a, b) => b.total - a.total);
    }
    return sorted.slice(0, 500);
  }, [rows, sortCol, sortDir]);

  const handleSort = useCallback((col: string) => {
    if (sortCol === col) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortCol(null); setSortDir('asc'); }
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  }, [sortCol, sortDir]);

  const togglePerson = useCallback((key: string) => {
    setExpandedPersons(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const colWidths = [120, 120, 130, 160];

  const renderSortIcon = (col: string) => {
    if (sortCol !== col) return <span className="sort-btn">↕</span>;
    return <span className="sort-btn active">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div>
      <div className="sec-title">
        <span className="sec-num">2</span> Details
      </div>

      {/* Controls */}
      <div className="gpd-filter-row">
        <span className="frl">Period</span>
        <PeriodSelect ymList={YM} value={fromYm} onChange={setFromYm} />
        <span className="sep">~</span>
        <PeriodSelect ymList={YM} value={toYm} onChange={setToYm} />
        <span className="sep">|</span>
        <span className="frl">Product</span>
        <select
          className="fi"
          value={prodFilter}
          onChange={e => setProdFilter(e.target.value)}
        >
          <option value="__all">All</option>
          {products.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <span className="sep">|</span>
        <Toggle
          options={[
            { value: 'monthly', label: 'Monthly' },
            { value: 'weekly', label: 'Weekly' },
          ]}
          value={tmMode}
          onChange={v => setTmMode(v as 'monthly' | 'weekly')}
        />
        <div style={{ marginLeft: 'auto' }}>
          <input
            className="fi"
            placeholder="Search member..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ minWidth: 180 }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="tbl">
        <div className="tbl-h">
          <h3>Resource Details</h3>
          <span className="cnt">{rows.length} rows</span>
        </div>
        <div className="tbl-s" style={{ overflowX: 'auto', maxHeight: 600 }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: colWidths[0], minWidth: colWidths[0] }} onClick={() => handleSort('lv2')}>
                  Lv.2 {renderSortIcon('lv2')}
                </th>
                <th style={{ width: colWidths[1], minWidth: colWidths[1] }} onClick={() => handleSort('lv3')}>
                  Lv.3 {renderSortIcon('lv3')}
                </th>
                <th style={{ width: colWidths[2], minWidth: colWidths[2] }} onClick={() => handleSort('member')}>
                  Member {renderSortIcon('member')}
                </th>
                <th style={{ width: colWidths[3], minWidth: colWidths[3] }} onClick={() => handleSort('product')}>
                  Product {renderSortIcon('product')}
                </th>
                {timeKeys.map(k => (
                  <th key={k} className="wk-val" style={{ minWidth: 46 }}>
                    {tmMode === 'monthly' ? ymLabel(k) : (WM[k] || k)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, i) => {
                const rowKey = `${row.member}|${row.product}|${i}`;
                return (
                  <React.Fragment key={rowKey}>
                    <tr>
                      <td>{row.lv2}</td>
                      <td>{row.lv3}</td>
                      <td>
                        <span
                          className="tree-detail-link"
                          onClick={() => togglePerson(rowKey)}
                          style={{ marginRight: 6 }}
                          title="Show detail chart"
                        >
                          <svg viewBox="0 0 16 14" width="16" height="14" fill="none" stroke={expandedPersons.has(rowKey) ? '#6c5ce7' : '#9498b0'} strokeWidth="1.5">
                            <rect x="1" y="1" width="14" height="12" rx="2" />
                            <polyline points="4,10 6,6 9,8 12,4" />
                          </svg>
                        </span>
                        {row.member}
                      </td>
                      <td>{row.product}</td>
                      {timeKeys.map(k => (
                        <td key={k} className={`wk-val ${!row.times[k] ? 'zero' : ''}`}>
                          {fmtVal(row.times[k])}
                        </td>
                      ))}
                    </tr>
                    {expandedPersons.has(rowKey) && (
                      <tr>
                        <td colSpan={4 + timeKeys.length} style={{ padding: 0 }}>
                          <PersonInlineChart
                            name={row.member}
                            detail={detail}
                            range={range}
                            tmMode={tmMode}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SvcDetail;
