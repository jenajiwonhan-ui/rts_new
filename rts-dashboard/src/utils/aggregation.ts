import { DetailRecord, ColorInfo, TreeNode } from '../types';
import { LV1_COLORS, LV1_ORDER, DEPT_PC, ORG_PC2, NPC, OOF, PC, GPD_PALETTES, isPubgProduct } from './colors';
import rawData from '../data/rawData.json';

const D = rawData as unknown as import('../types').RawData;

/** Count distinct weeks per month across detail records */
export function getWeeksPerMonth(detail: DetailRecord[]): Record<string, number> {
  const wpm: Record<string, Set<string>> = {};
  for (const d of detail) {
    if (!wpm[d.ym]) wpm[d.ym] = new Set();
    for (const w of Object.keys(d.wk)) {
      wpm[d.ym].add(w);
    }
  }
  const result: Record<string, number> = {};
  for (const [ym, ws] of Object.entries(wpm)) {
    result[ym] = ws.size || 1;
  }
  return result;
}

/** Add time values to a target object (monthly or weekly) */
export function addTimes(
  target: Record<string, number>,
  d: DetailRecord,
  tmMode: 'monthly' | 'weekly',
  wpm: Record<string, number>
): void {
  if (tmMode === 'monthly') {
    const w = wpm[d.ym] || 1;
    target[d.ym] = (target[d.ym] || 0) + d.tot / w;
  } else {
    for (const [wk, v] of Object.entries(d.wk)) {
      target[wk] = (target[wk] || 0) + v;
    }
  }
}

/** Add time values nested by product */
export function addProdTimes(
  target: Record<string, Record<string, number>>,
  d: DetailRecord,
  tmMode: 'monthly' | 'weekly',
  wpm: Record<string, number>
): void {
  if (!target[d.p]) target[d.p] = {};
  addTimes(target[d.p], d, tmMode, wpm);
}

/** Build product color info from detail records */
export function buildProdColors(detail: DetailRecord[]): ColorInfo {
  const totals: Record<string, number> = {};
  for (const d of detail) {
    totals[d.p] = (totals[d.p] || 0) + d.tot;
  }

  const normal: string[] = [];
  let hasNP = false;
  let hasOOF = false;

  for (const p of Object.keys(totals)) {
    if (p === 'Non-product') hasNP = true;
    else if (p === '휴가(Out of Office)') hasOOF = true;
    else normal.push(p);
  }

  normal.sort((a, b) => (totals[b] || 0) - (totals[a] || 0));

  // Assign colors from group palettes
  const gpdGroups = D.gpd_groups || {};
  const groupCounters: Record<string, number> = {};
  const colorMap: Record<string, string> = {};

  for (const p of normal) {
    let palette: string[] | undefined;

    if (isPubgProduct(p)) {
      palette = GPD_PALETTES.PUBG;
      groupCounters.PUBG = (groupCounters.PUBG || 0);
      colorMap[p] = palette[groupCounters.PUBG % palette.length];
      groupCounters.PUBG++;
    } else if (gpdGroups[p]) {
      const grp = gpdGroups[p].gpd;
      palette = GPD_PALETTES[grp];
      if (palette) {
        groupCounters[grp] = (groupCounters[grp] || 0);
        colorMap[p] = palette[groupCounters[grp] % palette.length];
        groupCounters[grp]++;
      } else {
        colorMap[p] = PC[Object.keys(colorMap).length % PC.length];
      }
    } else {
      colorMap[p] = D.product_colors[p] || PC[Object.keys(colorMap).length % PC.length];
    }
  }
  if (hasNP) colorMap['Non-product'] = NPC;
  if (hasOOF) colorMap['휴가(Out of Office)'] = OOF;

  const allP = [...normal];
  if (hasNP) allP.push('Non-product');
  if (hasOOF) allP.push('휴가(Out of Office)');

  return { colorMap: colorMap, topItems: normal, allItems: allP };
}

/** Build org color info from detail records */
export function buildOrgColors(detail: DetailRecord[], orgDepth: string): ColorInfo {
  const totals: Record<string, number> = {};

  const getKey = (d: DetailRecord): string => {
    if (orgDepth === 'l') return d.b;
    if (orgDepth === 'd') {
      if (d.d === '-') return `${d.b} (Direct)`;
      return `${d.b} / ${d.d}`;
    }
    // orgDepth === 't'
    if (d.d === '-' && d.t === '-') return `${d.b} (Direct)`;
    if (d.d === '-') return `${d.b} / ${d.t}`;
    if (d.t === '-') return `${d.d} (Direct)`;
    return `${d.d} / ${d.t}`;
  };

  for (const d of detail) {
    const k = getKey(d);
    totals[k] = (totals[k] || 0) + d.tot;
  }

  const colorMap: Record<string, string> = {};

  if (orgDepth === 'l') {
    for (const k of Object.keys(totals)) {
      colorMap[k] = LV1_COLORS[k] || DEPT_PC[Object.keys(colorMap).length % DEPT_PC.length];
    }
    const ordered = LV1_ORDER.filter(o => totals[o] !== undefined);
    const rest = Object.keys(totals).filter(k => !LV1_ORDER.includes(k)).sort((a, b) => totals[b] - totals[a]);
    const allItems = [...ordered, ...rest];
    return { colorMap, topItems: allItems, allItems };
  }

  // For dept/team depth, group by Lv.1 then sort within each
  const byLv1: Record<string, string[]> = {};
  for (const k of Object.keys(totals)) {
    const lv1 = k.split(' / ')[0].replace(' (Direct)', '');
    if (!byLv1[lv1]) byLv1[lv1] = [];
    byLv1[lv1].push(k);
  }

  let ci = 0;
  const allItems: string[] = [];
  for (const lv1 of LV1_ORDER) {
    if (!byLv1[lv1]) continue;
    byLv1[lv1].sort((a, b) => (totals[b] || 0) - (totals[a] || 0));
    for (const k of byLv1[lv1]) {
      colorMap[k] = orgDepth === 'd' ? DEPT_PC[ci % DEPT_PC.length] : ORG_PC2[ci % ORG_PC2.length];
      ci++;
      allItems.push(k);
    }
  }
  // remaining
  for (const lv1 of Object.keys(byLv1)) {
    if (LV1_ORDER.includes(lv1)) continue;
    byLv1[lv1].sort((a, b) => (totals[b] || 0) - (totals[a] || 0));
    for (const k of byLv1[lv1]) {
      colorMap[k] = ORG_PC2[ci % ORG_PC2.length];
      ci++;
      allItems.push(k);
    }
  }

  return { colorMap, topItems: allItems, allItems };
}

/** Get org key from a detail record based on depth */
export function getOrgKey(d: DetailRecord, orgDepth: string): string {
  if (orgDepth === 'l') return d.b;
  if (orgDepth === 'd') {
    if (d.d === '-') return `${d.b} (Direct)`;
    return `${d.b} / ${d.d}`;
  }
  if (d.d === '-' && d.t === '-') return `${d.b} (Direct)`;
  if (d.d === '-') return `${d.b} / ${d.t}`;
  if (d.t === '-') return `${d.d} (Direct)`;
  return `${d.d} / ${d.t}`;
}

/** Get Lv2/Lv3 levels from a detail record for tree building */
export function getLevels(d: DetailRecord): { lv2: string; lv3: string } {
  if (d.d !== '-') {
    return {
      lv2: d.d,
      lv3: d.t === '-' ? (d.pt !== '-' ? d.pt : '-') : d.t,
    };
  }
  if (d.t !== '-') {
    return {
      lv2: d.t,
      lv3: d.pt !== '-' ? d.pt : '-',
    };
  }
  return { lv2: '-', lv3: '-' };
}

/** Build tree structure for GPD detail view */
export function buildTree(
  detail: DetailRecord[],
  tmMode: 'monthly' | 'weekly',
  wpm: Record<string, number>
): Record<string, TreeNode> {
  const tree: Record<string, TreeNode> = {};

  for (const d of detail) {
    const lv1 = d.b;
    if (!tree[lv1]) {
      tree[lv1] = {
        name: lv1,
        times: {},
        members: new Set(),
        memberCount: 0,
        subs: {},
        directMembers: {},
      };
    }

    const node1 = tree[lv1];
    addTimes(node1.times, d, tmMode, wpm);
    node1.members.add(d.n);

    const { lv2, lv3 } = getLevels(d);

    if (lv2 === '-') {
      // Direct member under Lv.1
      if (!node1.directMembers[d.n]) node1.directMembers[d.n] = {};
      addTimes(node1.directMembers[d.n], d, tmMode, wpm);
      continue;
    }

    if (!node1.subs[lv2]) {
      node1.subs[lv2] = {
        name: lv2,
        times: {},
        members: new Set(),
        memberCount: 0,
        subs: {},
        directMembers: {},
      };
    }

    const node2 = node1.subs[lv2];
    addTimes(node2.times, d, tmMode, wpm);
    node2.members.add(d.n);

    if (lv3 === '-') {
      if (!node2.directMembers[d.n]) node2.directMembers[d.n] = {};
      addTimes(node2.directMembers[d.n], d, tmMode, wpm);
      continue;
    }

    if (!node2.subs[lv3]) {
      node2.subs[lv3] = {
        name: lv3,
        times: {},
        members: new Set(),
        memberCount: 0,
        subs: {},
        directMembers: {},
      };
    }

    const node3 = node2.subs[lv3];
    addTimes(node3.times, d, tmMode, wpm);
    node3.members.add(d.n);
    if (!node3.directMembers[d.n]) node3.directMembers[d.n] = {};
    addTimes(node3.directMembers[d.n], d, tmMode, wpm);
  }

  // Set member counts
  for (const n1 of Object.values(tree)) {
    n1.memberCount = n1.members.size;
    for (const n2 of Object.values(n1.subs)) {
      n2.memberCount = n2.members.size;
      for (const n3 of Object.values(n2.subs)) {
        n3.memberCount = n3.members.size;
      }
    }
  }

  return tree;
}

/** Sort tree entries by total time descending */
export function sortByTotal(entries: [string, TreeNode][], timeKeys: string[]): [string, TreeNode][] {
  return entries.sort((a, b) => {
    const sumA = timeKeys.reduce((s, k) => s + (a[1].times[k] || 0), 0);
    const sumB = timeKeys.reduce((s, k) => s + (b[1].times[k] || 0), 0);
    return sumB - sumA;
  });
}

/** Filter detail records by date range, org, product etc. */
export function filterDetail(
  detail: DetailRecord[],
  range: string[],
  opts?: {
    orgs?: Set<string> | null;
    depts?: Set<string> | null;
    teams?: Set<string> | null;
    products?: Set<string> | null;
  }
): DetailRecord[] {
  const rangeSet = new Set(range);
  return detail.filter(d => {
    if (!rangeSet.has(d.ym)) return false;
    if (opts?.orgs && !opts.orgs.has(d.b)) return false;
    if (opts?.depts) {
      if (d.d === '-' && d.t === '-') return false;
      const dk = d.d === '-' ? '(Direct)' : d.d;
      if (!opts.depts.has(dk)) return false;
    }
    if (opts?.teams) {
      if (d.t === '-' && d.d !== '-') {
        if (!opts.teams.has('(Direct)')) return false;
      } else if (d.t === '-' && d.d === '-') {
        return false;
      } else {
        if (!opts.teams.has(d.t)) return false;
      }
    }
    if (opts?.products && !opts.products.has(d.p)) return false;
    return true;
  });
}

/** Get weeks in range for given months */
export function getWeeksInRange(detail: DetailRecord[], months: string[]): string[] {
  const monthSet = new Set(months);
  const weeks = new Set<string>();
  for (const d of detail) {
    if (monthSet.has(d.ym)) {
      for (const w of Object.keys(d.wk)) {
        weeks.add(w);
      }
    }
  }
  return Array.from(weeks).sort();
}

/** Get SVC Lv2 value from detail record */
export function getSvcLv2(d: DetailRecord): string {
  if (d.d !== '-') return d.d;
  if (d.t !== '-') return d.t;
  return '-';
}

/** Get SVC Lv3 value from detail record */
export function getSvcLv3(d: DetailRecord): string {
  if (d.d !== '-') {
    return d.t !== '-' ? d.t : (d.pt !== '-' ? d.pt : '-');
  }
  if (d.t !== '-') {
    return d.pt !== '-' ? d.pt : '-';
  }
  return '-';
}
