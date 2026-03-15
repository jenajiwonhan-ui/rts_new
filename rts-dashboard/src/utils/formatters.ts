/** Format "2026-03" to "'26.03" */
export function ymLabel(ym: string): string {
  const [y, m] = ym.split('-');
  return `'${y.slice(2)}.${m}`;
}

/** HTML-escape string */
export function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Convert Set to sorted array */
export function sortedSet(s: Set<string>): string[] {
  return Array.from(s).sort();
}

/** Get last N months from ymList ending at the last month */
export function getLastNMonths(ymList: string[], n: number): string[] {
  return ymList.slice(-n);
}

/** Format number to fixed decimal, return "-" for 0 */
export function fmtVal(v: number | undefined, decimals = 1): string {
  if (v === undefined || v === 0) return '-';
  return v.toFixed(decimals);
}

/** Format diff with sign */
export function fmtDiff(diff: number, decimals = 1): string {
  if (diff === 0) return '';
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff.toFixed(decimals)}`;
}
