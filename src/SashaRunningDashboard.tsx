import React from 'react';

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
  onRefresh: () => Promise<void> | void;
  refreshing: boolean;
  onOpenCoachChat: () => void;
  onStartTraining: () => Promise<void> | void;
  activeTab: string;                               // 💡 新增 Prop
  setActiveTab: (tab: string) => void;             // 💡 新增 Prop
}

export const SashaRunningDashboard: React.FC<Props> = ({
  activities,
  onRefresh,
  refreshing = false,
  onOpenCoachChat,
  onStartTraining,
  activeTab,
  setActiveTab,
}) => {

  const latestActivity = activities[0];

  const totalDistance = activities
    .slice(0, 7)
    .reduce((sum, act) => sum + Number(act.distance || 0), 0);

  const formatDuration = (totalSeconds: number) => {
    if (!totalSeconds) return '--';
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getWeeklyMileage = () => {
    const now = new Date();
    return [0, 1, 2, 3].map((weekOffset) => {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay() - weekOffset * 7);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(start.getDate() + 7);

      const distance = activities
        .filter((act) => {
          const activityDate = new Date(act.date);
          return activityDate >= start && activityDate < end;
        })
        .reduce((sum, act) => sum + Number(act.distance || 0), 0);

      return {
        label: weekOffset === 0 ? '本週' : `${weekOffset} 週前`,
        distance,
      };
    });
  };

  const weeklyMileage = getWeeklyMileage();
  const maxMileage = Math.max(...weeklyMileage.map((week) => week.distance), 1);

  return (
    <div className="dashboard-container">
      {/* 側邊欄 */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">V</div>
          <div>
            <p className="brand-title">velosays</p>
            <p className="brand-subtitle">Adaptive marathon coach</p>
          </div>
        </div>

        {/* 💡 需求 1：左側欄按鈕，點擊後觸發 setActiveTab 切換頁面 */}
        <nav className="nav" aria-label="主選單">
          <button 
            className={`nav-item ${activeTab === 'today' ? 'active' : ''}`} 
            type="button" 
            onClick={() => setActiveTab('today')}
          >
            <span className="nav-icon">⌁</span>今日教練
          </button>
          <button 
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} 
            type="button" 
            onClick={() => setActiveTab('history')}
          >
            <span className="nav-icon">↗</span>歷史數據
          </button>
          <button 
            className={`nav-item ${activeTab === 'schedule' ? 'active' : ''}`} 
            type="button" 
            onClick={() => setActiveTab('schedule')}
          >
            <span className="nav-icon">◎</span>訓練課表
          </button>
          <button 
            className="nav-item" 
            type="button" 
            onClick={onOpenCoachChat} // 💡 需求 3：AI 對話直接呼叫開新視窗
          >
            <span className="nav-icon">✦</span>AI 對話 (新視窗)
          </button>
          <button 
            className={`nav-item ${activeTab === 'fitness' ? 'active' : ''}`} 
            type="button" 
            onClick={() => setActiveTab('fitness')}
          >
            <span className="nav-icon">◐</span>體能狀態
          </button>
          <button 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} 
            type="button" 
            onClick={() => setActiveTab('settings')}
          >
            <span className="nav-icon">⚙</span>個人設定
          </button>
        </nav>

        <div className="sidebar-footer">
          <strong>金澤馬拉松</strong>
          <span>2026/10/25 · 目標 Sub 4:00</span>
        </div>
      </aside>

      {/* 主畫面：依據 activeTab 動態更換渲染區塊 */}
      <main className="main">
        {activeTab !== 'today' ? (
          /* 💡 需求 1：當分頁切換到其他頁面時顯示的視窗內容 */
          <div className="flex flex-col items-center justify-center h-full text-center py-20 bg-[#0b0c10] rounded-2xl border border-slate-800/40">
            <div className="text-4xl mb-4 text-[#ff2a5f] animate-pulse">⚙</div>
            <h2 className="text-xl font-semibold text-slate-200 mb-2">「{
              activeTab === 'history' ? '歷史數據' : 
              activeTab === 'schedule' ? '訓練課表' : 
              activeTab === 'fitness' ? '體能狀態' : '個人設定'
            }」模組編譯中</h2>
            <p className="text-sm text-slate-400 max-w-sm">
              Sasha，此核心子分頁資料正在進行 Supabase 聯表最佳化。請先點選左側「今日教練」查看最新課表與即時配速策略！
            </p>
            <button className="btn primary mt-6" onClick={() => setActiveTab('today')}>返回今日教練控制台</button>
          </div>
        ) : (
          /* 今日教練主控台分頁原封不動保留 */
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">Today Coach Console</p>
                <h1>velosays</h1>
                <p className="topbar-copy">
                  AI 根據昨日訓練、睡眠、恢復狀態與金澤馬目標，自動調整今日訓練。重點不是把課表跑完，而是讓下一次關鍵課表跑得出來。
                </p>
              </div>

              <div className="top-actions">
                {/* 💡 需求 2：重新同步按鈕 */}
                <button className="btn secondary" onClick={onRefresh} disabled={refreshing}>
                  {refreshing ? '⚡ 數據清洗中...' : '↻ 重新同步'}
                </button>
                {/* 💡 需求 3：AI 跑步教練聊天 */}
                <button className="btn secondary" onClick={onOpenCoachChat}>
                  ✦ AI 跑步教練聊天 (新視窗)
                </button>
              </div>
            </header>

            <section className="dashboard-grid">
              <div className="column">
                <article className="card">
                  <div className="card-header">
                    <div>
                      <h2 className="card-title">體能狀態與昨日表現</h2>
                      <p className="card-subtitle">
                        最近一筆紀錄 · {latestActivity ? `${latestActivity.title || '跑步'} ${latestActivity.distance} km` : '暫無跑步數據'}
                      </p>
                    </div>
                    <span className="chip hot">恢復中等偏低</span>
                  </div>

                  <div className="card-body">
                    <div className="status-row">
                      <div className="metric">
                        <div className="metric-label">近 7 筆跑量</div>
                        <div className="metric-value">{totalDistance.toFixed(1)} <small>km</small></div>
                      </div>
                      <div className="metric">
                        <div className="metric-label">最近均心</div>
                        <div className="metric-value">{latestActivity?.avg_hr || '--'} <small>bpm</small></div>
                      </div>
                      <div className="metric">
                        <div className="metric-label">最近時間</div>
                        <div className="metric-value">{latestActivity ? formatDuration(latestActivity.duration) : '--'} <small>min</small></div>
                      </div>
                      <div className="metric">
                        <div className="metric-label">目標配速</div>
                        <div className="metric-value">5:41 <small>/km</small></div>
                      </div>
                    </div>

                    <div className="health">
                      <div className="readiness">
                        <div className="readiness-inner">
                          <span className="readiness-score">68</span>
                          <span className="readiness-label">Readiness</span>
                        </div>
                      </div>

                      <div className="coach-summary">
                        <div className="summary-line">
                          <span className="dot"></span>
                          <div>
                            <strong>昨日檢討</strong>
                            <span>最新配速為 {latestActivity?.pace || '--'}/km。若後段心率上揚偏快，代表疲勞正在累積。睡眠不足時，不建議今天再堆強度。</span>
                          </div>
                        </div>
                        <div className="summary-line">
                          <span className="dot"></span>
                          <div>
                            <strong>今日策略</strong>
                            <span>改為 40 分鐘恢復跑，配速 6:45-7:20/km，心率維持 Z1-Z2。若起跑 10 分鐘仍覺得沉，直接改快走。</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>

                <div className="split">
                  <article className="card">
                    <div className="card-header">
                      <div>
                        <h2 className="card-title">歷史數據</h2>
                        <p className="card-subtitle">近 4 週訓練負荷</p>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="bars">
                        {weeklyMileage.map((week) => (
                          <div className="bar-row" key={week.label}>
                            <span>{week.label}</span>
                            <div className="bar-track">
                              <div className="bar-fill" style={{ width: `${Math.round((week.distance / maxMileage) * 100)}%` }} />
                            </div>
                            <span>{week.distance.toFixed(0)} km</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>

                  <article className="card">
                    <div className="card-header">
                      <div>
                        <h2 className="card-title">最近紀錄</h2>
                        <p className="card-subtitle">即時同步自 Supabase 資料庫</p>
                      </div>
                    </div>
                    <div className="card-body" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                      <div className="list">
                        {activities.length === 0 && (
                          <div className="bubble ai">目前還沒有跑步紀錄。等 Garmin 連線同步寫入後即可更新。</div>
                        )}
                        {activities.map((act) => (
                          <div key={act.id} className="activity">
                            <div className="activity-date">{act.date ? act.date.slice(5) : '--'}</div>
                            <div>
                              <p className="activity-name">{act.title || '跑步訓練'}</p>
                              <span className="activity-meta">
                                {act.distance} km · {formatDuration(act.duration)} · Avg HR {act.avg_hr || '--'}
                              </span>
                            </div>
                            <div className="pace">{act.pace || '--'}/km</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>
                </div>
              </div>

              <aside className="column">
                <article className="card">
                  <div className="card-header">
                    <div>
                      <h2 className="card-title">今日訓練課表</h2>
                      <p className="card-subtitle">依恢復狀態自動調整</p>
                    </div>
                    <span className="chip">可調整</span>
                  </div>
                  <div className="card-body">
                    <div className="plan">
                      <div className="plan-main">
                        <h2>40 分鐘恢復跑</h2>
                        <p>前 10 分鐘觀察身體反應。若腿部沉重或心率異常偏高，改為 30 分鐘快走加伸展。</p>
                        <div className="chips">
                          <span className="chip hot">6:45-7:20/km</span>
                          <span className="chip">Z1-Z2</span>
                          <span className="chip">最大心率 60-72%</span>
                          <span className="chip">RPE 2-3</span>
                        </div>
                      </div>
                      <div className="coach-note">
                        <strong>教練提醒：</strong>今天不是考驗意志力，是考驗控制力。恢復跑跑太快，會偷走下一堂關鍵課表的品質。
                      </div>
                      <button className="btn primary" onClick={onStartTraining} disabled={refreshing}>
                        {refreshing ? '⚡ 正在配置課表...' : '▶ 開始今日訓練'}
                      </button>
                      <button className="btn secondary">調整課表</button>
                    </div>
                  </div>
                </article>

                <article className="card">
                  <div className="card-header">
                    <div>
                      <h2 className="card-title">AI 跑步教練</h2>
                      <p className="card-subtitle">根據目標賽事與最新數據回覆</p>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="chat-preview">
                      <div className="bubble ai">昨日訓練已經給到足夠刺激，今天建議降低強度。你現在需要的是吸收，而不是補課。</div>
                      <div className="bubble user">如果今天只能跑 30 分鐘呢？</div>
                      <div className="bubble ai">可以。30 分鐘 Z1-Z2 更適合目前狀態，結束後加 6 分鐘髖部活動度。</div>
                      {/* 💡 需求 3：小卡內的開啟聊天，一樣啟用新視窗 */}
                      <button className="btn secondary" onClick={onOpenCoachChat}>✦ 開啟教練聊天</button>
                    </div>
                  </div>
                </article>

                <article className="card">
                  <div className="card-header">
                    <div>
                      <h2 className="card-title">金澤馬拉松進度</h2>
                      <p className="card-subtitle">2026/10/25 · 目標賽事</p>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="status-row" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                      <div className="metric">
                        <div className="metric-label">高標</div>
                        <div className="metric-value">4:00 <small>內</small></div>
                      </div>
                      <div className="metric">
                        <div className="metric-label">低標</div>
                        <div className="metric-value">4:15 <small>內</small></div>
                      </div>
                    </div>
                  </div>
                </article>
              </aside>
            </section>
          </>
        )}
      </main>
    </div>
  );
};