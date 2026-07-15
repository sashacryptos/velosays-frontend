import { useEffect, useRef } from 'react';
import type { RunSummary } from '../types';
import type { MonthlyGoalRow } from '../api/activities';
import { dateStripFromRuns, weeklyKmByDay } from '../api/activities';
import { TARGET_RACE, daysUntilRace } from '../raceConfig';

interface DashboardProps {
  runs: RunSummary[];
  monthlyKmValue: number;
  monthlyGoal: MonthlyGoalRow | null;
  vo2max?: number;
  sleepScore?: number;
  metricsDate?: string;
  onSelectRun: (id: string) => void;
  onSync: () => void;
  syncing: boolean;
  loadError?: string | null;
  syncMessage?: string | null;
}

const StatCard = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <div className="bg-white rounded-[20px] px-3.5 pt-3.5 pb-3">
    <p className="m-0 text-[11px] text-[#9AA3B0]">{label}</p>
    <p className={`mt-1.5 mb-0 text-[19px] font-medium font-[Outfit] ${accent ? 'text-[#2563EB]' : 'text-[#1C2430]'}`}>
      {value}
    </p>
  </div>
);

const WEEKDAY_ZH = ['日', '一', '二', '三', '四', '五', '六'];
const WEEKDAY_MON_FIRST = ['一', '二', '三', '四', '五', '六', '日'];

export function Dashboard({
  runs,
  monthlyKmValue,
  monthlyGoal,
  vo2max,
  sleepScore,
  metricsDate,
  onSelectRun,
  onSync,
  syncing,
  loadError,
  syncMessage,
}: DashboardProps) {
  const now = new Date();
  const todayLabel = `${now.getMonth() + 1}月${now.getDate()}日 星期${WEEKDAY_ZH[now.getDay()]}`;
  const dateStrip = dateStripFromRuns(runs);
  const latestRun = runs[0];
  const todayRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    todayRef.current?.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
  }, []);

  const remainKm = monthlyGoal ? Math.max(0, Math.round((monthlyGoal.goal_km - monthlyKmValue) * 10) / 10) : null;
  const goalPct = monthlyGoal ? Math.min(100, Math.round((monthlyKmValue / monthlyGoal.goal_km) * 100)) : null;
  const daysLeft = daysUntilRace();
  const weekKm = weeklyKmByDay(runs);
  const maxWeekKm = Math.max(...weekKm, 1);

  return (
    <div className="flex-1 overflow-y-auto px-5 pt-14 pb-[108px] flex flex-col gap-5">
      {loadError && (
        <div className="bg-red-50 text-red-700 text-xs rounded-xl px-3.5 py-2.5">
          無法連線資料庫，目前顯示空資料：{loadError}
        </div>
      )}
      {syncMessage && (
        <div
          className={`text-xs rounded-xl px-3.5 py-2.5 ${
            syncMessage.includes('失敗') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}
        >
          {syncMessage}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <p className="m-0 text-[13px] text-[#9AA3B0]">{todayLabel}</p>
          <h2 className="mt-1 mb-0 text-2xl font-bold text-[#1C2430]">Hi, Sasha</h2>
        </div>
        <button
          onClick={onSync}
          disabled={syncing}
          className="flex items-center gap-1.5 bg-[#FFE9D6] text-[#C2570F] text-xs font-medium px-3.5 py-2 rounded-full border-none cursor-pointer disabled:opacity-60"
        >
          <i className={`ti ${syncing ? 'ti-loader-2 animate-spin' : 'ti-refresh'} text-[13px]`} />
          {syncing ? '更新中...' : '重新整理'}
        </button>
      </div>

      <div
        className="flex gap-1.5 overflow-x-auto pb-1 -mx-5 px-5"
        style={{ scrollbarWidth: 'none', scrollSnapType: 'x mandatory' }}
      >
        {dateStrip.map((d) => (
          <button
            key={d.iso}
            ref={d.isToday ? todayRef : undefined}
            onClick={() => d.runId && onSelectRun(d.runId)}
            className="flex-shrink-0 w-[52px] flex flex-col items-center gap-1 pt-2.5 pb-2 rounded-2xl border-none"
            style={{
              background: d.isToday ? 'linear-gradient(160deg,#60A5FA,#2563EB)' : '#ffffff',
              boxShadow: d.isToday ? '0 8px 18px rgba(37,99,235,0.35)' : 'none',
              cursor: d.runId ? 'pointer' : 'default',
              scrollSnapAlign: 'start',
            }}
          >
            <span
              className="text-base font-semibold font-[Outfit]"
              style={{ color: d.isToday ? '#ffffff' : '#1C2430' }}
            >
              {d.dateNum}
            </span>
            <span className="text-[10px] tracking-wide" style={{ color: d.isToday ? 'rgba(255,255,255,0.8)' : '#9AA3B0' }}>
              {d.dayLabel}
            </span>
            <span
              className="w-1 h-1 rounded-full"
              style={{ background: d.runId ? (d.isToday ? '#ffffff' : '#F97316') : 'transparent' }}
            />
          </button>
        ))}
      </div>

      <div
        className="flex items-center gap-2.5 rounded-2xl px-4 py-3"
        style={{ background: 'linear-gradient(135deg,#FFE9D6 0%,#FDBA74 100%)' }}
      >
        <span className="text-lg leading-none">🎯</span>
        <div>
          <p className="m-0 text-[13px] font-medium text-[#7A3B0A]">
            {TARGET_RACE.name}・{TARGET_RACE.goalLabel}
          </p>
          <p className="m-0 text-[11px] text-[#C2570F]">倒數 {daysLeft} 天</p>
        </div>
      </div>

      <div
        className="rounded-2xl p-4 text-white"
        style={{
          background: 'linear-gradient(120deg, #4C82F0 0%, #2563EB 65%, #2E4FA8 100%)',
          boxShadow: '0 10px 24px rgba(37,99,235,0.28)',
        }}
      >
        <p className="m-0 text-xs opacity-85">本月跑量</p>
        <p className="mt-1 mb-0 text-[28px] font-medium font-[Outfit] leading-none">
          {monthlyKmValue.toFixed(1)}
          <span className="text-sm font-normal opacity-85"> {monthlyGoal ? `/ ${monthlyGoal.goal_km} km` : 'km'}</span>
        </p>
        {monthlyGoal ? (
          <>
            <div className="mt-2.5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.28)' }}>
              <div className="h-full rounded-full bg-white" style={{ width: `${goalPct}%` }} />
            </div>
            <p className="mt-1.5 mb-0 text-[11px] opacity-90">
              {remainKm && remainKm > 0 ? `還差 ${remainKm} km` : '已達成本月目標！'}
            </p>
            {monthlyGoal.summary && <p className="mt-2 mb-0 text-[12px] leading-[1.6] opacity-95">💬 {monthlyGoal.summary}</p>}
          </>
        ) : (
          <p className="mt-1.5 mb-0 text-[11px] opacity-80">本月目標將於月底由 AI 教練自動生成</p>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        <StatCard label="最近配速" value={latestRun?.paceMinPerKm ?? '--'} />
        <StatCard label="平均心率" value={latestRun?.avgHeartRate ? String(latestRun.avgHeartRate) : '--'} />
        <StatCard label="VO2max" value={vo2max != null ? String(vo2max) : '--'} accent />
        <StatCard label="睡眠分數" value={sleepScore != null ? String(sleepScore) : '--'} />
      </div>

      <div className="bg-white rounded-2xl p-4">
        <p className="m-0 mb-3 text-sm font-bold text-[#1C2430]">本週跑量</p>
        <div className="flex items-end gap-2 h-[70px]">
          {weekKm.map((km, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end h-full">
              <div
                className="rounded-full bg-[#93B8F8]"
                style={{ height: `${Math.max((km / maxWeekKm) * 100, km > 0 ? 8 : 2)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          {WEEKDAY_MON_FIRST.map((d) => (
            <span key={d} className="flex-1 text-center text-[10px] text-[#9AA3B0]">
              {d}
            </span>
          ))}
        </div>
      </div>

      {metricsDate && (
        <p className="m-0 text-[11px] text-[#B4BAC4] text-center">
          體能資料同步於 {metricsDate}・Garmin 每日約台北時間 06:00 自動同步
        </p>
      )}
    </div>
  );
}
