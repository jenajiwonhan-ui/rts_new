import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { DetailRecord, OrgNode, Product } from '../types';
import { fetchOrgNodes } from '../services/orgNodeService';
import { fetchProducts, buildPoGames, buildGpdConfig, buildProductLabelMap } from '../services/productService';
import { fetchRtsEntries, transformToDetailRecords, extractYmList, extractWeekMondays } from '../services/rtsEntryService';

interface DataContextValue {
  // 데이터
  detail: DetailRecord[];
  ymList: string[];
  weekMondays: Record<string, string>;
  productColors: Record<string, string>;
  gpdGroups: Record<string, { gpd: string; short: string }>;

  // org / product (DB)
  allOrgNodes: OrgNode[];
  products: Product[];
  poGames: ReturnType<typeof buildPoGames>;
  gpdConfig: ReturnType<typeof buildGpdConfig>;
  productLabelMap: Record<string, string>;

  // 로딩 상태
  sidebarLoading: boolean;
  detailLoading: boolean;
  loading: boolean;

  // rts_entries 로드 트리거
  loadDetail: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allOrgNodes, setAllOrgNodes] = useState<OrgNode[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [detail, setDetail] = useState<DetailRecord[]>([]);
  const [ymList, setYmList] = useState<string[]>([]);
  const [weekMondays, setWeekMondays] = useState<Record<string, string>>({});
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const orgNodesRef = useRef<OrgNode[]>([]);
  const detailLoaded = useRef(false);

  // Step 1: 사이드바용 데이터만 먼저 로드
  useEffect(() => {
    async function loadSidebar() {
      try {
        const [orgNodes, prods] = await Promise.all([
          fetchOrgNodes(),
          fetchProducts(),
        ]);
        orgNodesRef.current = orgNodes;
        setAllOrgNodes(orgNodes);
        setProducts(prods);
      } catch (err) {
        console.error('[DataContext] Sidebar load failed:', err);
      } finally {
        setSidebarLoading(false);
      }
    }
    loadSidebar();
  }, []);

  // Step 2: 조직 선택 시 rts_entries 로드 (한 번만)
  const loadDetail = useCallback(async () => {
    if (detailLoaded.current || detailLoading) return;
    detailLoaded.current = true;
    setDetailLoading(true);
    try {
      const entries = await fetchRtsEntries();
      const detailRecords = transformToDetailRecords(entries, orgNodesRef.current);
      setDetail(detailRecords);
      setYmList(extractYmList(entries));
      setWeekMondays(extractWeekMondays(entries));
    } catch (err) {
      console.error('[DataContext] Detail load failed:', err);
      detailLoaded.current = false;
    } finally {
      setDetailLoading(false);
    }
  }, [detailLoading]);

  const poGames = useMemo(() => buildPoGames(products), [products]);
  const gpdConfig = useMemo(() => buildGpdConfig(products), [products]);
  const productLabelMap = useMemo(() => buildProductLabelMap(products), [products]);

  const productColors = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of products) {
      if (p.color) map[p.name] = p.color;
    }
    return map;
  }, [products]);

  const gpdGroups = useMemo(() => {
    const map: Record<string, { gpd: string; short: string }> = {};
    for (const p of products) {
      if (p.product_owner) {
        map[p.name] = { gpd: p.product_owner, short: p.alias || p.name };
      }
    }
    return map;
  }, [products]);

  const loading = sidebarLoading;

  const value = useMemo<DataContextValue>(() => ({
    detail, ymList, weekMondays, productColors, gpdGroups,
    allOrgNodes, products, poGames, gpdConfig, productLabelMap,
    sidebarLoading, detailLoading, loading,
    loadDetail,
  }), [detail, ymList, weekMondays, productColors, gpdGroups,
       allOrgNodes, products, poGames, gpdConfig, productLabelMap,
       sidebarLoading, detailLoading, loading, loadDetail]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
