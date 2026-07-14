import type { FitnessMetrics, NavTab } from '../types';
import { BottomNav } from './BottomNav';

interface FitnessStatusProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  metrics: FitnessMetrics;
}

const dayLabels = ['一', '二', '三', '四', '五', '六', '日'];

export function FitnessStatus({ activeTab, onTabChange, metrics }: FitnessStatusProps) {
  const maxLoad = Math.max(...metrics.weeklyLoad, 1);
  const isRecovered = metrics.recoveryHours <= 24;

  return (
    <div className="max-w-sm mx-auto bg-white rounded-2xl p-3 flex flex-col gap-2.5">
      <div className="px-1.5 pt-1 pb-0.5">
        <h2 className="text-lg font-medium">體能狀態</h2>
        <p className="text-xs text-gray-400 mt-0.5">Garmin 每日體能指標</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-xl p-3.5 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full border-[3px] border-purple-400 flex items-center justify-center">
            <span className="text-base font-medium">{metrics.vo2max}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">VO2max</p>
          <p className="text-[11px] text-gray-400">優秀等級</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3.5 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full border-[3px] border-teal-400 flex items-center justify-center">
            <span className="text-base font-medium">{metrics.trainingLoad}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">體能負荷</p>
          <p className="text-[11px] text-gray-400">最佳範圍</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-sm text-gray-500 mb-2.5">7 天訓練負荷</p>
        <div className="flex items-end gap-1.5 h-[70px]">
          {metrics.weeklyLoad.map((v, i) => (
            <div
              key={i}
              className="flex-1 bg-amber-400 rounded-t-sm"
              style={{ height: `${(v / maxLoad) * 100}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
          {dayLabels.map((d) => <span key={d}>{d}</span>)}
        </div>
      </div>

      <div className={`flex items-center gap-3 rounded-xl p-3.5 ${isRecovered ? 'bg-green-50' : 'bg-amber-50'}`}>
        <i className={`ti ti-battery-4 text-2xl ${isRecovered ? 'text-green-700' : 'text-amber-700'}`} />
        <div>
          <p className={`text-sm ${isRecovered ? 'text-green-700' : 'text-amber-700'}`}>
            {isRecovered ? '恢復狀態良好' : '仍在恢復中'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            建議恢復時間已過 {metrics.recoveryHours} 小時，可正常訓練
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-3.5">
        <div className="flex justify-between items-center mb-1.5">
          <p className="text-xs text-gray-500">安靜心率</p>
          <p className="text-xs">{metrics.restingHeartRate} bpm</p>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500">睡眠分數</p>
          <p className="text-xs">{metrics.sleepScore}</p>
        </div>
      </div>

      <BottomNav active={activeTab} onChange={onTabChange} />
    </div>
  );
}