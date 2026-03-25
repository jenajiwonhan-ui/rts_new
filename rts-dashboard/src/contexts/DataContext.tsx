import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  loading: boolean;
}

const DataContext = createContext<DataContextValue | null>(null);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allOrgNodes, setAllOrgNodes] = useState<OrgNode[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [detail, setDetail] = useState<DetailRecord[]>([]);
  const [ymList, setYmList] = useState<string[]>([]);
  const [weekMondays, setWeekMondays] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      try {
        const [orgNodes, prods, entries] = await Promise.all([
          fetchOrgNodes(),
          fetchProducts(),
          fetchRtsEntries(),
        ]);

        setAllOrgNodes(orgNodes);
        setProducts(prods);

        const detailRecords = transformToDetailRecords(entries, orgNodes);
        setDetail(detailRecords);
        setYmList(extractYmList(entries));
        setWeekMondays(extractWeekMondays(entries));
      } catch (err) {
        console.error('[DataContext] Load failed:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

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
      if (p.product_owner && p.alias) {
        map[p.name] = { gpd: p.product_owner, short: p.alias };
      }
    }
    return map;
  }, [products]);

  const value = useMemo<DataContextValue>(() => ({
    detail, ymList, weekMondays, productColors, gpdGroups,
    allOrgNodes, products, poGames, gpdConfig, productLabelMap,
    loading,
  }), [detail, ymList, weekMondays, productColors, gpdGroups,
       allOrgNodes, products, poGames, gpdConfig, productLabelMap, loading]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
