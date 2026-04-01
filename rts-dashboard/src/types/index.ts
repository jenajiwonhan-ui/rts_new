// Raw data types matching the DB structure
export interface DetailRecord {
  n: string;    // member name
  p: string;    // product name
  ym: string;   // year-month "YYYY-MM"
  lv1: string;  // Level 1 org (e.g. "EPS", "GCD")
  lv2: string;  // Level 2 org (or "-")
  lv3: string;  // Level 3 org (or "-")
  lv4: string;  // Level 4 org (or "-")
  wk: Record<string, number>; // weekly values { "2026W01": 1.0, ... }
  tot: number;  // total for month
}

export interface RawData {
  filters: {
    ym_list: string[];
    products: string[];
  };
  org_tree: Record<string, Record<string, string[]>>;
  product_colors: Record<string, string>;
  detail: DetailRecord[];
  week_mondays: Record<string, string>;
  gpd_config: Record<string, { products: Record<string, string> }>;
  gpd_groups: Record<string, { gpd: string; short: string }>;
}

// Navigation / View state
export type ViewMode = 'home' | 'svc' | 'gpd';

export interface AppState {
  viewMode: ViewMode;
  curSvcOrg: string | null;
  curSvcLv2: string | null;
  curSvcLvl: string;
  curGpdOrg: string | null;
  curGpdProd: string | null;
  tmMode: 'monthly' | 'weekly';
  orgDepth: 'l' | 'd' | 't';
}

// Multi-select
export interface MultiSelectState {
  items: string[];
  selected: Set<string>;
}

// Tree node for GPD detail
export interface TreeNode {
  name: string;
  times: Record<string, number>;
  members: Set<string>;
  memberCount: number;
  subs: Record<string, TreeNode>;
  directMembers: Record<string, Record<string, number>>;
  directMemberProducts?: Record<string, Set<string>>;
}

// Sidebar org item
export interface SidebarOrg {
  name: string;
  color: string;
  section: 'services' | 'owners';
}

// Chart color info
export interface ColorInfo {
  colorMap: Record<string, string>;
  topItems: string[];
  allItems: string[];
}

// ─── Product Owner Game (DB 테이블 대응) ───
// 향후 DB 테이블: po_games (id, owner_id, game_name, game_short, sort_order, created_at, updated_at)
export interface PoGame {
  id: string;
  ownerId: string;       // GPD1, GPD2, GPD3 등 Product Owner 식별자
  gameName: string;       // 게임 전체 이름 (e.g. "Project inZOI")
  gameShort: string;      // 게임 약칭 (e.g. "inZOI")
  sortOrder: number;      // 정렬 순서
  createdAt: string;      // ISO date
  updatedAt: string;      // ISO date
}

export interface PoGameInput {
  ownerId: string;
  gameName: string;
  gameShort: string;
  sortOrder?: number;
}

// SVC dropdown option
export interface SvcDropdownOption {
  value: string;
  label: string;
  level: string; // "1", "2", "3"
  indent: number;
  isOld?: boolean;
}

// ─── DB 테이블 대응 타입 ───

export interface OrgNode {
  id: number;
  name: string;
  alias: string | null;
  level: number;
  parent_id: number | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  alias: string | null;
  product_owner: string | null;
  color: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
