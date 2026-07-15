import type { WeeklyProgress, RunSummary } from '../types';
import { BottomNav } from './BottomNav';
import type { NavTab } from '../types';

interface DashboardProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  weekly: WeeklyProgress[];
  weeklyGoalKm: number;
  latestRun?: RunSummary;
  vo2max?: number;
  restingHeartRate?: number;
  sleepScore?: number;
  onViewPlan: () => void;
  onSync: () => void;
  syncing: boolean;
}

const StatCard = ({ label, value, unit }: { label: string; value: string; unit: string }) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className="text-xl font-medium">
      {value} <span className="text-xs text-gray-400">{unit}</span>
    </p>
  </div>
);

const WEEKDAY_ZH = ['日', '一', '二', '三', '四', '五', '六'];

export function Dashboard({ activeTab, onTabChange, weekly, weeklyGoalKm, latestRun, vo2max, restingHeartRate, sleepScore, onViewPlan, onSync, syncing }: DashboardProps) {
  const completedKm = weekly.reduce((sum, d) => sum + d.distanceKm, 0);
  const maxKm = Math.max(...weekly.map((d) => d.distanceKm), 1);
  const now = new Date();
  const todayLabel = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${WEEKDAY_ZH[now.getDay()]}`;

  return (
    <div className="w-full max-w-md md:max-w-lg mx-auto bg-white rounded-2xl shadow-sm p-3 sm:p-4 flex flex-col gap-2.5">
      <div className="flex justify-between items-center px-1.5 pt-1 pb-0.5">
        <div>
          <p className="text-xs text-gray-400">{todayLabel}</p>
          <h2 className="text-lg font-medium mt-0.5">早安，Sasha</h2>
        </div>
        <button
          onClick={onSync}
          disabled={syncing}
          className="flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2 py-1 rounded-md disabled:opacity-60"
        >
          <i className={`ti ${syncing ? 'ti-loader-2 animate-spin' : 'ti-refresh'} text-xs`} />
          {syncing ? '更新中...' : '重新整理'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatCard label="最近跑量" value={latestRun ? String(latestRun.distanceKm) : '--'} unit="km" />
        <StatCard label="平均心率" value={latestRun?.avgHeartRate ? String(latestRun.avgHeartRate) : '--'} unit="bpm" />
        <StatCard label="配速" value={latestRun?.paceMinPerKm ?? '--'} unit="/km" />
        <StatCard label="時間" value={latestRun?.durationMin ? String(latestRun.durationMin) : '--'} unit="分" />
      </div>

      {(vo2max != null || restingHeartRate != null || sleepScore != null) && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-3">每日體能 <span className="text-[11px] text-gray-400">・Garmin 同步</span></p>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full border-[3px] border-purple-400 flex items-center justify-center">
                <span className="text-base font-medium">{vo2max ?? '--'}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">VO2max</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full border-[3px] border-rose-300 flex items-center justify-center">
                <span className="text-base font-medium">{restingHeartRate ?? '--'}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">安靜心率</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full border-[3px] border-sky-300 flex items-center justify-center">
                <span className="text-base font-medium">{sleepScore ?? '--'}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">睡眠分數</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-sm text-gray-500 mb-2.5">本週跑量進度</p>
        <div className="flex items-end gap-1.5 h-[70px]">
          {weekly.map((d) => (
            <div
              key={d.dayLabel}
              className="flex-1 bg-teal-400 rounded-t-sm"
              style={{ height: `${(d.distanceKm / maxKm) * 100}%` }}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {completedKm.toFixed(1)} / {weeklyGoalKm} km
        </p>
      </div>

      <div className="bg-blue-50 rounded-xl p-4">
        <div className="flex items-center gap-1.5 mb-1.5">
          <i className="ti ti-sparkles text-sm text-blue-600" />
          <span className="text-xs text-blue-600">AI 教練建議</span>
        </div>
        <p className="text-sm mb-2.5 leading-relaxed">今天建議 5 公里輕鬆跑，心率控制在 Z2。</p>
        <button
          onClick={onViewPlan}
          className="text-xs px-2.5 py-1.5 w-full border border-gray-300 rounded-md hover:bg-white"
        >
          查看本週計畫 →
        </button>
      </div>

      <BottomNav active={activeTab} onChange={onTabChange} />
    </div>
  );
}