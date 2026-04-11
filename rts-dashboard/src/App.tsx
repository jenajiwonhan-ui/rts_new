import React, { useState, useCallback, useMemo, useRef } from 'react';
import { SvcDropdownOption } from './types';
import { useData } from './contexts/DataContext';
import Sidebar from './components/layout/Sidebar';
import HomePage from './components/home/HomePage';
import GpdView from './components/gpd/GpdView';
import SvcView from './components/svc/SvcView';
import './App.css';

type ViewMode = 'home' | 'svc' | 'gpd' | 'npd';

const App: React.FC = () => {
  const {
    allOrgNodes, products, poGames, gpdConfig, productLabelMap,
    detail: allDetail, ymList: YM,
    loading, detailLoading, loadDetail,
  } = useData();

  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [activeOrg, setActiveOrg] = useState<string | null>(null);
  const [curGpdProd, setCurGpdProd] = useState<string | null>(null);
  const [curSvcLv2, setCurSvcLv2] = useState<string | null>(null);
  const [curSvcLvl, setCurSvcLvl] = useState<string>('1');
  const mainRef = useRef<HTMLDivElement>(null);

  const orgLv1 = useMemo(() => allOrgNodes.filter(n => n.level === 1), [allOrgNodes]);

  // activeOrg(풀네임) → alias(EPS 등) 변환
  const activeOrgAlias = useMemo(() => {
    if (!activeOrg) return null;
    const node = orgLv1.find(n => n.name === activeOrg);
    return node?.alias || activeOrg;
  }, [activeOrg, orgLv1]);

  const PO_ORDER = ['GPD1', 'GPD2', 'GPD3', 'IP Franchise'];
  const poOwnerIds = useMemo(() => {
    const found = new Set<string>();
    for (const p of products) {
      if (p.product_owner) found.add(p.product_owner);
    }
    return PO_ORDER.filter(o => found.has(o));
  }, [products]);

  const isGpd = useCallback((org: string) => poOwnerIds.includes(org), [poOwnerIds]);

  // Non-product 제품 목록: product_owner가 없는 제품
  const NPD_KEY = '__non_product__';
  const npdProducts = useMemo(() => {
    const owned = new Set<string>();
    for (const p of products) {
      if (p.product_owner) owned.add(p.name);
    }
    return products.filter(p => !owned.has(p.name)).map(p => p.name);
  }, [products]);

  const handleSelectOrg = useCallback((org: string) => {
    loadDetail();
    setActiveOrg(org);
    mainRef.current?.scrollTo(0, 0);
    if (org === NPD_KEY) {
      setViewMode('npd');
      setCurGpdProd(null);
      setCurSvcLv2(null);
    } else if (isGpd(org)) {
      setViewMode('gpd');
      setCurGpdProd(null);
      setCurSvcLv2(null);
    } else {
      setViewMode('svc');
      setCurSvcLv2(null);
      setCurSvcLvl('1');
      setCurGpdProd(null);
    }
  }, [isGpd, loadDetail]);

  const handleHome = useCallback(() => {
    setViewMode('home');
    setActiveOrg(null);
    setCurGpdProd(null);
    setCurSvcLv2(null);
  }, []);

  const handleGpdProdSelect = useCallback((prod: string | null) => {
    setCurGpdProd(prod);
  }, []);

  const handleSidebarGpdProduct = useCallback((owner: string, product: string) => {
    loadDetail();
    setActiveOrg(owner);
    setViewMode('gpd');
    setCurGpdProd(product);
    setCurSvcLv2(null);
    mainRef.current?.scrollTo(0, 0);
  }, [loadDetail]);

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

  // Active orgs in previous month (for legacy detection)
  const prevMonthActiveOrgs = useMemo(() => {
    if (YM.length < 2) return new Set<string>();
    const prevYm = YM[YM.length - 2];
    const active = new Set<string>();
    for (const d of allDetail) {
      if (d.ym === prevYm) {
        active.add(d.lv2);
        active.add(d.lv3);
      }
    }
    return active;
  }, [allDetail, YM]);

  // SVC dropdown options — DB org_nodes 기반
  const svcDropdownOptions = useMemo((): SvcDropdownOption[] => {
    if (!activeOrg || viewMode !== 'svc') return [];
    const lv1 = allOrgNodes.find(n => n.level === 1 && n.name === activeOrg);
    if (!lv1) return [];

    const opts: SvcDropdownOption[] = [
      { value: '__all', label: `${activeOrgAlias || activeOrg} All`, level: '1', indent: 0 },
    ];

    const lv2Nodes = allOrgNodes
      .filter(n => n.parent_id === lv1.id)
      .sort((a, b) => a.sort_order - b.sort_order);

    // Separate active and old lv2 groups
    const activeLv2: typeof lv2Nodes = [];
    const oldLv2: typeof lv2Nodes = [];
    for (const lv2 of lv2Nodes) {
      if (prevMonthActiveOrgs.has(lv2.name)) {
        activeLv2.push(lv2);
      } else {
        oldLv2.push(lv2);
      }
    }

    for (const lv2 of [...activeLv2, ...oldLv2]) {
      const isOldLv2 = !prevMonthActiveOrgs.has(lv2.name);
      opts.push({ value: lv2.name, label: isOldLv2 ? `(old) ${lv2.name}` : lv2.name, level: '2', indent: 1, isOld: isOldLv2 });

      const lv3Nodes = allOrgNodes
        .filter(n => n.parent_id === lv2.id)
        .sort((a, b) => a.sort_order - b.sort_order);

      const activeLv3 = lv3Nodes.filter(n => prevMonthActiveOrgs.has(n.name));
      const oldLv3 = lv3Nodes.filter(n => !prevMonthActiveOrgs.has(n.name));

      for (const lv3 of [...activeLv3, ...oldLv3]) {
        const isOldLv3 = !prevMonthActiveOrgs.has(lv3.name);
        opts.push({ value: lv3.name, label: isOldLv3 ? `(old) ${lv3.name}` : lv3.name, level: '3', indent: 2, isOld: isOldLv3 });
      }
    }
    return opts;
  }, [activeOrg, viewMode, allOrgNodes, prevMonthActiveOrgs]);


  if (loading) {
    return (
      <div className="app">
        <div className="app-layout">
          <Sidebar
            activeOrg={null}
            activeProduct={null}
            onSelectOrg={() => {}}
            onSelectGpdProduct={() => {}}
            orgLv1={[]}
            poOwnerIds={[]}
            poGames={[]}
            npdKey={NPD_KEY}
            onHomeClick={handleHome}
          />
          <div className="main-area">
            <div className="panel-wrap">
              <div className="loading-spinner">
                <svg viewBox="0 0 44 44">
                  <circle className="spinner-track" cx="22" cy="22" r="18" />
                  <circle className="spinner-arc" cx="22" cy="22" r="18" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-layout">
        <Sidebar
          activeOrg={activeOrg}
          activeProduct={curGpdProd}
          onSelectOrg={handleSelectOrg}
          onSelectGpdProduct={handleSidebarGpdProduct}
          orgLv1={orgLv1}
          poOwnerIds={poOwnerIds}
          poGames={poGames}
          npdKey={NPD_KEY}
          onHomeClick={handleHome}
        />
        <div className="main-area" ref={mainRef}>
          <div className="panel-wrap">
            {viewMode !== 'home' && activeOrg && (
              <div className="panel-header">
                <div className="panel-header-inner">
                  <div className="ph-row">
                    <div className="ph-title">
                      {viewMode === 'gpd' && curGpdProd ? (
                        <>
                          <span className="ph-title-parent">{activeOrg}</span>
                          <span className="ph-title-sep">›</span>
                          {gpdTabs.find(t => t.short === curGpdProd || t.full === curGpdProd)?.full ?? curGpdProd}
                        </>
                      ) : viewMode === 'npd'
                        ? 'Non-product Overview'
                        : activeOrg}
                    </div>
                    {viewMode === 'svc' && svcDropdownOptions.length > 0 && (
                      <select
                        className="svc-org-select"
                        value={curSvcLv2 || '__all'}
                        onChange={e => {
                          const opt = svcDropdownOptions.find(o => o.value === e.target.value);
                          if (opt) handleSvcLv2Change(opt.value === '__all' ? null : opt.value, opt.level);
                        }}
                      >
                        {svcDropdownOptions.map(opt => (
                          <option key={opt.value} value={opt.value} style={opt.isOld ? { color: 'var(--color-text-disabled)' } : undefined}>
                            {'　'.repeat(opt.indent)}{opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="panel-body">
              <div className="panel-body-inner">
                {detailLoading && (
                  <div className="loading-spinner">
                    <svg viewBox="0 0 44 44">
                      <circle className="spinner-track" cx="22" cy="22" r="18" />
                      <circle className="spinner-arc" cx="22" cy="22" r="18" />
                    </svg>
                  </div>
                )}
                {viewMode === 'home' && <HomePage />}
                {!detailLoading && viewMode === 'npd' && (
                  <GpdView
                    key="npd"
                    org={NPD_KEY}
                    product={null}
                    gpdConfig={gpdConfig}
                    npdProducts={npdProducts}
                  />
                )}
                {!detailLoading && viewMode === 'gpd' && activeOrg && (
                  <GpdView
                    key={`${activeOrg}-${curGpdProd}`}
                    org={activeOrg}
                    product={curGpdProd}
                    gpdConfig={gpdConfig}
                  />
                )}
                {!detailLoading && viewMode === 'svc' && activeOrg && (
                  <SvcView
                    key={`${activeOrg}-${curSvcLv2}`}
                    org={activeOrgAlias!}
                    lv2={curSvcLv2}
                    lvl={curSvcLvl}
                    onLv2Change={handleSvcLv2Change}
                    productLabelMap={productLabelMap}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
