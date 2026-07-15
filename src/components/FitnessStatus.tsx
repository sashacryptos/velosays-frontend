import type { FitnessMetrics } from '../types';

interface FitnessStatusProps {
  metrics: FitnessMetrics;
}

const dayLabels = ['一', '二', '三', '四', '五', '六', '日'];

// SVG 環形進度：circle r=36 的周長 ≈ 226
const RING_CIRC = 226;

// 兩個量表沒有官方「滿分」，用一般跑者的合理區間換算成環形填充比例：
// VO2max 20（久坐）~ 65（頂尖）；7 天訓練負荷 0 ~ 400 分鐘（業餘跑者常見上限）
function ringOffset(value: number | undefined, min: number, max: number): number {
  if (value == null) return RING_CIRC;
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return RING_CIRC - pct * RING_CIRC;
}

export function FitnessStatus({ metrics }: FitnessStatusProps) {
  const maxLoad = Math.max(...metrics.weeklyLoad, 1);
  const vo2Offset = ringOffset(metrics.vo2max, 20, 65);
  const loadOffset = ringOffset(metrics.trainingLoad, 0, 400);

  return (
    <div className="flex-1 overflow-y-auto px-5 pt-14 pb-[108px] flex flex-col gap-4">
      <div>
        <h2 className="m-0 text-xl font-bold text-[#1C2430]">體能狀態</h2>
        <p className="mt-0.5 mb-0 text-xs text-[#9AA3B0]">Garmin 每日體能指標</p>
      </div>

      <div className="flex gap-2.5">
        <div className="flex-1 bg-white rounded-3xl p-[18px] flex flex-col items-center gap-2">
          <svg width="84" height="84" viewBox="0 0 84 84">
            <circle cx="42" cy="42" r="36" fill="none" stroke="#EEF1F6" strokeWidth="7" />
            <circle
              cx="42"
              cy="42"
              r="36"
              fill="none"
              stroke="#2563EB"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={RING_CIRC}
              strokeDashoffset={vo2Offset}
              transform="rotate(-90 42 42)"
            />
            <text x="42" y="48" textAnchor="middle" fontSize="20" fontFamily="Outfit, sans-serif" fontWeight="500" fill="#1C2430">
              {metrics.vo2max ?? '--'}
            </text>
          </svg>
          <p className="m-0 text-xs text-[#6A7482]">VO2max</p>
        </div>
        <div className="flex-1 bg-white rounded-3xl p-[18px] flex flex-col items-center gap-2">
          <svg width="84" height="84" viewBox="0 0 84 84">
            <circle cx="42" cy="42" r="36" fill="none" stroke="#F0EAE2" strokeWidth="7" />
            <circle
              cx="42"
              cy="42"
              r="36"
              fill="none"
              stroke="#F97316"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={RING_CIRC}
              strokeDashoffset={loadOffset}
              transform="rotate(-90 42 42)"
            />
            <text x="42" y="48" textAnchor="middle" fontSize="20" fontFamily="Outfit, sans-serif" fontWeight="500" fill="#1C2430">
              {metrics.trainingLoad}
            </text>
          </svg>
          <p className="m-0 text-xs text-[#6A7482]">7 天負荷（分鐘）</p>
        </div>
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

      <div className="flex gap-2.5">
        <div className="flex-1 bg-white rounded-[20px] p-4">
          <div className="flex items-center gap-1.5">
            <i className="ti ti-heart text-sm text-[#F97316]" />
            <p className="m-0 text-[11px] text-[#9AA3B0]">安靜心率</p>
          </div>
          <p className="mt-2 mb-0 text-xl font-medium font-[Outfit] text-[#1C2430]">
            {metrics.restingHeartRate ?? '--'} <span className="text-xs text-[#9AA3B0]">bpm</span>
          </p>
        </div>
        <div className="flex-1 bg-white rounded-[20px] p-4">
          <div className="flex items-center gap-1.5">
            <i className="ti ti-moon text-sm text-[#2563EB]" />
            <p className="m-0 text-[11px] text-[#9AA3B0]">睡眠分數</p>
          </div>
          <p className="mt-2 mb-0 text-xl font-medium font-[Outfit] text-[#1C2430]">{metrics.sleepScore ?? '--'}</p>
        </div>
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
