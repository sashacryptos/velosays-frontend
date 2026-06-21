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
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const SashaRunningDashboard: React.FC<Props> = ({
  activities,
  onRefresh,
  refreshing = false,
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
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">R</div>
          <div>
            <p className="brand-title">RunForm AI</p>
            <p className="brand-subtitle">Adaptive marathon coach</p>
          </div>
        </div>

        <nav className="nav" aria-label="主選單">
          <div className="nav-item active">
            <span className="nav-icon">⌁</span>
            今日教練
          </div>
          <div className="nav-item">
            <span className="nav-icon">↗</span>
            歷史數據
          </div>
          <div className="nav-item">
            <span className="nav-icon">◎</span>
            訓練課表
          </div>
          <div className="nav-item">
            <span className="nav-icon">✦</span>
            AI 對話
          </div>
          <div className="nav-item">
            <span className="nav-icon">◐</span>
            體能狀態
          </div>
          <div className="nav-item">
            <span className="nav-icon">⚙</span>
            個人設定
          </div>
        </nav>

        <div className="sidebar-footer">
          <strong>金澤馬拉松</strong>
          <span>2026/10/25 · 目標 Sub 4:00，低標 4:15</span>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Today Coach Console</p>
            <h1>今天該跑，但要收著跑。</h1>
            <p className="topbar-copy">
              AI 根據昨日訓練、睡眠、恢復狀態與金澤馬目標，自動調整今日訓練。重點不是把課表跑完，而是讓下一次關鍵課表跑得出來。
            </p>
          </div>

          <div className="top-actions">
            <button
              className="btn secondary"
              onClick={onRefresh}
              disabled={refreshing}
            >
              {refreshing ? '同步中...' : '↻ 重新同步'}
            </button>

            <button className="btn secondary">
              ✦ AI 跑步教練聊天
            </button>

            <button className="btn primary">
              ▶ 開始訓練
            </button>
          </div>
        </header>

        <section className="dashboard-grid">
          <div className="column">
            <article className="card hero-card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">體能狀態與昨日表現</h2>
                  <p className="card-subtitle">
                    最近一筆紀錄 ·{' '}
                    {latestActivity
                      ? `${latestActivity.title || '跑步'} ${latestActivity.distance} km`
                      : '暫無跑步數據'}
                  </p>
                </div>
                <span className="chip hot">恢復中等偏低</span>
              </div>

              <div className="card-body">
                <div className="status-row">
                  <div className="metric">
                    <div className="metric-label">近 7 筆跑量</div>
                    <div className="metric-value">
                      {totalDistance.toFixed(1)} <small>km</small>
                    </div>
                  </div>

                  <div className="metric">
                    <div className="metric-label">最近均心</div>
                    <div className="metric-value">
                      {latestActivity?.avg_hr || '--'} <small>bpm</small>
                    </div>
                  </div>

                  <div className="metric">
                    <div className="metric-label">最近時間</div>
                    <div className="metric-value">
                      {latestActivity ? formatDuration(latestActivity.duration) : '--'}{' '}
                      <small>min</small>
                    </div>
                  </div>

                  <div className="metric">
                    <div className="metric-label">目標配速</div>
                    <div className="metric-value">
                      5:41 <small>/km</small>
                    </div>
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
                        <span>
                          最新配速為 {latestActivity?.pace || '--'}/km。
                          若後段心率上揚偏快，代表疲勞正在累積。睡眠不足時，不建議今天再堆強度。
                        </span>
                      </div>
                    </div>

                    <div className="summary-line">
                      <span className="dot"></span>
                      <div>
                        <strong>今日策略</strong>
                        <span>
                          改為 40 分鐘恢復跑，配速 6:45-7:20/km，心率維持 Z1-Z2。
                          若起跑 10 分鐘仍覺得沉，直接改快走。
                        </span>
                      </div>
                    </div>

                    <div className="summary-line">
                      <span className="dot"></span>
                      <div>
                        <strong>滾動調整</strong>
                        <span>
                          每次資料更新後，AI 會重新對齊近期訓練負荷與金澤馬目標，調整今日課表與教練提醒。
                        </span>
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
                          <div
                            className="bar-fill"
                            style={{
                              width: `${Math.round((week.distance / maxMileage) * 100)}%`,
                            }}
                          />
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
                      <div className="bubble ai">
                        目前還沒有跑步紀錄。等 Strava / GAS 寫入 Supabase 後，按重新同步即可更新。
                      </div>
                    )}

                    {activities.map((act) => (
                      <div key={act.id} className="activity">
                        <div className="activity-date">
                          {act.date ? act.date.slice(5) : '--'}
                        </div>
                        <div>
                          <p className="activity-name">{act.title || '跑步訓練'}</p>
                          <span className="activity-meta">
                            {act.distance} km · {formatDuration(act.duration)} · Avg HR{' '}
                            {act.avg_hr || '--'}
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
                    <p>
                      前 10 分鐘觀察身體反應。若腿部沉重或心率異常偏高，改為 30 分鐘快走加伸展。
                    </p>
                    <div className="chips">
                      <span className="chip hot">6:45-7:20/km</span>
                      <span className="chip">Z1-Z2</span>
                      <span className="chip">最大心率 60-72%</span>
                      <span className="chip">RPE 2-3</span>
                    </div>
                  </div>

                  <div className="coach-note">
                    <strong>教練提醒：</strong>
                    今天不是考驗意志力，是考驗控制力。恢復跑跑太快，會偷走下一堂關鍵課表的品質。
                  </div>

                  <button className="btn primary">
                    ▶ 開始今日訓練
                  </button>

                  <button className="btn secondary">
                    調整課表
                  </button>
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
                  <div className="bubble ai">
                    昨日訓練已經給到足夠刺激，今天建議降低強度。你現在需要的是吸收，而不是補課。
                  </div>
                  <div className="bubble user">
                    如果今天只能跑 30 分鐘呢？
                  </div>
                  <div className="bubble ai">
                    可以。30 分鐘 Z1-Z2 更適合目前狀態，結束後加 6 分鐘髖部活動度。
                  </div>
                  <button className="btn secondary">
                    ✦ 開啟教練聊天
                  </button>
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
                    <div className="metric-value">
                      4:00 <small>內</small>
                    </div>
                  </div>

                  <div className="metric">
                    <div className="metric-label">低標</div>
                    <div className="metric-value">
                      4:15 <small>內</small>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </aside>
        </section>
      </main>
    </div>
  );
};