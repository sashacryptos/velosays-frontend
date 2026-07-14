import type { RunDetail as RunDetailType, NavTab } from '../types';
import { BottomNav } from './BottomNav';

interface RunDetailProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  run: RunDetailType;
  onBack: () => void;
}

export function RunDetail({ activeTab, onTabChange, run, onBack }: RunDetailProps) {
  const hasLocation = run.city != null;
  const hasWeather = run.temperatureC != null || run.humidityPercent != null;
  const zones = run.zones ?? [];
  const splits = run.splits ?? [];

  return (
    <div className="max-w-sm mx-auto bg-white rounded-2xl p-3 flex flex-col gap-2.5">
      <div className="flex items-center gap-2.5 px-1.5 pt-1 pb-0.5">
        <button onClick={onBack} aria-label="返回">
          <i className="ti ti-arrow-left text-lg text-gray-500" />
        </button>
        <div>
          <h2 className="text-lg font-medium">{run.type}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{run.date}</p>
        </div>
      </div>

      {(hasLocation || hasWeather) && (
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3.5 py-2.5">
          {hasLocation && (
            <div className="flex items-center gap-1.5">
              <i className="ti ti-map-pin text-sm text-gray-500" />
              <span className="text-sm">{run.city}{run.country ? `, ${run.country}` : ''}</span>
            </div>
          )}
          {hasWeather && (
            <div className="flex items-center gap-2.5">
              {run.temperatureC != null && (
                <span className="flex items-center gap-1 text-sm">
                  <i className="ti ti-temperature text-sm text-gray-500" />{run.temperatureC}°C
                </span>
              )}
              {run.humidityPercent != null && (
                <span className="flex items-center gap-1 text-sm">
                  <i className="ti ti-droplet text-sm text-gray-500" />{run.humidityPercent}%
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-lg p-3.5">
          <div className="flex justify-between gap-2">
            <div>
              <p className="text-xs text-gray-500 mb-1">距離</p>
              <p className="text-lg font-medium">{run.distanceKm}<span className="text-[11px] text-gray-400"> km</span></p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">平均配速</p>
              <p className="text-lg font-medium">{run.paceMinPerKm}<span className="text-[11px] text-gray-400"> /km</span></p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3.5">
          <p className="text-xs text-gray-500 mb-1">時間</p>
          <p className="text-lg font-medium">{run.durationMin ?? '--'}<span className="text-[11px] text-gray-400"> 分</span></p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3.5">
          <p className="text-xs text-gray-500 mb-1">平均步幅</p>
          <p className="text-lg font-medium">{run.strideM ?? '--'}<span className="text-[11px] text-gray-400"> m</span></p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3.5">
          <p className="text-xs text-gray-500 mb-1">平均步頻</p>
          <p className="text-lg font-medium">{run.cadence ?? '--'}<span className="text-[11px] text-gray-400"> spm</span></p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-sm text-gray-500 mb-3.5">心率</p>
        <div className="flex justify-between mb-3">
          <div><p className="text-xs text-gray-400">平均</p><p className="text-lg font-medium">{run.avgHeartRate || '--'}</p></div>
          <div><p className="text-xs text-gray-400">最高</p><p className="text-lg font-medium">{run.maxHeartRate ?? '--'}</p></div>
          <div><p className="text-xs text-gray-400">步頻</p><p className="text-lg font-medium">{run.cadence ?? '--'}</p></div>
        </div>
        {zones.length > 0 && (
          <>
            <div className="flex h-2 rounded overflow-hidden mb-1.5">
              {zones.map((z) => (
                <div key={z.zone} style={{ width: `${z.percent}%`, backgroundColor: z.color }} />
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-gray-400 mb-3">
              {zones.map((z) => <span key={z.zone}>{z.zone}</span>)}
            </div>
            <div className="flex flex-col gap-1.5">
              {zones.map((z) => (
                <div key={z.zone} className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: z.color }} />
                    {z.zone} {z.label}
                  </span>
                  <span className="text-gray-400">{z.minutes}分・{z.percent}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {run.aerobicPercent != null && run.anaerobicPercent != null && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-2">有氧 / 無氧比例</p>
          <div className="flex h-3.5 rounded-full overflow-hidden mb-2">
            <div className="bg-teal-500" style={{ width: `${run.aerobicPercent}%` }} />
            <div className="bg-orange-500" style={{ width: `${run.anaerobicPercent}%` }} />
          </div>
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1.5 text-teal-800">
              <span className="w-2 h-2 rounded-full inline-block bg-teal-500" />有氧 {run.aerobicPercent}%
            </span>
            <span className="flex items-center gap-1.5 text-orange-800">
              <span className="w-2 h-2 rounded-full inline-block bg-orange-500" />無氧 {run.anaerobicPercent}%
            </span>
          </div>
        </div>
      )}

      {splits.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-3">分段配速</p>
          <div className="flex flex-col gap-2">
            {splits.map((s) => (
              <div key={s.km} className="flex justify-between text-sm">
                <span className="text-gray-400">{s.km} km</span>
                <span className="font-medium">{s.pace}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {run.coachFeedback && (
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <i className="ti ti-sparkles text-sm text-blue-600" />
            <span className="text-xs text-blue-600">教練回饋</span>
          </div>
          <p className="text-sm leading-relaxed">{run.coachFeedback}</p>
        </div>
      )}

      <BottomNav active={activeTab} onChange={onTabChange} />
    </div>
  );
}
