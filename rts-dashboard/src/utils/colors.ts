// Lv.1 org colors (fixed)
export const LV1_COLORS: Record<string, string> = {
  EPS: '#d4a098',
  WPS: '#96c08a',
  NAPS: '#e0b878',
  PSM: '#88b8dc',
  GCD: '#bca0d4',
};

export const LV1_ORDER = ['EPS', 'WPS', 'NAPS', 'PSM', 'GCD'];
export const LV1_HIDDEN = new Set(['Other']);

// Department palette
export const DEPT_PC = [
  '#7eb5c9', '#c9a87e', '#a3c97e', '#c97ea3', '#7ea3c9',
  '#c9c07e', '#7ec9a8', '#c97e7e', '#a87ec9', '#7ec97e',
  '#c98e7e', '#7e8ec9', '#b5c97e', '#c97eb5', '#7ec9c0',
  '#c9a07e', '#8ec97e', '#c97e90', '#7ea8c9', '#c9b87e',
];

export const ORG_PC2 = [
  '#7eb5c9', '#c9a87e', '#a3c97e', '#c97ea3', '#7ea3c9',
  '#c9c07e', '#7ec9a8', '#c97e7e', '#a87ec9', '#7ec97e',
  '#c98e7e', '#7e8ec9', '#b5c97e', '#c97eb5', '#7ec9c0',
  '#c9a07e', '#8ec97e', '#c97e90', '#7ea8c9', '#c9b87e',
  '#b0c97e', '#c9807e', '#7ec0c9', '#c9b07e', '#90c97e',
  '#c97e85', '#7eb0c9', '#c9987e', '#a0c97e', '#c97e98',
];

// Fallback palette
export const PC = [
  '#7eb5c9', '#c9a87e', '#a3c97e', '#c97ea3', '#7ea3c9',
  '#c9c07e', '#7ec9a8', '#c97e7e', '#a87ec9', '#7ec97e',
  '#c98e7e', '#7e8ec9', '#b5c97e', '#c97eb5', '#7ec9c0',
  '#c9a07e', '#8ec97e', '#c97e90', '#7ea8c9', '#c9b87e',
];

export const NPC = '#b8bcc5'; // Non-product
export const OOF = '#888e95'; // Out of Office

// GPD group palettes — soft muted tones, high intra-group contrast (scalable)
export const GPD_PALETTES: Record<string, string[]> = {
  GPD1: [ // sky blue → indigo → lavender (hue + lightness spread)
    '#7CB8E0', '#9888C8', '#A8D0E8', '#7078B8', '#B8B0D8',
    '#5898C0', '#C0A8D8', '#6890B0', '#8CA8D8', '#A890C0',
  ],
  GPD2: [ // salmon → coral → peach → terracotta (warm spread)
    '#E0A8A0', '#C88878', '#E8C8A8', '#D09080', '#C8A890',
    '#B87870', '#D8B898', '#D0A090', '#E0B0A0', '#B89078',
  ],
  GPD3: [ // sage → teal → lime → forest (cool green spread)
    '#80C0A0', '#A8C878', '#68A8A0', '#B8D090', '#78B0B8',
    '#90B870', '#68C0B0', '#A0B080', '#88D0A0', '#70A088',
  ],
  'IP Franchise': [ // wheat → camel → khaki → taupe (earthy spread)
    '#C8B890', '#A89878', '#D8C8A0', '#988868', '#B8A880',
    '#C0A070', '#B0B098', '#C8A880', '#A8A088', '#D0B890',
  ],
};

/** Detect PUBG products by name */
export function isPubgProduct(name: string): boolean {
  const n = name.toLowerCase();
  return n.includes('pubg') || n.includes('battlegrounds');
}

export function hexLum(h: string): number {
  const r = parseInt(h.slice(1, 3), 16) / 255;
  const g = parseInt(h.slice(3, 5), 16) / 255;
  const b = parseInt(h.slice(5, 7), 16) / 255;
  const toL = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toL(r) + 0.7152 * toL(g) + 0.0722 * toL(b);
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function lightenHex(hex: string, amt: number): string {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.min(255, r + amt);
  g = Math.min(255, g + amt);
  b = Math.min(255, b + amt);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function darkenHex(hex: string, amt: number): string {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.max(0, r - amt);
  g = Math.max(0, g - amt);
  b = Math.max(0, b - amt);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
