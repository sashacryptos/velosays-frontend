import { useEffect, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { HistoryList } from './components/HistoryList';
import { RunDetail } from './components/RunDetail';
import { Coach } from './components/Coach';
import { FitnessStatus } from './components/FitnessStatus';
import { BottomNav } from './components/BottomNav';
import {
  fetchActivities,
  syncActivities,
  toRunSummary,
  toRunDetail,
  toWeeklyProgress,
  monthlyKm,
  overallAvgPace,
  weeklyLoadFromRows,
  type ActivityRow,
} from './api/activities';
import type { NavTab, FitnessMetrics } from './types';

const USER_ID = 'c8f7c70c-7fbd-416d-8dbc-e817bf827e84';
const WEEKLY_GOAL_KM = 40;

interface ChatMessage {
  from: 'coach' | 'user';
  text: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  { from: 'coach', text: '早安！根據你最近的訓練負荷，今天建議安排一次輕鬆跑或休息。有什麼想問我的嗎？' },
];

function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities(USER_ID)
      .then((data) => setRows(data))
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

  const handleAsk = (question: string) => {
    setMessages((prev) => [
      ...prev,
      { from: 'user', text: question },
      { from: 'coach', text: '這部分我先幫你記錄下來，之後會根據你的 Garmin 數據提供更完整的分析。' },
    ]);
  };

  if (loading) {
    return (
      <div className="max-w-sm mx-auto flex h-screen items-center justify-center">
        <p className="text-sm text-gray-400 animate-pulse">正在載入最新跑步紀錄...</p>
      </div>
    );
  }

  const runs = rows.map(toRunSummary);

  // vo2max / 安靜心率 / 睡眠分數等 Garmin 體能指標資料庫尚未同步，先以固定值顯示
  const fitnessMetrics: FitnessMetrics = {
    vo2max: 52,
    vo2maxTrend: 1,
    trainingLoad: Math.min(weeklyLoadFromRows(rows).reduce((a, b) => a + b, 0), 999),
    restingHeartRate: 48,
    sleepScore: 82,
    recoveryHours: 18,
    weeklyLoad: weeklyLoadFromRows(rows),
  };

  const errorBanner = (
    <>
      {loadError && (
        <div className="max-w-sm mx-auto mb-2 bg-red-50 text-red-700 text-xs rounded-lg px-3 py-2">
          無法連線資料庫，目前顯示空資料：{loadError}
        </div>
      )}
      {syncMessage && (
        <div
          className={`max-w-sm mx-auto mb-2 text-xs rounded-lg px-3 py-2 ${
            syncMessage.startsWith('同步失敗') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}
        >
          {syncMessage}
        </div>
      )}
    </>
  );

  if (selectedRunId) {
    const row = rows.find((r) => r.id === selectedRunId);
    if (row) {
      return (
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
    }
  }

  switch (activeTab) {
    case 'dashboard':
      return (
        <>
          {errorBanner}
          <Dashboard
            activeTab={activeTab}
            onTabChange={setActiveTab}
            weekly={toWeeklyProgress(rows)}
            weeklyGoalKm={WEEKLY_GOAL_KM}
            latestRun={runs[0]}
            onViewPlan={() => setActiveTab('coach')}
            onSync={handleSync}
            syncing={syncing}
          />
        </>
      );
    case 'history':
      return (
        <>
          {errorBanner}
          <HistoryList
            activeTab={activeTab}
            onTabChange={setActiveTab}
            runs={runs}
            monthlyKm={Math.round(monthlyKm(rows) * 10) / 10}
            avgPace={overallAvgPace(rows)}
            onSelectRun={setSelectedRunId}
          />
        </>
      );
    case 'coach':
      return (
        <Coach
          activeTab={activeTab}
          onTabChange={setActiveTab}
          messages={messages}
          onAsk={handleAsk}
        />
      );
    case 'fitness':
      return (
        <FitnessStatus
          activeTab={activeTab}
          onTabChange={setActiveTab}
          metrics={fitnessMetrics}
        />
      );
    case 'settings':
      return (
        <div className="max-w-sm mx-auto bg-white rounded-2xl p-3 flex flex-col gap-2.5">
          <div className="px-1.5 pt-1 pb-0.5">
            <h2 className="text-lg font-medium">設定</h2>
            <p className="text-xs text-gray-400 mt-0.5">此頁面尚未實作</p>
          </div>
          <BottomNav active={activeTab} onChange={setActiveTab} />
        </div>
      );
  }
}

export default App;
