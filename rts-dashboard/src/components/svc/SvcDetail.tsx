import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
    setExpandedPersons(prev => prev.has(key) ? new Set() : new Set([key]));
  }, []);

  const [colWidths, setColWidths] = useState([120, 120, 150, 160]);
  const resizingCol = useRef<number | null>(null);
  const resizeStartX = useRef(0);
  const resizeStartW = useRef(0);

  const handleResizeStart = useCallback((colIdx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingCol.current = colIdx;
    resizeStartX.current = e.clientX;
    resizeStartW.current = colWidths[colIdx];

    const onMove = (ev: MouseEvent) => {
      if (resizingCol.current === null) return;
      const diff = ev.clientX - resizeStartX.current;
      const newW = Math.max(60, resizeStartW.current + diff);
      setColWidths(prev => {
        const next = [...prev];
        next[resizingCol.current!] = newW;
        return next;
      });
    };
    const onUp = () => {
      resizingCol.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [colWidths]);

  const totalFixedW = colWidths.reduce((s, w) => s + w, 0);
  const tableWrapRef = useRef<HTMLDivElement>(null);

  // Scroll to rightmost (latest date) when tmMode changes
  useEffect(() => {
    const el = tableWrapRef.current;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollLeft = el.scrollWidth;
      });
    }
  }, [tmMode]);

  const renderSortIcon = (col: string) => {
    if (sortCol !== col) return <span className="sort-btn">↕</span>;
    return <span className="sort-btn active">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div>
      <div className="sec-title">
        <span className="sec-num">2</span> Details
      </div>

      <div className="gpd-panel" style={{ padding: 20 }}>
        {/* Controls */}
        <div className="gpd-panel-header" style={{ padding: '0 0 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className="frl">Period</span>
            <PeriodSelect ymList={YM} value={fromYm} onChange={setFromYm} />
            <span className="sep">~</span>
            <PeriodSelect ymList={YM} value={toYm} onChange={setToYm} />
            <span className="frl" style={{ marginLeft: 6 }}>Product</span>
            <select
              className="fi"
              value={prodFilter}
              onChange={e => setProdFilter(e.target.value)}
              style={{ maxWidth: 200 }}
            >
              <option value="__all">All</option>
              {products.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <input
              className="fi"
              placeholder="Search member..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ minWidth: 150 }}
            />
          </div>
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

        {/* Table: single scroll, sticky fixed cols */}
        <div className="svc-table-wrap" ref={tableWrapRef} style={{ '--svc-fixed-w': `${totalFixedW}px` } as React.CSSProperties}>
          {/* Header */}
          <div className="svc-tbl-hdr">
            <div className="svc-hdr-fixed" style={{ width: totalFixedW }}>
              {['lv2', 'lv3', 'member', 'product'].map((col, ci) => (
                <span
                  key={col}
                  className="svc-hdr-field"
                  style={{ width: colWidths[ci] }}
                  onClick={() => handleSort(col)}
                >
                  {col === 'lv2' ? 'Lv.2' : col === 'lv3' ? 'Lv.3' : col === 'member' ? 'Member' : 'Product'}
                  {renderSortIcon(col)}
                  <span className="svc-col-resize" onMouseDown={e => handleResizeStart(ci, e)} />
                </span>
              ))}
            </div>
            <div className="svc-time-spacer" />
            {timeKeys.map(k => (
              <div key={k} className="tree-tc tree-tc-hdr">
                {tmMode === 'monthly' ? ymLabel(k) : (WM[k] || k)}
              </div>
            ))}
          </div>

          {/* Body */}
          {sortedRows.map((row, i) => {
            const rowKey = `${row.member}|${row.product}|${i}`;
            return (
              <React.Fragment key={rowKey}>
                <div className={`svc-tbl-row${expandedPersons.has(rowKey) ? ' person-row-active' : ''}`}>
                  <div className="svc-row-fixed" style={{ width: totalFixedW }}>
                    <span className="svc-row-field" style={{ width: colWidths[0] }}>{row.lv2}</span>
                    <span className="svc-row-field" style={{ width: colWidths[1] }}>{row.lv3}</span>
                    <span className="svc-row-field svc-f-member" style={{ width: colWidths[2] }}>
                      <span
                        className="tree-detail-link"
                        onClick={() => togglePerson(rowKey)}
                        title="Show detail chart"
                        style={{ marginRight: 6 }}
                      >
                        <svg viewBox="0 0 16 14" fill="none" stroke={expandedPersons.has(rowKey) ? '#6c5ce7' : '#9498b0'} strokeWidth="1.5">
                          <rect x="1" y="1" width="14" height="12" rx="2" />
                          <polyline points="4,10 6,6 9,8 12,4" />
                        </svg>
                      </span>
                      {row.member}
                    </span>
                    <span className="svc-row-field svc-f-prod" style={{ width: colWidths[3] }}>{row.product}</span>
                  </div>
                  <div className="svc-time-spacer" />
                  {timeKeys.map(k => (
                    <div key={k} className="tree-row-tc">{fmtVal(row.times[k])}</div>
                  ))}
                </div>
                {expandedPersons.has(rowKey) && (
                  <PersonInlineChart
                    name={row.member}
                    detail={detail}
                    range={range}
                    tmMode={tmMode}
                    onClose={() => togglePerson(rowKey)}
                    scrollRef={tableWrapRef}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SvcDetail;
