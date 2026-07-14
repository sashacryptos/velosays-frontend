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

  // 📱 行動版側邊欄開關與聊天室狀態
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Sasha 你好！我是你的 VeloSays AI 跑步教練。今天備戰金澤馬拉松有什麼想聊聊的嗎？' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  // 🧠 發送訊息給 GAS 後端
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const userText = inputMessage;
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInputMessage('');
    setIsSending(true);

    try {
      const syncEndpoint = "https://script.google.com/macros/s/AKfycbz-wLhGygelhCBg44bfylb9AR3TmFwUXJ6H2U1pKQ2soONw3YYZQvjKbHh4r1T9LuDw/exec"; 

      const response = await fetch(syncEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'strava_chat',       
          user_id: 'c8f7c70c-7fbd-416d-8dbc-e817bf827e84',
          chat_message: userText,    
          history_context: activities.slice(0, 10).map(act => ({
            title: act.title,
            distance: act.distance,
            pace: act.pace,
            duration: act.duration,
            date: act.date,
            avg_hr: act.avg_hr,
            source: 'Strava'          
          }))
        })
      });

      const resData = await response.json();
      let aiReply = "教練收到！看過你的 Strava 數據，建議今天維持 Z1-Z2 恢復跑，穩定吸收昨日的刺激。";
      if (resData.status === "success" && resData.message) {
        aiReply = resData.message;
      }

      setMessages(prev => [...prev, { role: 'ai', text: aiReply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', text: '❌ 連線異常，請確保網路暢通或稍後再試。' }]);
    } finally {
      setIsSending(false);
    }
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
      return { label: weekOffset === 0 ? '本週跑量' : `${weekOffset} 週前跑量`, distance };
    });
  };

  const weeklyMileage = getWeeklyMileage();
  const maxMileage = Math.max(...weeklyMileage.map((week) => week.distance), 1);

  // 導覽切換包裹器（點擊後在手機版自動收起選單）
  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={`dashboard-container ${isMobileMenuOpen ? 'menu-open' : ''}`}>
      
      {/* 📱 行動版頂部 Top Navbar */}
      <div className="mobile-top-bar">
        <div className="mobile-brand">
          <div className="brand-mark">V</div>
          <span className="brand-title">VeloSays</span>
        </div>
        <button 
          className="hamburger-btn" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="選單"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* 側邊欄 (支援 RWD 抽屜式彈出) */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">V</div>
          <div>
            <p className="brand-title">VeloSays</p>
            <p className="brand-subtitle">Adaptive marathon coach</p>
          </div>
        </div>

        <nav className="nav" aria-label="主選單">
          <button className={`nav-item ${activeTab === 'today' ? 'active' : ''}`} type="button" onClick={() => handleNavClick('today')}>
            <span className="nav-icon">⌁</span>今日看板
          </button>
          <button className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} type="button" onClick={() => handleNavClick('history')}>
            <span className="nav-icon">↗</span>歷史數據
          </button>
          <button className={`nav-item ${activeTab === 'ai-coach' ? 'active' : ''}`} type="button" onClick={() => { handleNavClick('today'); setIsChatOpen(true); }}>
            <span className="nav-icon">✦</span>AI 教練對話
          </button>
          <button className={`nav-item ${activeTab === 'fitness' ? 'active' : ''}`} type="button" onClick={() => handleNavClick('fitness')}>
            <span className="nav-icon">◐</span>體能狀態
          </button>
          <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} type="button" onClick={() => handleNavClick('settings')}>
            <span className="nav-icon">⚙</span>個人設定
          </button>
        </nav>

        <div className="sidebar-footer">
          <strong>金澤馬拉松</strong>
          <span>2026/10/25 · 目標 Sub 4:00</span>
        </div>
      </aside>

      {/* 遮罩層 (手機版選單打開時點擊空白處關閉) */}
      {isMobileMenuOpen && <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />}

      {/* 主畫面 */}
      <main className="main">
        {/* 1️⃣ 今日看板分頁 */}
        {activeTab === 'today' && (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">Today Coach Console</p>
                <h1>VeloSays</h1>
                <p className="topbar-copy">AI 根據昨日訓練、睡眠、恢復狀態與金澤馬目標，自動調整今日訓練。</p>
              </div>
              <div className="top-actions">
                <button className="btn secondary" onClick={onRefresh} disabled={refreshing}>
                  {refreshing ? '⚡ 數據清洗中...' : '↻ 重新同步'}
                </button>
              </div>
            </header>

            <section className="dashboard-grid single-col">
              <article className="card hero-card">
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

              <article className="card">
                <div className="card-header"><h2>AI 跑步教練今日建議</h2></div>
                <div className="card-body">
                  <div className="chat-preview">
                    <div className="bubble ai" style={{ maxWidth: '100%' }}>
                      昨日訓練已經給到足夠刺激，今天建議降低強度。推薦進行 40 分鐘恢復跑 (配速 6:45-7:20/km，心率維持在 Z1-Z2 區間)。
                    </div>
                  </div>
                </div>
              </article>
            </section>
          </>
        )}

        {/* 2️⃣ 歷史數據分頁 (原下層數據全面卡片化搬移至此) */}
        {activeTab === 'history' && (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">Data Analytics</p>
                <h1>歷史數據控制台</h1>
                <p className="topbar-copy">檢視你備戰金澤馬拉松的跑量累積與每週吸收狀況。</p>
              </div>
            </header>

            <section className="dashboard-grid">
              {/* 每週跑量分析卡片 */}
              <article className="card">
                <div className="card-header"><h2>每週跑量趨勢</h2></div>
                <div className="card-body">
                  <div className="bars">
                    {weeklyMileage.map((week) => (
                      <div className="bar-row" key={week.label}>
                        <span style={{ minWidth: '70px' }}>{week.label}</span>
                        <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round((week.distance / maxMileage) * 100)}%` }} /></div>
                        <span style={{ textAlign: 'right', minWidth: '45px' }}>{week.distance.toFixed(0)} km</span>
                      </div>
                    ))}
                  </div>
                </div>
              </article>

              {/* 歷史清單：全新響應式格狀卡片呈現 */}
              <div className="history-cards-container">
                <h2 className="section-title-embedded">所有訓練紀錄 ({activities.length} 筆)</h2>
                <div className="history-grid">
                  {activities.map((act) => (
                    <article key={act.id} className="history-data-card">
                      <div className="history-card-top">
                        <span className="history-card-date">{act.date ? act.date.slice(0, 10) : '--'}</span>
                        <span className="history-card-pace">{act.pace || '--'}/km</span>
                      </div>
                      <h3 className="history-card-title">{act.title || '跑步訓練'}</h3>
                      <div className="history-card-metrics">
                        <div className="h-metric"><span>距離</span><strong>{act.distance} km</strong></div>
                        <div className="h-metric"><span>時間</span><strong>{formatDuration(act.duration)}</strong></div>
                        <div className="h-metric"><span>均心</span><strong>{act.avg_hr || '--'} bpm</strong></div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {/* 3️⃣ 其他編譯中分頁 */}
        {activeTab !== 'today' && activeTab !== 'history' && (
          <div className="flex flex-col items-center justify-center h-full text-center py-20 bg-[#0b0c10] rounded-2xl border border-slate-800/40">
            <div className="text-4xl mb-4 text-[#ff2a5f] animate-pulse">⚙</div>
            <h2 className="text-xl font-semibold text-slate-200 mb-2">
              「{activeTab === 'fitness' ? '體能狀態' : '個人設定'}」編譯中
            </h2>
            <button className="btn primary mt-6" onClick={() => setActiveTab('today')}>返回今日看板</button>
          </div>
        )
        }
      </main >

      {/* 🪐 內建嵌入式 Gemini 懸浮對話視窗 */}
      {
        isChatOpen && (
          <div className="embedded-chat-window">
            <div className="chat-header">
              <div className="chat-coach-profile">
                <span className="coach-avatar">✦</span>
                <div>
                  <h3>VeloSays AI 教練</h3>
                  <p>已同步 {activities.length} 筆 Strava 歷史數據</p>
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
                placeholder="Ask Gemini... (例如：這週跑量吸收得好嗎？)" 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isSending}
              />
              <button type="submit" disabled={isSending || !inputMessage.trim()}>➔</button>
            </form>
          </div>
        )
      }
    </div >
  );
};