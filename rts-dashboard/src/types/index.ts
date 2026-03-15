// Raw data types matching the JSON structure
export interface DetailRecord {
  n: string;   // member name
  p: string;   // product name
  ym: string;  // year-month "YYYY-MM"
  b: string;   // bureau (Lv.1 org)
  d: string;   // department (or "-")
  t: string;   // team (or "-")
  pt: string;  // part (or "-")
  wk: Record<string, number>; // weekly values { "2026W01": 1.0, ... }
  tot: number; // total for month
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

// SVC dropdown option
export interface SvcDropdownOption {
  value: string;
  label: string;
  level: string; // "1", "2", "3"
  indent: number;
}
