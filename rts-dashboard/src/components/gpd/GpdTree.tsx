import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
  const [depth, setDepth] = useState<'2' | '3' | 'a'>('2');
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

  const handleDepthChange = useCallback((v: string) => {
    setDepth(v as '2' | '3' | 'a');
  }, []);

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

  // Apply depth toggle: reset expand states based on tree structure
  useEffect(() => {
    setExpandedLv1(new Set(LV1_ORDER));
    if (depth === '2') {
      // Lv.1 expanded, Lv.2 rows shown but collapsed
      setExpandedLv2(new Set());
      setExpandedLv3(new Set());
    } else if (depth === '3') {
      // Lv.1 + Lv.2 expanded, Lv.3 rows shown but collapsed
      const allLv2 = new Set<string>();
      for (const [lv1Key, lv1Node] of Object.entries(tree)) {
        for (const lv2Key of Object.keys(lv1Node.subs)) {
          allLv2.add(`${lv1Key}|${lv2Key}`);
        }
      }
      setExpandedLv2(allLv2);
      setExpandedLv3(new Set());
    } else {
      // "All": expand everything
      const allLv2 = new Set<string>();
      const allLv3 = new Set<string>();
      for (const [lv1Key, lv1Node] of Object.entries(tree)) {
        for (const [lv2Key, lv2Node] of Object.entries(lv1Node.subs)) {
          const lv2Full = `${lv1Key}|${lv2Key}`;
          allLv2.add(lv2Full);
          for (const lv3Key of Object.keys(lv2Node.subs)) {
            allLv3.add(`${lv2Full}|${lv3Key}`);
          }
        }
      }
      setExpandedLv2(allLv2);
      setExpandedLv3(allLv3);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depth]);

  const treeWrapRef = useRef<HTMLDivElement>(null);

  // Scroll to rightmost (latest date) when tmMode changes
  useEffect(() => {
    const el = treeWrapRef.current;
    if (el) {
      requestAnimationFrame(() => { el.scrollLeft = el.scrollWidth; });
    }
  }, [tmMode]);


  const togglePerson = useCallback((key: string) => {
    setExpandedPersons(prev => prev.has(key) ? new Set() : new Set([key]));
  }, []);

  const toggleLv1 = useCallback((key: string) => {
    setExpandedLv1(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        // Close all children under this Lv.1
        setExpandedLv2(p => {
          const n = new Set(p);
          for (const k of p) { if (k.startsWith(key + '|')) n.delete(k); }
          return n;
        });
        setExpandedLv3(p => {
          const n = new Set(p);
          for (const k of p) { if (k.startsWith(key + '|')) n.delete(k); }
          return n;
        });
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const toggleLv2 = useCallback((key: string) => {
    setExpandedLv2(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        // Close Lv.3 children under this Lv.2
        setExpandedLv3(p => {
          const n = new Set(p);
          for (const k of p) { if (k.startsWith(key + '|')) n.delete(k); }
          return n;
        });
      } else {
        next.add(key);
      }
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

  // No hard-gating: depth sets initial expand state, clicking always toggles

  const renderTimeVals = (times: Record<string, number>) => (
    <>
      <div className="tree-time-spacer" />
      {timeKeys.map(k => (
        <div key={k} className="tree-row-tc">{fmtVal(times[k])}</div>
      ))}
    </>
  );

  const renderMemberRow = (name: string, times: Record<string, number>, parentKey: string) => {
    const personKey = `${parentKey}|${name}`;
    return (
      <React.Fragment key={personKey}>
        <div className={`tree-row tree-zebra${expandedPersons.has(personKey) ? ' person-row-active' : ''}`}>
          <div className="tree-fixed">
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
          </div>
          {renderTimeVals(times)}
        </div>
        {expandedPersons.has(personKey) && (
          <PersonInlineChart
            name={name}
            detail={D.detail}
            range={range}
            tmMode={tmMode}
            onClose={() => togglePerson(personKey)}
            scrollRef={treeWrapRef}
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

      <div className="gpd-panel" style={{ padding: 20 }}>
        {/* Controls */}
        <div className="gpd-panel-header" style={{ padding: '0 0 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className="frl" style={{ marginLeft: 8 }}>Period</span>
            <PeriodSelect ymList={YM} value={fromYm} onChange={setFromYm} />
            <span className="sep">~</span>
            <PeriodSelect ymList={YM} value={toYm} onChange={setToYm} />
          </div>
          <div className="gpd-controls">
            <Toggle
              options={[
                { value: '2', label: 'Lv.2' },
                { value: '3', label: 'Lv.3' },
                { value: 'a', label: 'All' },
              ]}
              value={depth}
              onChange={handleDepthChange}
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

        {/* Tree */}
        <div id="gpd-tree-wrap" className="gpd-tree-wrap" ref={treeWrapRef}>
        {/* Header */}
        <div className="tree-hdr">
          <div className="tree-fixed">
            <div className="tree-hdr-name">Organization</div>
            <div className="tree-hdr-cnt">#</div>
          </div>
          <div className="tree-time-spacer" />
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
                className="tree-row tree-lv1-header"
                onClick={() => toggleLv1(lv1Key)}
              >
                <div className="tree-fixed">
                  <div className="tree-row-name" style={{ fontWeight: 700, cursor: 'pointer' }}>
                    <span className="tree-tgl">{isLv1Open ? '▼' : '▶'}</span>
                    {lv1Key}
                  </div>
                  <div className="tree-row-cnt">{lv1Node.memberCount}</div>
                </div>
                <div className="tree-time-spacer" />
                {timeKeys.map(k => (
                  <div key={k} className="tree-row-tc" style={{ fontWeight: 700 }}>{fmtVal(lv1Node.times[k])}</div>
                ))}
              </div>

              {/* Lv.1 Children */}
              {isLv1Open && (
                <div className="tree-body" style={{ display: 'block' }}>
                  {/* Lv.2 nodes */}
                  {lv2Entries.map(([lv2Key, lv2Node]) => {
                    const lv2FullKey = `${lv1Key}|${lv2Key}`;
                    const isLv2Open = expandedLv2.has(lv2FullKey);
                    const lv3Entries = sortByTotal(Object.entries(lv2Node.subs), timeKeys);
                    const lv2DirectMembers = Object.entries(lv2Node.directMembers).sort(
                      (a, b) => timeKeys.reduce((s, k) => s + (b[1][k] || 0), 0) - timeKeys.reduce((s, k) => s + (a[1][k] || 0), 0)
                    );

                    return (
                      <React.Fragment key={lv2FullKey}>
                        <div className="tree-row tree-lv2-row">
                          <div className="tree-fixed">
                            <div className="tree-row-name tree-dept" onClick={() => toggleLv2(lv2FullKey)} style={{ cursor: 'pointer' }}>
                              <span className="tree-tgl">{isLv2Open ? '▼' : '▶'}</span>
                              {lv2Key}
                            </div>
                            <div className="tree-row-cnt">{lv2Node.memberCount}</div>
                          </div>
                          {renderTimeVals(lv2Node.times)}
                        </div>

                        {isLv2Open && (
                          <>
                            {lv3Entries.map(([lv3Key, lv3Node]) => {
                              const lv3FullKey = `${lv2FullKey}|${lv3Key}`;
                              const isLv3Open = expandedLv3.has(lv3FullKey);
                              const lv3Members = Object.entries(lv3Node.directMembers).sort(
                                (a, b) => timeKeys.reduce((s, k) => s + (b[1][k] || 0), 0) - timeKeys.reduce((s, k) => s + (a[1][k] || 0), 0)
                              );

                              return (
                                <React.Fragment key={lv3FullKey}>
                                  <div className="tree-row tree-zebra">
                                    <div className="tree-fixed">
                                      <div className="tree-row-name tree-team" onClick={() => toggleLv3(lv3FullKey)} style={{ cursor: 'pointer' }}>
                                        <span className="tree-tgl">{isLv3Open ? '▼' : '▶'}</span>
                                        {lv3Key}
                                      </div>
                                      <div className="tree-row-cnt">{lv3Node.memberCount}</div>
                                    </div>
                                    {renderTimeVals(lv3Node.times)}
                                  </div>

                                  {isLv3Open && lv3Members.map(([name, times]) =>
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
    </div>
  );
};

export default GpdTree;
