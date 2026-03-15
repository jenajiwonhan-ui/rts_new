// Lv.1 org colors (fixed)
export const LV1_COLORS: Record<string, string> = {
  EPS: '#d4a098',
  WPS: '#96c08a',
  NAPS: '#e0b878',
  PSM: '#88b8dc',
  GCD: '#bca0d4',
};

export const LV1_ORDER = ['EPS', 'WPS', 'NAPS', 'PSM', 'GCD'];

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
