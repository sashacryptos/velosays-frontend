import React from 'react';

// 💡 核心型別直接定義在這裡，並 export 給 App.tsx 引入
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
  // 計算週跑量（這裡先撈取最近 4 筆的總和作為動態週跑量示意）
  const totalDistance = activities.slice(0, 4).reduce((sum, act) => sum + Number(act.distance || 0), 0);
  
  // 取得最新一筆跑步紀錄作為英雄大卡片的動態呈現
  const latestActivity = activities[0];

  // 格式化時間（將總秒數轉為 分:秒）
  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="app" style={{
      display: 'grid',
      gridTemplateColumns: '248px minmax(0, 1fr)',
      minHeight: '100vh',
      color: 'var(--text)',
      background: 'radial-gradient(circle at 78% 0%, rgba(255, 95, 158, 0.12), transparent 32rem), linear-gradient(180deg, #0b0b0e 0%, #070709 36%, #050506 100%)'
    }}>
      
      {/* 左側 Sidebar 側邊欄 */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">R</div>
          <div>
            <p className="brand-title">RunForm AI</p>
            <p className="brand-subtitle">Adaptive marathon coach</p>
          </div>
        </div>

        <nav className="nav" aria-label="主選單">
          <div className="nav-item active"><span className="nav-icon">⌁</span>今日教練</div>
          <div className="nav-item"><span className="nav-icon">↗</span>歷史數據</div>
          <div className="nav-item"><span className="nav-icon">◎</span>訓練課表</div>
          <div className="nav-item"><span className="nav-icon">✦</span>AI 對話</div>
          <div className="nav-item"><span className="nav-icon">◐</span>體能狀態</div>
          <div className="nav-item"><span className="nav-icon">⚙</span>個人設定</div>
        </nav>

        <div className="sidebar-footer">
          <strong>金澤馬拉松</strong>
          <span>2026/10/25 · 目標 Sub 4:00</span>
        </div>
      </aside>

      {/* 右側主畫面區塊 */}
      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Today Coach Console</p>
            <h1>今天該跑，但要收著跑。</h1>
            <p className="topbar-copy">
              AI 根據昨日間歇、睡眠、恢復狀態與金澤馬目標，自動調整今日訓練。重點不是把課表跑完，而是讓下一次關鍵課表跑得出來。
            </p>
          </div>
          <div className="top-actions">
            <button className="btn secondary">✦ AI 跑步教練聊天</button>
            <button className="btn primary">▶ 開始訓練</button>
          </div>
        </header>

        <section className="grid">
          <div className="column">
            
            {/* 核心英雄大卡片：動態讀取 Supabase 的第一筆數據 */}
            <article className="card hero-card">
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
                    <div className="metric-label">週跑量</div>
                    <div className="metric-value">{totalDistance.toFixed(1)} <small>km</small></div>
                  </div>
                  <div className="metric">
                    <div className="metric-label">昨日均心</div>
                    <div className="metric-value">{latestActivity?.avg_hr || '--'} <small>bpm</small></div>
                  </div>
                  <div className="metric">
                    <div className="metric-label">昨日時間</div>
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
                        <span>最新配速為 {latestActivity?.pace || '--'}/km。後段心率上揚偏快，代表疲勞正在累積。睡眠不足時，不建議今天再堆強度。</span>
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

            {/* 下半部兩大欄：歷史數據與最近紀錄列表 */}
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
                    <div className="bar-row"><span>本週</span><div className="bar-track"><div className="bar-fill" style={{ width: '64%' }}></div></div><span>{totalDistance.toFixed(0)} km</span></div>
                    <div className="bar-row"><span>上週</span><div className="bar-track"><div className="bar-fill" style={{ width: '82%' }}></div></div><span>49 km</span></div>
                    <div className="bar-row"><span>2 週前</span><div className="bar-track"><div className="bar-fill" style={{ width: '72%' }}></div></div><span>43 km</span></div>
                    <div className="bar-row"><span>3 週前</span><div className="bar-track"><div className="bar-fill" style={{ width: '58%' }}></div></div><span>35 km</span></div>
                  </div>
                </div>
              </article>

              {/* 動態循環渲染：將 Supabase 裡面的所有跑步動態悉數畫出卡片 */}
              <article className="card">
                <div className="card-header">
                  <div>
                    <h2 className="card-title">最近紀錄</h2>
                    <p className="card-subtitle">即時同步自 Supabase 資料庫</p>
                  </div>
                </div>
                <div className="card-body" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  <div className="list">
                    {activities.map((act) => (
                      <div key={act.id} className="activity">
                        <div className="activity-date">{act.date.slice(5)}</div>
                        <div>
                          <p className="activity-name">{act.title || "今日跑步"}</p>
                          <span className="activity-meta">
                            {act.distance} km · {formatDuration(act.duration)} · Avg HR {act.avg_hr || '--'}
                          </span>
                        </div>
                        <div className="pace">{act.pace}/km</div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            </div>
          </div>

          {/* 右側側邊欄課表群 */}
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
                    </div>
                  </div>
                  <button className="btn primary">▶ 開始今日訓練</button>
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
                  <button className="btn secondary">✦ 開啟教練聊天</button>
                </div>
              </div>
            </article>
          </aside>
        </section>
      </main>
    </div>
  );
};