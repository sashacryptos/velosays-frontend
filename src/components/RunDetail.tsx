import type { RunDetail as RunDetailType } from '../types';

interface RunDetailProps {
  run: RunDetailType;
  onBack: () => void;
}

const ZONE_COLOR: Record<string, string> = {
  Z1: '#BFD7FB',
  Z2: '#60A5FA',
  Z3: '#2563EB',
  Z4: '#F97316',
  Z5: '#C2570F',
};

function paceSeconds(pace: string): number {
  const m = pace.match(/(\d+)['’:](\d+)/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
}

const MetricCard = ({ label, value, unit }: { label: string; value: string | number; unit: string }) => (
  <div className="bg-white rounded-[20px] px-4 py-3.5">
    <p className="m-0 text-[11px] text-[#9AA3B0]">{label}</p>
    <p className="mt-1 mb-0 text-lg font-medium font-[Outfit] text-[#1C2430]">
      {value} <span className="text-[11px] text-[#9AA3B0]">{unit}</span>
    </p>
  </div>
);

export function RunDetail({ run, onBack }: RunDetailProps) {
  const zones = run.zones ?? [];
  const splits = run.splits ?? [];

  const subtitleParts = [run.date];
  if (run.city) subtitleParts.push(run.country ? `${run.city}, ${run.country}` : run.city);
  if (run.temperatureC != null) subtitleParts.push(`${run.temperatureC}°C`);
  if (run.humidityPercent != null) subtitleParts.push(`${run.humidityPercent}%`);

  const fastestSec = splits.length ? Math.min(...splits.map((s) => paceSeconds(s.pace))) : 0;

  return (
    <div className="flex-1 overflow-y-auto px-5 pt-14 pb-[108px] flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label="返回"
          className="w-[38px] h-[38px] rounded-full bg-white border-none cursor-pointer flex items-center justify-center text-[#1C2430]"
        >
          <i className="ti ti-arrow-left text-[17px]" />
        </button>
        <div>
          <h2 className="m-0 text-xl font-bold text-[#1C2430]">{run.type}</h2>
          <p className="mt-0.5 mb-0 text-xs text-[#9AA3B0]">{subtitleParts.join('・')}</p>
        </div>
      </div>

      <div
        className="rounded-3xl p-5 text-white"
        style={{ background: 'radial-gradient(130% 150% at 10% 0%, #93B8F8 0%, #2563EB 58%, #8C6F5A 135%)' }}
      >
        <div className="flex justify-between">
          <div>
            <p className="m-0 text-xs opacity-85">距離</p>
            <p className="mt-1 mb-0 text-[26px] font-medium font-[Outfit]">
              {run.distanceKm}
              <span className="text-[13px] opacity-85"> km</span>
            </p>
          </div>
          <div>
            <p className="m-0 text-xs opacity-85">配速</p>
            <p className="mt-1 mb-0 text-[26px] font-medium font-[Outfit]">{run.paceMinPerKm}</p>
          </div>
          <div>
            <p className="m-0 text-xs opacity-85">時間</p>
            <p className="mt-1 mb-0 text-[26px] font-medium font-[Outfit]">
              {run.durationMin ?? '--'}
              <span className="text-[13px] opacity-85"> 分</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <MetricCard label="平均心率" value={run.avgHeartRate || '--'} unit="bpm" />
        <MetricCard label="最高心率" value={run.maxHeartRate ?? '--'} unit="bpm" />
        <MetricCard label="平均步頻" value={run.cadence ?? '--'} unit="spm" />
        <MetricCard label="平均步幅" value={run.strideM ?? '--'} unit="m" />
      </div>

      {zones.length > 0 && (
        <div className="bg-white rounded-3xl p-[18px]">
          <p className="m-0 mb-3 text-sm font-bold text-[#1C2430]">心率區間</p>
          <div className="flex h-2.5 rounded-full overflow-hidden mb-3.5">
            {zones.map((z) => (
              <div key={z.zone} style={{ width: `${z.percent}%`, backgroundColor: ZONE_COLOR[z.zone] }} />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {zones.map((z) => (
              <div key={z.zone} className="flex justify-between items-center text-[13px]">
                <span className="flex items-center gap-2 text-[#1C2430]">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: ZONE_COLOR[z.zone] }} />
                  {z.zone} {z.label}
                </span>
                <span className="text-[#9AA3B0] font-[Outfit]">
                  {z.minutes}分・{z.percent}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {splits.length > 0 && (
        <div className="bg-white rounded-3xl p-[18px]">
          <p className="m-0 mb-3 text-sm font-bold text-[#1C2430]">分段配速</p>
          <div className="flex flex-col gap-2.5">
            {splits.map((s) => {
              const sec = paceSeconds(s.pace);
              const pct = sec > 0 ? Math.round((fastestSec / sec) * 100) : 0;
              return (
                <div key={s.km} className="flex items-center gap-3 text-[13px]">
                  <span className="text-[#9AA3B0] w-[34px] font-[Outfit]">{s.km} km</span>
                  <span className="flex-1 h-1.5 rounded-full bg-[#EEF1F6] relative">
                    <span
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#60A5FA,#2563EB)' }}
                    />
                  </span>
                  <span className="font-medium text-[#1C2430] font-[Outfit]">{s.pace}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {run.coachFeedback && (
        <div className="rounded-3xl p-[18px]" style={{ background: 'linear-gradient(135deg,#FFE9D6 0%,#E7DACB 100%)' }}>
          <div className="flex items-center gap-2 mb-2">
            <i className="ti ti-sparkles text-[15px] text-[#C2570F]" />
            <span className="text-xs font-bold text-[#C2570F]">教練回饋</span>
          </div>
          <p className="m-0 text-[13px] leading-[1.7] text-[#4B4238]">{run.coachFeedback}</p>
        </div>
      )}
    </div>
  );
}
