import { supabase } from '../supabase.js';
import 'dotenv/config';

interface RawEntry {
  additionalJobFlag: string;
  championUnitId: string;
  championUnitName: string;
  displayName: string;
  employeeNumber: string;
  orgId: string;
  orgLinePath: string;
  orgName: string;
  participationRate: number;
  primaryPos: number;
  productId: string;
  productName: string;
  resourceTrackingInfoId: number;
  userId: number;
  userState: number;
  week: number;
  year: number;
}

interface ApiResponse {
  data: RawEntry[];
  enterNumber: number;
  totalNumber: number;
}

/** 현재 연도와 주차 계산 (ISO week) */
function getCurrentYearWeek(): { year: number; week: number } {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - jan1.getTime()) / 86400000);
  const week = Math.ceil((days + jan1.getDay() + 1) / 7);
  return { year: now.getFullYear(), week };
}

/** API에서 특정 주차 데이터 fetch */
async function fetchWeek(baseUrl: string, apiToken: string, year: number, week: number): Promise<RawEntry[]> {
  const url = `${baseUrl}/rts/total/product/user/rate?year=${year}&week=${week}`;
  console.log(`[fetchWeek] GET ${url}`);

  const res = await fetch(url, {
    headers: { 'api-token': apiToken },
  });

  if (!res.ok) {
    throw new Error(`API responded with ${res.status}: ${res.statusText}`);
  }

  const body: ApiResponse = await res.json();
  console.log(`[fetchWeek] year=${year} week=${week}: ${body.enterNumber} entries (total=${body.totalNumber})`);
  return body.data;
}

/** year+week → 해당 주 월요일 (ISO 8601, UTC) */
function getMonday(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dow = jan4.getUTCDay() || 7; // 월=1 ~ 일=7
  const week1Monday = new Date(Date.UTC(year, 0, 4 - dow + 1));
  const monday = new Date(week1Monday);
  monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  return monday;
}

/** 월요일 기준 → 귀속 월 (7일 중 과반이 속한 월 = 목요일 기준) */
function getMonth(monday: Date): string {
  const thu = new Date(monday);
  thu.setUTCDate(monday.getUTCDate() + 3);
  const y = thu.getUTCFullYear();
  const m = String(thu.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Date → "YYYY-MM-DD" (UTC) */
function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** API 응답 필터: primaryPos=1 (주직)만 */
function filterPrimary(entries: RawEntry[]): RawEntry[] {
  return entries.filter(e => e.primaryPos === 1);
}

/** API 응답 → DB row 변환 */
function toDbRow(entry: RawEntry) {
  const monday = getMonday(entry.year, entry.week);
  return {
    year: entry.year,
    week: entry.week,
    week_starting: formatDate(monday),
    month: getMonth(monday),
    user_id: entry.userId,
    employee_number: entry.employeeNumber,
    display_name: entry.displayName,
    user_state: entry.userState,
    product_id: entry.productId,
    product_name: entry.productName,
    participation_rate: entry.participationRate,
    org_id: entry.orgId,
    org_name: entry.orgName,
    org_line_path: entry.orgLinePath,
  };
}

/** 중복 키 제거 (primary_pos=1 우선) */
function dedup(rows: ReturnType<typeof toDbRow>[]): ReturnType<typeof toDbRow>[] {
  const map = new Map<string, ReturnType<typeof toDbRow>>();
  for (const row of rows) {
    const key = `${row.year}|${row.week}|${row.user_id}|${row.product_id}`;
    if (!map.has(key)) {
      map.set(key, row);
    }
  }
  return Array.from(map.values());
}

/** Supabase에 배치 upsert (1000건씩, 중복 제거 후) */
async function upsertBatch(rows: ReturnType<typeof toDbRow>[]) {
  const unique = dedup(rows);
  const BATCH_SIZE = 1000;
  let inserted = 0;

  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('rts_entries')
      .upsert(batch, { onConflict: 'year,week,user_id,product_id' });

    if (error) throw error;
    inserted += batch.length;
    console.log(`[upsert] ${inserted}/${unique.length}`);
  }

  return inserted;
}

/** 2026W01 ~ 현재 주차까지 모든 {year, week} 목록 생성 */
function getAllWeeks(): { year: number; week: number }[] {
  const { year: curYear, week: curWeek } = getCurrentYearWeek();
  const weeks: { year: number; week: number }[] = [];
  const now = new Date();

  for (let y = 2026; y <= curYear; y++) {
    const maxWeek = y < curYear ? getISOWeeksInYear(y) : curWeek;
    for (let w = 1; w <= maxWeek; w++) {
      // 해당 주 월요일이 미래가 아닌지 확인
      const monday = getMonday(y, w);
      if (monday <= now) {
        weeks.push({ year: y, week: w });
      }
    }
  }
  return weeks;
}

/** 해당 연도의 ISO 주 수 (52 또는 53) */
function getISOWeeksInYear(year: number): number {
  const dec28 = new Date(Date.UTC(year, 11, 28));
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dow = jan4.getUTCDay() || 7;
  const week1Monday = new Date(Date.UTC(year, 0, 4 - dow + 1));
  const diff = dec28.getTime() - week1Monday.getTime();
  return Math.floor(diff / (7 * 86400000)) + 1;
}

/** 메인: 현재 주차 데이터를 fetch하여 DB에 저장 */
export async function fetchRawData() {
  const baseUrl = process.env.RAW_DATA_API_URL;
  const apiToken = process.env.RAW_DATA_API_KEY;

  if (!baseUrl || !apiToken) {
    console.error('[fetchRawData] RAW_DATA_API_URL or RAW_DATA_API_KEY is not set');
    return;
  }

  console.log(`[fetchRawData] Starting at ${new Date().toISOString()}`);

  try {
    const { year, week } = getCurrentYearWeek();
    const raw = await fetchWeek(baseUrl, apiToken, year, week);
    const entries = filterPrimary(raw);

    if (entries.length === 0) {
      console.log('[fetchRawData] No data returned');
      return;
    }

    const rows = entries.map(toDbRow);
    const count = await upsertBatch(rows);
    console.log(`[fetchRawData] Done. ${count} rows upserted for ${year}-W${week}`);
  } catch (err) {
    console.error('[fetchRawData] Error:', err);
  }
}

/** 백필: 2026W01 ~ 현재 주차까지 모든 주를 병렬 fetch → DB 저장 */
export async function backfillAll() {
  const baseUrl = process.env.RAW_DATA_API_URL;
  const apiToken = process.env.RAW_DATA_API_KEY;

  if (!baseUrl || !apiToken) {
    console.error('[backfill] RAW_DATA_API_URL or RAW_DATA_API_KEY is not set');
    return;
  }

  const weeks = getAllWeeks();
  console.log(`[backfill] Fetching ${weeks.length} weeks (2026-W01 ~ now) in parallel...`);

  // 5개씩 병렬 fetch → 주차별 개별 upsert
  const CONCURRENCY = 5;
  let totalRows = 0;

  for (let i = 0; i < weeks.length; i += CONCURRENCY) {
    const chunk = weeks.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      chunk.map(async ({ year, week }) => {
        try {
          const raw = await fetchWeek(baseUrl, apiToken, year, week);
          return { year, week, entries: filterPrimary(raw) };
        } catch (err) {
          console.error(`[backfill] Fetch failed ${year}-W${week}:`, err);
          return { year, week, entries: [] as RawEntry[] };
        }
      })
    );

    // 주차별로 개별 upsert (중복 키 충돌 방지)
    for (const { year, week, entries } of results) {
      if (entries.length === 0) continue;
      const rows = entries.map(toDbRow);
      try {
        await upsertBatch(rows);
        totalRows += rows.length;
      } catch (err) {
        console.error(`[backfill] Upsert failed for ${year}-W${week}:`, err);
      }
    }
  }

  console.log(`[backfill] Done. ${totalRows} total rows upserted for ${weeks.length} weeks`);
}

// 직접 실행
const isDirectRun = process.argv[1]?.includes('fetchRawData');
if (isDirectRun) {
  const arg = process.argv[2];
  if (arg === '--backfill') {
    backfillAll();
  } else {
    fetchRawData();
  }
}
