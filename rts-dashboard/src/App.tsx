import React, { useState, useCallback, useMemo } from 'react';
import { SvcDropdownOption } from './types';
import { useData } from './contexts/DataContext';
import Header from './components/layout/Header';
import Breadcrumb from './components/layout/Breadcrumb';
import Sidebar from './components/layout/Sidebar';
import HomePage from './components/home/HomePage';
import GpdView from './components/gpd/GpdView';
import SvcView from './components/svc/SvcView';
import './App.css';

type ViewMode = 'home' | 'svc' | 'gpd';

const App: React.FC = () => {
  const {
    allOrgNodes, products, poGames, gpdConfig, productLabelMap, loading,
  } = useData();

  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [activeOrg, setActiveOrg] = useState<string | null>(null);
  const [curGpdProd, setCurGpdProd] = useState<string | null>(null);
  const [curSvcLv2, setCurSvcLv2] = useState<string | null>(null);
  const [curSvcLvl, setCurSvcLvl] = useState<string>('1');

  const orgLv1 = useMemo(() => allOrgNodes.filter(n => n.level === 1), [allOrgNodes]);

  const PO_ORDER = ['GPD1', 'GPD2', 'GPD3', 'IP Franchise'];
  const poOwnerIds = useMemo(() => {
    const found = new Set<string>();
    for (const p of products) {
      if (p.product_owner) found.add(p.product_owner);
    }
    return PO_ORDER.filter(o => found.has(o));
  }, [products]);

  const isGpd = useCallback((org: string) => poOwnerIds.includes(org), [poOwnerIds]);

  const handleSelectOrg = useCallback((org: string) => {
    setActiveOrg(org);
    if (isGpd(org)) {
      setViewMode('gpd');
      setCurGpdProd(null);
      setCurSvcLv2(null);
    } else {
      setViewMode('svc');
      setCurSvcLv2(null);
      setCurSvcLvl('1');
      setCurGpdProd(null);
    }
  }, [isGpd]);

  const handleHome = useCallback(() => {
    setViewMode('home');
    setActiveOrg(null);
    setCurGpdProd(null);
    setCurSvcLv2(null);
  }, []);

  const handleGpdProdSelect = useCallback((prod: string | null) => {
    setCurGpdProd(prod);
  }, []);

  const handleSvcLv2Change = useCallback((lv2: string | null, lvl: string) => {
    setCurSvcLv2(lv2);
    setCurSvcLvl(lvl);
  }, []);

  // Product tabs for GPD
  const gpdTabs = useMemo(() => {
    if (!activeOrg) return [];
    return poGames
      .filter(g => g.ownerId === activeOrg)
      .map(g => ({ short: g.gameShort, full: g.gameName }));
  }, [activeOrg, poGames]);

  // SVC dropdown options — DB org_nodes 기반
  const svcDropdownOptions = useMemo((): SvcDropdownOption[] => {
    if (!activeOrg || viewMode !== 'svc') return [];
    const lv1 = allOrgNodes.find(n => n.level === 1 && n.name === activeOrg);
    if (!lv1) return [];

    const opts: SvcDropdownOption[] = [
      { value: '__all', label: `${activeOrg} All`, level: '1', indent: 0 },
    ];

    const lv2Nodes = allOrgNodes
      .filter(n => n.parent_id === lv1.id)
      .sort((a, b) => a.sort_order - b.sort_order);

    for (const lv2 of lv2Nodes) {
      opts.push({ value: lv2.name, label: lv2.name, level: '2', indent: 1 });
      const lv3Nodes = allOrgNodes
        .filter(n => n.parent_id === lv2.id)
        .sort((a, b) => a.sort_order - b.sort_order);
      for (const lv3 of lv3Nodes) {
        opts.push({ value: lv3.name, label: lv3.name, level: '3', indent: 2 });
      }
    }
    return opts;
  }, [activeOrg, viewMode, allOrgNodes]);

  // Breadcrumb parts
  const breadcrumbParts = useMemo(() => {
    if (viewMode === 'home') return [];
    if (viewMode === 'gpd') {
      const parts = [activeOrg || ''];
      if (curGpdProd) {
        const game = poGames.find(g => g.gameName === curGpdProd);
        parts.push(game?.gameShort || curGpdProd);
      } else {
        parts.push('All');
      }
      return parts;
    }
    if (viewMode === 'svc') {
      const parts = [activeOrg || ''];
      if (curSvcLv2) {
        parts.push(curSvcLv2);
      } else {
        parts.push(`${activeOrg} All`);
      }
      return parts;
    }
    return [];
  }, [viewMode, activeOrg, curGpdProd, curSvcLv2, poGames]);

  if (loading) {
    return <div className="app"><Header /><div style={{ padding: 40, textAlign: 'center' }}>Loading...</div></div>;
  }

  return (
    <div className="app">
      <Header />
      <Breadcrumb parts={breadcrumbParts} onHomeClick={handleHome} />
      <div className="app-layout">
        <Sidebar
          activeOrg={activeOrg}
          onSelectOrg={handleSelectOrg}
          onHome={handleHome}
          orgLv1={orgLv1}
          poOwnerIds={poOwnerIds}
        />
        <div className="main-area">
          {viewMode === 'gpd' && gpdTabs.length > 0 && (
            <div className="filter-bar">
              <button
                className={`prod-tab ${curGpdProd === null ? 'active' : ''}`}
                onClick={() => handleGpdProdSelect(null)}
              >
                All
              </button>
              {gpdTabs.map(tab => (
                <button
                  key={tab.short}
                  className={`prod-tab ${curGpdProd === tab.full ? 'active' : ''}`}
                  onClick={() => handleGpdProdSelect(tab.full)}
                >
                  {tab.short}
                </button>
              ))}
            </div>
          )}

          {viewMode === 'svc' && svcDropdownOptions.length > 0 && (
            <div className="filter-bar">
              <select
                className="svc-org-select"
                value={curSvcLv2 || '__all'}
                onChange={e => {
                  const opt = svcDropdownOptions.find(o => o.value === e.target.value);
                  if (opt) handleSvcLv2Change(opt.value === '__all' ? null : opt.value, opt.level);
                }}
              >
                {svcDropdownOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {'　'.repeat(opt.indent)}{opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {viewMode === 'home' && <HomePage />}
          {viewMode === 'gpd' && activeOrg && (
            <GpdView
              key={`${activeOrg}-${curGpdProd}`}
              org={activeOrg}
              product={curGpdProd}
              gpdConfig={gpdConfig}
            />
          )}
          {viewMode === 'svc' && activeOrg && (
            <SvcView
              key={`${activeOrg}-${curSvcLv2}`}
              org={activeOrg}
              lv2={curSvcLv2}
              lvl={curSvcLvl}
              onLv2Change={handleSvcLv2Change}
              productLabelMap={productLabelMap}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
