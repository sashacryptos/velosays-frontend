import { useState } from 'react';
import type { RunSummary, NavTab } from '../types';
import { BottomNav } from './BottomNav';

interface HistoryListProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  runs: RunSummary[];
  monthlyKm: number;
  avgPace: string;
  onSelectRun: (id: string) => void;
  onBack: () => void;
}

const PAGE_SIZE = 10;

const typeIcon: Record<RunSummary['type'], string> = {
  輕鬆跑: 'ti-run',
  恢復跑: 'ti-run',
  長距離跑: 'ti-mountain',
  配速跑: 'ti-bolt',
  間歇跑: 'ti-bolt',
};

export function HistoryList({ activeTab, onTabChange, runs, monthlyKm, avgPace, onSelectRun, onBack }: HistoryListProps) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(runs.length / PAGE_SIZE));
  const pageRuns = runs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="w-full max-w-md md:max-w-lg mx-auto bg-white rounded-2xl shadow-sm p-3 sm:p-4 flex flex-col gap-2.5">
      <div className="flex items-center gap-2.5 px-1.5 pt-1 pb-0.5">
        <button onClick={onBack} aria-label="返回">
          <i className="ti ti-arrow-left text-lg text-gray-500" />
        </button>
        <div>
          <h2 className="text-lg font-medium">歷史數據</h2>
          <p className="text-xs text-gray-400 mt-0.5">共 {runs.length} 次跑步・已同步 Garmin</p>
        </div>
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
        {pageRuns.map((run) => (
          <button
            key={run.id}
            onClick={() => onSelectRun(run.id)}
            className="flex items-center gap-2.5 bg-gray-50 rounded-lg px-3.5 py-2.5 text-left hover:bg-gray-100"
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

      {pageCount > 1 && (
        <div className="flex items-center justify-between px-1">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50"
          >
            ← 上一頁
          </button>
          <span className="text-xs text-gray-400">
            {page + 1} / {pageCount} 頁
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50"
          >
            下一頁 →
          </button>
        </div>
      )}

      <BottomNav active={activeTab} onChange={onTabChange} />
    </div>
  );
}
