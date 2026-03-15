import React, { useState, useCallback, useMemo } from 'react';
import D from './data';
import Header from './components/layout/Header';
import Breadcrumb from './components/layout/Breadcrumb';
import Sidebar from './components/layout/Sidebar';
import HomePage from './components/home/HomePage';
import GpdView from './components/gpd/GpdView';
import SvcView from './components/svc/SvcView';
import './App.css';

type ViewMode = 'home' | 'svc' | 'gpd';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [activeOrg, setActiveOrg] = useState<string | null>(null);
  const [curGpdProd, setCurGpdProd] = useState<string | null>(null);
  const [curSvcLv2, setCurSvcLv2] = useState<string | null>(null);
  const [curSvcLvl, setCurSvcLvl] = useState<string>('1');

  const isGpd = useCallback((org: string) => !!D.gpd_config[org], []);

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
    if (!activeOrg || !D.gpd_config[activeOrg]) return [];
    const cfg = D.gpd_config[activeOrg];
    return Object.entries(cfg.products).map(([short, full]) => ({ short, full }));
  }, [activeOrg]);

  // Breadcrumb parts
  const breadcrumbParts = useMemo(() => {
    if (viewMode === 'home') return [];
    if (viewMode === 'gpd') {
      const parts = [activeOrg || ''];
      if (curGpdProd) {
        const gpdInfo = D.gpd_groups[curGpdProd];
        parts.push(gpdInfo?.short || curGpdProd);
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
  }, [viewMode, activeOrg, curGpdProd, curSvcLv2]);

  return (
    <div className="app">
      <Header />
      <Breadcrumb parts={breadcrumbParts} onHomeClick={handleHome} />
      <div className="app-layout">
        <Sidebar
          activeOrg={activeOrg}
          onSelectOrg={handleSelectOrg}
          onHome={handleHome}
        />
        <div className="main-area">
          {/* Product Tab Bar for GPD */}
          {viewMode === 'gpd' && gpdTabs.length > 0 && (
            <div className="prod-tab-bar">
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

          {/* Views */}
          {viewMode === 'home' && <HomePage />}
          {viewMode === 'gpd' && activeOrg && (
            <GpdView
              key={`${activeOrg}-${curGpdProd}`}
              org={activeOrg}
              product={curGpdProd}
            />
          )}
          {viewMode === 'svc' && activeOrg && (
            <SvcView
              key={`${activeOrg}-${curSvcLv2}`}
              org={activeOrg}
              lv2={curSvcLv2}
              lvl={curSvcLvl}
              onLv2Change={handleSvcLv2Change}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
