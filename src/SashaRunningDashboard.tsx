import React, { useState, useRef, useEffect } from 'react';

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
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const SashaRunningDashboard: React.FC<Props> = ({
  activities,
  onRefresh,
  refreshing = false,
  activeTab,
  setActiveTab,
}) => {
  const latestActivity = activities[0];

  // 💬 內建內建聊天室狀態
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Sasha 你好！我是你的 VeloSays AI 跑步教練。我已經讀取了你存在 Supabase 資料庫中的所有歷史跑量數據。今天備戰金澤馬拉松有什麼想聊聊的嗎？' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  // 🧠 發送訊息給 GAS Gemini 後端
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const userText = inputMessage;
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInputMessage('');
    setIsSending(true);

    try {
      const syncEndpoint = import.meta.env.VITE_SYNC_ENDPOINT;
      if (!syncEndpoint) {
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'ai', text: '⚠️ 本地環境未配置 VITE_SYNC_ENDPOINT 變數，無法連線至 Gemini 教練大腦。' }]);
          setIsSending(false);
        }, 1000);
        return;
      }

      // 將對話連同歷史紀錄上下文一起 POST 給 GAS 後端
      const response = await fetch(syncEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync_activities', 
          user_id: 'c8f7c70c-7fbd-416d-8dbc-e817bf827e84',
          chat_message: userText,    
          history_context: activities.slice(0, 10) 
        })
      });

      const resData = await response.json();
      
      let aiReply = "教練收到！建議今天維持 Z1-Z2 恢復跑心率，穩定吸收昨日的訓練刺激。";
      if (resData.status === "success" && resData.message) {
        aiReply = resData.message;
      }

      setMessages(prev => [...prev, { role: 'ai', text: aiReply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', text: '❌ 教練線路異常，請檢查 Google Apps Script 部署狀態。' }]);
    } finally {
      setIsSending(false);
    }
  };

  // 安全開啟聊天的處理函式，防止事件冒泡
  const openChatHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsChatOpen(true);
  };

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
      return { label: weekOffset === 0 ? '本週' : `${weekOffset} 週前`, distance };
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

        <nav className="nav" aria-label="主選單">
          <button className={`nav-item ${activeTab === 'today' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('today')}>
            <span className="nav-icon">⌁</span>今日教練
          </button>
          <button className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('history')}>
            <span className="nav-icon">↗</span>歷史數據
          </button>
          <button className={`nav-item ${activeTab === 'schedule' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('schedule')}>
            <span className="nav-icon">◎</span>訓練課表
          </button>
          <button className="nav-item" type="button" onClick={openChatHandler}>
            <span className="nav-icon">✦</span>AI 教練對話
          </button>
          <button className={`nav-item ${activeTab === 'fitness' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('fitness')}>
            <span className="nav-icon">◐</span>體能狀態
          </button>
          <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('settings')}>
            <span className="nav-icon">⚙</span>個人設定
          </button>
        </nav>

        <div className="sidebar-footer">
          <strong>金澤馬拉松</strong>
          <span>2026/10/25 · 目標 Sub 4:00</span>
        </div>
      </aside>

      {/* 主畫面 */}
      <main className="main">
        {activeTab !== 'today' ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20 bg-[#0b0c10] rounded-2xl border border-slate-800/40">
            <div className="text-4xl mb-4 text-[#ff2a5f] animate-pulse">⚙</div>
            <h2 className="text-xl font-semibold text-slate-200 mb-2">「{activeTab === 'history' ? '歷史數據' : activeTab === 'schedule' ? '訓練課表' : activeTab === 'fitness' ? '體能狀態' : '個人設定'}」編譯中</h2>
            <button className="btn primary mt-6" onClick={() => setActiveTab('today')}>返回今日教練控制台</button>
          </div>
        ) : (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">Today Coach Console</p>
                <h1>velosays</h1>
                <p className="topbar-copy">AI 根據昨日訓練、睡眠、恢復狀態與金澤馬目標，自動調整今日訓練。</p>
              </div>
              <div className="top-actions">
                <button className="btn secondary" onClick={onRefresh} disabled={refreshing}>
                  {refreshing ? '⚡ 數據清洗中...' : '↻ 重新同步'}
                </button>
                <button className="btn secondary" onClick={openChatHandler}>
                  ✦ 和教練討論
                </button>
              </div>
            </header>

            <section className="dashboard-grid">
              <div className="column">
                <article className="card">
                  <div className="card-header">
                    <div>
                      <h2 className="card-title">體能狀態與昨日表現</h2>
                      <p className="card-subtitle">最近一筆紀錄 · {latestActivity ? `${latestActivity.title || '跑步'} ${latestActivity.distance} km` : '暫無跑步數據'}</p>
                    </div>
                    <span className="chip hot">恢復中等偏低</span>
                  </div>
                  <div className="card-body">
                    <div className="status-row">
                      <div className="metric"><div className="metric-label">近 7 筆跑量</div><div className="metric-value">{totalDistance.toFixed(1)} <small>km</small></div></div>
                      <div className="metric"><div className="metric-label">最近均心</div><div className="metric-value">{latestActivity?.avg_hr || '--'} <small>bpm</small></div></div>
                      <div className="metric"><div className="metric-label">最近時間</div><div className="metric-value">{latestActivity ? formatDuration(latestActivity.duration) : '--'} <small>min</small></div></div>
                      <div className="metric"><div className="metric-label">目標配速</div><div className="metric-value">5:41 <small>/km</small></div></div>
                    </div>
                  </div>
                </article>

                <div className="split">
                  <article className="card">
                    <div className="card-header"><h2>歷史數據</h2></div>
                    <div className="card-body">
                      <div className="bars">
                        {weeklyMileage.map((week) => (
                          <div className="bar-row" key={week.label}>
                            <span>{week.label}</span>
                            <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round((week.distance / maxMileage) * 100)}%` }} /></div>
                            <span>{week.distance.toFixed(0)} km</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>

                  <article className="card">
                    <div className="card-header"><h2>最近紀錄</h2></div>
                    <div className="card-body" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                      <div className="list">
                        {activities.map((act) => (
                          <div key={act.id} className="activity">
                            <div className="activity-date">{act.date ? act.date.slice(5) : '--'}</div>
                            <div>
                              <p className="activity-name">{act.title || '跑步訓練'}</p>
                              <span className="activity-meta">{act.distance} km · {formatDuration(act.duration)} · Avg HR {act.avg_hr || '--'}</span>
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
                  <div className="card-header"><h2>今日訓練課表</h2></div>
                  <div className="card-body">
                    <div className="plan">
                      <h2>40 分鐘恢復跑</h2>
                      <div className="chips">
                        <span className="chip hot">6:45-7:20/km</span>
                        <span className="chip">Z1-Z2</span>
                      </div>
                      <button className="btn primary" onClick={openChatHandler}>▶ 和教練討論</button>
                    </div>
                  </div>
                </article>

                <article className="card">
                  <div className="card-header"><h2>AI 跑步教練</h2></div>
                  <div className="card-body">
                    <div className="chat-preview">
                      <div className="bubble ai">昨日訓練已經給到足夠刺激，今天建議降低強度。</div>
                      <button className="btn secondary" onClick={openChatHandler}>✦ 開啟教練內建對話</button>
                    </div>
                  </div>
                </article>
              </aside>
            </section>
          </>
        )}
      </main>

      {/* 🛠️ 內建嵌入式 Gemini 懸浮對話視窗組件 */}
      {isChatOpen && (
        <div className="embedded-chat-window">
          <div className="chat-header">
            <div className="chat-coach-profile">
              <span className="coach-avatar">✦</span>
              <div>
                <h3>velosays AI 教練</h3>
                <p>已同步 {activities.length} 筆 Supabase 歷史數據</p>
              </div>
            </div>
            <button className="close-chat-btn" type="button" onClick={() => setIsChatOpen(false)}>✕</button>
          </div>

          <div className="chat-body-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-bubble-row ${msg.role}`}>
                <div className="bubble-text">{msg.text}</div>
              </div>
            ))}
            {isSending && (
              <div className="chat-bubble-row ai">
                <div className="bubble-text loading-pulse">Gemini 教練正在精算指標中...</div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form className="chat-input-footer" onSubmit={handleSendMessage}>
            <input 
              type="text" 
              placeholder="Ask Gemini... (例如：如果今天只能跑30分鐘呢？)" 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isSending}
            />
            <button type="submit" disabled={isSending || !inputMessage.trim()}>➔</button>
          </form>
        </div>
      )}
    </div>
  );
};