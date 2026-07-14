export type NavTab = 'dashboard' | 'history' | 'coach' | 'fitness' | 'settings';

export interface RunSummary {
  id: string;
  date: string;
  type: '輕鬆跑' | '長距離跑' | '配速跑' | '恢復跑' | '間歇跑';
  distanceKm: number;
  paceMinPerKm: string;
  avgHeartRate: number;
  durationMin?: number;
}

export interface HeartRateZone {
  zone: 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5';
  label: string;
  minutes: number;
  percent: number;
  color: string;
}

export interface Split {
  km: number;
  pace: string;
}

export interface RunDetail extends RunSummary {
  city?: string;
  country?: string;
  temperatureC?: number;
  humidityPercent?: number;
  maxHeartRate?: number;
  cadence?: number;
  strideM?: number;
  aerobicPercent?: number;
  anaerobicPercent?: number;
  zones?: HeartRateZone[];
  splits?: Split[];
  coachFeedback?: string;
}

export interface WeeklyProgress {
  dayLabel: string;
  distanceKm: number;
}

export interface FitnessMetrics {
  vo2max?: number;
  trainingLoad: number;
  restingHeartRate?: number;
  sleepScore?: number;
  recoveryHours?: number;
  weeklyLoad: number[];
}