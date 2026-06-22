import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { SashaRunningDashboard } from './SashaRunningDashboard';
import type { Activity } from './SashaRunningDashboard';

const USER_ID = 'c8f7c70c-7fbd-416d-8dbc-e817bf827e84';

function App() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('today');

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

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);

    try {
      const syncEndpoint = import.meta.env.VITE_SYNC_ENDPOINT;

      if (syncEndpoint) {
        await fetch(syncEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'sync_activities',
            user_id: USER_ID,
          }),
          signal: AbortSignal.timeout(30000)
        });
      }

      await fetchRunningData();
      window.location.reload();
    } catch (error) {
      console.error('重新同步失敗:', error);
      alert('同步請求失敗。');
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

// ... 前面的程式碼不變 ...

  return (
    <SashaRunningDashboard
      activities={activities}
      onRefresh={handleRefresh}
      refreshing={refreshing}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  );
} // 

export default App;