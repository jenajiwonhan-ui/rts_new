import React, { useState, useMemo, useCallback } from 'react';
import D, { YM, WM } from '../../data';
import { DetailRecord, TreeNode } from '../../types';
import { buildTree, sortByTotal, getWeeksPerMonth, getWeeksInRange } from '../../utils/aggregation';
import { ymLabel, getLastNMonths, fmtVal } from '../../utils/formatters';
import { LV1_COLORS, LV1_ORDER } from '../../utils/colors';
import Toggle from '../common/Toggle';
import PeriodSelect from '../common/PeriodSelect';
import PersonInlineChart from '../charts/PersonInlineChart';

interface GpdTreeProps {
  detail: DetailRecord[];
  org: string;
  product: string | null;
}

const GpdTree: React.FC<GpdTreeProps> = ({ detail, org, product }) => {
  const [tmMode, setTmMode] = useState<'monthly' | 'weekly'>('monthly');
  const [depth, setDepth] = useState<'1' | '2' | 'a'>('2');
  const [search, setSearch] = useState('');
  const [fromYm, setFromYm] = useState(() => {
    const last4 = getLastNMonths(YM, 4);
    return last4[0] || YM[0];
  });
  const [toYm, setToYm] = useState(() => YM[YM.length - 1]);
  const [expandedPersons, setExpandedPersons] = useState<Set<string>>(new Set());
  const [expandedLv1, setExpandedLv1] = useState<Set<string>>(new Set(LV1_ORDER));
  const [expandedLv2, setExpandedLv2] = useState<Set<string>>(new Set());
  const [expandedLv3, setExpandedLv3] = useState<Set<string>>(new Set());

  const range = useMemo(() => {
    const fromIdx = YM.indexOf(fromYm);
    const toIdx = YM.indexOf(toYm);
    if (fromIdx < 0 || toIdx < 0) return YM;
    return YM.slice(fromIdx, toIdx + 1);
  }, [fromYm, toYm]);

  const filteredDetail = useMemo(() => {
    let d = detail.filter(r => range.includes(r.ym));
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(r => r.n.toLowerCase().includes(q));
    }
    return d;
  }, [detail, range, search]);

  const wpm = useMemo(() => getWeeksPerMonth(filteredDetail), [filteredDetail]);

  const timeKeys = useMemo(() => {
    if (tmMode === 'monthly') return range;
    return getWeeksInRange(D.detail, range);
  }, [tmMode, range]);

  const tree = useMemo(() => buildTree(filteredDetail, tmMode, wpm), [filteredDetail, tmMode, wpm]);

  const relevantProducts = useMemo(() => {
    const cfg = D.gpd_config[org];
    if (!cfg) return null;
    if (product) return new Set([product]);
    return new Set(Object.values(cfg.products));
  }, [org, product]);

  const togglePerson = useCallback((key: string) => {
    setExpandedPersons(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleLv1 = useCallback((key: string) => {
    setExpandedLv1(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleLv2 = useCallback((key: string) => {
    setExpandedLv2(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleLv3 = useCallback((key: string) => {
    setExpandedLv3(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const show2 = depth !== '1';
  const show3 = depth === 'a';
  const showM = depth === 'a';

  const renderTimeVals = (times: Record<string, number>) => (
    <>
      {timeKeys.map(k => (
        <div key={k} className="tree-row-tc">{fmtVal(times[k])}</div>
      ))}
    </>
  );

  const renderMemberRow = (name: string, times: Record<string, number>, parentKey: string) => {
    const personKey = `${parentKey}|${name}`;
    return (
      <React.Fragment key={personKey}>
        <div className="tree-row">
          <div className="tree-row-name tree-member">
            <span
              className="tree-detail-link"
              onClick={() => togglePerson(personKey)}
              title="Show detail chart"
            >
              <svg viewBox="0 0 16 14" fill="none" stroke={expandedPersons.has(personKey) ? '#6c5ce7' : '#9498b0'} strokeWidth="1.5">
                <rect x="1" y="1" width="14" height="12" rx="2" />
                <polyline points="4,10 6,6 9,8 12,4" />
              </svg>
            </span>
            &nbsp;{name}
          </div>
          <div className="tree-row-cnt">&nbsp;</div>
          {renderTimeVals(times)}
        </div>
        {expandedPersons.has(personKey) && (
          <PersonInlineChart
            name={name}
            detail={D.detail}
            range={range}
            tmMode={tmMode}
            relevantProducts={relevantProducts}
          />
        )}
      </React.Fragment>
    );
  };

  const sortedTree = sortByTotal(
    Object.entries(tree),
    timeKeys
  );

  // Reorder by LV1_ORDER
  const orderedTree = [
    ...LV1_ORDER.filter(k => tree[k]).map(k => [k, tree[k]] as [string, TreeNode]),
    ...sortedTree.filter(([k]) => !LV1_ORDER.includes(k)),
  ];

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
        <span className="frl">Depth</span>
        <Toggle
          options={[
            { value: '1', label: 'Lv.1' },
            { value: '2', label: 'Lv.2' },
            { value: 'a', label: 'All' },
          ]}
          value={depth}
          onChange={v => setDepth(v as '1' | '2' | 'a')}
          className="depth-tgl"
        />
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

      {/* Tree */}
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 700 }}>
        {/* Header */}
        <div className="tree-hdr">
          <div className="tree-hdr-name">Organization</div>
          <div className="tree-hdr-cnt">#</div>
          {timeKeys.map(k => (
            <div key={k} className="tree-tc tree-tc-hdr">
              {tmMode === 'monthly' ? ymLabel(k) : (WM[k] || k)}
            </div>
          ))}
        </div>

        {/* Body */}
        {orderedTree.map(([lv1Key, lv1Node]) => {
          const isLv1Open = expandedLv1.has(lv1Key);
          const lv2Entries = sortByTotal(Object.entries(lv1Node.subs), timeKeys);
          const directMembers = Object.entries(lv1Node.directMembers).sort(
            (a, b) => timeKeys.reduce((s, k) => s + (b[1][k] || 0), 0) - timeKeys.reduce((s, k) => s + (a[1][k] || 0), 0)
          );

          return (
            <div key={lv1Key} className="tree-lv1">
              {/* Lv.1 Row */}
              <div
                className="tree-lv1-header"
                style={{ borderLeft: `4px solid ${LV1_COLORS[lv1Key] || '#888'}` }}
                onClick={() => toggleLv1(lv1Key)}
              >
                <span>
                  <span className="tree-arrow">{isLv1Open ? '▼' : '▶'}</span>
                  {lv1Key}
                </span>
                <div className="tree-lv1-right">
                  <span className="tree-lv1-cnt">{lv1Node.memberCount}</span>
                  {timeKeys.map(k => (
                    <span key={k} className="tree-lv1-mm">{fmtVal(lv1Node.times[k])}</span>
                  ))}
                </div>
              </div>

              {/* Lv.1 Children */}
              {isLv1Open && (
                <div className="tree-body" style={{ display: 'block' }}>
                  {/* Direct members under Lv.1 */}
                  {showM && directMembers.map(([name, times]) =>
                    renderMemberRow(name, times, lv1Key)
                  )}

                  {/* Lv.2 nodes */}
                  {show2 && lv2Entries.map(([lv2Key, lv2Node]) => {
                    const lv2FullKey = `${lv1Key}|${lv2Key}`;
                    const isLv2Open = expandedLv2.has(lv2FullKey);
                    const lv3Entries = sortByTotal(Object.entries(lv2Node.subs), timeKeys);
                    const lv2DirectMembers = Object.entries(lv2Node.directMembers).sort(
                      (a, b) => timeKeys.reduce((s, k) => s + (b[1][k] || 0), 0) - timeKeys.reduce((s, k) => s + (a[1][k] || 0), 0)
                    );

                    return (
                      <React.Fragment key={lv2FullKey}>
                        <div className="tree-row" style={{ background: '#f5f5ff' }}>
                          <div className="tree-row-name tree-dept" onClick={() => toggleLv2(lv2FullKey)} style={{ cursor: 'pointer' }}>
                            <span className="tree-tgl">{isLv2Open ? '▼' : '▶'}</span>
                            {lv2Key}
                          </div>
                          <div className="tree-row-cnt">{lv2Node.memberCount}</div>
                          {renderTimeVals(lv2Node.times)}
                        </div>

                        {isLv2Open && (
                          <>
                            {showM && lv2DirectMembers.map(([name, times]) =>
                              renderMemberRow(name, times, lv2FullKey)
                            )}

                            {show3 && lv3Entries.map(([lv3Key, lv3Node]) => {
                              const lv3FullKey = `${lv2FullKey}|${lv3Key}`;
                              const isLv3Open = expandedLv3.has(lv3FullKey);
                              const lv3Members = Object.entries(lv3Node.directMembers).sort(
                                (a, b) => timeKeys.reduce((s, k) => s + (b[1][k] || 0), 0) - timeKeys.reduce((s, k) => s + (a[1][k] || 0), 0)
                              );

                              return (
                                <React.Fragment key={lv3FullKey}>
                                  <div className="tree-row">
                                    <div className="tree-row-name tree-team" onClick={() => toggleLv3(lv3FullKey)} style={{ cursor: 'pointer' }}>
                                      <span className="tree-tgl">{isLv3Open ? '▼' : '▶'}</span>
                                      {lv3Key}
                                    </div>
                                    <div className="tree-row-cnt">{lv3Node.memberCount}</div>
                                    {renderTimeVals(lv3Node.times)}
                                  </div>

                                  {isLv3Open && showM && lv3Members.map(([name, times]) =>
                                    renderMemberRow(name, times, lv3FullKey)
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GpdTree;
