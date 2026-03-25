import { supabase } from './supabase';
import type { Product } from '../types';

/** products 전체 조회 (is_active = true) */
export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  return data;
}

/** product_owner별 제품 조회 (e.g. 'GPD1') */
export async function fetchProductsByOwner(productOwner: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('product_owner', productOwner)
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  return data;
}

/** products → product_colors 맵 변환 (기존 rawData.product_colors 호환) */
export function buildProductColors(products: Product[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const p of products) {
    if (p.color) map[p.name] = p.color;
  }
  return map;
}

/** products → gpd_groups 호환 형태 변환 */
export function buildGpdGroups(products: Product[]): Record<string, { gpd: string; short: string }> {
  const map: Record<string, { gpd: string; short: string }> = {};
  for (const p of products) {
    if (p.product_owner) {
      map[p.name] = { gpd: p.product_owner, short: p.alias || p.name };
    }
  }
  return map;
}

/** products → gpd_config 호환 형태 변환 */
export function buildGpdConfig(products: Product[]): Record<string, { products: Record<string, string> }> {
  const config: Record<string, { products: Record<string, string> }> = {};
  for (const p of products) {
    if (!p.product_owner) continue;
    if (!config[p.product_owner]) {
      config[p.product_owner] = { products: {} };
    }
    const label = p.alias || p.name;
    config[p.product_owner].products[label] = p.name;
  }
  return config;
}

/** name → 표시용 라벨 맵 (alias 있으면 alias, 없으면 name) */
export function buildProductLabelMap(products: Product[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const p of products) {
    map[p.name] = p.alias || p.name;
  }
  return map;
}

/** products → PoGame[] 호환 변환 (localPoGameRepository 대체) */
export function buildPoGames(products: Product[]) {
  return products
    .filter(p => p.product_owner)
    .map(p => ({
      id: `${p.product_owner}_${p.alias || p.name}`,
      ownerId: p.product_owner!,
      gameName: p.name,
      gameShort: p.alias || p.name,
      sortOrder: p.sort_order,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
}
