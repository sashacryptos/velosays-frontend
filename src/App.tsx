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
  syncActivities,
  askCoach,
  toRunSummary,
  toRunDetail,
  toWeeklyProgress,
  monthlyKm,
  overallAvgPace,
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

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncMessage(null);
    try {
      const result = await syncActivities(USER_ID);
      if (result.status === 'error') {
        setSyncMessage(`同步失敗：${result.error ?? '未知錯誤'}`);
      } else {
        const data = await fetchActivities(USER_ID);
        setRows(data);
        setSyncMessage(result.message ?? '同步完成');
      }
    } catch (error) {
      console.error('同步失敗:', error);
      setSyncMessage(`同步失敗：${error instanceof Error ? error.message : String(error)}`);
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

  const runs = rows.map(toRunSummary);
  const weeklyLoad = weeklyLoadFromRows(rows);

  const fitnessMetrics: FitnessMetrics = {
    vo2max: dailyMetrics?.vo2max ?? undefined,
    restingHeartRate: dailyMetrics?.resting_hr ?? undefined,
    sleepScore: dailyMetrics?.sleep_score ?? undefined,
    trainingLoad: weeklyLoad.reduce((a, b) => a + b, 0),
    weeklyLoad,
  };

  const errorBanner = (
    <>
      {loadError && (
        <div className="w-full max-w-md md:max-w-lg mx-auto mb-2 bg-red-50 text-red-700 text-xs rounded-lg px-3 py-2">
          無法連線資料庫，目前顯示空資料：{loadError}
        </div>
      )}
      {syncMessage && (
        <div
          className={`w-full max-w-md md:max-w-lg mx-auto mb-2 text-xs rounded-lg px-3 py-2 ${
            syncMessage.startsWith('同步失敗') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}
        >
          {syncMessage}
        </div>
      )}
    </>
  );

  let screen;
  if (loading) {
    screen = (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-sm text-gray-400 animate-pulse">正在載入最新跑步紀錄...</p>
      </div>
    );
  } else if (selectedRunId && rows.some((r) => r.id === selectedRunId)) {
    const row = rows.find((r) => r.id === selectedRunId)!;
    screen = (
      <RunDetail
        activeTab={activeTab}
        onTabChange={(tab) => {
          setSelectedRunId(null);
          setActiveTab(tab);
        }}
        run={toRunDetail(row)}
        onBack={() => setSelectedRunId(null)}
      />
    );
  } else {
    switch (activeTab) {
      case 'dashboard':
        screen = (
          <>
            {errorBanner}
            <Dashboard
              activeTab={activeTab}
              onTabChange={setActiveTab}
              weekly={toWeeklyProgress(rows)}
              weeklyGoalKm={WEEKLY_GOAL_KM}
              latestRun={runs[0]}
              vo2max={dailyMetrics?.vo2max ?? undefined}
              onViewPlan={() => setActiveTab('coach')}
              onSync={handleSync}
              syncing={syncing}
            />
          </>
        );
        break;
      case 'history':
        screen = (
          <>
            {errorBanner}
            <HistoryList
              activeTab={activeTab}
              onTabChange={setActiveTab}
              runs={runs}
              monthlyKm={Math.round(monthlyKm(rows) * 10) / 10}
              avgPace={overallAvgPace(rows)}
              onSelectRun={setSelectedRunId}
              onBack={() => setActiveTab('dashboard')}
            />
          </>
        );
        break;
      case 'coach':
        screen = (
          <Coach
            activeTab={activeTab}
            onTabChange={setActiveTab}
            messages={messages}
            onAsk={handleAsk}
            sending={asking}
          />
        );
        break;
      case 'fitness':
        screen = (
          <FitnessStatus
            activeTab={activeTab}
            onTabChange={setActiveTab}
            metrics={fitnessMetrics}
          />
        );
        break;
      case 'settings':
        screen = (
          <div className="w-full max-w-md md:max-w-lg mx-auto bg-white rounded-2xl shadow-sm p-3 sm:p-4 flex flex-col gap-2.5">
            <div className="px-1.5 pt-1 pb-0.5">
              <h2 className="text-lg font-medium">設定</h2>
              <p className="text-xs text-gray-400 mt-0.5">此頁面尚未實作</p>
            </div>
            <BottomNav active={activeTab} onChange={setActiveTab} />
          </div>
        );
        break;
    }
  }

  return <div className="min-h-screen bg-gray-100 px-3 py-4 sm:py-8">{screen}</div>;
}

export default App;
