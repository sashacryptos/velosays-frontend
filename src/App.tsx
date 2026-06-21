import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { SashaRunningDashboard, Activity } from './SashaRunningDashboard';

function App() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRunningData() {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', 'c8f7c70c-7fbd-416d-8dbc-e817bf827e84')
        .order('date', { ascending: false });

      if (!error && data) {
        setActivities(data);
      } else {
        console.error("撈取資料失敗:", error);
      }
      setLoading(false);
    }

    fetchRunningData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-medium animate-pulse">正在為 Sasha 載入最新跑步紀錄...</p>
      </div>
    );
  }

  return <SashaRunningDashboard activities={activities} />;
}

export default App; // 👈 兇手就是這行！確保這行有在最底下