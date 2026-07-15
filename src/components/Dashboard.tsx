import { useEffect, useRef } from 'react';
import type { RunSummary } from '../types';
import type { MonthlyGoalRow } from '../api/activities';
import { dateStripFromRuns } from '../api/activities';
import { TARGET_RACE, daysUntilRace } from '../raceConfig';

interface DashboardProps {
  runs: RunSummary[];
  monthlyKmValue: number;
  monthlyGoal: MonthlyGoalRow | null;
  vo2max?: number;
  sleepScore?: number;
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

export function Dashboard({
  runs,
  monthlyKmValue,
  monthlyGoal,
  vo2max,
  sleepScore,
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
          <h2 className="mt-1 mb-0 text-2xl font-bold text-[#1C2430]">早安，Sasha</h2>
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
        className="rounded-2xl p-4 text-white"
        style={{
          background: 'linear-gradient(120deg, #4C82F0 0%, #2563EB 55%, #C2570F 130%)',
          boxShadow: '0 10px 24px rgba(37,99,235,0.28)',
        }}
      >
        <p className="m-0 text-[11px] opacity-85">
          🎯 {TARGET_RACE.name}・{TARGET_RACE.goalLabel}・倒數 {daysLeft} 天
        </p>
        <p className="mt-2 mb-0 text-xs opacity-85">本月跑量</p>
        <p className="mt-1 mb-0 text-[28px] font-medium font-[Outfit] leading-none">
          {monthlyKmValue.toFixed(1)}
          <span className="text-sm font-normal opacity-85"> {monthlyGoal ? `/ ${monthlyGoal.goal_km} km` : 'km'}</span>
        </p>
        {monthlyGoal && (
          <>
            <div className="mt-2.5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.28)' }}>
              <div className="h-full rounded-full bg-white" style={{ width: `${goalPct}%` }} />
            </div>
            <p className="mt-1.5 mb-0 text-[11px] opacity-90">
              {remainKm && remainKm > 0 ? `還差 ${remainKm} km` : '已達成本月目標！'}
              {monthlyGoal.focus ? `・${monthlyGoal.focus}` : ''}
            </p>
          </>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        <StatCard label="最近配速" value={latestRun?.paceMinPerKm ?? '--'} />
        <StatCard label="平均心率" value={latestRun?.avgHeartRate ? String(latestRun.avgHeartRate) : '--'} />
        <StatCard label="VO2max" value={vo2max != null ? String(vo2max) : '--'} accent />
        <StatCard label="睡眠分數" value={sleepScore != null ? String(sleepScore) : '--'} />
      </div>
    </div>
  );
}
