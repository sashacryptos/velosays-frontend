import React from 'react';
import { Calendar, Clock, Heart, Zap, Move } from 'lucide-react';

export interface Activity {
  id: string;
  user_id: string;
  date: string;
  distance: number;
  pace: string;
  duration: number;
  avg_hr: number | null;
  max_hr: number | null;
  avg_spm: number | null;
  avg_stride_length: number | null;
  source: string;
  title: string;
}

interface Props {
  activities: Activity[];
}

export const SashaRunningDashboard: React.FC<Props> = ({ activities }) => {
  const formatDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs > 0 ? hrs + '小時' : ''}${mins}分${secs}秒`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-50 min-h-screen">
      <div className="mb-8 border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          🏃 VeloSays 跑步教練平台 <span className="text-sm font-medium bg-orange-100 text-orange-600 px-2.5 py-0.5 rounded-full">Strava 數據即時連線</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">學員 Sasha 的最新動態訓練日誌</p>
      </div>

      <div className="space-y-4">
        {activities.map((act) => (
          <div key={act.id} className="bg-white rounded-xl shadow-sm border border-slate-100 hover:border-orange-200 hover:shadow-md transition-all duration-200 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-semibold text-slate-800 text-lg">{act.title || "今日跑步"}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {act.date}</span>
                  <span>•</span>
                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px] uppercase font-bold">{act.source}</span>
                </div>
              </div>
              <div className="flex items-baseline gap-4 sm:text-right">
                <div><span className="text-3xl font-extrabold text-slate-900">{act.distance}</span><span className="text-sm font-semibold text-slate-400 ml-1">KM</span></div>
                <div className="border-l border-slate-200 pl-4"><span className="text-2xl font-bold text-orange-600 font-mono">{act.pace}</span><span className="text-xs font-medium text-slate-400 block">/公里</span></div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-md"><Clock className="w-4 h-4" /></div>
                <div><p className="text-xs text-slate-400 font-medium">總時間</p><p className="font-semibold text-slate-700">{formatDuration(act.duration)}</p></div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-3">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-md"><Heart className="w-4 h-4" /></div>
                <div><p className="text-xs text-slate-400 font-medium">心率 (Avg/Max)</p><p className="font-semibold text-slate-700">{act.avg_hr || '--'} {act.max_hr ? `(${act.max_hr})` : ''}</p></div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-md"><Zap className="w-4 h-4" /></div>
                <div><p className="text-xs text-slate-400 font-medium">平均步頻</p><p className="font-semibold text-slate-700">{act.avg_spm ? `${act.avg_spm} spm` : '--'}</p></div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-md"><Move className="w-4 h-4" /></div>
                <div><p className="text-xs text-slate-400 font-medium">平均步幅</p><p className="font-semibold text-slate-700">{act.avg_stride_length ? `${act.avg_stride_length} cm` : '--'}</p></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};