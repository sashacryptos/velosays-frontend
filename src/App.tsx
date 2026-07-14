import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { HistoryList } from './components/HistoryList';
import { RunDetail } from './components/RunDetail';
import { Coach } from './components/Coach';
import { FitnessStatus } from './components/FitnessStatus';
import { BottomNav } from './components/BottomNav';
import type {
  NavTab,
  RunSummary,
  RunDetail as RunDetailType,
  WeeklyProgress,
  FitnessMetrics,
} from './types';

const WEEKLY: WeeklyProgress[] = [
  { dayLabel: '一', distanceKm: 6 },
  { dayLabel: '二', distanceKm: 0 },
  { dayLabel: '三', distanceKm: 8.4 },
  { dayLabel: '四', distanceKm: 5 },
  { dayLabel: '五', distanceKm: 0 },
  { dayLabel: '六', distanceKm: 12 },
  { dayLabel: '日', distanceKm: 3.2 },
];

const RUN_SUMMARIES: RunSummary[] = [
  { id: 'r1', date: '2026年7月13日', type: '輕鬆跑', distanceKm: 8.4, paceMinPerKm: "5'21", avgHeartRate: 148, durationMin: 45 },
  { id: 'r2', date: '2026年7月11日', type: '間歇跑', distanceKm: 6.2, paceMinPerKm: "4'48", avgHeartRate: 162, durationMin: 30 },
  { id: 'r3', date: '2026年7月9日', type: '長距離跑', distanceKm: 18, paceMinPerKm: "5'40", avgHeartRate: 152, durationMin: 102 },
  { id: 'r4', date: '2026年7月7日', type: '恢復跑', distanceKm: 4, paceMinPerKm: "6'10", avgHeartRate: 128, durationMin: 25 },
];

const RUN_DETAILS: Record<string, RunDetailType> = {
  r1: {
    ...RUN_SUMMARIES[0],
    city: '台北', country: '台灣', temperatureC: 29, humidityPercent: 78,
    maxHeartRate: 168, cadence: 172, strideM: 1.05,
    aerobicPercent: 88, anaerobicPercent: 12,
    zones: [
      { zone: 'Z1', label: '熱身', minutes: 5, percent: 11, color: '#a7c7e7' },
      { zone: 'Z2', label: '輕鬆', minutes: 28, percent: 62, color: '#7ce3b1' },
      { zone: 'Z3', label: '有氧', minutes: 9, percent: 20, color: '#f2c56b' },
      { zone: 'Z4', label: '閾值', minutes: 3, percent: 7, color: '#ff8fbd' },
      { zone: 'Z5', label: '最大', minutes: 0, percent: 0, color: '#ff6f7d' },
    ],
    splits: [
      { km: 1, pace: "5'30" }, { km: 2, pace: "5'25" }, { km: 3, pace: "5'20" },
      { km: 4, pace: "5'18" }, { km: 5, pace: "5'22" }, { km: 6, pace: "5'19" },
      { km: 7, pace: "5'15" }, { km: 8, pace: "5'10" },
    ],
    coachFeedback: '今天的配速控制得很穩定，心率大部分落在 Z2，符合輕鬆跑的目標。建議明天安排恢復跑或休息一天。',
  },
  r2: {
    ...RUN_SUMMARIES[1],
    city: '台北', country: '台灣', temperatureC: 27, humidityPercent: 70,
    maxHeartRate: 178, cadence: 182, strideM: 1.18,
    aerobicPercent: 58, anaerobicPercent: 42,
    zones: [
      { zone: 'Z1', label: '熱身', minutes: 4, percent: 13, color: '#a7c7e7' },
      { zone: 'Z2', label: '輕鬆', minutes: 6, percent: 20, color: '#7ce3b1' },
      { zone: 'Z3', label: '有氧', minutes: 5, percent: 17, color: '#f2c56b' },
      { zone: 'Z4', label: '閾值', minutes: 9, percent: 30, color: '#ff8fbd' },
      { zone: 'Z5', label: '最大', minutes: 6, percent: 20, color: '#ff6f7d' },
    ],
    splits: [
      { km: 1, pace: "5'00" }, { km: 2, pace: "4'40" }, { km: 3, pace: "4'35" },
      { km: 4, pace: "4'50" }, { km: 5, pace: "4'45" }, { km: 6, pace: "4'55" },
    ],
    coachFeedback: '間歇強度達標，Z4/Z5 佔比偏高，注意組間恢復是否充足，避免連續高強度日安排。',
  },
  r3: {
    ...RUN_SUMMARIES[2],
    city: '新北', country: '台灣', temperatureC: 25, humidityPercent: 65,
    maxHeartRate: 165, cadence: 168, strideM: 1.02,
    aerobicPercent: 92, anaerobicPercent: 8,
    zones: [
      { zone: 'Z1', label: '熱身', minutes: 8, percent: 8, color: '#a7c7e7' },
      { zone: 'Z2', label: '輕鬆', minutes: 70, percent: 68, color: '#7ce3b1' },
      { zone: 'Z3', label: '有氧', minutes: 20, percent: 20, color: '#f2c56b' },
      { zone: 'Z4', label: '閾值', minutes: 4, percent: 4, color: '#ff8fbd' },
      { zone: 'Z5', label: '最大', minutes: 0, percent: 0, color: '#ff6f7d' },
    ],
    splits: [
      { km: 5, pace: "5'45" }, { km: 10, pace: "5'42" }, { km: 15, pace: "5'38" }, { km: 18, pace: "5'35" },
    ],
    coachFeedback: '長距離跑心率控制良好，有氧比例高，是很扎實的一次基礎耐力訓練。',
  },
  r4: {
    ...RUN_SUMMARIES[3],
    city: '台北', country: '台灣', temperatureC: 30, humidityPercent: 80,
    maxHeartRate: 138, cadence: 160, strideM: 0.92,
    aerobicPercent: 97, anaerobicPercent: 3,
    zones: [
      { zone: 'Z1', label: '熱身', minutes: 10, percent: 40, color: '#a7c7e7' },
      { zone: 'Z2', label: '輕鬆', minutes: 15, percent: 60, color: '#7ce3b1' },
      { zone: 'Z3', label: '有氧', minutes: 0, percent: 0, color: '#f2c56b' },
      { zone: 'Z4', label: '閾值', minutes: 0, percent: 0, color: '#ff8fbd' },
      { zone: 'Z5', label: '最大', minutes: 0, percent: 0, color: '#ff6f7d' },
    ],
    splits: [
      { km: 1, pace: "6'15" }, { km: 2, pace: "6'10" }, { km: 3, pace: "6'05" }, { km: 4, pace: "6'08" },
    ],
    coachFeedback: '恢復跑心率維持在低區間，有助於代謝間歇跑後的疲勞，做得很好。',
  },
};

const FITNESS_METRICS: FitnessMetrics = {
  vo2max: 52,
  vo2maxTrend: 1,
  trainingLoad: 68,
  restingHeartRate: 48,
  sleepScore: 82,
  recoveryHours: 18,
  weeklyLoad: [40, 55, 30, 60, 20, 70, 45],
};

interface ChatMessage {
  from: 'coach' | 'user';
  text: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  { from: 'coach', text: '早安！根據你昨天的訓練負荷，今天建議安排一次輕鬆跑或休息。有什麼想問我的嗎？' },
];

function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);

  const handleAsk = (question: string) => {
    setMessages((prev) => [
      ...prev,
      { from: 'user', text: question },
      { from: 'coach', text: '這部分我先幫你記錄下來，之後會根據你的 Garmin 數據提供更完整的分析。' },
    ]);
  };

  if (selectedRunId) {
    const run = RUN_DETAILS[selectedRunId];
    return (
      <RunDetail
        activeTab={activeTab}
        onTabChange={(tab) => {
          setSelectedRunId(null);
          setActiveTab(tab);
        }}
        run={run}
        onBack={() => setSelectedRunId(null)}
      />
    );
  }

  switch (activeTab) {
    case 'dashboard':
      return (
        <Dashboard
          activeTab={activeTab}
          onTabChange={setActiveTab}
          weekly={WEEKLY}
          weeklyGoalKm={40}
          onViewPlan={() => setActiveTab('coach')}
        />
      );
    case 'history':
      return (
        <HistoryList
          activeTab={activeTab}
          onTabChange={setActiveTab}
          runs={RUN_SUMMARIES}
          monthlyKm={Math.round(RUN_SUMMARIES.reduce((sum, r) => sum + r.distanceKm, 0))}
          avgPace="5'25"
          onSelectRun={setSelectedRunId}
        />
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
          metrics={FITNESS_METRICS}
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
