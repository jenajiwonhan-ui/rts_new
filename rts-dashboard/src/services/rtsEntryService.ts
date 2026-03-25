import { supabase } from './supabase';
import type { DetailRecord, OrgNode } from '../types';

interface RtsEntry {
  year: number;
  week: number;
  week_starting: string;
  month: string;
  user_id: number;
  employee_number: string;
  display_name: string;
  user_state: number;
  product_id: string;
  product_name: string;
  participation_rate: number;
  org_id: string;
  org_name: string;
  org_line_path: string;
}

/** rts_entries 전체 조회 */
export async function fetchRtsEntries(): Promise<RtsEntry[]> {
  const all: RtsEntry[] = [];
  const PAGE_SIZE = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('rts_entries')
      .select('*')
      .range(from, from + PAGE_SIZE - 1)
      .order('year')
      .order('week');

    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}

interface OrgLevels { lv1: string; lv2: string; lv3: string; lv4: string }

/** org_nodes로 name→레벨 매핑 구축 */
function buildOrgLookup(orgNodes: OrgNode[]): Map<string, OrgLevels> {
  const byId = new Map(orgNodes.map(n => [n.id, n]));
  const lookup = new Map<string, OrgLevels>();

  for (const node of orgNodes) {
    const chain: OrgNode[] = [];
    let cur: OrgNode | undefined = node;
    while (cur) {
      chain.unshift(cur);
      cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
    }

    const levels: OrgLevels = {
      lv1: chain[0]?.name || '-',
      lv2: chain[1]?.name || '-',
      lv3: chain[2]?.name || '-',
      lv4: chain[3]?.name || '-',
    };

    lookup.set(node.name, levels);
  }

  return lookup;
}

/** org_line_path 키워드 → Lv.1 약칭 매핑 (org_nodes에 없는 상위 조직용) */
const PATH_TO_LV1: [string, string][] = [
  ['East Publishing Div.', 'EPS'],
  ['East Publishing Services Div.', 'EPS'],
  ['West Publishing Dept.', 'WPS'],
  ['West Publishing Services Dept.', 'WPS'],
  ['NA Publishing Div.', 'NAPS'],
  ['NA Publishing Services', 'NAPS'],
  ['Global Creative Div.', 'GCD'],
  ['Publishing Services Management', 'PSM'],
];

/** org_line_path에서 org_nodes에 매칭되는 가장 깊은 노드로 lv1~lv4 결정 */
function resolveOrg(
  orgLinePath: string,
  orgName: string,
  orgLookup: Map<string, OrgLevels>
): OrgLevels {
  // 1. org_name으로 직접 매칭
  const direct = orgLookup.get(orgName);
  if (direct) return direct;

  // 2. org_line_path segment를 뒤에서부터 매칭
  const segments = orgLinePath.split('>');
  for (let i = segments.length - 1; i >= 0; i--) {
    const match = orgLookup.get(segments[i]);
    if (match) return match;
  }

  // 3. org_line_path 키워드로 Lv.1 추론
  for (const [keyword, lv1] of PATH_TO_LV1) {
    if (orgLinePath.includes(keyword)) {
      return { lv1, lv2: orgName, lv3: '-', lv4: '-' };
    }
  }

  // 4. 매칭 실패 → "Other"
  return { lv1: 'Other', lv2: orgName, lv3: '-', lv4: '-' };
}

/** rts_entries → DetailRecord[] 변환 */
export function transformToDetailRecords(
  entries: RtsEntry[],
  orgNodes: OrgNode[]
): DetailRecord[] {
  const orgLookup = buildOrgLookup(orgNodes);

  const groups = new Map<string, {
    n: string; p: string; ym: string;
    lv1: string; lv2: string; lv3: string; lv4: string;
    wk: Record<string, number>; tot: number;
  }>();

  for (const entry of entries) {
    const org = resolveOrg(entry.org_line_path, entry.org_name, orgLookup);
    const weekKey = `${entry.year}W${String(entry.week).padStart(2, '0')}`;
    const groupKey = `${entry.display_name}|${entry.product_name}|${entry.month}|${org.lv1}|${org.lv2}|${org.lv3}|${org.lv4}`;

    let group = groups.get(groupKey);
    if (!group) {
      group = {
        n: entry.display_name,
        p: entry.product_name,
        ym: entry.month,
        ...org,
        wk: {},
        tot: 0,
      };
      groups.set(groupKey, group);
    }

    group.wk[weekKey] = (group.wk[weekKey] || 0) + entry.participation_rate;
    group.tot += entry.participation_rate;
  }

  return Array.from(groups.values());
}

/** rts_entries에서 YM 리스트 추출 (정렬) */
export function extractYmList(entries: RtsEntry[]): string[] {
  const yms = new Set<string>();
  for (const e of entries) yms.add(e.month);
  return [...yms].sort();
}

/** rts_entries에서 week_mondays 맵 생성 */
export function extractWeekMondays(entries: RtsEntry[]): Record<string, string> {
  const wm: Record<string, string> = {};
  for (const e of entries) {
    const weekKey = `${e.year}W${String(e.week).padStart(2, '0')}`;
    if (!wm[weekKey]) {
      // week_starting "2026-01-26" → "'26.01.26"
      const d = e.week_starting; // "YYYY-MM-DD"
      wm[weekKey] = `'${d.slice(2, 4)}.${d.slice(5, 7)}.${d.slice(8, 10)}`;
    }
  }
  return wm;
}
