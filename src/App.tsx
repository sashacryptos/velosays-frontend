import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { SashaRunningDashboard } from './SashaRunningDashboard';
import type { Activity } from './SashaRunningDashboard';

const USER_ID = 'c8f7c70c-7fbd-416d-8dbc-e817bf827e84';

function App() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // 💡 需求 1：新增 activeTab 狀態，預設在 'today' (今日教練)
  const [activeTab, setActiveTab] = useState<string>('today');

  // 1. 撈取 Supabase 資料庫中的跑步歷史數據
  const fetchRunningData = useCallback(async () => {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', USER_ID)
      .order('date', { ascending: false });

    if (!error && data) {
      setActivities(data);
    } else {
      console.error('撈取資料失敗:', error);
    }
    setLoading(false);
  }, []);

  // 💡 需求 2：點擊「↻ 重新同步」，呼叫 GAS 一條龍更新，隨後強制 Reload 洗淨畫面
  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);

    try {
      const syncEndpoint = import.meta.env.VITE_SYNC_ENDPOINT;

      if (!syncEndpoint) {
        console.warn('⚠️ 未設定 VITE_SYNC_ENDPOINT 環境變數，跳過後端同步。');
      } else {
        await fetch(syncEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'sync_activities',
            user_id: USER_ID,
          }),
          signal: AbortSignal.timeout(30000) // 30秒安全斷路
        });
      }

      await fetchRunningData();
      // 🚀 強制重新整理頁面，確保活數據全面更新
      window.location.reload();
    } catch (error) {
      console.error('重新同步失敗:', error);
      alert('同步請求失敗，請檢查網路連線或 GAS 狀態。');
      setRefreshing(false);
    }
  }, [refreshing, fetchRunningData]);

  // 💡 需求 3：點擊 AI 教練打開全新精緻小視窗，直通 Google AI Studio/Gemini 核心
  const handleOpenCoachChat = useCallback(() => {
    // 你可以將此網址替換成你的 Gemini 聊天 Web App 網址，或是客製化對話組件
    const chatUrl = `https://aistudio.google.com/`; 
    const windowFeatures = "width=450,height=700,resizable=yes,scrollbars=yes,status=yes";
    
    // 以優雅的側邊獨立小視窗(Pop-up)形式打開，不干擾主儀表板
    window.open(chatUrl, "GeminiCoachChat", windowFeatures);
  }, []);

  // 4. 開始今日訓練
  const handleStartTraining = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const syncEndpoint = import.meta.env.VITE_SYNC_ENDPOINT;
      if (syncEndpoint) {
        await fetch(syncEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start_training', user_id: USER_ID }),
          signal: AbortSignal.timeout(30000)
        });
      }
      alert('✅ 訓練已開始！Gemini 課表與追蹤已啟動。');
      await fetchRunningData();
      window.location.reload();
    } catch (error) {
      console.error(error);
      setRefreshing(false);
    }
  }, [refreshing, fetchRunningData]);

  useEffect(() => {
    fetchRunningData();
  }, [fetchRunningData]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#070709]">
        <p className="text-slate-400 font-medium animate-pulse text-sm tracking-wide">
          正在為 Sasha 載入最新跑步紀錄...
        </p>
      </div>
    );
  }

  return (
    <SashaRunningDashboard
      activities={activities}
      onRefresh={handleRefresh}
      refreshing={refreshing}
      onOpenCoachChat={handleOpenCoachChat}
      onStartTraining={handleStartTraining}
      activeTab={activeTab}         // 💡 傳遞當前分頁
      setActiveTab={setActiveTab}   // 💡 傳遞切換分頁控制
    />
  );
}

export default App;