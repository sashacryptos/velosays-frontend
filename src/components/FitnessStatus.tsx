import type { FitnessMetrics } from '../types';
import type { TrainingLoadResult, IntensitySplit } from '../api/activities';

interface FitnessStatusProps {
  metrics: FitnessMetrics;
  trainingLoad: TrainingLoadResult;
  intensity: IntensitySplit;
}

const dayLabels = ['一', '二', '三', '四', '五', '六', '日'];

function tsbCaption(tsb: number): { text: string; color: string } {
  if (tsb > 5) return { text: '偏新鮮・可接受強度', color: '#1E9E6B' };
  if (tsb < -10) return { text: '疲勞偏高・建議降量', color: '#EA5B23' };
  return { text: '穩定累積中', color: '#6A7482' };
}

const StatCard = ({
  label,
  value,
  unit,
  caption,
  captionColor,
}: {
  label: string;
  value: string | number;
  unit?: string;
  caption?: string;
  captionColor?: string;
}) => (
  <div className="bg-white rounded-2xl p-4">
    <p className="m-0 text-[11px] text-[#9AA3B0]">{label}</p>
    <p className="mt-1.5 mb-0 text-2xl font-medium font-[Outfit] text-[#1C2430]">
      {value}
      {unit && <span className="text-xs font-normal text-[#9AA3B0]"> {unit}</span>}
    </p>
    {caption && (
      <p className="mt-1 mb-0 text-[11px]" style={{ color: captionColor ?? '#9AA3B0' }}>
        {caption}
      </p>
    )}
  </div>
);

export function FitnessStatus({ metrics, trainingLoad, intensity }: FitnessStatusProps) {
  const maxLoad = Math.max(...metrics.weeklyLoad, 1);
  const tsb = tsbCaption(trainingLoad.tsb);

  return (
    <div className="flex-1 overflow-y-auto px-5 pt-14 pb-[108px] flex flex-col gap-4">
      <div>
        <h2 className="m-0 text-xl font-bold text-[#1C2430]">體能狀態</h2>
        <p className="mt-0.5 mb-0 text-xs text-[#9AA3B0]">Garmin 每日體能指標與訓練負荷分析</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <StatCard label="VO2max" value={metrics.vo2max ?? '--'} caption="Garmin 每日估算" />
        <StatCard
          label="訓練負荷狀態 (TSB)"
          value={trainingLoad.tsb > 0 ? `+${trainingLoad.tsb}` : trainingLoad.tsb}
          caption={tsb.text}
          captionColor={tsb.color}
        />
        <StatCard
          label="低強度跑量比例"
          value={`${intensity.lowPercent}%`}
          caption={`高強度 ${intensity.highPercent}%`}
          captionColor={intensity.lowPercent >= 80 ? '#1E9E6B' : '#EA5B23'}
        />
        <StatCard label="安靜心率" value={metrics.restingHeartRate ?? '--'} unit="bpm" />
      </div>

      <div className="bg-white rounded-3xl p-[18px]">
        <p className="m-0 mb-3.5 text-sm font-bold text-[#1C2430]">7 天訓練負荷</p>
        <div className="flex items-end gap-2 h-[90px]">
          {metrics.weeklyLoad.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end h-full">
              <div
                className="rounded-full"
                style={{
                  height: `${Math.max((v / maxLoad) * 100, v > 0 ? 6 : 2)}%`,
                  background: v === maxLoad && v > 0 ? '#F97316' : '#93B8F8',
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          {dayLabels.map((d) => (
            <span key={d} className="flex-1 text-center text-[10px] text-[#9AA3B0]">
              {d}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[20px] p-4">
        <div className="flex items-center gap-1.5">
          <i className="ti ti-moon text-sm text-[#2563EB]" />
          <p className="m-0 text-[11px] text-[#9AA3B0]">睡眠分數</p>
        </div>
        <p className="mt-2 mb-0 text-xl font-medium font-[Outfit] text-[#1C2430]">{metrics.sleepScore ?? '--'}</p>
      </div>

      {metrics.recoveryHours != null && (
        <div
          className="rounded-[20px] p-4 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg,#DBEAFE 0%,#FFE9D6 100%)' }}
        >
          <i className="ti ti-battery-4 text-2xl text-[#37548C]" />
          <div>
            <p className="m-0 text-sm font-medium text-[#1C2430]">
              {metrics.recoveryHours <= 24 ? '恢復狀態良好' : '仍在恢復中'}
            </p>
            <p className="mt-0.5 mb-0 text-xs text-[#6A7482]">建議恢復時間 {metrics.recoveryHours} 小時</p>
          </div>
        </div>
      )}
    </div>
  );
}
