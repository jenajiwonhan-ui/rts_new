import type { PoGame } from '../types';

/** Product Owner별 게임 목록 — 나중에 DB 테이블로 전환 */
const SEED_DATA: { ownerId: string; gameShort: string; gameName: string }[] = [
  // GPD1
  { ownerId: 'GPD1', gameShort: 'ZOI',  gameName: 'Project inZOI' },
  { ownerId: 'GPD1', gameShort: 'SN2',    gameName: 'Subnautica 2' },
  { ownerId: 'GPD1', gameShort: 'LE',     gameName: 'Last Epoch' },
  { ownerId: 'GPD1', gameShort: 'PalM',   gameName: 'Palworld Mobile' },
  // GPD2
  { ownerId: 'GPD2', gameShort: 'No Law',    gameName: 'Project IMPACT' },
  { ownerId: 'GPD2', gameShort: 'Windless',  gameName: 'Project Windless' },
  { ownerId: 'GPD2', gameShort: 'Ascent',    gameName: 'The Ascent' },
  // GPD3
  { ownerId: 'GPD3', gameShort: 'ZETA', gameName: 'Project ZETA' },
  { ownerId: 'GPD3', gameShort: 'Butterfly',  gameName: 'Project Butterfly' },
  { ownerId: 'GPD3', gameShort: 'Nut',  gameName: 'Project Nut' },
  { ownerId: 'GPD3', gameShort: 'DKO',  gameName: 'Dinkum Original' },
  { ownerId: 'GPD3', gameShort: 'DKT',  gameName: 'Dinkum Together' },
];

/** SEED_DATA → PoGame[] 변환 (한 번만 생성) */
export const PO_GAMES: PoGame[] = SEED_DATA.map((s, idx) => ({
  id: `${s.ownerId}_${s.gameShort}`,
  ownerId: s.ownerId,
  gameName: s.gameName,
  gameShort: s.gameShort,
  sortOrder: idx,
  createdAt: '',
  updatedAt: '',
}));

/** ownerId로 게임 목록 조회 */
export function getGamesByOwner(ownerId: string): PoGame[] {
  return PO_GAMES.filter(g => g.ownerId === ownerId);
}

/** 등록된 owner ID 목록 */
export const PO_OWNER_IDS = new Set(PO_GAMES.map(g => g.ownerId));
