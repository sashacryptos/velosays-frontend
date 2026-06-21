import React from 'react';
import { Calendar, Clock, Heart, Zap, Move, Trophy } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto p-6 bg-slate-50 min-h-screen text-slate-800">
      {/* 頂部 Header 區塊 */}
      <div className="mb-8 border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          🏃 VeloSays 跑步教練平台
        </h1>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-sm font-semibold bg-orange-100 text-orange-600 px-3 py-0.5 rounded-full flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" /> Strava 數據即時連線
          </span>
          <p className="text-sm text-slate-500">| 學員 Sasha 的金澤馬拉松備戰日誌</p>
        </div>
      </div>

      {/* 如果 Supabase 剛好沒撈到資料的防呆畫面 */}
      {activities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <p className="text-slate-400 font-medium text-lg">目前資料庫連線正常，正在等待同步首錶動態...</p>
          <p className="text-xs text-slate-400 mt-2">（若持續看到此畫面，請檢查 Supabase Table 資料是否已成功從 Strava 寫入）</p>
        </div>
      ) : (
        /* 資料列表 - 真正畫出卡片的地方 */
        <div className="space-y-6">
          {activities.map((act) => (
            <div key={act.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-orange-300 hover:shadow-md transition-all duration-300 p-6">
              {/* 卡片上半部：標題與核心大數字 */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dashed border-slate-100 pb-4 mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-xl">{act.title || "今日訓練"}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5">
                    <span className="inline-flex items-center gap-1 font-medium"><Calendar className="w-3.5 h-3.5" /> {act.date}</span>
                    <span>•</span>
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px]">{act.source}</span>
                  </div>
                </div>
                
                <div className="flex items-baseline gap-6 md:text-right">
                  <div>
                    <span className="text-4xl font-black text-slate-900 font-mono tracking-tight">{act.distance}</span>
                    <span className="text-sm font-bold text-slate-400 ml-1">KM</span>
                  </div>
                  <div className="border-l border-slate-200 pl-6">
                    <span className="text-3xl font-black text-orange-600 font-mono tracking-tight">{act.pace}</span>
                    <span className="text-xs font-bold text-slate-400 block mt-0.5">/ 公里配速</span>
                  </div>
                </div>
              </div>

              {/* 卡片下半部：四大專業大數據面板 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-xl p-3.5 flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg"><Clock className="w-4 h-4" /></div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">總訓練時間</p>
                    <p className="font-bold text-slate-700 text-sm mt-0.5">{formatDuration(act.duration)}</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3.5 flex items-center gap-3">
                  <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg"><Heart className="w-4 h-4" /></div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">心率 (Avg/Max)</p>
                    <p className="font-bold text-slate-700 text-sm mt-0.5">
                      {act.avg_hr || '--'} <span className="text-xs text-slate-400 font-normal">{act.max_hr ? ` / ${act.max_hr}` : ''}</span>
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3.5 flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg"><Zap className="w-4 h-4" /></div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">平均步頻</p>
                    <p className="font-bold text-slate-700 text-sm mt-0.5">{act.avg_spm ? `${act.avg_spm} spm` : '--'}</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3.5 flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg"><Move className="w-4 h-4" /></div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">平均步幅</p>
                    <p className="font-bold text-slate-700 text-sm mt-0.5">{act.avg_stride_length ? `${act.avg_stride_length} cm` : '--'}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};