import { supabase } from '../supabaseClient';
import type { RunSummary, RunDetail, WeeklyProgress } from '../types';

// GAS 後端：接收 sync_activities 後抓 Strava 活動寫入 Supabase
const SYNC_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbz-wLhGygelhCBg44bfylb9AR3TmFwUXJ6H2U1pKQ2soONw3YYZQvjKbHh4r1T9LuDw/exec';

interface SyncResult {
  status: string;
  message?: string;
  error?: string;
}

export async function syncActivities(userId: string): Promise<SyncResult> {
  // GAS 不支援 CORS preflight，必須用 text/plain 讓瀏覽器視為 simple request
  const response = await fetch(SYNC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'sync_activities', user_id: userId }),
  });
  return (await response.json()) as SyncResult;
}

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
    type: inferRunType(row),
    distanceKm: Number(row.distance) || 0,
    paceMinPerKm: row.pace || paceFromDuration(row.duration, row.distance),
    avgHeartRate: row.avg_hr ?? 0,
    durationMin: row.duration ? Math.round(row.duration / 60) : undefined,
  };
}

// 位置、天氣、心率區間、分段配速等欄位資料庫尚未提供，維持 undefined 讓畫面自行省略
export function toRunDetail(row: ActivityRow): RunDetail {
  return {
    ...toRunSummary(row),
    maxHeartRate: row.max_hr ?? undefined,
    cadence: row.avg_spm ?? undefined,
    // avg_stride_length 存的是公分
    strideM: row.avg_stride_length != null ? row.avg_stride_length / 100 : undefined,
  };
}

const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

// 本週（週一起算）每日跑量
export function toWeeklyProgress(rows: ActivityRow[]): WeeklyProgress[] {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const week = DAY_LABELS.map((dayLabel) => ({ dayLabel, distanceKm: 0 }));
  for (const row of rows) {
    const d = new Date(row.date);
    const dayIndex = Math.floor((d.getTime() - monday.getTime()) / 86400000);
    if (dayIndex >= 0 && dayIndex < 7) {
      week[dayIndex].distanceKm += Number(row.distance) || 0;
    }
  }
  return week;
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
