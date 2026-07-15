import type { RunSummary } from './types';

export const RUN_TYPE_ICON: Record<RunSummary['type'], string> = {
  輕鬆跑: 'ti-run',
  恢復跑: 'ti-run',
  長距離跑: 'ti-mountain',
  配速跑: 'ti-bolt',
  間歇跑: 'ti-bolt',
};

export const RUN_TYPE_COLOR: Record<RunSummary['type'], { bg: string; color: string; dot: string; ring: string }> = {
  輕鬆跑: { bg: '#DBEAFE', color: '#2563EB', dot: '#2563EB', ring: 'rgba(37,99,235,0.18)' },
  恢復跑: { bg: '#DBEAFE', color: '#2563EB', dot: '#2563EB', ring: 'rgba(37,99,235,0.18)' },
  間歇跑: { bg: '#FFE9D6', color: '#F97316', dot: '#F97316', ring: 'rgba(249,115,22,0.18)' },
  配速跑: { bg: '#FFE9D6', color: '#F97316', dot: '#F97316', ring: 'rgba(249,115,22,0.18)' },
  長距離跑: { bg: '#FFE4CC', color: '#EA5B23', dot: '#EA5B23', ring: 'rgba(234,91,35,0.18)' },
};
