import { useState } from 'react';
import type { RunSummary } from '../types';
import { RUN_TYPE_ICON, RUN_TYPE_COLOR } from '../runTypeStyle';

interface HistoryListProps {
  runs: RunSummary[];
  monthlyKm: number;
  monthlyCount: number;
  totalCount: number;
  onSelectRun: (id: string) => void;
  onBack: () => void;
}

const PAGE_SIZE = 6;

export function HistoryList({ runs, monthlyKm, monthlyCount, totalCount, onSelectRun, onBack }: HistoryListProps) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(runs.length / PAGE_SIZE));
  const pageRuns = runs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const atFirst = page === 0;
  const atLast = page >= pageCount - 1;

  return (
    <div className="flex-1 overflow-y-auto px-5 pt-14 pb-[108px] flex flex-col gap-[18px]">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label="返回"
          className="w-[38px] h-[38px] rounded-full bg-white border-none cursor-pointer flex items-center justify-center text-[#1C2430]"
        >
          <i className="ti ti-arrow-left text-[17px]" />
        </button>
        <div>
          <h2 className="m-0 text-xl font-bold text-[#1C2430]">歷史數據</h2>
          <p className="mt-0.5 mb-0 text-xs text-[#9AA3B0]">已同步 Garmin</p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-[1.25] rounded-[20px] p-3.5" style={{ background: 'linear-gradient(135deg,#DBEAFE 0%,#BFD7FB 100%)' }}>
          <p className="m-0 text-[11px] text-[#37548C]">本月累積里程</p>
          <p className="mt-1.5 mb-0 text-xl font-medium font-[Outfit] text-[#1C2430]">
            {monthlyKm} <span className="text-xs font-normal text-[#6A7482]">km</span>
          </p>
        </div>
        <div className="flex-1 rounded-[20px] p-3.5" style={{ background: 'linear-gradient(135deg,#FFE9D6 0%,#FDBA74 100%)' }}>
          <p className="m-0 text-[11px] text-[#C2570F]">本月跑步</p>
          <p className="mt-1.5 mb-0 text-xl font-medium font-[Outfit] text-[#1C2430]">
            {monthlyCount} <span className="text-xs font-normal text-[#6A7482]">次</span>
          </p>
        </div>
        <div className="flex-1 bg-white rounded-[20px] p-3.5">
          <p className="m-0 text-[11px] text-[#9AA3B0]">累積跑步</p>
          <p className="mt-1.5 mb-0 text-xl font-medium font-[Outfit] text-[#1C2430]">
            {totalCount} <span className="text-xs font-normal text-[#6A7482]">次</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {pageRuns.map((run) => {
          const style = RUN_TYPE_COLOR[run.type];
          return (
            <button
              key={run.id}
              onClick={() => onSelectRun(run.id)}
              className="flex items-center gap-3 bg-white rounded-[20px] px-4 py-3.5 text-left border-none cursor-pointer hover:bg-[#FBFAF8]"
            >
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: style.bg, color: style.color }}
              >
                <i className={`ti ${RUN_TYPE_ICON[run.type]} text-lg`} />
              </span>
              <div className="flex-1">
                <p className="m-0 text-sm font-medium text-[#1C2430]">
                  {run.date}・{run.type}
                </p>
                <p className="mt-0.5 mb-0 text-xs text-[#9AA3B0]">
                  {run.paceMinPerKm}/km・{run.avgHeartRate} bpm・{run.durationMin ?? '--'} 分
                </p>
              </div>
              <i className="ti ti-chevron-right text-[#C4CAD3]" />
            </button>
          );
        })}
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-4 py-0.5">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={atFirst}
            aria-label="上一頁"
            className="w-9 h-9 rounded-full bg-white border-none flex items-center justify-center"
            style={{ color: atFirst ? '#D5DAE1' : '#1C2430', cursor: atFirst ? 'default' : 'pointer' }}
          >
            <i className="ti ti-chevron-left text-base" />
          </button>
          <span className="text-[13px] text-[#6A7482] font-[Outfit]">
            {page + 1} / {pageCount}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={atLast}
            aria-label="下一頁"
            className="w-9 h-9 rounded-full bg-white border-none flex items-center justify-center"
            style={{ color: atLast ? '#D5DAE1' : '#1C2430', cursor: atLast ? 'default' : 'pointer' }}
          >
            <i className="ti ti-chevron-right text-base" />
          </button>
        </div>
      )}
    </div>
  );
}
