import type { RunSummary, NavTab } from '../types';
import { RUN_TYPE_ICON, RUN_TYPE_COLOR } from '../runTypeStyle';
import { weekStripFromRuns } from '../api/activities';

interface DashboardProps {
  runs: RunSummary[];
  weeklyKm: number;
  weeklyGoalKm: number;
  vo2max?: number;
  onTabChange: (tab: NavTab) => void;
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
  weeklyKm,
  weeklyGoalKm,
  vo2max,
  onTabChange,
  onSelectRun,
  onSync,
  syncing,
  loadError,
  syncMessage,
}: DashboardProps) {
  const now = new Date();
  const todayLabel = `${now.getMonth() + 1}月${now.getDate()}日 星期${WEEKDAY_ZH[now.getDay()]}`;
  const weekStrip = weekStripFromRuns(runs);
  const latestRun = runs[0];
  const recentRuns = runs.slice(0, 3);

  const weekPct = Math.min(100, Math.round((weeklyKm / weeklyGoalKm) * 100));
  const remainKm = Math.max(0, Math.round((weeklyGoalKm - weeklyKm) * 10) / 10);

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

      <div className="flex gap-1.5">
        {weekStrip.map((d) => (
          <button
            key={d.dayLabel + d.dateNum}
            onClick={() => d.runId && onSelectRun(d.runId)}
            className="flex-1 flex flex-col items-center gap-1 pt-2.5 pb-2 rounded-2xl border-none"
            style={{
              background: d.isToday ? 'linear-gradient(160deg,#60A5FA,#2563EB)' : '#ffffff',
              boxShadow: d.isToday ? '0 8px 18px rgba(37,99,235,0.35)' : 'none',
              cursor: d.runId ? 'pointer' : 'default',
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
        className="relative rounded-[28px] p-6 text-white overflow-hidden"
        style={{
          background:
            'radial-gradient(120% 140% at 8% 0%, #93B8F8 0%, #4C82F0 34%, #2563EB 62%, #F97316 130%)',
          boxShadow: '0 16px 36px rgba(37,99,235,0.32)',
        }}
      >
        <div
          className="absolute -right-10 -bottom-16 w-[200px] h-[200px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(253,186,116,0.55) 0%, rgba(253,186,116,0) 70%)' }}
        />
        <div className="relative flex justify-between items-start">
          <div>
            <p className="m-0 text-[13px] opacity-85">本週跑量</p>
            <p className="mt-1.5 mb-0 text-[44px] font-medium font-[Outfit] leading-none">
              {weeklyKm.toFixed(1)}
              <span className="text-[17px] font-normal opacity-85"> / {weeklyGoalKm} km</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onTabChange('fitness')}
              aria-label="體能"
              className="w-10 h-10 rounded-full border-none cursor-pointer flex items-center justify-center text-white"
              style={{ background: 'rgba(255,255,255,0.22)' }}
            >
              <i className="ti ti-heartbeat text-lg" />
            </button>
            <button
              onClick={() => onTabChange('coach')}
              aria-label="教練"
              className="w-10 h-10 rounded-full border-none cursor-pointer flex items-center justify-center text-white"
              style={{ background: 'rgba(255,255,255,0.22)' }}
            >
              <i className="ti ti-message-circle text-lg" />
            </button>
          </div>
        </div>
        <div className="relative mt-[18px] h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.28)' }}>
          <div className="absolute inset-y-0 left-0 rounded-full bg-white" style={{ width: `${weekPct}%` }} />
        </div>
        <p className="relative mt-3 mb-0 text-[13px] opacity-90">
          {remainKm > 0 ? `還差 ${remainKm} km` : '已達成本週目標！'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <StatCard label="最近配速" value={latestRun?.paceMinPerKm ?? '--'} />
        <StatCard label="平均心率" value={latestRun?.avgHeartRate ? String(latestRun.avgHeartRate) : '--'} />
        <StatCard label="VO2max" value={vo2max != null ? String(vo2max) : '--'} accent />
      </div>

      {recentRuns.length > 0 && (
        <div>
          <div className="flex justify-between items-baseline mb-3">
            <p className="m-0 text-base font-bold text-[#1C2430]">最近訓練紀錄</p>
            <button
              onClick={() => onTabChange('history')}
              className="bg-transparent border-none cursor-pointer p-0 text-[13px] text-[#2563EB]"
            >
              歷史數據 →
            </button>
          </div>
          <div className="flex flex-col">
            {recentRuns.map((r, i) => {
              const style = RUN_TYPE_COLOR[r.type];
              const shortDate = r.isoDate.slice(5).replace('-', '/');
              return (
                <div key={r.id} className="flex gap-3.5">
                  <div className="flex flex-col items-center w-11 shrink-0">
                    <span className="text-xs font-semibold font-[Outfit]" style={{ color: style.color }}>
                      {shortDate}
                    </span>
                    <span
                      className="w-2 h-2 rounded-full mt-1.5"
                      style={{ background: style.dot, boxShadow: `0 0 0 3px ${style.ring}` }}
                    />
                    {i < recentRuns.length - 1 && <span className="w-0.5 flex-1 bg-[#E4DFD7] mt-1" />}
                  </div>
                  <button
                    onClick={() => onSelectRun(r.id)}
                    className="flex-1 bg-white rounded-2xl px-4 py-3.5 mb-3 flex items-center gap-3 text-left border-none cursor-pointer"
                  >
                    <span
                      className="w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0"
                      style={{ background: style.bg, color: style.color }}
                    >
                      <i className={`ti ${RUN_TYPE_ICON[r.type]} text-[17px]`} />
                    </span>
                    <div>
                      <p className="m-0 text-sm font-medium text-[#1C2430]">
                        {r.type}・{r.distanceKm} km
                      </p>
                      <p className="mt-0.5 mb-0 text-xs text-[#9AA3B0]">
                        {r.paceMinPerKm}/km・{r.avgHeartRate} bpm
                      </p>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
