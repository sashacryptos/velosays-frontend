import type { NavTab } from '../types';

interface BottomNavProps {
  active: NavTab;
  onChange: (tab: NavTab) => void;
}

const items: { key: NavTab; label: string; icon: string }[] = [
  { key: 'dashboard', label: '看板', icon: 'ti-layout-dashboard' },
  { key: 'history', label: '歷史', icon: 'ti-history' },
  { key: 'coach', label: '教練', icon: 'ti-message-circle' },
  { key: 'fitness', label: '體能', icon: 'ti-heartbeat' },
  { key: 'settings', label: '設定', icon: 'ti-settings' },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <div
      className="absolute left-0 right-0 bottom-0 flex justify-around px-2 pt-3 pb-[26px] border-t border-[#EFECE6]"
      style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)' }}
    >
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className="flex flex-col items-center gap-[3px] bg-transparent border-none cursor-pointer min-w-[52px]"
          >
            <i
              className={`ti ${item.icon} text-[21px]`}
              style={{ color: isActive ? '#2563EB' : '#B4BAC4' }}
            />
            <span
              className="text-[10px]"
              style={{ color: isActive ? '#2563EB' : '#B4BAC4', fontWeight: isActive ? 700 : 400 }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
