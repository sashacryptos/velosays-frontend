import type { WeeklyProgress } from '../types';
import { BottomNav } from './BottomNav';
import type { NavTab } from '../types';

interface DashboardProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  weekly: WeeklyProgress[];
  weeklyGoalKm: number;
  onViewPlan: () => void;
}

const StatCard = ({ label, value, unit }: { label: string; value: string; unit: string }) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className="text-xl font-medium">
      {value} <span className="text-xs text-gray-400">{unit}</span>
    </p>
  </div>
);

export function Dashboard({ activeTab, onTabChange, weekly, weeklyGoalKm, onViewPlan }: DashboardProps) {
  const completedKm = weekly.reduce((sum, d) => sum + d.distanceKm, 0);
  const maxKm = Math.max(...weekly.map((d) => d.distanceKm), 1);

  return (
    <div className="max-w-sm mx-auto bg-white rounded-2xl p-3 flex flex-col gap-2.5">
      <div className="flex justify-between items-center px-1.5 pt-1 pb-0.5">
        <div>
          <p className="text-xs text-gray-400">2026年7月13日 星期一</p>
          <h2 className="text-lg font-medium mt-0.5">早安，今天輕鬆跑</h2>
        </div>
        <div className="flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2 py-1 rounded-md">
          <i className="ti ti-plug-connected text-xs" />
          Garmin
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard label="昨日跑量" value="8.4" unit="km" />
        <StatCard label="平均心率" value="148" unit="bpm" />
        <StatCard label="配速" value="5'21" unit="/km" />
        <StatCard label="恢復時間" value="18" unit="hr" />
      </div>

      <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
        <div className="w-14 h-14 rounded-full border-[3px] border-purple-400 flex items-center justify-center flex-shrink-0">
          <span className="text-base font-medium">52</span>
        </div>
        <div>
          <p className="text-sm">
            VO2max <span className="text-gray-500 font-normal">・優秀等級</span>
          </p>
          <p className="text-xs text-gray-500 mt-0.5">近 30 天 +1・持續進步中</p>
        </div>
      </div>

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