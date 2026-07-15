import { useEffect, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { HistoryList } from './components/HistoryList';
import { RunDetail } from './components/RunDetail';
import { Coach } from './components/Coach';
import { FitnessStatus } from './components/FitnessStatus';
import { BottomNav } from './components/BottomNav';
import {
  fetchActivities,
  fetchLatestMetrics,
  askCoach,
  toRunSummary,
  toRunDetail,
  weeklyKmFromRows,
  monthlyKm,
  monthlyRunCount,
  weeklyLoadFromRows,
  type ActivityRow,
  type DailyMetricsRow,
} from './api/activities';
import type { NavTab, FitnessMetrics } from './types';

const USER_ID = 'c8f7c70c-7fbd-416d-8dbc-e817bf827e84';
const WEEKLY_GOAL_KM = 40;

interface ChatMessage {
  from: 'coach' | 'user';
  text: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  { from: 'coach', text: '早安！我是你的 AI 跑步教練，已經讀取了你的 Garmin 訓練數據。今天想聊什麼？' },
];

function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [asking, setAsking] = useState(false);
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetricsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchActivities(USER_ID), fetchLatestMetrics(USER_ID)])
      .then(([activityRows, metricsRow]) => {
        setRows(activityRows);
        setDailyMetrics(metricsRow);
      })
      .catch((error) => {
        console.error('撈取跑步紀錄失敗:', error);
        const message =
          error && typeof error === 'object' && 'message' in error
            ? String((error as { message: unknown }).message)
            : String(error);
        setLoadError(message);
      })
      .finally(() => setLoading(false));
  }, []);

  // Garmin 資料由 GitHub Actions 排程每日自動同步（見 scripts/sync_garmin.py），
  // 這裡不再觸發舊的 GAS/Strava 同步路徑（Strava app 已停用，會回 403）。
  // 這個按鈕改為單純重新從 Supabase 抓最新資料。
  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncMessage(null);
    try {
      const [data, metricsRow] = await Promise.all([fetchActivities(USER_ID), fetchLatestMetrics(USER_ID)]);
      setRows(data);
      setDailyMetrics(metricsRow);
      setSyncMessage('已更新最新資料');
    } catch (error) {
      console.error('重新整理失敗:', error);
      setSyncMessage(`重新整理失敗：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleAsk = async (question: string) => {
    if (asking) return;
    setMessages((prev) => [...prev, { from: 'user', text: question }]);
    setAsking(true);
    try {
      const reply = await askCoach(USER_ID, question, rows);
      setMessages((prev) => [...prev, { from: 'coach', text: reply }]);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      setMessages((prev) => [
        ...prev,
        { from: 'coach', text: `目前連不上教練後端（${detail}），請稍後再試。` },
      ]);
    } finally {
      setAsking(false);
    }
  };

  const handleTabChange = (tab: NavTab) => {
    setSelectedRunId(null);
    setActiveTab(tab);
  };

  const handleSelectRun = (id: string) => {
    setActiveTab('history');
    setSelectedRunId(id);
  };

  const runs = rows.map(toRunSummary);
  const weeklyLoad = weeklyLoadFromRows(rows);

  const fitnessMetrics: FitnessMetrics = {
    vo2max: dailyMetrics?.vo2max ?? undefined,
    restingHeartRate: dailyMetrics?.resting_hr ?? undefined,
    sleepScore: dailyMetrics?.sleep_score ?? undefined,
    trainingLoad: weeklyLoad.reduce((a, b) => a + b, 0),
    weeklyLoad,
  };

  let screen;
  if (loading) {
    screen = (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-[#9AA3B0] animate-pulse">正在載入最新跑步紀錄...</p>
      </div>
    );
  } else if (selectedRunId && rows.some((r) => r.id === selectedRunId)) {
    const row = rows.find((r) => r.id === selectedRunId)!;
    screen = <RunDetail run={toRunDetail(row)} onBack={() => setSelectedRunId(null)} />;
  } else {
    switch (activeTab) {
      case 'dashboard':
        screen = (
          <Dashboard
            runs={runs}
            weeklyKm={weeklyKmFromRows(rows)}
            weeklyGoalKm={WEEKLY_GOAL_KM}
            vo2max={dailyMetrics?.vo2max ?? undefined}
            onTabChange={handleTabChange}
            onSelectRun={handleSelectRun}
            onSync={handleSync}
            syncing={syncing}
            loadError={loadError}
            syncMessage={syncMessage}
          />
        );
        break;
      case 'history':
        screen = (
          <HistoryList
            runs={runs}
            monthlyKm={Math.round(monthlyKm(rows) * 10) / 10}
            monthlyCount={monthlyRunCount(rows)}
            totalCount={rows.length}
            onSelectRun={handleSelectRun}
            onBack={() => handleTabChange('dashboard')}
          />
        );
        break;
      case 'coach':
        screen = <Coach messages={messages} onAsk={handleAsk} sending={asking} />;
        break;
      case 'fitness':
        screen = <FitnessStatus metrics={fitnessMetrics} />;
        break;
      case 'settings':
        screen = (
          <div className="flex-1 overflow-y-auto px-5 pt-14 pb-[108px]">
            <div className="bg-white rounded-3xl px-[18px] py-4">
              <h2 className="m-0 text-lg font-medium text-[#1C2430]">設定</h2>
              <p className="mt-0.5 mb-0 text-xs text-[#9AA3B0]">此頁面尚未實作</p>
            </div>
          </div>
        );
        break;
    }
  }

  return (
    <div
      className="w-full max-w-[430px] mx-auto h-dvh overflow-hidden flex flex-col relative"
      style={{
        background: 'linear-gradient(170deg, #E8F1FF 0%, #F7F9FF 45%, #FFF0E2 100%)',
        boxShadow: '0 0 60px rgba(28,36,48,0.10)',
      }}
    >
      {screen}
      <BottomNav active={selectedRunId ? 'history' : activeTab} onChange={handleTabChange} />
    </div>
  );
}

export default App;
