import { supabase } from '../supabaseClient';
import type { RunSummary, RunDetail } from '../types';

// GAS 後端：strava_chat AI 教練（2026-07-15 的新部署）。
// 活動資料改由 GitHub Actions 每日直連 Garmin 同步（見 scripts/sync_garmin.py），
// 這個 GAS 部署的 sync_activities 分支仍依賴已停用的 Strava app，前端不再呼叫它。
const SYNC_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbzz86Yy5aHgfROz5zdi7G0O_x8L3uxcl0pZBTjKU_Ud9nRf1AzPMNJaKBMbsDGSyQrR/exec';

export interface DailyMetricsRow {
  date: string;
  vo2max: number | null;
  resting_hr: number | null;
  sleep_score: number | null;
}

// 由 scripts/sync_garmin.py 每日寫入；表不存在或還沒有資料時回 null
export async function fetchLatestMetrics(userId: string): Promise<DailyMetricsRow | null> {
  const { data, error } = await supabase
    .from('daily_metrics')
    .select('date,vo2max,resting_hr,sleep_score')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(1);
  if (error || !data?.length) return null;
  return data[0] as DailyMetricsRow;
}

export interface MonthlyGoalRow {
  year_month: string;
  goal_km: number;
  summary: string | null;
  focus: string | null;
}

// 由 scripts/sync_garmin.py 於每月最後一天用 Gemini 生成下個月目標；
// 表不存在或當月尚未生成時回 null（畫面不應顯示假目標）
export async function fetchMonthlyGoal(userId: string, yearMonth: string): Promise<MonthlyGoalRow | null> {
  const { data, error } = await supabase
    .from('monthly_goals')
    .select('year_month,goal_km,summary,focus')
    .eq('user_id', userId)
    .eq('year_month', yearMonth)
    .limit(1);
  if (error || !data?.length) return null;
  return data[0] as MonthlyGoalRow;
}

interface CoachReply {
  status?: string;
  message?: string;
  error?: string;
}

// 問 AI 教練：帶上最近的跑步紀錄給 GAS 的 Gemini 後端當 context
export async function askCoach(userId: string, question: string, recentRows: ActivityRow[]): Promise<string> {
  const response = await fetch(SYNC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action: 'strava_chat',
      user_id: userId,
      chat_message: question,
      history_context: recentRows.slice(0, 10).map((row) => ({
        title: row.title,
        distance: row.distance,
        pace: row.pace,
        duration: row.duration,
        date: row.date,
        avg_hr: row.avg_hr,
        source: 'Garmin',
      })),
    }),
  });
  const data = (await response.json()) as CoachReply;
  if (data.status === 'success' && data.message) return data.message;
  throw new Error(data.message || data.error || '教練後端未回覆');
}

export interface ActivityRow {
  id: string;
  user_id: string;
  date: string;
  distance: number;
  pace: string;
  duration: number; // 秒
  avg_hr: number | null;
  max_hr: number | null;
  avg_spm: number | null;
  avg_stride_length: number | null;
  source: string;
  title: string;
  // 由 scripts/sync_garmin.py 對「新同步」的活動補上（見 monthly_goals/weather 遷移）；
  // 欄位還沒建立、或該筆是遷移前的舊資料時會是 undefined/null
  city?: string | null;
  country?: string | null;
  temperature_c?: number | null;
  humidity_percent?: number | null;
}

export async function fetchActivities(userId: string): Promise<ActivityRow[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

function formatDateZh(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function paceFromDuration(durationSec: number, distanceKm: number): string {
  if (!durationSec || !distanceKm) return '--';
  const secPerKm = durationSec / distanceKm;
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}'${sec < 10 ? '0' : ''}${sec}`;
}

function paceToSeconds(pace: string): number | null {
  const m = pace.match(/(\d+)['':](\d+)/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

// 資料庫沒有跑步類型欄位：先從 title 關鍵字判斷，再用距離/配速推估
function inferRunType(row: ActivityRow): RunSummary['type'] {
  const title = row.title ?? '';
  if (title.includes('間歇')) return '間歇跑';
  if (title.includes('長距離') || title.includes('長跑')) return '長距離跑';
  if (title.includes('配速') || title.includes('節奏')) return '配速跑';
  if (title.includes('恢復')) return '恢復跑';
  if (title.includes('輕鬆')) return '輕鬆跑';

  if (row.distance >= 15) return '長距離跑';
  const paceSec = paceToSeconds(row.pace ?? '') ?? (row.duration && row.distance ? row.duration / row.distance : null);
  if (paceSec !== null && paceSec < 300) return '配速跑';
  if (row.distance <= 4) return '恢復跑';
  return '輕鬆跑';
}

export function toRunSummary(row: ActivityRow): RunSummary {
  return {
    id: row.id,
    date: formatDateZh(row.date),
    isoDate: row.date,
    type: inferRunType(row),
    distanceKm: Number(row.distance) || 0,
    paceMinPerKm: row.pace || paceFromDuration(row.duration, row.distance),
    avgHeartRate: row.avg_hr ?? 0,
    durationSec: row.duration || undefined,
  };
}

// hh:mm:ss（時:分:秒，恆定三段，方便跟碼錶顯示一致）
export function formatDurationHms(totalSec?: number): string {
  if (totalSec == null || totalSec <= 0) return '--:--:--';
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// 心率區間、分段配速資料庫尚未提供，維持 undefined 讓畫面自行省略；
// 天氣/城市欄位只有「新同步」的活動才有值（見 scripts/sync_garmin.py）
export function toRunDetail(row: ActivityRow): RunDetail {
  return {
    ...toRunSummary(row),
    maxHeartRate: row.max_hr ?? undefined,
    cadence: row.avg_spm ?? undefined,
    // avg_stride_length 存的是公分
    strideM: row.avg_stride_length != null ? row.avg_stride_length / 100 : undefined,
    city: row.city ?? undefined,
    country: row.country ?? undefined,
    temperatureC: row.temperature_c ?? undefined,
    humidityPercent: row.humidity_percent ?? undefined,
  };
}

function mondayOfCurrentWeek(): Date {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// 本週（週一起算）累積跑量
export function weeklyKmFromRows(rows: ActivityRow[]): number {
  const monday = mondayOfCurrentWeek();
  return rows.reduce((sum, row) => {
    const d = new Date(row.date);
    const dayIndex = Math.floor((d.getTime() - monday.getTime()) / 86400000);
    return dayIndex >= 0 && dayIndex < 7 ? sum + (Number(row.distance) || 0) : sum;
  }, 0);
}

// 本週（週一起算）每日跑量，用於看板迷你長條圖
export function weeklyKmByDay(runs: RunSummary[]): number[] {
  const monday = mondayOfCurrentWeek();
  const km = Array(7).fill(0) as number[];
  for (const r of runs) {
    const d = new Date(r.isoDate);
    const dayIndex = Math.floor((d.getTime() - monday.getTime()) / 86400000);
    if (dayIndex >= 0 && dayIndex < 7) km[dayIndex] += r.distanceKm;
  }
  return km;
}

export interface DateStripDay {
  iso: string;
  dateNum: number;
  dayLabel: string;
  isToday: boolean;
  runId?: string;
}

const WEEKDAY_SUN_FIRST = ['日', '一', '二', '三', '四', '五', '六'];

// 可滑動日曆條：今天往前 daysBack 天到往後 daysForward 天，標記真實跑步日並帶出當天第一筆跑步 id
export function dateStripFromRuns(runs: RunSummary[], daysBack = 90, daysForward = 7): DateStripDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const runIdByDate = new Map<string, string>();
  for (const r of runs) {
    if (!runIdByDate.has(r.isoDate)) runIdByDate.set(r.isoDate, r.id);
  }

  const days: DateStripDay[] = [];
  for (let offset = -daysBack; offset <= daysForward; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    days.push({
      iso,
      dateNum: d.getDate(),
      dayLabel: WEEKDAY_SUN_FIRST[d.getDay()],
      isToday: offset === 0,
      runId: runIdByDate.get(iso),
    });
  }
  return days;
}

export function monthlyKm(rows: ActivityRow[]): number {
  const now = new Date();
  return rows
    .filter((row) => {
      const d = new Date(row.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((sum, row) => sum + (Number(row.distance) || 0), 0);
}

export function monthlyRunCount(rows: ActivityRow[]): number {
  const now = new Date();
  return rows.filter((row) => {
    const d = new Date(row.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
}

export function overallAvgPace(rows: ActivityRow[]): string {
  const totalSec = rows.reduce((sum, row) => sum + (row.duration || 0), 0);
  const totalKm = rows.reduce((sum, row) => sum + (Number(row.distance) || 0), 0);
  return paceFromDuration(totalSec, totalKm);
}

// 近 7 天每日訓練負荷（以運動時間分鐘數代表）
export function weeklyLoadFromRows(rows: ActivityRow[]): number[] {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const load = Array(7).fill(0) as number[];
  for (const row of rows) {
    const d = new Date(row.date);
    const dayIndex = Math.floor((d.getTime() - start.getTime()) / 86400000);
    if (dayIndex >= 0 && dayIndex < 7) {
      load[dayIndex] += Math.round((row.duration || 0) / 60);
    }
  }
  return load;
}

// HRmax 用歷史活動裡觀察到的最高 max_hr 估算（沒有年齡/生理量測資料時的合理近似值）
function estimateHrMax(rows: ActivityRow[]): number {
  const observed = rows.map((r) => r.max_hr).filter((v): v is number => v != null);
  return observed.length ? Math.max(...observed) : 190;
}

function heartRateReserve(avgHr: number, hrRest: number, hrMax: number): number {
  if (hrMax <= hrRest) return 0;
  return Math.max(0, Math.min(1, (avgHr - hrRest) / (hrMax - hrRest)));
}

export interface TrainingLoadResult {
  ctl: number;
  atl: number;
  tsb: number;
}

/**
 * 訓練負荷狀態（CTL/ATL/TSB 概念，簡化版）：
 * 每日 TRIMP 用「心率儲備比例 × 運動分鐘數 × 100」的線性近似（非 Banister 指數公式），
 * 再用 42 天/7 天指數移動平均分別代表長期負荷(CTL)與近期疲勞(ATL)，TSB = CTL - ATL。
 * 這是給訓練趨勢參考用的簡化估算，不是專業運動生理實驗室等級的精算。
 */
export function trainingLoadFromRows(rows: ActivityRow[], restingHr: number | null): TrainingLoadResult {
  const hrRest = restingHr ?? 50;
  const hrMax = estimateHrMax(rows);

  const trimpByDate = new Map<string, number>();
  for (const row of rows) {
    if (!row.avg_hr || !row.duration) continue;
    const hrr = heartRateReserve(row.avg_hr, hrRest, hrMax);
    const trimp = (row.duration / 60) * hrr * 100;
    trimpByDate.set(row.date, (trimpByDate.get(row.date) ?? 0) + trimp);
  }

  const start = new Date();
  start.setDate(start.getDate() - 90);
  start.setHours(0, 0, 0, 0);

  let ctl = 0;
  let atl = 0;
  for (let i = 0; i <= 90; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const trimp = trimpByDate.get(iso) ?? 0;
    ctl += (trimp - ctl) / 42;
    atl += (trimp - atl) / 7;
  }

  return { ctl: Math.round(ctl), atl: Math.round(atl), tsb: Math.round(ctl - atl) };
}

export interface IntensitySplit {
  lowPercent: number;
  highPercent: number;
  totalKm: number;
}

// 近 28 天低/高強度跑量佔比（80/20 法則參考）：以心率儲備 75% 為切點，用平均心率估算
// （非 Garmin 逐秒心率區間資料，單次跑步中途變速不會被拆開計算）
export function intensitySplitFromRows(rows: ActivityRow[], restingHr: number | null, days = 28): IntensitySplit {
  const hrRest = restingHr ?? 50;
  const hrMax = estimateHrMax(rows);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  let lowKm = 0;
  let highKm = 0;
  for (const row of rows) {
    if (!row.avg_hr) continue;
    if (new Date(row.date) < cutoff) continue;
    const hrr = heartRateReserve(row.avg_hr, hrRest, hrMax);
    const km = Number(row.distance) || 0;
    if (hrr <= 0.75) lowKm += km;
    else highKm += km;
  }

  const totalKm = lowKm + highKm;
  return {
    lowPercent: totalKm > 0 ? Math.round((lowKm / totalKm) * 100) : 0,
    highPercent: totalKm > 0 ? Math.round((highKm / totalKm) * 100) : 0,
    totalKm: Math.round(totalKm * 10) / 10,
  };
}
