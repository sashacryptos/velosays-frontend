import type { RunSummary, NavTab } from '../types';
import { BottomNav } from './BottomNav';

interface HistoryListProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  runs: RunSummary[];
  monthlyKm: number;
  avgPace: string;
  onSelectRun: (id: string) => void;
}

const typeIcon: Record<RunSummary['type'], string> = {
  輕鬆跑: 'ti-run',
  恢復跑: 'ti-run',
  長距離跑: 'ti-mountain',
  配速跑: 'ti-bolt',
  間歇跑: 'ti-bolt',
};

export function HistoryList({ activeTab, onTabChange, runs, monthlyKm, avgPace, onSelectRun }: HistoryListProps) {
  return (
    <div className="max-w-sm mx-auto bg-white rounded-2xl p-3 flex flex-col gap-2.5">
      <div className="px-1.5 pt-1 pb-0.5">
        <h2 className="text-lg font-medium">歷史數據</h2>
        <p className="text-xs text-gray-400 mt-0.5">共 {runs.length} 次跑步・已同步 Garmin</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">本月里程</p>
          <p className="text-lg font-medium">{monthlyKm} km</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">平均配速</p>
          <p className="text-lg font-medium">{avgPace}/km</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {runs.map((run) => (
          <button
            key={run.id}
            onClick={() => onSelectRun(run.id)}
            className="flex items-center gap-2.5 bg-gray-50 rounded-lg px-3.5 py-2.5 text-left"
          >
            <i className={`ti ${typeIcon[run.type]} text-lg text-teal-600`} />
            <div className="flex-1">
              <p className="text-sm">{run.date}・{run.type}</p>
              <p className="text-xs text-gray-400">
                {run.distanceKm} km・{run.paceMinPerKm}/km・{run.avgHeartRate} bpm
              </p>
            </div>
            <i className="ti ti-chevron-right text-gray-400" />
          </button>
        ))}
      </div>

      <BottomNav active={activeTab} onChange={onTabChange} />
    </div>
  );
}