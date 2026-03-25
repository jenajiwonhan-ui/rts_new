import { supabase } from './supabase';
import type { OrgNode } from '../types';

/** org_nodes 전체 조회 (is_active = true) */
export async function fetchOrgNodes(): Promise<OrgNode[]> {
  const { data, error } = await supabase
    .from('org_nodes')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  return data;
}

/** 특정 level의 org_nodes 조회 */
export async function fetchOrgNodesByLevel(level: number): Promise<OrgNode[]> {
  const { data, error } = await supabase
    .from('org_nodes')
    .select('*')
    .eq('level', level)
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  return data;
}

/** 특정 노드의 하위 자식 조회 */
export async function fetchChildNodes(parentId: number): Promise<OrgNode[]> {
  const { data, error } = await supabase
    .from('org_nodes')
    .select('*')
    .eq('parent_id', parentId)
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  return data;
}

/** org_nodes → org_tree 형태로 변환 (기존 rawData.org_tree 호환) */
export function buildOrgTree(nodes: OrgNode[]): Record<string, Record<string, string[]>> {
  const byId = new Map(nodes.map(n => [n.id, n]));
  const lv1 = nodes.filter(n => n.level === 1);
  const tree: Record<string, Record<string, string[]>> = {};

  for (const bureau of lv1) {
    const children = nodes.filter(n => n.parent_id === bureau.id);
    const deptMap: Record<string, string[]> = {};

    // Level 2 중 하위(Level 3)가 있는 것 = Dept, 없는 것 = 직할 Team
    const directTeams: string[] = [];

    for (const child of children) {
      const grandchildren = nodes.filter(n => n.parent_id === child.id && n.level === child.level + 1);
      // level 3 children that are "teams" (not parts)
      const teamChildren = grandchildren.filter(gc => {
        // If this child has further children, it's a team; otherwise check naming
        // For org_tree compat: we list Level 3 nodes under Level 2 depts
        return true;
      });

      if (teamChildren.length > 0) {
        // This is a dept with teams under it
        deptMap[child.name] = teamChildren.map(t => t.name);
      } else {
        // 직할 team (no sub-teams) — goes under "-"
        directTeams.push(child.name);
      }
    }

    if (directTeams.length > 0) {
      deptMap['-'] = directTeams;
    }

    tree[bureau.name] = deptMap;
  }

  return tree;
}
